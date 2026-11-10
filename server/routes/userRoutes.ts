import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Accessible to organization members (reviewers and uploaders can view users for assignments/collaborators)
router.get('/', authenticate, getUsers);

// Admin-only user management
router.post('/', authenticate, authorize(['admin']), createUser);
router.put('/:id', authenticate, authorize(['admin']), updateUser);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

export default router;
