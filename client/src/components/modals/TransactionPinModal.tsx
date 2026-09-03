import React, { useState } from 'react';
import { Lock, ShieldAlert, X } from 'lucide-react';

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title?: string;
  amount?: number;
  recipientName?: string;
  isLoading?: boolean;
}

export const TransactionPinModal: React.FC<TransactionPinModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Authorize Transaction',
  amount,
  recipientName,
  isLoading = false
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter your 4 to 6-digit Transaction PIN.');
      return;
    }
    setError('');
    onSubmit(pin);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="#D84315" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {amount !== undefined && (
              <div style={{
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: '4px',
                padding: '12px 16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#9A3412', textTransform: 'uppercase', fontWeight: 600 }}>
                  Authorizing Amount
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)' }}>
                  ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                {recipientName && (
                  <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '4px' }}>
                    Beneficiary: <strong>{recipientName}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Enter Transaction PIN <span className="required">*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                className="form-control"
                style={{
                  textAlign: 'center',
                  letterSpacing: '0.3em',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
              />
              <div className="form-help">
                Enter your SecureBank 4 or 6-digit confidential Transaction PIN set during onboarding.
              </div>
              {error && <div className="text-danger" style={{ fontSize: '0.775rem', marginTop: '6px' }}>{error}</div>}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.725rem',
              color: '#92400E',
              background: '#FEF3C7',
              padding: '8px',
              borderRadius: '4px'
            }}>
              <ShieldAlert size={14} style={{ flexShrink: 0 }} />
              <span>Simulated Security Check: Transaction PIN is verified on the backend via bcrypt.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isLoading || !pin}
            >
              {isLoading ? 'Authorizing...' : 'Authorize & Pay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
