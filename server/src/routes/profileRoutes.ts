import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { hashValue, compareHash } from '../utils/security.js';
import { maskAccountNumber } from '../utils/generators.js';
import { createNotification } from '../services/notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

/**
 * Get full profile info
 */
profileRouter.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT id, customer_id, username, is_onboarded, status, last_login_at, created_at FROM users WHERE id = ?').get(userId) as any;
    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as any;
    const accounts = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').all(userId) as any[];

    res.json({
      success: true,
      profile: {
        userId: user.id,
        customerId: user.customer_id,
        username: user.username,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        displayName: profile?.display_name,
        dob: profile?.dob,
        mobile: profile?.mobile,
        email: profile?.email,
        address: profile?.address,
        city: profile?.city,
        state: profile?.state,
        pincode: profile?.pincode,
        status: user.status,
        memberSince: user.created_at,
        lastLoginAt: user.last_login_at,
        accounts: accounts.map(a => ({
          id: a.id,
          accountNumber: a.account_number,
          accountNumberMasked: maskAccountNumber(a.account_number),
          accountType: a.account_type,
          ifsc: a.ifsc,
          branch: a.branch,
          balance: Number(a.balance),
          status: a.status
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Update Profile Contact Info
 */
profileRouter.put('/contact', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { email, mobile, address, city, state, pincode } = req.body;

    if (!email || !mobile) {
      return res.status(400).json({ success: false, message: 'Email and Mobile number are mandatory.' });
    }

    db.prepare(`
      UPDATE customer_profiles
      SET email = ?, mobile = ?, address = ?, city = ?, state = ?, pincode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(email, mobile, address || '', city || '', state || '', pincode || '', userId);

    logSecurityEvent(userId, 'PROFILE_CONTACT_UPDATED', req.ip, req.get('user-agent'), 'SUCCESS');

    res.json({ success: true, message: 'Contact details updated successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Change Login Password
 */
profileRouter.post('/change-password', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    const isCurrentValid = await compareHash(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(401).json({ success: false, message: 'The current password entered is incorrect.' });
    }

    const newHash = await hashValue(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);

    createNotification(userId, 'Internet Banking Password Changed', 'Your login password was updated successfully.', 'SECURITY');
    logSecurityEvent(userId, 'PASSWORD_CHANGE', req.ip, req.get('user-agent'), 'SUCCESS');

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Change Transaction PIN
 */
profileRouter.post('/change-pin', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPin } = req.body;

    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({ success: false, message: 'New Transaction PIN must be 4 to 6 numeric digits.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    const isPasswordValid = await compareHash(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Login password verification failed.' });
    }

    const newPinHash = await hashValue(newPin);
    db.prepare('UPDATE users SET transaction_pin_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPinHash, userId);

    createNotification(userId, 'Transaction PIN Changed', 'Your Transaction PIN was successfully changed.', 'SECURITY');
    logSecurityEvent(userId, 'PIN_CHANGE', req.ip, req.get('user-agent'), 'SUCCESS');

    res.json({ success: true, message: 'Transaction PIN changed successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Get Login History
 */
profileRouter.get('/login-history', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const history = db.prepare(`
      SELECT * FROM login_history
      WHERE user_id = ?
      ORDER BY login_time DESC
      LIMIT 25
    `).all(userId) as any[];

    res.json({
      success: true,
      history: history.map(h => ({
        id: h.id,
        loginTime: h.login_time,
        ipAddress: h.ip_address,
        deviceType: h.device_type,
        status: h.status
      }))
    });
  } catch (err) {
    next(err);
  }
});
