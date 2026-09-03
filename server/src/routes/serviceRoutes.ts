import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { generateServiceRequestId, maskAccountNumber } from '../utils/generators.js';
import { createNotification } from '../services/notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const serviceRouter = Router();

serviceRouter.use(requireAuth);
serviceRouter.use(requireOnboarded);

/**
 * List all service requests for authenticated user
 */
serviceRouter.get('/requests', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const requests = db.prepare(`
      SELECT sr.*, ba.account_number
      FROM service_requests sr
      LEFT JOIN bank_accounts ba ON sr.account_id = ba.id
      WHERE sr.user_id = ?
      ORDER BY sr.created_at DESC
    `).all(userId) as any[];

    res.json({
      success: true,
      requests: requests.map(r => ({
        id: r.id,
        requestId: r.request_id,
        requestType: r.request_type,
        accountNumberMasked: r.account_number ? maskAccountNumber(r.account_number) : 'N/A',
        description: r.description,
        status: r.status,
        resolutionRemarks: r.resolution_remarks,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Submit Cheque Book Request
 */
serviceRouter.post('/cheque-book', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { accountId, leavesCount = 25, deliveryAddress } = req.body;

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId) as any;
    if (!account) {
      return res.status(404).json({ success: false, message: 'Selected bank account is invalid.' });
    }

    const requestId = generateServiceRequestId();
    const desc = `Cheque Book Request: ${leavesCount} leaves for account ${maskAccountNumber(account.account_number)}. Delivery: ${deliveryAddress || 'Registered Address'}`;

    db.prepare(`
      INSERT INTO service_requests (id, request_id, user_id, account_id, request_type, description, status)
      VALUES (?, ?, ?, ?, 'CHEQUE_BOOK', ?, 'SUBMITTED')
    `).run(uuidv4(), requestId, userId, account.id, desc);

    createNotification(
      userId,
      'Cheque Book Request Submitted',
      `Your request for a ${leavesCount}-leaf Cheque Book has been submitted. Tracking Request ID: ${requestId}.`,
      'SERVICE',
      { requestId }
    );

    logSecurityEvent(userId, 'CHEQUE_BOOK_REQUEST', req.ip, req.get('user-agent'), 'SUCCESS', `Request ID: ${requestId}`);

    res.status(201).json({
      success: true,
      message: 'Cheque book request submitted successfully.',
      requestId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Submit Stop Cheque Payment
 */
serviceRouter.post('/stop-cheque', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { accountId, chequeNumber, reason } = req.body;

    if (!chequeNumber || !reason) {
      return res.status(400).json({ success: false, message: 'Cheque number and reason for stop payment are required.' });
    }

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId) as any;
    if (!account) {
      return res.status(404).json({ success: false, message: 'Invalid bank account.' });
    }

    const requestId = generateServiceRequestId();
    const desc = `Stop Cheque Request for Cheque No. ${chequeNumber} on account ${maskAccountNumber(account.account_number)}. Reason: ${reason}`;

    db.prepare(`
      INSERT INTO service_requests (id, request_id, user_id, account_id, request_type, description, status)
      VALUES (?, ?, ?, ?, 'STOP_CHEQUE', ?, 'SUBMITTED')
    `).run(uuidv4(), requestId, userId, account.id, desc);

    createNotification(
      userId,
      'Stop Cheque Payment Instruction Registered',
      `Stop payment instruction for Cheque #${chequeNumber} has been logged. Request ID: ${requestId}.`,
      'SERVICE',
      { requestId, chequeNumber }
    );

    res.status(201).json({
      success: true,
      message: `Stop cheque payment instruction logged for Cheque #${chequeNumber}.`,
      requestId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Generic Service / Certificate Request
 */
serviceRouter.post('/general', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { accountId, requestType, description } = req.body;

    if (!requestType || !description) {
      return res.status(400).json({ success: false, message: 'Request type and description are required.' });
    }

    const requestId = generateServiceRequestId();
    db.prepare(`
      INSERT INTO service_requests (id, request_id, user_id, account_id, request_type, description, status)
      VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `).run(uuidv4(), requestId, userId, accountId || null, requestType, description);

    createNotification(userId, 'Service Request Registered', `Your request "${requestType}" has been registered. ID: ${requestId}`, 'SERVICE');

    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully.',
      requestId
    });
  } catch (err) {
    next(err);
  }
});
