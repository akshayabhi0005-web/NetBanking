import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

// Ensure directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Execute a function within a strict database transaction.
 * If any exception occurs, it issues ROLLBACK automatically.
 */
export function runTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch (rollbackErr) {
      // ignore secondary rollback error
    }
    throw err;
  }
}

export function initDatabase() {
  const schema = `
    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      customer_id TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      transaction_pin_hash TEXT,
      card_pin_hash TEXT,
      security_question TEXT,
      security_answer_hash TEXT,
      is_onboarded INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

    -- CUSTOMER PROFILES
    CREATE TABLE IF NOT EXISTS customer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);

    -- BANK ACCOUNTS
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT DEFAULT 'SAVINGS',
      ifsc TEXT NOT NULL,
      branch TEXT NOT NULL,
      balance REAL DEFAULT 0.00,
      ledger_balance REAL DEFAULT 0.00,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'ACTIVE',
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_acc_no ON bank_accounts(account_number);

    -- TRANSACTIONS
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      source_account_id TEXT,
      dest_account_id TEXT,
      sender_user_id TEXT,
      recipient_user_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      transfer_mode TEXT DEFAULT 'INTERNAL',
      description TEXT NOT NULL,
      message TEXT,
      reference_no TEXT,
      balance_after REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_account_id) REFERENCES bank_accounts(id),
      FOREIGN KEY (dest_account_id) REFERENCES bank_accounts(id),
      FOREIGN KEY (sender_user_id) REFERENCES users(id),
      FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_txn_id ON transactions(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

    -- PAYMENT REQUESTS (Pay & Request feature)
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      request_id TEXT UNIQUE NOT NULL,
      requester_user_id TEXT NOT NULL,
      payer_user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      transaction_id TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (requester_user_id) REFERENCES users(id),
      FOREIGN KEY (payer_user_id) REFERENCES users(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pay_req_requester ON payment_requests(requester_user_id);
    CREATE INDEX IF NOT EXISTS idx_pay_req_payer ON payment_requests(payer_user_id);
    CREATE INDEX IF NOT EXISTS idx_pay_req_status ON payment_requests(status);

    -- BENEFICIARIES
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      beneficiary_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      ifsc TEXT NOT NULL,
      transfer_limit REAL DEFAULT 50000.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);

    -- VIRTUAL DEBIT CARDS
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      card_number_masked TEXT NOT NULL,
      cardholder_name TEXT NOT NULL,
      expiry_month TEXT NOT NULL,
      expiry_year TEXT NOT NULL,
      card_type TEXT DEFAULT 'VIRTUAL_DEBIT_CLASSIC',
      card_status TEXT DEFAULT 'ACTIVE',
      is_online_enabled INTEGER DEFAULT 1,
      is_international_enabled INTEGER DEFAULT 0,
      is_contactless_enabled INTEGER DEFAULT 1,
      daily_limit REAL DEFAULT 25000.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);

    -- FIXED DEPOSITS
    CREATE TABLE IF NOT EXISTS fixed_deposits (
      id TEXT PRIMARY KEY,
      deposit_no TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      principal_amount REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      maturity_amount REAL NOT NULL,
      maturity_date DATETIME NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
    );

    -- RECURRING DEPOSITS
    CREATE TABLE IF NOT EXISTS recurring_deposits (
      id TEXT PRIMARY KEY,
      deposit_no TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      monthly_installment REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      maturity_amount REAL NOT NULL,
      maturity_date DATETIME NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
    );

    -- BILLERS
    CREATE TABLE IF NOT EXISTS billers (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      biller_name TEXT NOT NULL,
      biller_code TEXT UNIQUE NOT NULL,
      identifier_label TEXT NOT NULL,
      sample_format TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- BILL PAYMENTS
    CREATE TABLE IF NOT EXISTS bill_payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      biller_id TEXT NOT NULL,
      consumer_number TEXT NOT NULL,
      bill_amount REAL NOT NULL,
      transaction_id TEXT NOT NULL,
      status TEXT DEFAULT 'SUCCESS',
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES bank_accounts(id),
      FOREIGN KEY (biller_id) REFERENCES billers(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    -- SERVICE REQUESTS
    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      request_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      account_id TEXT,
      request_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'SUBMITTED',
      resolution_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_services_user ON service_requests(user_id);

    -- NOTIFICATIONS
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

    -- LOGIN HISTORY
    CREATE TABLE IF NOT EXISTS login_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      device_type TEXT,
      status TEXT NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);

    -- SECURITY AUDIT EVENTS
    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- SYSTEM NOTICES & ANNOUNCEMENTS
    CREATE TABLE IF NOT EXISTS system_notices (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT DEFAULT 'NORMAL',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- SECURITY ADVISORIES
    CREATE TABLE IF NOT EXISTS security_advisories (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- FAQS
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      order_num INTEGER DEFAULT 0
    );
  `;

  db.exec(schema);
  seedSystemConfigurations();
}

function seedSystemConfigurations() {
  const noticeCount = (db.prepare('SELECT COUNT(*) as count FROM system_notices').get() as { count: number | bigint }).count;
  if (Number(noticeCount) === 0) {
    const insertNotice = db.prepare(`
      INSERT INTO system_notices (id, category, title, message, priority)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertNotice.run(
      'notice-1',
      'SECURITY',
      'Important Security Alert: Never Share OTP or Transaction PIN',
      'SecureBank will NEVER ask for your password, Transaction PIN, Card PIN, or simulated OTP via call, SMS, or email. Do not disclose sensitive credentials to anyone.',
      'HIGH'
    );
    insertNotice.run(
      'notice-2',
      'MAINTENANCE',
      'Scheduled Internet Banking Core Upgrade Window',
      'Routine maintenance is scheduled every Sunday between 02:00 AM to 03:30 AM IST. Some services may experience brief latency.',
      'NORMAL'
    );
    insertNotice.run(
      'notice-3',
      'SECURITY',
      'Beware of Phishing Websites & Unverified Remote Support Apps',
      'Always ensure the web address begins with our official portal URL. Never install screen-sharing software (e.g. AnyDesk, TeamViewer) on request of unknown callers.',
      'HIGH'
    );
    insertNotice.run(
      'notice-4',
      'NEW_FEATURE',
      'Instant Pay & Request Feature Enabled for All Customers',
      'You can now send or request virtual funds directly using registered SecureBank usernames (@username) without remembering 12-digit account numbers.',
      'NORMAL'
    );
    insertNotice.run(
      'notice-5',
      'GENERAL',
      'Keep Registered Mobile Number and Email Updated',
      'Ensure your contact details in your profile are always up to date to receive timely transaction alerts and login notifications.',
      'NORMAL'
    );
  }

  const billerCount = (db.prepare('SELECT COUNT(*) as count FROM billers').get() as { count: number | bigint }).count;
  if (Number(billerCount) === 0) {
    const insertBiller = db.prepare(`
      INSERT INTO billers (id, category, biller_name, biller_code, identifier_label, sample_format)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const defaultBillers = [
      { id: 'bil-elec-1', category: 'Electricity', name: 'Adani Electricity Mumbai Ltd', code: 'ADANI_MUM', label: '10-Digit Consumer Number', sample: '9000123456' },
      { id: 'bil-elec-2', category: 'Electricity', name: 'BESCOM - Bangalore Electricity', code: 'BESCOM_KA', label: 'Consumer Account ID', sample: '1029384756' },
      { id: 'bil-elec-3', category: 'Electricity', name: 'Tata Power Delhi Distribution Ltd', code: 'TATAPOWER_DL', label: 'CA Number', sample: '6000123456' },
      { id: 'bil-water-1', category: 'Water', name: 'Delhi Jal Board (DJB)', code: 'DJB_WATER', label: 'K Number', sample: '1234567890' },
      { id: 'bil-water-2', category: 'Water', name: 'Brihanmumbai Municipal Corporation (BMC)', code: 'BMC_WATER', label: 'CCN Number', sample: 'BMC8901234' },
      { id: 'bil-gas-1', category: 'Gas', name: 'Mahanagar Gas Limited (MGL)', code: 'MGL_MUM', label: 'CA Number', sample: '7000123456' },
      { id: 'bil-gas-2', category: 'Gas', name: 'Indraprastha Gas Limited (IGL)', code: 'IGL_DL', label: 'BP Number', sample: '4000123456' },
      { id: 'bil-mob-1', category: 'Mobile', name: 'Airtel Postpaid & Broadband', code: 'AIRTEL_POST', label: '10-Digit Mobile Number', sample: '9876543210' },
      { id: 'bil-mob-2', category: 'Mobile', name: 'Jio Postpaid / JioFiber', code: 'JIO_FIBER', label: 'Service ID / Mobile Number', sample: '9812345678' },
      { id: 'bil-dth-1', category: 'DTH', name: 'Tata Play (formerly Tata Sky)', code: 'TATA_PLAY', label: 'Subscriber ID', sample: '1089273645' },
      { id: 'bil-ins-1', category: 'Insurance', name: 'Life Insurance Corporation of India (LIC)', code: 'LIC_INDIA', label: 'Policy Number', sample: '891029384' },
      { id: 'bil-tax-1', category: 'Municipal Tax', name: 'Municipal Property Tax Assessment', code: 'MUNI_TAX', label: 'Property Tax Index No', sample: 'PTX-2026-901' },
    ];

    for (const b of defaultBillers) {
      insertBiller.run(b.id, b.category, b.name, b.code, b.label, b.sample);
    }
  }

  const advCount = (db.prepare('SELECT COUNT(*) as count FROM security_advisories').get() as { count: number | bigint }).count;
  if (Number(advCount) === 0) {
    const insertAdv = db.prepare(`
      INSERT INTO security_advisories (id, category, title, description)
      VALUES (?, ?, ?, ?)
    `);

    const advisories = [
      {
        id: 'adv-1',
        category: 'Password Security',
        title: 'Strong Password and PIN Practices',
        desc: 'Create passwords with a combination of uppercase letters, lowercase letters, numbers, and special characters. Never reuse social media or email passwords for Internet Banking. Change your Transaction PIN periodically.'
      },
      {
        id: 'adv-2',
        category: 'Phishing Awareness',
        title: 'Identifying Fake SMS, Links and Phishing Portals',
        desc: 'Fraudsters often circulate fake messages regarding electricity bill disconnection, lottery winnings, or KYC suspension containing malicious links. SecureBank never sends links asking for login credentials.'
      },
      {
        id: 'adv-3',
        category: 'Device Security',
        title: 'Safe Internet Browsing & Device Hygiene',
        desc: 'Avoid logging into Internet Banking through public Wi-Fi networks or cyber cafes. Always verify the lock icon in the browser address bar and log out immediately upon completing your transactions.'
      },
      {
        id: 'adv-4',
        category: 'SIM Swap & Call Forwarding',
        title: 'Protecting Against SIM Swap Scams',
        desc: 'If your mobile network abruptly stops working or prompts an unexpected SIM activation request, contact your cellular operator immediately. Never dial MMI codes (*21*, *401*) given by unknown callers.'
      }
    ];

    for (const a of advisories) {
      insertAdv.run(a.id, a.category, a.title, a.desc);
    }
  }

  const faqCount = (db.prepare('SELECT COUNT(*) as count FROM faqs').get() as { count: number | bigint }).count;
  if (Number(faqCount) === 0) {
    const insertFaq = db.prepare(`
      INSERT INTO faqs (id, category, question, answer, order_num)
      VALUES (?, ?, ?, ?, ?)
    `);

    const defaultFaqs = [
      {
        id: 'faq-1',
        category: 'General Banking',
        q: 'What is SecureBank and how does this simulation work?',
        a: 'SecureBank is a realistic Indian Internet Banking educational platform. All funds, accounts, and transactions are virtual INR stored securely in an isolated database without any connections to real banks or actual payment gateways.',
        order: 1
      },
      {
        id: 'faq-2',
        category: 'Pay & Request',
        q: 'How does Pay & Request work between registered users?',
        a: 'Every registered SecureBank customer has a unique username (e.g. @rahulk). You can search for their username to instantly send or request virtual funds without needing to know their 12-digit account number or IFSC.',
        order: 2
      },
      {
        id: 'faq-3',
        category: 'Security',
        q: 'What is the purpose of the Transaction PIN?',
        a: 'The Transaction PIN is a distinct 4 to 6-digit cryptographic security code required to authorize debit operations, fund transfers, and bill payments, ensuring your account balance remains protected.',
        order: 3
      },
      {
        id: 'faq-4',
        category: 'Deposits',
        q: 'How are Fixed Deposit interest calculations determined?',
        a: 'Fixed Deposits earn guaranteed simulated returns based on tenure (ranging from 6.00% p.a. for 6 months up to 7.25% p.a. for 36 months), compounded quarterly according to standard banking formulas.',
        order: 4
      },
      {
        id: 'faq-5',
        category: 'Cards',
        q: 'Can I manage my Virtual Debit Card limits and blocking?',
        a: 'Yes! From the Cards section, you can instantly toggle online transactions, international usage, adjust daily transaction limits, or temporarily freeze your card with immediate effect.',
        order: 5
      }
    ];

    for (const f of defaultFaqs) {
      insertFaq.run(f.id, f.category, f.q, f.a, f.order);
    }
  }
}
