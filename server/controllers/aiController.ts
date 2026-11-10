import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { store } from '../config/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { UPLOADS_DIR } from '../middleware/upload.ts';
import { analyzeDocumentWithGemini } from '../services/geminiService.ts';
import { extractTextFromPDF } from '../services/pdfService.ts';

export async function reanalyzeDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const orgId = req.user!.organizationId;

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const versions = store.findVersionsByDocId(documentId);
    const latestVersion = versions[0];

    let extractedText = '';
    let fileBuffer: Buffer | undefined;

    if (latestVersion) {
      const fullPath = path.join(UPLOADS_DIR, latestVersion.fileName);
      if (fs.existsSync(fullPath)) {
        try {
          fileBuffer = fs.readFileSync(fullPath);
          if (latestVersion.mimeType === 'application/pdf') {
            const pdf = await extractTextFromPDF(fileBuffer);
            extractedText = pdf.text;
          }
        } catch (e: any) {
          console.warn('Reanalysis file read warning:', e.message);
        }
      }
    }

    const aiResult = await analyzeDocumentWithGemini({
      category: doc.category,
      title: doc.title,
      description: doc.description,
      mimeType: latestVersion ? latestVersion.mimeType : 'application/pdf',
      extractedText,
      fileBuffer,
    });

    const analysis = store.createOrUpdateAIAnalysis({
      documentId: doc._id,
      versionId: latestVersion ? latestVersion._id : 'ver_01',
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

    store.createAuditLog({
      organizationId: orgId,
      documentId: doc._id,
      documentTitle: doc.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'AI_REANALYZED',
      description: `Re-ran Gemini AI intelligence analysis. Confidence score: ${(aiResult.confidenceScore * 100).toFixed(0)}%`,
    });

    res.json({ success: true, message: 'AI re-analysis completed.', analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'AI re-analysis failed.' });
  }
}

export async function updateExtractedFields(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const { extractedFields } = req.body;
    const orgId = req.user!.organizationId;

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const currentAnalysis = store.findAIAnalysisByDocId(documentId);
    if (!currentAnalysis) {
      res.status(404).json({ success: false, message: 'No AI analysis found to edit.' });
      return;
    }

    const updated = store.createOrUpdateAIAnalysis({
      ...currentAnalysis,
      extractedFields: { ...currentAnalysis.extractedFields, ...extractedFields },
    });

    store.createAuditLog({
      organizationId: orgId,
      documentId: doc._id,
      documentTitle: doc.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'AI_FIELDS_CORRECTED',
      description: `Reviewer corrected extracted metadata fields for "${doc.title}"`,
    });

    res.json({ success: true, message: 'Extracted fields updated.', analysis: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update extracted fields.' });
  }
}

export async function askAssistant(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const { question } = req.body;
    const orgId = req.user!.organizationId;

    if (!question || !question.trim()) {
      res.status(400).json({ success: false, message: 'Please provide a question.' });
      return;
    }

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const currentAnalysis = store.findAIAnalysisByDocId(documentId);
    const { askGeminiAssistant } = await import('../services/geminiService.ts');

    const answer = await askGeminiAssistant({
      documentTitle: doc.title,
      category: doc.category,
      summary: currentAnalysis?.summary,
      extractedFields: currentAnalysis?.extractedFields,
      riskFlags: currentAnalysis?.riskFlags,
      importantClauses: currentAnalysis?.importantClauses,
      question: question.trim(),
    });

    res.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    console.error('Ask assistant error:', error);
    res.status(500).json({ success: false, message: 'Failed to query AI assistant.' });
  }
}

