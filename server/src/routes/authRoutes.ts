import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, runTransaction } from '../database/db.js';
import { hashValue, compareHash } from '../utils/security.js';
import { signToken } from '../utils/jwt.js';
import {
  generateCustomerId,
  generateAccountNumber,
  generateVirtualCardNumber,
  maskAccountNumber,
  maskCardNumber
} from '../utils/generators.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logSecurityEvent, logLoginHistory } from '../middleware/audit.js';
import { createNotification } from '../services/notificationService.js';
import { config } from '../config/env.js';

export const authRouter = Router();

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date of Birth (YYYY-MM-DD) required'),
  mobile: z.string().min(10, 'Valid 10-digit Indian mobile number required'),
  email: z.string().email('Valid email address required'),
  address: z.string().min(5, 'Residential address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  username: z.string().min(4, 'Username must be at least 4 characters').regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
});

/**
 * Open Bank Account (Self Registration)
 */
authRouter.post('/register', async (req: Request, res: Response, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    // Check if username already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(validated.username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose a different username.'
      });
    }

    // Check if email already registered
    const existingEmail = db.prepare('SELECT id FROM customer_profiles WHERE LOWER(email) = LOWER(?)').get(validated.email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const passwordHash = await hashValue(validated.password);
    const secAnswerHash = validated.securityAnswer ? await hashValue(validated.securityAnswer.toLowerCase().trim()) : null;
    const customerId = generateCustomerId();
    const userId = uuidv4();
    const accountId = uuidv4();
    const accountNumber = generateAccountNumber();
    const displayName = `${validated.firstName} ${validated.lastName}`.trim();

    // Create records inside an atomic transaction
    runTransaction(() => {
      // 1. User Auth Record
      db.prepare(`
        INSERT INTO users (
          id, customer_id, username, password_hash, security_question, security_answer_hash, is_onboarded, status, last_login_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'ACTIVE', CURRENT_TIMESTAMP)
      `).run(userId, customerId, validated.username.toLowerCase(), passwordHash, validated.securityQuestion || null, secAnswerHash);

      // 2. Customer Profile
      db.prepare(`
        INSERT INTO customer_profiles (
          id, user_id, first_name, last_name, display_name, dob, mobile, email, address, city, state, pincode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        userId,
        validated.firstName,
        validated.lastName,
        displayName,
        validated.dob,
        validated.mobile,
        validated.email,
        validated.address,
        validated.city,
        validated.state,
        validated.pincode
      );

      // 3. Automatic Bank Account (Savings Account, ₹0.00 initial balance)
      db.prepare(`
        INSERT INTO bank_accounts (
          id, user_id, account_number, account_type, ifsc, branch, balance, ledger_balance, currency, status
        ) VALUES (?, ?, ?, 'SAVINGS', ?, ?, 0.00, 0.00, 'INR', 'ACTIVE')
      `).run(accountId, userId, accountNumber, config.defaultIfsc, config.defaultBranch);

      // 4. Initial Welcome Notification
      createNotification(
        userId,
        'Welcome to SecureBank Internet Banking',
        `Your Savings Account ${maskAccountNumber(accountNumber)} has been opened successfully. Customer ID: ${customerId}. Please complete your first-time security onboarding.`,
        'ALERT',
        { customerId, accountNumber }
      );
    });

    logSecurityEvent(userId, 'USER_REGISTERED', req.ip, req.get('user-agent'), 'SUCCESS', `Customer ID: ${customerId}`);

    const token = signToken({
      userId,
      customerId,
      username: validated.username.toLowerCase(),
      isOnboarded: false
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Please complete your first-time security setup.',
      token,
      user: {
        id: userId,
        customerId,
        username: validated.username.toLowerCase(),
        displayName,
        isOnboarded: false,
        account: {
          id: accountId,
          accountNumberMasked: maskAccountNumber(accountNumber),
          accountNumber,
          accountType: 'Savings Account',
          ifsc: config.defaultIfsc,
          branch: config.defaultBranch,
          balance: 0.00
        }
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: err.errors[0]?.message || 'Invalid input data.'
      });
    }
    next(err);
  }
});

/**
 * Internet Banking Login
 */
authRouter.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Customer ID / Username and Password.'
      });
    }

    const cleanIdentifier = identifier.trim();

    // Query user by username or customer_id
    const user = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = LOWER(?) OR UPPER(customer_id) = UPPER(?)
    `).get(cleanIdentifier, cleanIdentifier) as any;

    if (!user) {
      logSecurityEvent(null, 'LOGIN_FAILED', req.ip, req.get('user-agent'), 'FAILURE', `Unknown identifier: ${cleanIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid Customer ID / Username or Password.'
      });
    }

    // Check if account locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockMins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (1000 * 60));
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockMins} minute(s).`
      });
    }

    const isMatch = await compareHash(password, user.password_hash);
    if (!isMatch) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntilSql = 'locked_until';
      let lockMessage = 'Invalid Customer ID / Username or Password.';

      if (failedAttempts >= 5) {
        const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(failedAttempts, lockTime, user.id);
        logSecurityEvent(user.id, 'ACCOUNT_LOCKED', req.ip, req.get('user-agent'), 'FAILURE', '5 consecutive failed attempts');
        lockMessage = 'Account temporarily locked for 15 minutes due to 5 failed login attempts.';
      } else {
        db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(failedAttempts, user.id);
        logSecurityEvent(user.id, 'LOGIN_FAILED', req.ip, req.get('user-agent'), 'FAILURE', `Attempt ${failedAttempts}`);
      }

      logLoginHistory(user.id, req.ip, req.get('user-agent'), 'FAILED');

      return res.status(401).json({
        success: false,
        message: lockMessage
      });
    }

    // Successful login -> Reset failed attempts, update last login
    const previousLastLogin = user.last_login_at;
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?').run(now, user.id);

    logLoginHistory(user.id, req.ip, req.get('user-agent'), 'SUCCESS');
    logSecurityEvent(user.id, 'LOGIN_SUCCESS', req.ip, req.get('user-agent'), 'SUCCESS');

    // Fetch Profile & Primary Account
    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(user.id) as any;
    const account = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ? LIMIT 1').get(user.id) as any;

    const token = signToken({
      userId: user.id,
      customerId: user.customer_id,
      username: user.username,
      isOnboarded: Boolean(user.is_onboarded)
    });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        customerId: user.customer_id,
        username: user.username,
        displayName: profile?.display_name || user.username,
        isOnboarded: Boolean(user.is_onboarded),
        lastLoginAt: previousLastLogin,
        account: account ? {
          id: account.id,
          accountNumberMasked: maskAccountNumber(account.account_number),
          accountNumber: account.account_number,
          accountType: 'Savings Account',
          ifsc: account.ifsc,
          branch: account.branch,
          balance: Number(account.balance)
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get Authenticated User Details & Account Snapshot
 */
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    const user = db.prepare('SELECT id, customer_id, username, is_onboarded, status, last_login_at FROM users WHERE id = ?').get(userId) as any;
    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as any;
    const accounts = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').all(userId) as any[];
    const card = db.prepare('SELECT * FROM cards WHERE user_id = ? LIMIT 1').get(userId) as any;
    const unreadNotifications = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as any).count;
    const pendingRequests = (db.prepare(`SELECT COUNT(*) as count FROM payment_requests WHERE payer_user_id = ? AND status = 'PENDING'`).get(userId) as any).count;

    res.json({
      success: true,
      user: {
        id: user.id,
        customerId: user.customer_id,
        username: user.username,
        displayName: profile?.display_name,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        email: profile?.email,
        mobile: profile?.mobile,
        city: profile?.city,
        state: profile?.state,
        isOnboarded: Boolean(user.is_onboarded),
        lastLoginAt: user.last_login_at,
        unreadNotifications: Number(unreadNotifications),
        pendingRequestsCount: Number(pendingRequests),
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
        })),
        card: card ? {
          id: card.id,
          cardNumberMasked: card.card_number_masked,
          cardholderName: card.cardholder_name,
          expiry: `${card.expiry_month}/${card.expiry_year}`,
          cardStatus: card.card_status,
          isOnlineEnabled: Boolean(card.is_online_enabled),
          isInternationalEnabled: Boolean(card.is_international_enabled),
          dailyLimit: Number(card.daily_limit)
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * First Time Onboarding: Set Transaction PIN & Issue Virtual Debit Card
 */
authRouter.post('/onboarding/setup', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { transactionPin, cardPin } = req.body;

    if (!transactionPin || !/^\d{4,6}$/.test(transactionPin)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN must be 4 to 6 numeric digits.'
      });
    }

    if (!cardPin || !/^\d{4}$/.test(cardPin)) {
      return res.status(400).json({
        success: false,
        message: 'Debit Card PIN must be exactly 4 numeric digits.'
      });
    }

    const txPinHash = await hashValue(transactionPin);
    const cardPinHash = await hashValue(cardPin);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as any;
    const account = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ? LIMIT 1').get(userId) as any;

    if (!account) {
      return res.status(400).json({
        success: false,
        message: 'No bank account linked to user profile.'
      });
    }

    const rawCardNumber = generateVirtualCardNumber();
    const maskedCard = maskCardNumber(rawCardNumber);
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 5);
    const expiryMonth = String(expDate.getMonth() + 1).padStart(2, '0');
    const expiryYear = String(expDate.getFullYear()).slice(-2);

    runTransaction(() => {
      // 1. Update User PINs and mark Onboarded
      db.prepare(`
        UPDATE users
        SET transaction_pin_hash = ?, card_pin_hash = ?, is_onboarded = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(txPinHash, cardPinHash, userId);

      // 2. Issue Virtual Debit Card
      const cardId = uuidv4();
      db.prepare(`
        INSERT INTO cards (
          id, user_id, account_id, card_number_masked, cardholder_name,
          expiry_month, expiry_year, card_type, card_status,
          is_online_enabled, is_international_enabled, daily_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'VIRTUAL_DEBIT_CLASSIC', 'ACTIVE', 1, 0, 25000.00)
      `).run(cardId, userId, account.id, maskedCard, profile?.display_name || user.username.toUpperCase(), expiryMonth, expiryYear);

      // 3. Security Event & Notification
      createNotification(
        userId,
        'Security Setup & Virtual Card Activated',
        `Your 4-digit Transaction PIN and SecureBank Virtual Debit Card (${maskedCard}) have been configured. You are now ready to use Internet Banking.`,
        'SECURITY'
      );
    });

    logSecurityEvent(userId, 'ONBOARDING_COMPLETED', req.ip, req.get('user-agent'), 'SUCCESS', 'Transaction PIN and Card created');

    const updatedToken = signToken({
      userId,
      customerId: user.customer_id,
      username: user.username,
      isOnboarded: true
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully! Welcome to SecureBank Internet Banking.',
      token: updatedToken,
      card: {
        cardNumberMasked: maskedCard,
        cardholderName: profile?.display_name || user.username.toUpperCase(),
        expiry: `${expiryMonth}/${expiryYear}`,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    next(err);
  }
});
