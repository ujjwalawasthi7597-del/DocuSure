import { Response } from 'express';
import { store } from '../config/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orgId = req.user!.organizationId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = store.findAuditLogs(orgId, limit);
    res.json({ success: true, count: logs.length, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit trail.' });
  }
}
