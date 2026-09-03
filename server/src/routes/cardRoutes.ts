import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { hashValue, compareHash } from '../utils/security.js';
import { createNotification } from '../services/notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const cardRouter = Router();

cardRouter.use(requireAuth);
cardRouter.use(requireOnboarded);

/**
 * Get Virtual Debit Card details
 */
cardRouter.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const cards = db.prepare(`
      SELECT c.*, a.account_number
      FROM cards c
      JOIN bank_accounts a ON c.account_id = a.id
      WHERE c.user_id = ?
    `).all(userId) as any[];

    res.json({
      success: true,
      cards: cards.map(c => ({
        id: c.id,
        accountId: c.account_id,
        cardNumberMasked: c.card_number_masked,
        cardholderName: c.cardholder_name,
        expiry: `${c.expiry_month}/${c.expiry_year}`,
        cardType: 'SecureBank Classic Virtual Debit',
        cardStatus: c.card_status,
        isOnlineEnabled: Boolean(c.is_online_enabled),
        isInternationalEnabled: Boolean(c.is_international_enabled),
        isContactlessEnabled: Boolean(c.is_contactless_enabled),
        dailyLimit: Number(c.daily_limit)
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Block / Unblock Card
 */
cardRouter.post('/:id/status', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const cardId = req.params.id as string;
    const { status } = req.body; // 'ACTIVE' or 'BLOCKED'

    if (!['ACTIVE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid card status.' });
    }

    const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cardId, userId) as any;
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found or unauthorized.' });
    }

    db.prepare('UPDATE cards SET card_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, cardId);

    createNotification(
      userId,
      status === 'BLOCKED' ? 'Debit Card Temporarily Blocked' : 'Debit Card Unblocked',
      `Your SecureBank Virtual Debit Card (${card.card_number_masked}) has been marked as ${status}.`,
      'SECURITY'
    );

    logSecurityEvent(userId, `CARD_${status}`, req.ip, req.get('user-agent'), 'SUCCESS');

    res.json({
      success: true,
      message: `Card has been ${status === 'BLOCKED' ? 'blocked' : 'unblocked'} successfully.`,
      status
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Update Card Preferences (Limits, Online/Intl switches)
 */
cardRouter.post('/:id/settings', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const cardId = req.params.id as string;
    const { isOnlineEnabled, isInternationalEnabled, dailyLimit } = req.body;

    const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cardId, userId) as any;
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found.' });
    }

    const limit = Number(dailyLimit) || card.daily_limit;
    if (limit < 1000 || limit > 100000) {
      return res.status(400).json({ success: false, message: 'Daily limit must be between ₹1,000 and ₹1,00,000.' });
    }

    db.prepare(`
      UPDATE cards
      SET is_online_enabled = ?, is_international_enabled = ?, daily_limit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(isOnlineEnabled ? 1 : 0, isInternationalEnabled ? 1 : 0, limit, cardId);

    logSecurityEvent(userId, 'CARD_SETTINGS_UPDATED', req.ip, req.get('user-agent'), 'SUCCESS');

    res.json({
      success: true,
      message: 'Debit card security settings and limits updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Change Card PIN
 */
cardRouter.post('/:id/change-pin', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPin } = req.body;

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ success: false, message: 'Card PIN must be a 4-digit number.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    const isPasswordValid = await compareHash(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Internet Banking password verification failed.' });
    }

    const newPinHash = await hashValue(newPin);
    db.prepare('UPDATE users SET card_pin_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPinHash, userId);

    createNotification(userId, 'Debit Card PIN Changed', 'Your 4-digit Debit Card ATM/POS PIN was updated successfully.', 'SECURITY');
    logSecurityEvent(userId, 'CARD_PIN_CHANGED', req.ip, req.get('user-agent'), 'SUCCESS');

    res.json({ success: true, message: 'Debit Card PIN updated successfully.' });
  } catch (err) {
    next(err);
  }
});
