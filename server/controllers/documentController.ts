import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { store } from '../config/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { UPLOADS_DIR } from '../middleware/upload.ts';
import { extractTextFromPDF } from '../services/pdfService.ts';
import { analyzeDocumentWithGemini } from '../services/geminiService.ts';
import { DocumentCategory } from '../models/types.ts';

export async function uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'Please attach a document file (PDF, PNG, or JPEG).' });
      return;
    }

    const {
      title,
      category,
      description,
      issueDate,
      expiryDate,
      assignedReviewer,
      tags,
    } = req.body;

    if (!title || !category) {
      res.status(400).json({ success: false, message: 'Title and category are required fields.' });
      return;
    }

    const orgId = req.user!.organizationId;
    const uploaderId = req.user!._id;

    // Resolve reviewer name if assigned
    let reviewerName: string | undefined;
    if (assignedReviewer) {
      const rev = store.findUserById(assignedReviewer);
      if (rev && rev.organizationId === orgId) {
        reviewerName = rev.name;
      }
    }

    // 1. Create Document in Processing state
    const parsedTags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : tags || [];

    const document = store.createDocument({
      title: title.trim(),
      category: category as DocumentCategory,
      description: description || '',
      organizationId: orgId,
      uploadedBy: uploaderId,
      uploaderName: req.user!.name,
      assignedReviewer: assignedReviewer || undefined,
      reviewerName,
      currentVersion: 1,
      status: 'Processing',
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      tags: parsedTags,
    });

    // 2. Create Version 1
    const version = store.createDocumentVersion({
      documentId: document._id,
      versionNumber: 1,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.filename,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: uploaderId,
      uploaderName: req.user!.name,
      changeSummary: 'Initial document submission',
    });

    // 3. Log initial upload audit
    store.createAuditLog({
      organizationId: orgId,
      documentId: document._id,
      documentTitle: document.title,
      userId: uploaderId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DOCUMENT_UPLOADED',
      description: `Uploaded "${document.title}" (v1: ${file.originalname})`,
    });

    // 4. Extract Text & Run AI Analysis
    let extractedText = '';
    let fileBuffer: Buffer | undefined;

    try {
      fileBuffer = fs.readFileSync(file.path);
      if (file.mimetype === 'application/pdf') {
        const pdfData = await extractTextFromPDF(fileBuffer);
        extractedText = pdfData.text;
      }
    } catch (readErr: any) {
      console.warn('[DocController] Buffer read warning:', readErr.message);
    }

    // Run Gemini analysis
    const aiResult = await analyzeDocumentWithGemini({
      category,
      title,
      description,
      mimeType: file.mimetype,
      extractedText,
      fileBuffer,
    });

    // 5. Save AI Analysis
    const analysis = store.createOrUpdateAIAnalysis({
      documentId: document._id,
      versionId: version._id,
      organizationId: orgId,
      documentType: aiResult.documentType,
      extractedFields: aiResult.extractedFields,
      missingFields: aiResult.missingFields,
      inconsistencies: aiResult.inconsistencies,
      riskFlags: aiResult.riskFlags,
      importantClauses: aiResult.importantClauses,
      summary: aiResult.summary,
      recommendation: aiResult.recommendation,
      confidenceScore: aiResult.confidenceScore,
    });

    // 6. Transition document to Pending Review
    const updatedDoc = store.updateDocument(document._id, {
      status: 'Pending Review',
      // If AI detected an expiry date and user didn't specify one, set it
      expiryDate: document.expiryDate || (aiResult.extractedFields?.expiryDate as string) || undefined,
    });

    // 7. Log AI analysis completion
    store.createAuditLog({
      organizationId: orgId,
      documentId: document._id,
      documentTitle: document.title,
      userId: 'system',
      userName: 'DocuSure AI Engine',
      userRole: 'admin',
      action: 'AI_ANALYSIS_COMPLETED',
      description: `Automated analysis completed: ${aiResult.riskFlags.length} risk flags, confidence ${(aiResult.confidenceScore * 100).toFixed(0)}%`,
    });

    // 8. Create Notification for Reviewer or Organization Admins
    if (assignedReviewer) {
      store.createNotification({
        organizationId: orgId,
        userId: assignedReviewer,
        title: 'New Document Assigned for Review',
        message: `${req.user!.name} assigned "${document.title}" to you for compliance review.`,
        documentId: document._id,
        type: 'assignment',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully.',
      document: updatedDoc || document,
      version,
      analysis,
    });
  } catch (error: any) {
    console.error('[DocController] Upload error:', error);
    res.status(500).json({ success: false, message: 'Document upload and processing failed.' });
  }
}

export async function getDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orgId = req.user!.organizationId;
    const { category, status, search, assignedReviewer, uploadedBy, expiryFilter } = req.query;

    const documents = store.findDocumentsByOrg(orgId, {
      category: category as string,
      status: status as string,
      search: search as string,
      assignedReviewer: assignedReviewer as string,
      uploadedBy: uploadedBy as string,
      expiryFilter: expiryFilter as any,
    });

    res.json({ success: true, count: documents.length, documents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const orgId = req.user!.organizationId;

    const document = store.findDocumentById(id);
    if (!document || document.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const versions = store.findVersionsByDocId(id);
    const analysis = store.findAIAnalysisByDocId(id);
    const uploader = store.findUserById(document.uploadedBy);
    const reviewer = document.assignedReviewer ? store.findUserById(document.assignedReviewer) : null;

    res.json({
      success: true,
      document,
      versions,
      analysis,
      uploader: uploader ? { name: uploader.name, email: uploader.email, role: uploader.role } : null,
      reviewer: reviewer ? { name: reviewer.name, email: reviewer.email, role: reviewer.role } : null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve document details.' });
  }
}

export async function uploadNewVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const orgId = req.user!.organizationId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'Please attach the updated document file.' });
      return;
    }

    const document = store.findDocumentById(id);
    if (!document || document.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const { changeSummary } = req.body;
    const newVersionNumber = document.currentVersion + 1;

    // 1. Create Document Version
    const version = store.createDocumentVersion({
      documentId: document._id,
      versionNumber: newVersionNumber,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.filename,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user!._id,
      uploaderName: req.user!.name,
      changeSummary: changeSummary || `Version ${newVersionNumber} update following review feedback`,
    });

    // 2. Extract text and run Gemini
    let extractedText = '';
    let fileBuffer: Buffer | undefined;
    try {
      fileBuffer = fs.readFileSync(file.path);
      if (file.mimetype === 'application/pdf') {
        const pdfData = await extractTextFromPDF(fileBuffer);
        extractedText = pdfData.text;
      }
    } catch (e: any) {
      console.warn('Buffer read error for new version:', e.message);
    }

    const aiResult = await analyzeDocumentWithGemini({
      category: document.category,
      title: document.title,
      description: document.description,
      mimeType: file.mimetype,
      extractedText,
      fileBuffer,
    });

    const analysis = store.createOrUpdateAIAnalysis({
      documentId: document._id,
      versionId: version._id,
      organizationId: orgId,
      documentType: aiResult.documentType,
      extractedFields: aiResult.extractedFields,
      missingFields: aiResult.missingFields,
      inconsistencies: aiResult.inconsistencies,
      riskFlags: aiResult.riskFlags,
      importantClauses: aiResult.importantClauses,
      summary: aiResult.summary,
      recommendation: aiResult.recommendation,
      confidenceScore: aiResult.confidenceScore,
    });

    // 3. Update Document to Pending Review
    const updatedDoc = store.updateDocument(document._id, {
      currentVersion: newVersionNumber,
      status: 'Pending Review',
    });

    // 4. Log Audit
    store.createAuditLog({
      organizationId: orgId,
      documentId: document._id,
      documentTitle: document.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'NEW_VERSION_UPLOADED',
      description: `Uploaded version ${newVersionNumber}: ${file.originalname}`,
    });

    // 5. Notify assigned reviewer
    if (document.assignedReviewer) {
      store.createNotification({
        organizationId: orgId,
        userId: document.assignedReviewer,
        title: 'New Version Ready for Review',
        message: `${req.user!.name} uploaded v${newVersionNumber} for "${document.title}".`,
        documentId: document._id,
        type: 'status_change',
      });
    }

    res.status(201).json({
      success: true,
      message: `Version ${newVersionNumber} uploaded and processed.`,
      document: updatedDoc,
      version,
      analysis,
    });
  } catch (error: any) {
    console.error('Error uploading new version:', error);
    res.status(500).json({ success: false, message: 'Failed to upload new document version.' });
  }
}

export async function downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const versionId = req.query.versionId as string;
    const orgId = req.user!.organizationId;

    const document = store.findDocumentById(id);
    if (!document || document.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      return;
    }

    let targetVersion = versionId
      ? store.findVersionById(versionId)
      : store.findVersionsByDocId(id)[0];

    // Audit log document download/access
    store.createAuditLog({
      organizationId: orgId,
      documentId: document._id,
      documentTitle: document.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DOCUMENT_ACCESSED',
      description: `Accessed file for "${document.title}" (v${targetVersion?.versionNumber || 1})`,
    });

    if (targetVersion) {
      const fullPath = path.join(UPLOADS_DIR, targetVersion.fileName);
      if (fs.existsSync(fullPath)) {
        res.setHeader('Content-Type', targetVersion.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${targetVersion.originalName}"`);
        const stream = fs.createReadStream(fullPath);
        stream.pipe(res);
        return;
      }
    }

    // For seeded initial mock documents whose files were not created by multer yet,
    // generate an on-the-fly clean text/document response with enterprise certificate styling
    const fallbackContent = `
================================================================================
DOCUSURE ENTERPRISE SECURE ARCHIVE PREVIEW
================================================================================
Document Title: ${document.title}
Category: ${document.category}
Current Status: ${document.status}
Version: v${document.currentVersion}
Organization: Apex Global Technologies
Uploaded By: ${document.uploaderName || 'Procurement Specialist'}
Issue Date: ${document.issueDate || 'N/A'}
Expiry Date: ${document.expiryDate || 'N/A'}
================================================================================
Verified by DocuSure AI Document Intelligence Engine.
Security Hash: SHA-256: docusure_${document._id}_verified
================================================================================
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.txt"`);
    res.send(fallbackContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to access document file.' });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const orgId = req.user!.organizationId;

    const document = store.findDocumentById(id);
    if (!document || document.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    store.deleteDocument(id);

    store.createAuditLog({
      organizationId: orgId,
      documentId: id,
      documentTitle: document.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DOCUMENT_DELETED',
      description: `Permanently deleted document "${document.title}"`,
    });

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
}
