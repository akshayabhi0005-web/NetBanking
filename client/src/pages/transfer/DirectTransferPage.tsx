import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';
import { Building2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const DirectTransferPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [destAccount, setDestAccount] = useState('');
  const [confirmDestAccount, setConfirmDestAccount] = useState('');
  const [ifsc, setIfsc] = useState('SECB0001089');
  const [amount, setAmount] = useState('');
  const [transferMode, setTransferMode] = useState('IMPS_SIM');
  const [remarks, setRemarks] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (destAccount.replace(/\s+/g, '') !== confirmDestAccount.replace(/\s+/g, '')) {
      setErrorMessage('Destination Account Number confirmation does not match.');
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      setErrorMessage('Please enter a valid transfer amount (> ₹0).');
      return;
    }
    if (primaryAccount && num > primaryAccount.balance) {
      setErrorMessage(`Insufficient available balance. Current balance: ${formatInr(primaryAccount.balance)}.`);
      return;
    }

    setErrorMessage('');
    setStep(2);
  };

  const handleAuthorize = async (pin: string) => {
    if (!primaryAccount) return;
    try {
      setIsAuthorizing(true);
      const res = await api.directTransfer({
        sourceAccountId: primaryAccount.id,
        destAccountNumber: destAccount.trim(),
        ifsc: ifsc.trim(),
        amount: Number(amount),
        transferMode,
        transactionPin: pin,
        message: remarks.trim() || undefined
      });

      if (res.success) {
        setIsPinModalOpen(false);
        setReceiptData(res.receipt);
        await refreshUser();
        // Reset
        setDestAccount('');
        setConfirmDestAccount('');
        setAmount('');
        setRemarks('');
        setStep(1);
      }
    } catch (err: any) {
      alert(err.message || 'Direct transfer failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Funds Transfer', path: '/transfer' }, { label: 'Within SecureBank' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Transfer Funds within SecureBank (Account Number + IFSC)
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Electronic transfer to any 12-digit SecureBank account using simulated IMPS/NEFT rails.
      </p>

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <Building2 size={16} /> {step === 1 ? 'Fund Transfer Details' : 'Review Transfer Order'}
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

            {step === 1 ? (
              <form onSubmit={handleReview}>
                {/* Debit Account Info */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Debit From Account</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      {primaryAccount?.accountType} ({primaryAccount?.accountNumberMasked})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Available Balance</div>
                    <div style={{ fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)' }}>
                      {formatInr(primaryAccount?.balance || 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Beneficiary Account Number <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="12-digit account number"
                      value={destAccount}
                      onChange={(e) => setDestAccount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Re-enter Account Number <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Confirm account number"
                      value={confirmDestAccount}
                      onChange={(e) => setConfirmDestAccount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">IFSC Code <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      required
                    />
                    <div className="form-help">SecureBank default IFSC: SECB0001089</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transfer Mode (Simulated)</label>
                    <select
                      className="form-control"
                      value={transferMode}
                      onChange={(e) => setTransferMode(e.target.value)}
                    >
                      <option value="IMPS_SIM">IMPS (Instant 24x7 Settlement)</option>
                      <option value="NEFT_SIM">NEFT (Batch Simulation)</option>
                      <option value="RTGS_SIM">RTGS (High Value Simulation)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (INR) <span className="required">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    className="form-control"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <div className="form-help">Single transaction limit: ₹50,000.00</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Narration</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Consultancy fee, Personal transfer"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Proceed to Review</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div className="receipt-row">
                    <span className="receipt-label">Beneficiary Account:</span>
                    <span className="receipt-value" style={{ fontFamily: 'var(--font-mono)' }}>{destAccount}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">IFSC Code:</span>
                    <span className="receipt-value" style={{ fontFamily: 'var(--font-mono)' }}>{ifsc}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Transfer Mode:</span>
                    <span className="receipt-value">{transferMode}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Transfer Amount:</span>
                    <span className="receipt-value" style={{ color: '#C2410C', fontSize: '1.1rem' }}>{formatInr(Number(amount))}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(true)}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                  >
                    Confirm & Enter PIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handleAuthorize}
        amount={Number(amount)}
        recipientName={`Account: ${destAccount}`}
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
