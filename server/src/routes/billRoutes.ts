import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { TransactionEngine } from '../services/transactionEngine.js';

export const billRouter = Router();

billRouter.use(requireAuth);
billRouter.use(requireOnboarded);

/**
 * Get all supported billers by category
 */
billRouter.get('/billers', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const category = req.query.category as string;
    let sql = 'SELECT * FROM billers';
    const params: any[] = [];

    if (category && category !== 'ALL') {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY category, biller_name';

    const billers = db.prepare(sql).all(...params) as any[];

    // Extract categories
    const categories = Array.from(new Set(billers.map(b => b.category)));

    res.json({
      success: true,
      categories,
      billers: billers.map(b => ({
        id: b.id,
        category: b.category,
        billerName: b.biller_name,
        billerCode: b.biller_code,
        identifierLabel: b.identifier_label,
        sampleFormat: b.sample_format
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Pay utility bill
 */
billRouter.post('/pay', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { accountId, billerId, consumerNumber, amount, transactionPin } = req.body;

    if (!accountId || !billerId || !consumerNumber || !amount || !transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'All payment fields and Transaction PIN are required.'
      });
    }

    const receipt = await TransactionEngine.executeBillPayment({
      userId,
      accountId,
      billerId,
      consumerNumber,
      amount: Number(amount),
      transactionPin: String(transactionPin),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Bill payment processed successfully.',
      receipt
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get bill payment history
 */
billRouter.get('/history', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const history = db.prepare(`
      SELECT bp.*, b.biller_name, b.category, t.transaction_id as ref_txn_id
      FROM bill_payments bp
      JOIN billers b ON bp.biller_id = b.id
      LEFT JOIN transactions t ON bp.transaction_id = t.id
      WHERE bp.user_id = ?
      ORDER BY bp.paid_at DESC
    `).all(userId) as any[];

    res.json({
      success: true,
      history: history.map(h => ({
        id: h.id,
        transactionId: h.ref_txn_id,
        billerName: h.biller_name,
        category: h.category,
        consumerNumber: h.consumer_number,
        amount: Number(h.bill_amount),
        status: h.status,
        paidAt: h.paid_at
      }))
    });
  } catch (err) {
    next(err);
  }
});
