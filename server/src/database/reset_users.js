import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../securebank.sqlite');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = OFF;');

console.log('Clearing all test/user accounts and transactions from database...');

const tablesToClear = [
  'transactions',
  'payment_requests',
  'beneficiaries',
  'cards',
  'fixed_deposits',
  'recurring_deposits',
  'bill_payments',
  'service_requests',
  'notifications',
  'login_history',
  'security_events',
  'bank_accounts',
  'customer_profiles',
  'users'
];

for (const table of tablesToClear) {
  db.exec(`DELETE FROM ${table};`);
  console.log(`  ✓ Cleared ${table}`);
}

db.exec('PRAGMA foreign_keys = ON;');
console.log('\nDatabase reset successfully! Zero dummy accounts exist.');
console.log('Only real accounts registered by you will now appear in the application.');
