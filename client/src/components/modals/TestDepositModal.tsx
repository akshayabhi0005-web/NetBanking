import React, { useState } from 'react';
import { PlusCircle, Check, X, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatInr } from '../common/AmountDisplay';

interface TestDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onSuccess: () => void;
}

export const TestDepositModal: React.FC<TestDepositModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onSuccess
}) => {
  const { refreshUser } = useAuth();
  const [amount, setAmount] = useState('10000');
  const [description, setDescription] = useState('Simulated Salary / Test Deposit');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickAmounts = [2000, 5000, 10000, 25000, 50000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await api.depositTestFunds({
        accountId,
        amount: numAmt,
        description: description.trim() || 'Simulated Fund Deposit'
      });

      if (res.success) {
        await refreshUser();
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Deposit simulation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={16} color="#15803D" />
            <span>Deposit Simulated Virtual Funds</span>
          </div>
          <button onClick={onClose} disabled={isLoading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '0.785rem',
              color: '#166534',
              marginBottom: '16px'
            }}>
              Since this is an educational simulated banking environment, you can deposit virtual INR to test transfers, fixed deposits, bill payments, and user-to-user transactions.
            </div>

            <div className="form-group">
              <label className="form-label">Select or Enter Amount (INR)</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {quickAmounts.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: Number(amount) === q ? '#D84315' : '#E2E8F0',
                      background: Number(amount) === q ? '#FFF3E0' : '#FFFFFF',
                      color: Number(amount) === q ? '#D84315' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {formatInr(q)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="500000"
                className="form-control"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deposit Narration / Source</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <div className="text-danger" style={{ fontSize: '0.775rem', marginBottom: '10px' }}>{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-success btn-sm">
              {isLoading ? 'Processing...' : 'Deposit Simulated Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
