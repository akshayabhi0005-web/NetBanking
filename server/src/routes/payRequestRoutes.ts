import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, runTransaction } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { TransactionEngine } from '../services/transactionEngine.js';
import { generateRequestId } from '../utils/generators.js';
import { createNotification } from '../services/notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const payRequestRouter = Router();

payRequestRouter.use(requireAuth);
payRequestRouter.use(requireOnboarded);

/**
 * Get All Registered Users Directory (Privacy Safe)
 */
payRequestRouter.get('/directory', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const currentUserId = req.user!.id;
    const rows = db.prepare(`
      SELECT u.id, u.username, cp.display_name, u.created_at
      FROM users u
      JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE u.id != ? AND u.status = 'ACTIVE' AND u.is_onboarded = 1
      ORDER BY cp.display_name ASC
      LIMIT 50
    `).all(currentUserId) as any[];

    res.json({
      success: true,
      users: rows.map(r => ({
        id: r.id,
        username: r.username,
        displayName: r.display_name,
        memberSince: r.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Privacy-Safe User Discovery Search
 * Only reveals Display Name & @username. Never exposes sensitive financial or personal details.
 */
payRequestRouter.get('/search-users', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const currentUserId = req.user!.id;
    const query = (req.query.q as string || '').trim();

    if (!query) {
      return res.json({ success: true, users: [] });
    }

    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;

    const rows = db.prepare(`
      SELECT u.id, u.username, cp.display_name
      FROM users u
      JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE u.id != ? AND u.status = 'ACTIVE' AND u.is_onboarded = 1
      AND (u.username LIKE ? OR cp.display_name LIKE ? OR cp.first_name LIKE ? OR cp.last_name LIKE ?)
      LIMIT 10
    `).all(currentUserId, `%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`) as any[];

    res.json({
      success: true,
      users: rows.map(r => ({
        id: r.id,
        username: r.username,
        displayName: r.display_name
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Send Money (Virtual Peer Transfer)
 */
payRequestRouter.post('/send', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const senderUserId = req.user!.id;
    const { sourceAccountId, recipientUserId, amount, transactionPin, message, transferMode } = req.body;

    if (!sourceAccountId || !recipientUserId || !amount || !transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Debit Account, Recipient, Amount, and Transaction PIN) are required.'
      });
    }

    const result = await TransactionEngine.executePeerTransfer({
      senderUserId,
      sourceAccountId,
      recipientUserId,
      amount: Number(amount),
      transactionPin: String(transactionPin),
      message,
      transferMode: transferMode || 'INTERNAL',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Transfer completed successfully!',
      receipt: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Create Money Request
 */
payRequestRouter.post('/request', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const requesterUserId = req.user!.id;
    const { payerUserId, amount, reason } = req.body;

    if (!payerUserId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid recipient and request amount (> ₹0) are required.'
      });
    }

    if (requesterUserId === payerUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request money from your own account.'
      });
    }

    const payer = db.prepare('SELECT u.id, u.username, cp.display_name FROM users u JOIN customer_profiles cp ON u.id = cp.user_id WHERE u.id = ?').get(payerUserId) as any;
    if (!payer) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found.'
      });
    }

    const requesterProfile = db.prepare('SELECT display_name FROM customer_profiles WHERE user_id = ?').get(requesterUserId) as any;
    const requestId = generateRequestId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days expiry

    db.prepare(`
      INSERT INTO payment_requests (
        id, request_id, requester_user_id, payer_user_id, amount, reason, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(uuidv4(), requestId, requesterUserId, payerUserId, Number(amount), reason || 'Money Request', expiresAt);

    // Notify payer
    createNotification(
      payerUserId,
      'New Payment Request Received',
      `@${req.user!.username} (${requesterProfile?.display_name}) requested ₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for: ${reason || 'Money Request'}`,
      'REQUEST',
      { requestId, requesterUsername: req.user!.username, amount: Number(amount) }
    );

    logSecurityEvent(requesterUserId, 'PAYMENT_REQUEST_CREATED', req.ip, req.get('user-agent'), 'SUCCESS', `Requested ₹${amount} from @${payer.username}`);

    res.status(201).json({
      success: true,
      message: `Money request of ₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} sent to @${payer.username}.`,
      requestId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List incoming & outgoing payment requests
 */
payRequestRouter.get('/requests', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // Incoming requests (where this user is the payer)
    const incoming = db.prepare(`
      SELECT pr.*, u.username as requester_username, cp.display_name as requester_name
      FROM payment_requests pr
      JOIN users u ON pr.requester_user_id = u.id
      JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE pr.payer_user_id = ?
      ORDER BY pr.created_at DESC
    `).all(userId) as any[];

    // Outgoing requests (where this user created the request)
    const outgoing = db.prepare(`
      SELECT pr.*, u.username as payer_username, cp.display_name as payer_name
      FROM payment_requests pr
      JOIN users u ON pr.payer_user_id = u.id
      JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE pr.requester_user_id = ?
      ORDER BY pr.created_at DESC
    `).all(userId) as any[];

    res.json({
      success: true,
      incoming: incoming.map(r => ({
        id: r.id,
        requestId: r.request_id,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        requesterId: r.requester_user_id,
        requesterUsername: r.requester_username,
        requesterDisplayName: r.requester_name,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        paidAt: r.paid_at
      })),
      outgoing: outgoing.map(r => ({
        id: r.id,
        requestId: r.request_id,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        payerId: r.payer_user_id,
        payerUsername: r.payer_username,
        payerDisplayName: r.payer_name,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        paidAt: r.paid_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Pay a received payment request
 */
payRequestRouter.post('/requests/:id/pay', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const payerUserId = req.user!.id;
    const reqId = req.params.id as string;
    const { sourceAccountId, transactionPin } = req.body;

    if (!sourceAccountId || !transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'Debit Account and Transaction PIN are required to authorize payment.'
      });
    }

    const payReq = db.prepare(`
      SELECT * FROM payment_requests WHERE id = ? AND payer_user_id = ?
    `).get(reqId, payerUserId) as any;

    if (!payReq) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found or unauthorized.'
      });
    }

    if (payReq.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This payment request has already been ${payReq.status.toLowerCase()}.`
      });
    }

    // Execute atomic transfer from payer to requester
    const transferResult = await TransactionEngine.executePeerTransfer({
      senderUserId: payerUserId,
      sourceAccountId,
      recipientUserId: payReq.requester_user_id,
      amount: Number(payReq.amount),
      transactionPin: String(transactionPin),
      message: `Payment for Request ${payReq.request_id}: ${payReq.reason}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Mark request as PAID
    db.prepare(`
      UPDATE payment_requests
      SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payReq.id);

    createNotification(
      payReq.requester_user_id,
      'Payment Request Fulfilled',
      `@${req.user!.username} has paid your request of ₹${Number(payReq.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for: ${payReq.reason}.`,
      'TRANSACTION',
      { requestId: payReq.request_id, amount: payReq.amount }
    );

    res.json({
      success: true,
      message: 'Payment request fulfilled successfully!',
      receipt: transferResult
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Decline a payment request
 */
payRequestRouter.post('/requests/:id/decline', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const payerUserId = req.user!.id;
    const reqId = req.params.id as string;

    const payReq = db.prepare('SELECT * FROM payment_requests WHERE id = ? AND payer_user_id = ?').get(reqId, payerUserId) as any;
    if (!payReq) {
      return res.status(404).json({ success: false, message: 'Payment request not found.' });
    }

    if (payReq.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request is already ${payReq.status.toLowerCase()}.` });
    }

    db.prepare(`UPDATE payment_requests SET status = 'DECLINED' WHERE id = ?`).run(payReq.id);

    createNotification(
      payReq.requester_user_id,
      'Payment Request Declined',
      `@${req.user!.username} declined your request of ₹${Number(payReq.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      'ALERT'
    );

    res.json({ success: true, message: 'Payment request declined.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Cancel a payment request
 */
payRequestRouter.post('/requests/:id/cancel', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const requesterUserId = req.user!.id;
    const reqId = req.params.id as string;

    const payReq = db.prepare('SELECT * FROM payment_requests WHERE id = ? AND requester_user_id = ?').get(reqId, requesterUserId) as any;
    if (!payReq) {
      return res.status(404).json({ success: false, message: 'Payment request not found.' });
    }

    if (payReq.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request is already ${payReq.status.toLowerCase()}.` });
    }

    db.prepare(`UPDATE payment_requests SET status = 'CANCELLED' WHERE id = ?`).run(payReq.id);

    res.json({ success: true, message: 'Payment request cancelled.' });
  } catch (err) {
    next(err);
  }
});
