import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, runTransaction } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { compareHash } from '../utils/security.js';
import { generateTransactionId, maskAccountNumber } from '../utils/generators.js';
import { createNotification } from '../services/notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const depositRouter = Router();

depositRouter.use(requireAuth);
depositRouter.use(requireOnboarded);

// Interest rate calculation helper based on tenure (standard quarterly compounding)
function getInterestRate(tenureMonths: number): number {
  if (tenureMonths <= 6) return 6.00;
  if (tenureMonths <= 12) return 6.75;
  if (tenureMonths <= 24) return 7.10;
  if (tenureMonths <= 36) return 7.25;
  return 7.00;
}

function calculateFdMaturity(principal: number, ratePercent: number, tenureMonths: number): number {
  // A = P * (1 + r/400)^(4 * t) where t = tenureMonths / 12
  const r = ratePercent / 100;
  const t = tenureMonths / 12;
  const maturity = principal * Math.pow(1 + r / 4, 4 * t);
  return Math.round(maturity * 100) / 100;
}

/**
 * Calculate FD estimate
 */
depositRouter.get('/calculator', (req: AuthenticatedRequest, res: Response) => {
  const principal = Number(req.query.principal) || 10000;
  const tenureMonths = Number(req.query.tenureMonths) || 12;
  const rate = getInterestRate(tenureMonths);
  const maturityAmount = calculateFdMaturity(principal, rate, tenureMonths);

  res.json({
    success: true,
    principal,
    tenureMonths,
    interestRate: rate,
    maturityAmount,
    totalInterestEarned: Math.round((maturityAmount - principal) * 100) / 100
  });
});

/**
 * List user's Fixed and Recurring Deposits
 */
depositRouter.get('/list', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const fixedDeposits = db.prepare('SELECT * FROM fixed_deposits WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
    const recurringDeposits = db.prepare('SELECT * FROM recurring_deposits WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];

    res.json({
      success: true,
      fixedDeposits: fixedDeposits.map(f => ({
        id: f.id,
        depositNo: f.deposit_no,
        principalAmount: Number(f.principal_amount),
        tenureMonths: f.tenure_months,
        interestRate: Number(f.interest_rate),
        maturityAmount: Number(f.maturity_amount),
        maturityDate: f.maturity_date,
        status: f.status,
        createdAt: f.created_at
      })),
      recurringDeposits: recurringDeposits.map(r => ({
        id: r.id,
        depositNo: r.deposit_no,
        monthlyInstallment: Number(r.monthly_installment),
        tenureMonths: r.tenure_months,
        interestRate: Number(r.interest_rate),
        maturityAmount: Number(r.maturity_amount),
        maturityDate: r.maturity_date,
        status: r.status,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Open New Fixed Deposit (Atomically debits selected account and creates FD)
 */
depositRouter.post('/open-fd', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { sourceAccountId, principalAmount, tenureMonths, transactionPin } = req.body;

    const principal = Number(principalAmount);
    const months = Number(tenureMonths);

    if (!sourceAccountId || !principal || !months || !transactionPin) {
      return res.status(400).json({ success: false, message: 'All fields and Transaction PIN are required.' });
    }

    if (principal < 1000) {
      return res.status(400).json({ success: false, message: 'Minimum Fixed Deposit amount is ₹1,000.00.' });
    }

    const user = db.prepare('SELECT transaction_pin_hash FROM users WHERE id = ?').get(userId) as any;
    const isPinValid = await compareHash(transactionPin, user?.transaction_pin_hash || '');
    if (!isPinValid) {
      return res.status(401).json({ success: false, message: 'The Transaction PIN entered is incorrect.' });
    }

    const interestRate = getInterestRate(months);
    const maturityAmount = calculateFdMaturity(principal, interestRate, months);
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + months);
    const depositNo = `FD${Math.floor(10000000 + Math.random() * 90000000)}`;

    const result = runTransaction(() => {
      const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(sourceAccountId, userId) as any;
      if (!account || account.status !== 'ACTIVE') {
        throw { statusCode: 400, isCustom: true, message: 'Selected debit account is invalid or inactive.' };
      }

      if (account.balance < principal) {
        throw { statusCode: 400, isCustom: true, message: 'Insufficient available balance to open Fixed Deposit.' };
      }

      const newBal = Number(account.balance) - principal;
      db.prepare('UPDATE bank_accounts SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newBal, newBal, account.id);

      const txnId = generateTransactionId();
      db.prepare(`
        INSERT INTO transactions (
          id, transaction_id, source_account_id, dest_account_id,
          sender_user_id, recipient_user_id, amount, type, status,
          transfer_mode, description, balance_after
        ) VALUES (?, ?, ?, null, ?, null, ?, 'TRANSFER', 'SUCCESS', 'INTERNAL', ?, ?)
      `).run(uuidv4(), txnId, account.id, userId, principal, `Open Fixed Deposit: ${depositNo}`, newBal);

      const fdId = uuidv4();
      db.prepare(`
        INSERT INTO fixed_deposits (
          id, deposit_no, user_id, account_id, principal_amount,
          tenure_months, interest_rate, maturity_amount, maturity_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(fdId, depositNo, userId, account.id, principal, months, interestRate, maturityAmount, maturityDate.toISOString());

      createNotification(
        userId,
        'Fixed Deposit Opened Successfully',
        `Fixed Deposit account ${depositNo} for ₹${principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} created. Maturity: ₹${maturityAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} on ${maturityDate.toDateString()}.`,
        'TRANSACTION',
        { depositNo, principal, maturityAmount }
      );

      return {
        depositNo,
        principalAmount: principal,
        tenureMonths: months,
        interestRate,
        maturityAmount,
        maturityDate: maturityDate.toISOString(),
        transactionId: txnId
      };
    });

    logSecurityEvent(userId, 'FD_OPENED', req.ip, req.get('user-agent'), 'SUCCESS', `FD: ${depositNo}`);

    res.status(201).json({
      success: true,
      message: `Fixed Deposit ${depositNo} opened successfully.`,
      result
    });
  } catch (err) {
    next(err);
  }
});
