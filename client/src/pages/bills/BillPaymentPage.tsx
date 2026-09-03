import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';
import { Receipt, Zap, Droplet, Flame, Smartphone, Tv, ShieldCheck, ArrowRight } from 'lucide-react';

export const BillPaymentPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [categories, setCategories] = useState<string[]>([]);
  const [billers, setBillers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBillerId, setSelectedBillerId] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('1250');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchBillers = async () => {
      try {
        const res = await api.getBillers(selectedCategory !== 'ALL' ? selectedCategory : undefined);
        if (res.success) {
          setBillers(res.billers || []);
          if (res.categories && categories.length === 0) setCategories(res.categories);
          if (res.billers?.[0] && !selectedBillerId) setSelectedBillerId(res.billers[0].id);
        }
      } catch (err) {
        console.error('Failed to load billers:', err);
      }
    };

    fetchBillers();
  }, [selectedCategory]);

  const activeBiller = billers.find(b => b.id === selectedBillerId) || billers[0];

  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerNumber.trim()) {
      setErrorMessage(`Please enter a valid ${activeBiller?.identifierLabel || 'Consumer Number'}.`);
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      setErrorMessage('Please enter a valid bill amount.');
      return;
    }
    if (primaryAccount && num > primaryAccount.balance) {
      setErrorMessage(`Insufficient available balance in ${primaryAccount.accountNumberMasked}.`);
      return;
    }

    setErrorMessage('');
    setIsPinModalOpen(true);
  };

  const handleAuthorize = async (pin: string) => {
    if (!primaryAccount || !activeBiller) return;
    try {
      setIsAuthorizing(true);
      const res = await api.payBill({
        accountId: primaryAccount.id,
        billerId: activeBiller.id,
        consumerNumber: consumerNumber.trim(),
        amount: Number(amount),
        transactionPin: pin
      });

      if (res.success) {
        setIsPinModalOpen(false);
        setReceiptData(res.receipt);
        await refreshUser();
        setConsumerNumber('');
      }
    } catch (err: any) {
      alert(err.message || 'Bill payment failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Bill Payment', path: '/bills' }, { label: 'Pay Utility Bills' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Utility & Bharat Bill Payment Simulation
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Pay electricity, water, broadband, gas, and postpaid bills directly from your SecureBank account.
      </p>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.775rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: selectedCategory === 'ALL' ? '#D84315' : '#CBD5E1',
            background: selectedCategory === 'ALL' ? '#FFF3E0' : '#FFFFFF',
            color: selectedCategory === 'ALL' ? '#D84315' : '#475569'
          }}
        >
          All Categories
        </button>
        {categories.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCategory(c)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.775rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: selectedCategory === c ? '#D84315' : '#CBD5E1',
              background: selectedCategory === c ? '#FFF3E0' : '#FFFFFF',
              color: selectedCategory === c ? '#D84315' : '#475569'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <Receipt size={16} /> Bill Settlement Form
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

            <form onSubmit={handlePayClick}>
              {/* Debit Account */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Debit Account</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {primaryAccount?.accountType} ({primaryAccount?.accountNumberMasked})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Balance</div>
                  <div style={{ fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)' }}>
                    {formatInr(primaryAccount?.balance || 0)}
                  </div>
                </div>
              </div>

              {/* Biller Select */}
              <div className="form-group">
                <label className="form-label">Select Biller Organization <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={selectedBillerId}
                  onChange={(e) => setSelectedBillerId(e.target.value)}
                >
                  {billers.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.category}] {b.billerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consumer / Account Number */}
              <div className="form-group">
                <label className="form-label">
                  {activeBiller?.identifierLabel || 'Consumer Account Number'} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={activeBiller?.sampleFormat ? `e.g. ${activeBiller.sampleFormat}` : 'Enter identifier'}
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Bill Amount (INR) <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 1250"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!consumerNumber || !amount}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Authorize Bill Payment</span>
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
        recipientName={activeBiller?.billerName}
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
