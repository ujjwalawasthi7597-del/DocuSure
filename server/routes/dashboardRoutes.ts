import { Router } from 'express';
import {
  getAdminDashboard,
  getReviewerDashboard,
  getUploaderDashboard,
} from '../controllers/dashboardController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize(['admin']), getAdminDashboard);
router.get('/reviewer', authorize(['admin', 'reviewer']), getReviewerDashboard);
router.get('/uploader', getUploaderDashboard);

export default router;
