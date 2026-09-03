import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, runTransaction } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { TransactionEngine } from '../services/transactionEngine.js';
import { compareHash } from '../utils/security.js';
import { generateTransactionId, maskAccountNumber } from '../utils/generators.js';
import { createNotification } from '../services/notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const transferRouter = Router();

transferRouter.use(requireAuth);
transferRouter.use(requireOnboarded);

/**
 * Transfer within SecureBank using Account Number + IFSC
 */
transferRouter.post('/direct', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const senderUserId = req.user!.id;
    const { sourceAccountId, destAccountNumber, ifsc, amount, transactionPin, message, transferMode } = req.body;

    if (!sourceAccountId || !destAccountNumber || !amount || !transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'All transfer fields and Transaction PIN are required.'
      });
    }

    // Clean account number
    const cleanAccNo = destAccountNumber.replace(/\s+/g, '').trim();

    // Find destination account in our database
    const destAcc = db.prepare('SELECT * FROM bank_accounts WHERE account_number = ?').get(cleanAccNo) as any;
    if (!destAcc) {
      return res.status(404).json({
        success: false,
        message: 'Destination account number not found in SecureBank directory.'
      });
    }

    if (destAcc.user_id === senderUserId) {
      return res.status(400).json({
        success: false,
        message: 'For transferring between your own accounts, please select "Own Account Transfer".'
      });
    }

    const result = await TransactionEngine.executePeerTransfer({
      senderUserId,
      sourceAccountId,
      recipientUserId: destAcc.user_id,
      amount: Number(amount),
      transactionPin: String(transactionPin),
      message,
      transferMode: transferMode || 'IMPS_SIM',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Funds transferred successfully.',
      receipt: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Own Account Transfer (Between User's Own Accounts)
 */
transferRouter.post('/own-account', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { sourceAccountId, destAccountId, amount, transactionPin, message } = req.body;

    if (!sourceAccountId || !destAccountId || !amount || !transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'Source account, destination account, amount, and Transaction PIN are required.'
      });
    }

    if (sourceAccountId === destAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Source and Destination accounts cannot be the same.'
      });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Transfer amount must be greater than ₹0.00.' });
    }

    const user = db.prepare('SELECT transaction_pin_hash FROM users WHERE id = ?').get(userId) as any;
    const isPinValid = await compareHash(transactionPin, user?.transaction_pin_hash || '');
    if (!isPinValid) {
      return res.status(401).json({ success: false, message: 'The Transaction PIN entered is incorrect.' });
    }

    const receipt = runTransaction(() => {
      const srcAcc = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(sourceAccountId, userId) as any;
      const dstAcc = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(destAccountId, userId) as any;

      if (!srcAcc || !dstAcc) {
        throw { statusCode: 404, isCustom: true, message: 'One or more selected accounts could not be verified.' };
      }

      if (srcAcc.balance < amt) {
        throw { statusCode: 400, isCustom: true, message: 'Insufficient available balance in source account.' };
      }

      const newSrcBal = Number(srcAcc.balance) - amt;
      const newDstBal = Number(dstAcc.balance) + amt;

      db.prepare('UPDATE bank_accounts SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newSrcBal, newSrcBal, srcAcc.id);
      db.prepare('UPDATE bank_accounts SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newDstBal, newDstBal, dstAcc.id);

      const txnId = generateTransactionId();
      const desc = `Own Account Transfer: ${maskAccountNumber(srcAcc.account_number)} to ${maskAccountNumber(dstAcc.account_number)}`;

      db.prepare(`
        INSERT INTO transactions (
          id, transaction_id, source_account_id, dest_account_id,
          sender_user_id, recipient_user_id, amount, type, status,
          transfer_mode, description, message, balance_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'TRANSFER', 'SUCCESS', 'INTERNAL', ?, ?, ?)
      `).run(uuidv4(), txnId, srcAcc.id, dstAcc.id, userId, userId, amt, desc, message || null, newSrcBal);

      createNotification(
        userId,
        'Own Account Transfer Completed',
        `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} transferred from ${maskAccountNumber(srcAcc.account_number)} to ${maskAccountNumber(dstAcc.account_number)}. Txn: ${txnId}`,
        'TRANSACTION',
        { txnId, amount: amt }
      );

      return {
        transactionId: txnId,
        amount: amt,
        status: 'SUCCESS',
        sourceAccountMasked: maskAccountNumber(srcAcc.account_number),
        destAccountMasked: maskAccountNumber(dstAcc.account_number),
        transferMode: 'INTERNAL_OWN',
        timestamp: new Date().toISOString(),
        balanceAfter: newSrcBal
      };
    });

    res.json({
      success: true,
      message: 'Own account transfer completed successfully.',
      receipt
    });
  } catch (err) {
    next(err);
  }
});
