import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'securebank-production-grade-super-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'securebank.sqlite'),
  defaultIfsc: 'SECB0001089',
  defaultBranch: 'Main Financial Branch, Mumbai',
  dailyTransferLimit: 100000,
  singleTransactionLimit: 50000,
  isProduction: process.env.NODE_ENV === 'production',
};
