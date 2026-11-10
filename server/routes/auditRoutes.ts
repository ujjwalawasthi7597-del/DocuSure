import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Admin-only audit trail
router.get('/', authenticate, authorize(['admin']), getAuditLogs);

export default router;
