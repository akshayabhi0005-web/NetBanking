import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { requireAuth, requireOnboarded, AuthenticatedRequest } from '../middleware/auth.js';
import { maskAccountNumber } from '../utils/generators.js';
import { logSecurityEvent } from '../middleware/audit.js';

export const beneficiaryRouter = Router();

beneficiaryRouter.use(requireAuth);
beneficiaryRouter.use(requireOnboarded);

/**
 * List user's beneficiaries
 */
beneficiaryRouter.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const beneficiaries = db.prepare('SELECT * FROM beneficiaries WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];

    res.json({
      success: true,
      beneficiaries: beneficiaries.map(b => ({
        id: b.id,
        nickname: b.nickname,
        beneficiaryName: b.beneficiary_name,
        accountNumber: b.account_number,
        accountNumberMasked: maskAccountNumber(b.account_number),
        bankName: b.bank_name,
        ifsc: b.ifsc,
        transferLimit: Number(b.transfer_limit),
        createdAt: b.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Add Beneficiary
 */
beneficiaryRouter.post('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { nickname, beneficiaryName, accountNumber, bankName, ifsc, transferLimit } = req.body;

    if (!nickname || !beneficiaryName || !accountNumber || !bankName || !ifsc) {
      return res.status(400).json({
        success: false,
        message: 'All beneficiary fields are required.'
      });
    }

    const cleanAcc = accountNumber.replace(/\s+/g, '');
    const cleanIfsc = ifsc.toUpperCase().trim();

    // Check duplicate for this user
    const existing = db.prepare('SELECT id FROM beneficiaries WHERE user_id = ? AND account_number = ?').get(userId, cleanAcc);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A beneficiary with this account number already exists in your list.'
      });
    }

    const benId = uuidv4();
    db.prepare(`
      INSERT INTO beneficiaries (
        id, user_id, nickname, beneficiary_name, account_number, bank_name, ifsc, transfer_limit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(benId, userId, nickname.trim(), beneficiaryName.trim(), cleanAcc, bankName.trim(), cleanIfsc, Number(transferLimit) || 50000);

    logSecurityEvent(userId, 'BENEFICIARY_CREATED', req.ip, req.get('user-agent'), 'SUCCESS', `Added ${beneficiaryName} (${cleanAcc})`);

    res.status(201).json({
      success: true,
      message: `Beneficiary "${nickname}" added successfully.`,
      beneficiaryId: benId
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete Beneficiary
 */
beneficiaryRouter.delete('/:id', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const benId = req.params.id as string;

    const result = db.prepare('DELETE FROM beneficiaries WHERE id = ? AND user_id = ?').run(benId, userId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found or unauthorized.' });
    }

    logSecurityEvent(userId, 'BENEFICIARY_DELETED', req.ip, req.get('user-agent'), 'SUCCESS', `Deleted ID: ${benId}`);

    res.json({ success: true, message: 'Beneficiary removed successfully.' });
  } catch (err) {
    next(err);
  }
});
