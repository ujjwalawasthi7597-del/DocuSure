import { Router } from 'express';
import { registerOrganization, login, getMe } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.post('/register-organization', registerOrganization);
router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;
