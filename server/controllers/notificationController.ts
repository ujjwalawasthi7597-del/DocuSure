import { Response } from 'express';
import { store } from '../config/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!._id;
    const notifs = store.findNotifications(userId);
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    res.json({ success: true, count: notifs.length, unreadCount, notifications: notifs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const success = store.markNotificationAsRead(id);
    res.json({ success, message: success ? 'Notification marked as read.' : 'Notification not found.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!._id;
    store.markAllNotificationsAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
}
