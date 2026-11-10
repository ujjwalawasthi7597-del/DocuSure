import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../config/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orgId = req.user!.organizationId;
    const users = store.findUsersByOrg(orgId).map(({ password, ...u }) => u);
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve organization users.' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, role, department, title } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
      return;
    }

    if (!['admin', 'reviewer', 'uploader'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role. Must be admin, reviewer, or uploader.' });
      return;
    }

    const existing = store.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ success: false, message: 'A user with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = store.createUser({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      organizationId: req.user!.organizationId,
      department: department || 'Operations',
      title: title || (role === 'reviewer' ? 'Compliance Reviewer' : 'Document Officer'),
    });

    store.createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'USER_CREATED',
      description: `Created user ${name} (${email}) with role ${role}`,
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, message: 'User added successfully.', user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, role, department, title, password } = req.body;

    const targetUser = store.findUserById(id);
    if (!targetUser || targetUser.organizationId !== req.user!.organizationId) {
      res.status(404).json({ success: false, message: 'User not found in your organization.' });
      return;
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (role && ['admin', 'reviewer', 'uploader'].includes(role)) updates.role = role;
    if (department) updates.department = department;
    if (title) updates.title = title;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updated = store.updateUser(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    store.createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'USER_UPDATED',
      description: `Updated profile for user ${targetUser.name}`,
    });

    const { password: _, ...safeUser } = updated;
    res.json({ success: true, message: 'User updated.', user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === req.user!._id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      return;
    }

    const targetUser = store.findUserById(id);
    if (!targetUser || targetUser.organizationId !== req.user!.organizationId) {
      res.status(404).json({ success: false, message: 'User not found in your organization.' });
      return;
    }

    store.deleteUser(id);

    store.createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'USER_DELETED',
      description: `Deleted user ${targetUser.name} (${targetUser.email})`,
    });

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}
