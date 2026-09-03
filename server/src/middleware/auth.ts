import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { db } from '../database/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    customerId: string;
    username: string;
    isOnboarded: boolean;
    status: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to your SecureBank account.'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.'
    });
  }

  const user = db.prepare(`
    SELECT id, customer_id, username, is_onboarded, status, locked_until
    FROM users WHERE id = ?
  `).get(payload.userId) as any;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Account not found. Please log in again.'
    });
  }

  if (user.status === 'LOCKED' || (user.locked_until && new Date(user.locked_until) > new Date())) {
    return res.status(403).json({
      success: false,
      message: 'Your Internet Banking access has been temporarily locked due to security reasons. Please contact customer support.'
    });
  }

  req.user = {
    id: user.id,
    customerId: user.customer_id,
    username: user.username,
    isOnboarded: Boolean(user.is_onboarded),
    status: user.status
  };

  next();
}

export function requireOnboarded(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.isOnboarded) {
    return res.status(403).json({
      success: false,
      code: 'ONBOARDING_REQUIRED',
      message: 'First-time security setup required before accessing internet banking features.'
    });
  }
  next();
}
