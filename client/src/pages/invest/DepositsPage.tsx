import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { EmptyState } from '../../components/common/EmptyState';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { TrendingUp, PlusCircle, CheckCircle2, Calculator, ArrowRight } from 'lucide-react';

export const DepositsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [fixedDeposits, setFixedDeposits] = useState<any[]>([]);
  const [recurringDeposits, setRecurringDeposits] = useState<any[]>([]);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [principal, setPrincipal] = useState('25000');
  const [tenureMonths, setTenureMonths] = useState(12);
  const [calcResult, setCalcResult] = useState<any | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDeposits = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDeposits();
      if (res.success) {
        setFixedDeposits(res.fixedDeposits || []);
        setRecurringDeposits(res.recurringDeposits || []);
      }
    } catch (err) {
      console.error('Failed to load deposits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Update calculator live
  useEffect(() => {
    const num = Number(principal);
    if (!num || num < 1000) return;
    const calc = async () => {
      try {
        const res = await api.calculateFd({ principal: num, tenureMonths });
        if (res.success) {
          setCalcResult(res);
        }
      } catch (err) {
        console.error('Calculation error:', err);
      }
    };
    calc();
  }, [principal, tenureMonths]);

  const handleOpenFdClick = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(principal);
    if (!num || num < 1000) {
      setErrorMessage('Minimum Fixed Deposit amount is ₹1,000.00.');
      return;
    }
    if (primaryAccount && num > primaryAccount.balance) {
      setErrorMessage(`Insufficient balance in ${primaryAccount.accountNumberMasked}. Available: ${formatInr(primaryAccount.balance)}.`);
      return;
    }

    setErrorMessage('');
    setIsPinModalOpen(true);
  };

  const handleAuthorizeFd = async (pin: string) => {
    if (!primaryAccount) return;
    try {
      setIsLoading(true);
      const res = await api.openFd({
        sourceAccountId: primaryAccount.id,
        principalAmount: Number(principal),
        tenureMonths,
        transactionPin: pin
      });

      if (res.success) {
        setIsPinModalOpen(false);
        setSuccessMessage(res.message);
        setShowOpenForm(false);
        await refreshUser();
        await fetchDeposits();
      }
    } catch (err: any) {
      alert(err.message || 'Fixed deposit creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Invest', path: '/invest/deposits' }, { label: 'Term Deposits (FD & RD)' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>
            Fixed & Recurring Term Deposits
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Earn guaranteed simulated returns with quarterly compounding interest rates up to 7.25% p.a.
          </p>
        </div>

        <button
          onClick={() => setShowOpenForm(!showOpenForm)}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={14} />
          <span>{showOpenForm ? 'Close Calculator' : '+ Open New Fixed Deposit'}</span>
        </button>
      </div>

      {successMessage && (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          padding: '10px 14px',
          borderRadius: '4px',
          color: '#166534',
          fontSize: '0.8rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Open FD Form & Calculator */}
      {showOpenForm && (
        <div className="banking-card" style={{ borderLeftColor: '#D84315', marginBottom: '24px' }}>
          <div className="banking-card-header" style={{ background: '#FFF7ED' }}>
            <span className="banking-card-title" style={{ color: '#C2410C' }}>
              <Calculator size={16} /> Fixed Deposit Investment Calculator & Creation
            </span>
          </div>

          <div className="banking-card-body">
            {errorMessage && (
              <div style={{ color: '#DC2626', fontSize: '0.8rem', marginBottom: '12px' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <form onSubmit={handleOpenFdClick}>
                <div className="form-group">
                  <label className="form-label">Principal Investment Amount (INR) <span className="required">*</span></label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    className="form-control"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    required
                  />
                  <div className="form-help">Minimum: ₹1,000.00 | Debited from your Savings Account</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tenure Duration <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                  >
                    <option value={6}>6 Months @ 6.00% p.a.</option>
                    <option value={12}>12 Months (1 Year) @ 6.75% p.a.</option>
                    <option value={24}>24 Months (2 Years) @ 7.10% p.a.</option>
                    <option value={36}>36 Months (3 Years) @ 7.25% p.a.</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                  Proceed to Open FD →
                </button>
              </form>

              {/* Estimate Preview */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#1E293B', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Maturity Estimation
                  </h4>
                  <div className="receipt-row">
                    <span className="receipt-label">Interest Rate:</span>
                    <span className="receipt-value" style={{ color: '#15803D' }}>{calcResult?.interestRate || 6.75}% p.a.</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Interest Earned:</span>
                    <span className="receipt-value">{formatInr(calcResult?.totalInterestEarned || 0)}</span>
                  </div>
                  <div className="receipt-row" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                    <span className="receipt-label">Estimated Maturity:</span>
                    <span className="receipt-value" style={{ color: '#C2410C', fontSize: '1.1rem' }}>
                      {formatInr(calcResult?.maturityAmount || 0)}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '10px' }}>
                  * Quarterly compounding simulation according to Indian banking norms.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Fixed Deposits Table */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <TrendingUp size={16} /> Active Fixed Deposits ({fixedDeposits.length})
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {fixedDeposits.length === 0 ? (
            <EmptyState
              title="No Active Fixed Deposits"
              description="You haven't opened any term deposits yet. Open an FD to earn simulated interest."
              actionLabel="+ Open Fixed Deposit"
              onAction={() => setShowOpenForm(true)}
            />
          ) : (
            <table className="banking-table">
              <thead>
                <tr>
                  <th>Deposit No.</th>
                  <th style={{ textAlign: 'right' }}>Principal (₹)</th>
                  <th>Tenure</th>
                  <th>Interest Rate</th>
                  <th style={{ textAlign: 'right' }}>Maturity Amount (₹)</th>
                  <th>Maturity Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fixedDeposits.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#D84315', fontWeight: 600 }}>
                      {f.depositNo}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {formatInr(f.principalAmount)}
                    </td>
                    <td>{f.tenureMonths} Months</td>
                    <td style={{ color: '#15803D', fontWeight: 700 }}>{f.interestRate}% p.a.</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#C2410C' }}>
                      {formatInr(f.maturityAmount)}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {new Date(f.maturityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td><span className="status-badge success">{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handleAuthorizeFd}
        amount={Number(principal)}
        recipientName="Fixed Deposit Creation"
        isLoading={isLoading}
      />
    </div>
  );
};
