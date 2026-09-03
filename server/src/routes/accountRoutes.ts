import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { maskAccountNumber } from '../utils/generators.js';
import { TransactionEngine } from '../services/transactionEngine.js';

export const accountRouter = Router();

accountRouter.use(requireAuth);
accountRouter.use(requireOnboarded);

/**
 * List all accounts belonging to the authenticated user
 */
accountRouter.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const accounts = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').all(userId) as any[];

    res.json({
      success: true,
      accounts: accounts.map(acc => ({
        id: acc.id,
        accountNumber: acc.account_number,
        accountNumberMasked: maskAccountNumber(acc.account_number),
        accountType: acc.account_type === 'SAVINGS' ? 'Savings Account' : acc.account_type,
        ifsc: acc.ifsc,
        branch: acc.branch,
        balance: Number(acc.balance),
        ledgerBalance: Number(acc.ledger_balance),
        currency: acc.currency,
        status: acc.status,
        openedAt: acc.opened_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Account Summary overview
 */
accountRouter.get('/summary', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as any;
    const accounts = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').all(userId) as any[];
    const fds = db.prepare(`SELECT * FROM fixed_deposits WHERE user_id = ? AND status = 'ACTIVE'`).all(userId) as any[];

    const totalSavingsBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
    const totalFdAmount = fds.reduce((acc, f) => acc + Number(f.principal_amount), 0);

    res.json({
      success: true,
      summary: {
        customerName: profile?.display_name,
        customerId: req.user!.customerId,
        totalSavingsBalance,
        totalFdAmount,
        totalNetWorth: totalSavingsBalance + totalFdAmount,
        activeAccountsCount: accounts.length,
        activeFdCount: fds.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          accountNumber: acc.account_number,
          accountNumberMasked: maskAccountNumber(acc.account_number),
          accountType: acc.account_type === 'SAVINGS' ? 'Savings Account' : acc.account_type,
          ifsc: acc.ifsc,
          branch: acc.branch,
          balance: Number(acc.balance),
          ledgerBalance: Number(acc.ledger_balance),
          currency: acc.currency,
          status: acc.status
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Account Details by ID (Strict ownership check)
 */
accountRouter.get('/:id', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const accountId = req.params.id as string;

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId) as any;
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or access unauthorized.'
      });
    }

    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as any;

    res.json({
      success: true,
      account: {
        id: account.id,
        accountNumber: account.account_number,
        accountNumberMasked: maskAccountNumber(account.account_number),
        accountType: account.account_type === 'SAVINGS' ? 'Savings Account' : account.account_type,
        customerName: profile?.display_name,
        customerId: req.user!.customerId,
        ifsc: account.ifsc,
        branch: account.branch,
        balance: Number(account.balance),
        ledgerBalance: Number(account.ledger_balance),
        currency: account.currency,
        status: account.status,
        openedAt: account.opened_at,
        nomineeRegistered: 'Yes (Standard Nomination)',
        micrCode: '400010892',
        modeOfOperation: 'Single / Self'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Account Transaction History with pagination, filters & search
 */
accountRouter.get('/:id/transactions', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const accountId = req.params.id as string;

    const account = db.prepare('SELECT id FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or access unauthorized.'
      });
    }

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '15', 10);
    const offset = (page - 1) * limit;
    const type = req.query.type as string; // 'CREDIT', 'DEBIT', 'TRANSFER', 'ALL'
    const search = req.query.search as string;

    let sql = `
      SELECT t.*, 
        sp.display_name as sender_name, su.username as sender_username,
        rp.display_name as recipient_name, ru.username as recipient_username
      FROM transactions t
      LEFT JOIN users su ON t.sender_user_id = su.id
      LEFT JOIN customer_profiles sp ON t.sender_user_id = sp.user_id
      LEFT JOIN users ru ON t.recipient_user_id = ru.id
      LEFT JOIN customer_profiles rp ON t.recipient_user_id = rp.user_id
      WHERE (t.source_account_id = ? OR t.dest_account_id = ? OR t.sender_user_id = ? OR t.recipient_user_id = ?)
    `;
    const params: any[] = [accountId, accountId, userId, userId];

    if (type && type !== 'ALL') {
      sql += ' AND t.type = ?';
      params.push(type);
    }

    if (search) {
      sql += ' AND (t.description LIKE ? OR t.transaction_id LIKE ? OR t.message LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params) as any[];

    // Count query
    let countSql = `
      SELECT COUNT(*) as count FROM transactions t
      WHERE (t.source_account_id = ? OR t.dest_account_id = ? OR t.sender_user_id = ? OR t.recipient_user_id = ?)
    `;
    const countParams: any[] = [accountId, accountId, userId, userId];
    if (type && type !== 'ALL') {
      countSql += ' AND t.type = ?';
      countParams.push(type);
    }
    if (search) {
      countSql += ' AND (t.description LIKE ? OR t.transaction_id LIKE ? OR t.message LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const totalCount = (db.prepare(countSql).get(...countParams) as any).count;

    const formattedTransactions = rows.map(r => {
      const isDebit = (r.sender_user_id === userId) || (r.source_account_id === accountId && r.type !== 'DEPOSIT');
      return {
        id: r.id,
        transactionId: r.transaction_id,
        date: r.created_at,
        description: r.description,
        type: r.type,
        amount: Number(r.amount),
        isDebit,
        debit: isDebit ? Number(r.amount) : null,
        credit: !isDebit ? Number(r.amount) : null,
        balanceAfter: r.balance_after !== null ? Number(r.balance_after) : null,
        status: r.status,
        transferMode: r.transfer_mode,
        message: r.message,
        party: isDebit ? (r.recipient_name || r.recipient_username ? `@${r.recipient_username}` : null) : (r.sender_name || r.sender_username ? `@${r.sender_username}` : null)
      };
    });

    res.json({
      success: true,
      page,
      limit,
      totalCount: Number(totalCount),
      totalPages: Math.ceil(Number(totalCount) / limit),
      transactions: formattedTransactions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Generate Account Statement
 */
accountRouter.get('/:id/statement', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const accountId = req.params.id as string;
    const period = req.query.period as string || '30DAYS'; // '30DAYS', '3MONTHS', '6MONTHS', 'CUSTOM'
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId) as any;
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or access unauthorized.'
      });
    }

    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as any;

    let startDate = new Date();
    if (period === '30DAYS') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '3MONTHS') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === '6MONTHS') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === 'CUSTOM' && fromDate) {
      startDate = new Date(fromDate);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const endDate = (period === 'CUSTOM' && toDate) ? new Date(toDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const rows = db.prepare(`
      SELECT * FROM transactions
      WHERE (source_account_id = ? OR dest_account_id = ? OR sender_user_id = ? OR recipient_user_id = ?)
      AND created_at >= ? AND created_at <= ?
      ORDER BY created_at ASC
    `).all(accountId, accountId, userId, userId, startDate.toISOString(), endDate.toISOString()) as any[];

    let totalDebits = 0;
    let totalCredits = 0;

    const transactions = rows.map(r => {
      const isDebit = (r.sender_user_id === userId) || (r.source_account_id === accountId && r.type !== 'DEPOSIT');
      const amt = Number(r.amount);
      if (isDebit) totalDebits += amt;
      else totalCredits += amt;

      return {
        id: r.id,
        transactionId: r.transaction_id,
        date: r.created_at,
        valueDate: r.created_at.split('T')[0],
        description: r.description,
        type: r.type,
        debit: isDebit ? amt : null,
        credit: !isDebit ? amt : null,
        balance: r.balance_after !== null ? Number(r.balance_after) : null,
        status: r.status
      };
    });

    const currentBalance = Number(account.balance);
    const openingBalance = Math.max(0, currentBalance - totalCredits + totalDebits);

    res.json({
      success: true,
      statement: {
        statementId: `STMT-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        customer: {
          name: profile?.display_name,
          customerId: req.user!.customerId,
          address: `${profile?.address}, ${profile?.city}, ${profile?.state} - ${profile?.pincode}`,
          email: profile?.email,
          mobile: profile?.mobile
        },
        account: {
          accountNumber: account.account_number,
          accountNumberMasked: maskAccountNumber(account.account_number),
          accountType: 'Savings Account',
          ifsc: account.ifsc,
          branch: account.branch,
          currency: 'INR'
        },
        period: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          periodName: period
        },
        openingBalance,
        totalDebits,
        totalCredits,
        closingBalance: currentBalance,
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Deposit Simulated Funds (Test self-service top up)
 */
accountRouter.post('/deposit-funds', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and deposit amount are required.'
      });
    }

    const result = await TransactionEngine.executeTestDeposit({
      userId,
      accountId,
      amount: Number(amount),
      description: description || 'Simulated Test Deposit'
    });

    res.json({
      success: true,
      message: `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} credited successfully.`,
      result
    });
  } catch (err) {
    next(err);
  }
});
