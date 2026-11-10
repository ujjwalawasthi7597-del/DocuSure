import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadFile,
  uploadNewVersion,
  deleteDocument,
} from '../controllers/documentController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { uploadMiddleware } from '../middleware/upload.ts';

const router = Router();

router.use(authenticate);

// Document upload
router.post('/upload', uploadMiddleware.single('file'), uploadDocument);

// Document list & details
router.get('/', getDocuments);
router.get('/:id', getDocumentById);

// Secure authenticated download
router.get('/:id/download', downloadFile);

// Versioning
router.post('/:id/versions', uploadMiddleware.single('file'), uploadNewVersion);

// Admin-only deletion
router.delete('/:id', authorize(['admin']), deleteDocument);

export default router;
