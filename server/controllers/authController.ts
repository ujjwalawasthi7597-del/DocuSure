import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../config/store.ts';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.ts';

export async function registerOrganization(req: Request, res: Response): Promise<void> {
  try {
    const { orgName, industry, adminName, email, password } = req.body;

    if (!orgName || !adminName || !email || !password) {
      res.status(400).json({ success: false, message: 'All fields (orgName, adminName, email, password) are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = store.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    // 1. Create Organization
    const organization = store.createOrganization({
      name: orgName,
      industry: industry || 'Technology & Services',
      contactEmail: email,
      plan: 'Enterprise Pro',
    });

    // 2. Hash Password and Create Admin User
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = store.createUser({
      name: adminName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      organizationId: organization._id,
      department: 'Executive Compliance',
      title: 'Administrator',
    });

    // 3. Log Audit
    store.createAuditLog({
      organizationId: organization._id,
      userId: adminUser._id,
      userName: adminUser.name,
      userRole: 'admin',
      action: 'ORGANIZATION_REGISTERED',
      description: `Organization "${orgName}" created by ${adminName}`,
    });

    // 4. Send Welcome Notification
    store.createNotification({
      organizationId: organization._id,
      userId: adminUser._id,
      title: 'Welcome to DocuSure',
      message: `Organization "${orgName}" setup complete. Start by uploading documents or inviting team reviewers.`,
      type: 'system',
    });

    const token = generateToken(adminUser);
    const { password: _, ...safeUser } = adminUser;

    res.status(201).json({
      success: true,
      message: 'Organization and administrator account registered successfully.',
      token,
      user: safeUser,
      organization,
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      return;
    }

    const user = store.findUserByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid password. Please check and retry.' });
      return;
    }

    const token = generateToken(user);
    const organization = store.findOrganizationById(user.organizationId);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      organization,
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const organization = store.findOrganizationById(req.user.organizationId);
    const { password: _, ...safeUser } = req.user;

    res.json({
      success: true,
      user: safeUser,
      organization,
    });
  } catch (error: any) {
    console.error('[Auth] getMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}
