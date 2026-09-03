import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

/**
 * Get all notifications for user
 */
notificationRouter.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId) as any[];

    const unreadCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(userId) as any).count;

    res.json({
      success: true,
      unreadCount: Number(unreadCount),
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: Boolean(n.is_read),
        metadata: n.metadata_json ? JSON.parse(n.metadata_json) : null,
        createdAt: n.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Mark single notification as read
 */
notificationRouter.post('/:id/read', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const notifId = req.params.id as string;

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, userId);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Mark all notifications as read
 */
notificationRouter.post('/read-all', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});
