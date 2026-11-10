import { Response } from 'express';
import { store } from '../config/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export async function assignReviewer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const { reviewerId } = req.body;
    const orgId = req.user!.organizationId;

    if (!reviewerId) {
      res.status(400).json({ success: false, message: 'Please select a reviewer.' });
      return;
    }

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const reviewer = store.findUserById(reviewerId);
    if (!reviewer || reviewer.organizationId !== orgId) {
      res.status(400).json({ success: false, message: 'Selected reviewer does not belong to your organization.' });
      return;
    }

    const updated = store.updateDocument(documentId, {
      assignedReviewer: reviewerId,
      reviewerName: reviewer.name,
      status: doc.status === 'Uploaded' ? 'Pending Review' : doc.status,
    });

    store.createAuditLog({
      organizationId: orgId,
      documentId,
      documentTitle: doc.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'REVIEWER_ASSIGNED',
      description: `Assigned review to ${reviewer.name} (${reviewer.email})`,
    });

    store.createNotification({
      organizationId: orgId,
      userId: reviewerId,
      title: 'Document Assigned for Review',
      message: `${req.user!.name} assigned "${doc.title}" to you for compliance verification.`,
      documentId,
      type: 'assignment',
    });

    res.json({ success: true, message: `Document assigned to ${reviewer.name}.`, document: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to assign reviewer.' });
  }
}

export async function approveDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const { comments } = req.body;
    const orgId = req.user!.organizationId;

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const updated = store.updateDocument(documentId, {
      status: 'Approved',
      reviewerComments: comments || 'Compliance criteria satisfied. Document approved.',
      rejectionReason: undefined,
    });

    store.createAuditLog({
      organizationId: orgId,
      documentId,
      documentTitle: doc.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DOCUMENT_APPROVED',
      description: `Approved "${doc.title}". ${comments ? `Note: ${comments}` : ''}`,
    });

    // Notify uploader
    store.createNotification({
      organizationId: orgId,
      userId: doc.uploadedBy,
      title: 'Document Approved',
      message: `Your document "${doc.title}" has been verified and approved by ${req.user!.name}.`,
      documentId,
      type: 'status_change',
    });

    res.json({ success: true, message: 'Document marked as Approved.', document: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to approve document.' });
  }
}

export async function rejectDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;
    const orgId = req.user!.organizationId;

    if (!reason || reason.trim() === '') {
      res.status(400).json({ success: false, message: 'A mandatory rejection reason must be provided.' });
      return;
    }

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const updated = store.updateDocument(documentId, {
      status: 'Rejected',
      rejectionReason: reason.trim(),
    });

    store.createAuditLog({
      organizationId: orgId,
      documentId,
      documentTitle: doc.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DOCUMENT_REJECTED',
      description: `Rejected "${doc.title}". Reason: ${reason}`,
    });

    // Notify uploader
    store.createNotification({
      organizationId: orgId,
      userId: doc.uploadedBy,
      title: 'Document Rejected',
      message: `"${doc.title}" was rejected by ${req.user!.name}: "${reason}"`,
      documentId,
      type: 'status_change',
    });

    res.json({ success: true, message: 'Document marked as Rejected.', document: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reject document.' });
  }
}

export async function requestChanges(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const { comments } = req.body;
    const orgId = req.user!.organizationId;

    if (!comments || comments.trim() === '') {
      res.status(400).json({ success: false, message: 'Please describe the required changes or corrections.' });
      return;
    }

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const updated = store.updateDocument(documentId, {
      status: 'Changes Requested',
      reviewerComments: comments.trim(),
    });

    store.createAuditLog({
      organizationId: orgId,
      documentId,
      documentTitle: doc.title,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CHANGES_REQUESTED',
      description: `Requested changes for "${doc.title}": ${comments}`,
    });

    // Notify uploader
    store.createNotification({
      organizationId: orgId,
      userId: doc.uploadedBy,
      title: 'Corrections Requested on Document',
      message: `${req.user!.name} requested updates on "${doc.title}": "${comments}"`,
      documentId,
      type: 'status_change',
    });

    res.json({ success: true, message: 'Changes requested from document uploader.', document: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to request changes.' });
  }
}

export async function setUnderReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const orgId = req.user!.organizationId;

    const doc = store.findDocumentById(documentId);
    if (!doc || doc.organizationId !== orgId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    if (doc.status === 'Pending Review') {
      const updated = store.updateDocument(documentId, {
        status: 'Under Review',
      });
      res.json({ success: true, document: updated });
      return;
    }

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to set review status.' });
  }
}

export async function getAssignedReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orgId = req.user!.organizationId;
    const userId = req.user!._id;

    const assignedDocs = store.findDocumentsByOrg(orgId, {
      assignedReviewer: userId,
    });

    res.json({ success: true, count: assignedDocs.length, documents: assignedDocs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve assigned reviews.' });
  }
}
