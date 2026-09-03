import { v4 as uuidv4 } from 'uuid';
import { db, runTransaction } from '../database/db.js';
import { generateTransactionId, maskAccountNumber } from '../utils/generators.js';
import { compareHash } from '../utils/security.js';
import { createNotification } from './notificationService.js';
import { logSecurityEvent } from '../middleware/audit.js';
import { config } from '../config/env.js';

export interface TransferParams {
  senderUserId: string;
  sourceAccountId: string;
  recipientUserId: string;
  amount: number;
  transactionPin: string;
  message?: string;
  transferMode?: 'INTERNAL' | 'IMPS_SIM' | 'NEFT_SIM' | 'RTGS_SIM';
  ipAddress?: string;
  userAgent?: string;
}

export interface OwnTransferParams {
  userId: string;
  sourceAccountId: string;
  destAccountId: string;
  amount: number;
  transactionPin: string;
  message?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class TransactionEngine {
  /**
   * Execute atomic transfer between two SecureBank users
   */
  static async executePeerTransfer(params: TransferParams) {
    const {
      senderUserId,
      sourceAccountId,
      recipientUserId,
      amount,
      transactionPin,
      message,
      transferMode = 'INTERNAL',
      ipAddress,
      userAgent
    } = params;

    // Basic amount validation
    if (isNaN(amount) || amount <= 0) {
      throw { statusCode: 400, isCustom: true, message: 'Transfer amount must be greater than ₹0.00.' };
    }

    if (amount > config.singleTransactionLimit) {
      throw {
        statusCode: 400,
        isCustom: true,
        message: `Amount exceeds single transaction limit of ₹${config.singleTransactionLimit.toLocaleString('en-IN')}.`
      };
    }

    if (senderUserId === recipientUserId) {
      throw { statusCode: 400, isCustom: true, message: 'For own account transfers, please use the Own Account Transfer option.' };
    }

    // Step 1: Verify sender credentials & PIN
    const senderUser = db.prepare('SELECT * FROM users WHERE id = ?').get(senderUserId) as any;
    if (!senderUser) {
      throw { statusCode: 404, isCustom: true, message: 'Sender account profile not found.' };
    }

    if (!senderUser.transaction_pin_hash) {
      throw { statusCode: 400, isCustom: true, message: 'Transaction PIN is not set. Please complete security setup.' };
    }

    const isPinValid = await compareHash(transactionPin, senderUser.transaction_pin_hash);
    if (!isPinValid) {
      logSecurityEvent(senderUserId, 'TRANSFER_FAILED_PIN', ipAddress, userAgent, 'FAILURE', 'Incorrect Transaction PIN entered');
      throw { statusCode: 401, isCustom: true, message: 'The Transaction PIN entered is incorrect.' };
    }

    // Run atomic ACID transaction
    return runTransaction(() => {
      // Step 2: Verify Source Account
      const sourceAcc = db.prepare(`
        SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?
      `).get(sourceAccountId, senderUserId) as any;

      if (!sourceAcc) {
        throw { statusCode: 404, isCustom: true, message: 'Selected debit account is invalid or unauthorized.' };
      }

      if (sourceAcc.status !== 'ACTIVE') {
        throw { statusCode: 400, isCustom: true, message: `Debit account is currently ${sourceAcc.status}. Transfers are not permitted.` };
      }

      if (sourceAcc.balance < amount) {
        throw {
          statusCode: 400,
          isCustom: true,
          message: `Insufficient available balance. Available: ₹${Number(sourceAcc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        };
      }

      // Step 3: Verify Recipient
      const recipientUser = db.prepare('SELECT * FROM users WHERE id = ?').get(recipientUserId) as any;
      if (!recipientUser || recipientUser.status !== 'ACTIVE') {
        throw { statusCode: 404, isCustom: true, message: 'Recipient account is inactive or not found.' };
      }

      const recipientProfile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(recipientUserId) as any;
      const senderProfile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(senderUserId) as any;

      const destAcc = db.prepare(`
        SELECT * FROM bank_accounts WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1
      `).get(recipientUserId) as any;

      if (!destAcc) {
        throw { statusCode: 404, isCustom: true, message: 'Recipient active bank account could not be resolved.' };
      }

      // Step 4: Check Daily Limits
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailyDebits = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE sender_user_id = ? AND type IN ('DEBIT', 'TRANSFER', 'BILL_PAYMENT') AND status = 'SUCCESS'
        AND created_at >= ?
      `).get(senderUserId, todayStart.toISOString()) as any;

      if (Number(dailyDebits.total) + amount > config.dailyTransferLimit) {
        throw {
          statusCode: 400,
          isCustom: true,
          message: `Daily transfer limit of ₹${config.dailyTransferLimit.toLocaleString('en-IN')} exceeded.`
        };
      }

      // Step 5: Update Balances
      const newSenderBal = Number(sourceAcc.balance) - amount;
      const newDestBal = Number(destAcc.balance) + amount;

      db.prepare(`
        UPDATE bank_accounts
        SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newSenderBal, newSenderBal, sourceAcc.id);

      db.prepare(`
        UPDATE bank_accounts
        SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newDestBal, newDestBal, destAcc.id);

      // Step 6: Create Transactions
      const txnId = generateTransactionId();
      const descSender = `Transfer to @${recipientUser.username} (${recipientProfile?.display_name || 'SecureBank User'})`;
      const descRecipient = `Transfer from @${senderUser.username} (${senderProfile?.display_name || 'SecureBank User'})`;

      const insertTxn = db.prepare(`
        INSERT INTO transactions (
          id, transaction_id, source_account_id, dest_account_id,
          sender_user_id, recipient_user_id, amount, type, status,
          transfer_mode, description, message, balance_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Transaction row
      insertTxn.run(
        uuidv4(),
        txnId,
        sourceAcc.id,
        destAcc.id,
        senderUserId,
        recipientUserId,
        amount,
        'TRANSFER',
        'SUCCESS',
        transferMode,
        descSender,
        message || null,
        newSenderBal
      );

      // Step 7: Create Notifications
      createNotification(
        senderUserId,
        'Virtual Funds Debited',
        `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} transferred to @${recipientUser.username} (${recipientProfile?.display_name}). Txn: ${txnId}`,
        'TRANSACTION',
        { txnId, amount, recipientUsername: recipientUser.username }
      );

      createNotification(
        recipientUserId,
        'Virtual Funds Credited',
        `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} received from @${senderUser.username} (${senderProfile?.display_name}). Txn: ${txnId}`,
        'TRANSACTION',
        { txnId, amount, senderUsername: senderUser.username }
      );

      // Step 8: Log Audit Event
      logSecurityEvent(
        senderUserId,
        'TRANSFER_SUCCESS',
        ipAddress,
        userAgent,
        'SUCCESS',
        `Txn ${txnId}: Transferred ₹${amount} from account ${maskAccountNumber(sourceAcc.account_number)} to @${recipientUser.username}`
      );

      return {
        transactionId: txnId,
        amount,
        status: 'SUCCESS',
        senderUsername: senderUser.username,
        senderDisplayName: senderProfile?.display_name,
        recipientUsername: recipientUser.username,
        recipientDisplayName: recipientProfile?.display_name,
        sourceAccountMasked: maskAccountNumber(sourceAcc.account_number),
        destAccountMasked: maskAccountNumber(destAcc.account_number),
        message: message || '',
        transferMode,
        timestamp: new Date().toISOString(),
        balanceAfter: newSenderBal
      };
    });
  }

  /**
   * Deposit simulated virtual funds for testing/educational purposes
   */
  static async executeTestDeposit(params: {
    userId: string;
    accountId: string;
    amount: number;
    description?: string;
  }) {
    const { userId, accountId, amount, description = 'Simulated Fund Deposit' } = params;

    if (isNaN(amount) || amount <= 0 || amount > 500000) {
      throw { statusCode: 400, isCustom: true, message: 'Deposit amount must be between ₹1.00 and ₹5,00,000.00.' };
    }

    return runTransaction(() => {
      const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId) as any;
      if (!account) {
        throw { statusCode: 404, isCustom: true, message: 'Target bank account not found.' };
      }

      const newBalance = Number(account.balance) + amount;
      db.prepare(`
        UPDATE bank_accounts
        SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBalance, newBalance, account.id);

      const txnId = generateTransactionId();
      db.prepare(`
        INSERT INTO transactions (
          id, transaction_id, source_account_id, dest_account_id,
          sender_user_id, recipient_user_id, amount, type, status,
          transfer_mode, description, balance_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        txnId,
        null,
        account.id,
        null,
        userId,
        amount,
        'DEPOSIT',
        'SUCCESS',
        'INTERNAL',
        description,
        newBalance
      );

      createNotification(
        userId,
        'Simulated Funds Credited',
        `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been deposited to ${maskAccountNumber(account.account_number)}. Txn ID: ${txnId}`,
        'TRANSACTION',
        { txnId, amount }
      );

      return {
        transactionId: txnId,
        amount,
        newBalance,
        status: 'SUCCESS'
      };
    });
  }

  /**
   * Execute Bill Payment
   */
  static async executeBillPayment(params: {
    userId: string;
    accountId: string;
    billerId: string;
    consumerNumber: string;
    amount: number;
    transactionPin: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { userId, accountId, billerId, consumerNumber, amount, transactionPin, ipAddress, userAgent } = params;

    if (isNaN(amount) || amount <= 0) {
      throw { statusCode: 400, isCustom: true, message: 'Bill payment amount must be greater than ₹0.00.' };
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user || !user.transaction_pin_hash) {
      throw { statusCode: 400, isCustom: true, message: 'Transaction PIN is required.' };
    }

    const isPinValid = await compareHash(transactionPin, user.transaction_pin_hash);
    if (!isPinValid) {
      logSecurityEvent(userId, 'BILL_PAYMENT_FAILED_PIN', ipAddress, userAgent, 'FAILURE');
      throw { statusCode: 401, isCustom: true, message: 'The Transaction PIN entered is incorrect.' };
    }

    const biller = db.prepare('SELECT * FROM billers WHERE id = ?').get(billerId) as any;
    if (!biller) {
      throw { statusCode: 404, isCustom: true, message: 'Selected biller organization not found.' };
    }

    return runTransaction(() => {
      const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(accountId, userId) as any;
      if (!account || account.status !== 'ACTIVE') {
        throw { statusCode: 400, isCustom: true, message: 'Invalid or inactive debit account.' };
      }

      if (account.balance < amount) {
        throw { statusCode: 400, isCustom: true, message: 'Insufficient available balance for bill payment.' };
      }

      const newBalance = Number(account.balance) - amount;
      db.prepare(`
        UPDATE bank_accounts
        SET balance = ?, ledger_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBalance, newBalance, account.id);

      const txnId = generateTransactionId();
      const desc = `Bill Payment: ${biller.biller_name} (${consumerNumber})`;

      const txnRowId = uuidv4();
      db.prepare(`
        INSERT INTO transactions (
          id, transaction_id, source_account_id, dest_account_id,
          sender_user_id, recipient_user_id, amount, type, status,
          transfer_mode, description, balance_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txnRowId,
        txnId,
        account.id,
        null,
        userId,
        null,
        amount,
        'BILL_PAYMENT',
        'SUCCESS',
        'INTERNAL',
        desc,
        newBalance
      );

      db.prepare(`
        INSERT INTO bill_payments (id, user_id, account_id, biller_id, consumer_number, bill_amount, transaction_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'SUCCESS')
      `).run(uuidv4(), userId, account.id, biller.id, consumerNumber, amount, txnRowId);

      createNotification(
        userId,
        'Utility Bill Paid Successfully',
        `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} paid to ${biller.biller_name} (${consumerNumber}). Txn: ${txnId}`,
        'TRANSACTION',
        { txnId, amount, billerName: biller.biller_name }
      );

      logSecurityEvent(userId, 'BILL_PAYMENT_SUCCESS', ipAddress, userAgent, 'SUCCESS', `Paid ₹${amount} to ${biller.biller_name}`);

      return {
        transactionId: txnId,
        amount,
        billerName: biller.biller_name,
        consumerNumber,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        balanceAfter: newBalance
      };
    });
  }
}
