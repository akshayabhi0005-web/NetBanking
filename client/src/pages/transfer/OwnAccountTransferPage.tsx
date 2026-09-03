import React, { useState } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';

export const OwnAccountTransferPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const accounts = user?.accounts || [];

  const [sourceAccId, setSourceAccId] = useState(accounts[0]?.id || '');
  const [destAccId, setDestAccId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('Transfer between self accounts');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceAccId === destAccId) {
      setErrorMessage('Source and Destination accounts cannot be identical.');
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      setErrorMessage('Please enter a valid transfer amount.');
      return;
    }

    setErrorMessage('');
    setIsPinModalOpen(true);
  };

  const handleAuthorize = async (pin: string) => {
    try {
      setIsAuthorizing(true);
      const res = await api.ownAccountTransfer({
        sourceAccountId: sourceAccId,
        destAccountId: destAccId,
        amount: Number(amount),
        transactionPin: pin,
        message: remarks
      });

      if (res.success) {
        setIsPinModalOpen(false);
        setReceiptData(res.receipt);
        await refreshUser();
        setAmount('');
      }
    } catch (err: any) {
      alert(err.message || 'Own transfer failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Funds Transfer', path: '/transfer' }, { label: 'Own Account Transfer' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Own Account Transfer
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Move funds seamlessly between your linked SecureBank Savings and current accounts.
      </p>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <ArrowLeftRight size={16} /> Inter-Account Transfer
            </span>
          </div>

          <div className="banking-card-body">
            {errorMessage && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderLeft: '4px solid #DC2626',
                padding: '10px 14px',
                borderRadius: '4px',
                color: '#991B1B',
                fontSize: '0.8rem',
                marginBottom: '16px'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleReview}>
              <div className="form-group">
                <label className="form-label">Debit Source Account</label>
                <select
                  className="form-control"
                  value={sourceAccId}
                  onChange={(e) => setSourceAccId(e.target.value)}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountType} ({a.accountNumberMasked}) - Balance: {formatInr(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Credit Destination Account</label>
                <select
                  className="form-control"
                  value={destAccId}
                  onChange={(e) => setDestAccId(e.target.value)}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountType} ({a.accountNumberMasked}) - Balance: {formatInr(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transfer Amount (INR) <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Narration</label>
                <input
                  type="text"
                  className="form-control"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Authorize Transfer</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handleAuthorize}
        amount={Number(amount)}
        recipientName="Own Account Transfer"
        isLoading={isAuthorizing}
      />

      <ReceiptModal
        isOpen={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        receipt={receiptData}
      />
    </div>
  );
};
