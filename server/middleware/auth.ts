import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, UserRole } from '../models/types.ts';
import { store } from '../config/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'docusure-enterprise-super-secure-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; organizationId: string; role: UserRole };
    const user = store.findUserById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token: User no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export function authorize(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
      });
      return;
    }

    next();
  };
}

export function enforceOrg(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }
  // User is bound to req.user.organizationId
  next();
}
