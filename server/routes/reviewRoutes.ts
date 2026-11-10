import { Router } from 'express';
import {
  assignReviewer,
  approveDocument,
  rejectDocument,
  requestChanges,
  setUnderReview,
  getAssignedReviews,
} from '../controllers/reviewController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// Admin-only assignment
router.put('/:documentId/assign', authorize(['admin']), assignReviewer);

// Reviewer actions (Reviewer and Admin can review)
router.put('/:documentId/approve', authorize(['admin', 'reviewer']), approveDocument);
router.put('/:documentId/reject', authorize(['admin', 'reviewer']), rejectDocument);
router.put('/:documentId/request-changes', authorize(['admin', 'reviewer']), requestChanges);
router.put('/:documentId/under-review', authorize(['admin', 'reviewer']), setUnderReview);

// Get reviewer's assigned queue
router.get('/assigned', authorize(['admin', 'reviewer']), getAssignedReviews);

export default router;
