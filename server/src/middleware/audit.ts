import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';

export function logSecurityEvent(
  userId: string | null,
  action: string,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  status: 'SUCCESS' | 'FAILURE',
  details?: string
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO security_events (id, user_id, action, ip_address, user_agent, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), userId, action, ipAddress || '127.0.0.1', userAgent || 'Unknown Browser', status, details || '');
  } catch (err) {
    console.error('Failed to write security audit event:', err);
  }
}

export function logLoginHistory(
  userId: string,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  status: 'SUCCESS' | 'FAILED'
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO login_history (id, user_id, ip_address, user_agent, device_type, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const device = userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';
    stmt.run(uuidv4(), userId, ipAddress || '127.0.0.1', userAgent || 'Web Browser', device, status);
  } catch (err) {
    console.error('Failed to record login history:', err);
  }
}
