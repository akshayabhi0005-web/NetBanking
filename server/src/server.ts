import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initDatabase } from './database/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Route Imports
import { authRouter } from './routes/authRoutes.js';
import { accountRouter } from './routes/accountRoutes.js';
import { payRequestRouter } from './routes/payRequestRoutes.js';
import { transferRouter } from './routes/transferRoutes.js';
import { beneficiaryRouter } from './routes/beneficiaryRoutes.js';
import { billRouter } from './routes/billRoutes.js';
import { cardRouter } from './routes/cardRoutes.js';
import { depositRouter } from './routes/depositRoutes.js';
import { serviceRouter } from './routes/serviceRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { profileRouter } from './routes/profileRoutes.js';
import { contentRouter } from './routes/contentRoutes.js';

// Initialize Database
initDatabase();

const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routing
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/pay-request', payRequestRouter);
app.use('/api/transfers', transferRouter);
app.use('/api/beneficiaries', beneficiaryRouter);
app.use('/api/bills', billRouter);
app.use('/api/cards', cardRouter);
app.use('/api/deposits', depositRouter);
app.use('/api/services', serviceRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/profile', profileRouter);
app.use('/api/content', contentRouter);

// Serve Frontend Static Assets in Production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = fs.existsSync(path.resolve(process.cwd(), 'client/dist'))
  ? path.resolve(process.cwd(), 'client/dist')
  : path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SecureBank Core Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[Mode] Simulated Educational Banking Portal (ACID Database Mode)`);
});
