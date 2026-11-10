import { Router } from 'express';
import { reanalyzeDocument, updateExtractedFields, askAssistant } from '../controllers/aiController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// Re-run AI analysis
router.post('/reanalyze/:documentId', reanalyzeDocument);

// Interactive AI Copilot / Assistant
router.post('/ask/:documentId', askAssistant);

// Reviewer/Admin correction of AI extracted fields
router.put('/fields/:documentId', authorize(['admin', 'reviewer']), updateExtractedFields);

export default router;
