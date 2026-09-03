import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'TRANSACTION' | 'SECURITY' | 'ALERT' | 'SERVICE' | 'REQUEST',
  metadata?: Record<string, any>
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, metadata_json)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);
    stmt.run(uuidv4(), userId, title, message, type, metadata ? JSON.stringify(metadata) : null);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
