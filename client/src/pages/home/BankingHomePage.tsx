import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  ArrowLeftRight, 
  SendHorizontal, 
  Receipt, 
  Wrench, 
  TrendingUp, 
  CreditCard, 
  HelpCircle, 
  Bell, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  PlusCircle, 
  Clock, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AmountDisplay, formatInr } from '../../components/common/AmountDisplay';
import { SecurityAlertBanner } from '../../components/common/SecurityAlertBanner';
import { TestDepositModal } from '../../components/modals/TestDepositModal';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';

export const BankingHomePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [notices, setNotices] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedPayReq, setSelectedPayReq] = useState<any | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const primaryAccount = user?.accounts?.[0];

  useEffect(() => {
    // Load dashboard data
    const loadHomeData = async () => {
      try {
        const [noticesRes, reqsRes] = await Promise.all([
          api.getNotices(),
          api.getPaymentRequests()
        ]);

        if (noticesRes.success) setNotices(noticesRes.notices || []);
        if (reqsRes.success) setPendingRequests(reqsRes.incoming?.filter((r: any) => r.status === 'PENDING') || []);

        if (primaryAccount) {
          const txnRes = await api.getTransactions(primaryAccount.id, { limit: '5' });
          if (txnRes.success) setRecentTransactions(txnRes.transactions || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadHomeData();
  }, [primaryAccount?.id]);

  const handlePayRequestClick = (req: any) => {
    setSelectedPayReq(req);
    setIsPinModalOpen(true);
  };

  const handleAuthorizePayRequest = async (pin: string) => {
    if (!selectedPayReq || !primaryAccount) return;
    try {
      setIsAuthorizing(true);
      const res = await api.payPaymentRequest(selectedPayReq.id, {
        sourceAccountId: primaryAccount.id,
        transactionPin: pin
      });

      if (res.success) {
        setIsPinModalOpen(false);
        setReceiptData(res.receipt);
        setPendingRequests(prev => prev.filter(r => r.id !== selectedPayReq.id));
        await refreshUser();
        // Refresh txns
        const txnRes = await api.getTransactions(primaryAccount.id, { limit: '5' });
        if (txnRes.success) setRecentTransactions(txnRes.transactions || []);
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    if (!confirm('Are you sure you want to decline this payment request?')) return;
    try {
      await api.declinePaymentRequest(reqId);
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err: any) {
      alert(err.message || 'Failed to decline request.');
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--bank-primary)',
        padding: '14px 20px',
        borderRadius: '4px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', color: '#1E293B', fontWeight: 800 }}>
            Welcome to SecureBank Internet Banking, {user?.displayName || 'Customer'}
          </h2>
          <div style={{ fontSize: '0.785rem', color: '#64748B', marginTop: '2px' }}>
            Customer ID: <strong style={{ color: '#1E293B', fontFamily: 'var(--font-mono)' }}>{user?.customerId}</strong> | 
            Username: <strong style={{ color: '#D84315' }}>@{user?.username}</strong>
          </div>
        </div>

        {/* Small Primary Account Snapshot */}
        {primaryAccount && (
          <div style={{
            background: '#FFF7ED',
            border: '1px solid #FFEDD5',
            padding: '10px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9A3412', textTransform: 'uppercase', fontWeight: 700 }}>
                Primary {primaryAccount.accountType} ({primaryAccount.accountNumberMasked})
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)' }}>
                {formatInr(primaryAccount.balance)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link to="/accounts/summary" className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                View Account
              </Link>
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#16A34A', borderColor: '#15803D' }}
              >
                + Add Test Funds
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Action Section: "What would you like to do today?" */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '0.95rem',
          fontWeight: 800,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>What would you like to do today?</span>
        </h3>

        <div className="quick-action-grid">
          <Link to="/accounts/summary" className="quick-action-tile">
            <div className="quick-action-icon"><Wallet size={20} /></div>
            <span className="quick-action-label">Accounts</span>
          </Link>

          <Link to="/transfer" className="quick-action-tile">
            <div className="quick-action-icon"><ArrowLeftRight size={20} /></div>
            <span className="quick-action-label">Funds Transfer</span>
          </Link>

          <Link to="/pay-request" className="quick-action-tile" style={{ borderTopColor: '#D84315' }}>
            <div className="quick-action-icon" style={{ background: '#FFEDD5', color: '#C2410C' }}><SendHorizontal size={20} /></div>
            <span className="quick-action-label">Pay & Request</span>
          </Link>

          <Link to="/bills" className="quick-action-tile">
            <div className="quick-action-icon"><Receipt size={20} /></div>
            <span className="quick-action-label">Bill Payment</span>
          </Link>

          <Link to="/cards" className="quick-action-tile">
            <div className="quick-action-icon"><CreditCard size={20} /></div>
            <span className="quick-action-label">Cards</span>
          </Link>

          <Link to="/services" className="quick-action-tile">
            <div className="quick-action-icon"><Wrench size={20} /></div>
            <span className="quick-action-label">Services</span>
          </Link>

          <Link to="/invest/deposits" className="quick-action-tile">
            <div className="quick-action-icon"><TrendingUp size={20} /></div>
            <span className="quick-action-label">Deposits</span>
          </Link>

          <Link to="/help" className="quick-action-tile">
            <div className="quick-action-icon"><HelpCircle size={20} /></div>
            <span className="quick-action-label">Help Center</span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Left Content (Notices & Activity) / Right Content (Quick Links & Advisories) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* LEFT COLUMN */}
        <div>
          {/* PENDING PAYMENT REQUESTS BANNER (If Any) */}
          {pendingRequests.length > 0 && (
            <div className="banking-card" style={{ borderLeftColor: '#D97706' }}>
              <div className="banking-card-header" style={{ background: '#FEF3C7' }}>
                <span className="banking-card-title" style={{ color: '#92400E' }}>
                  <Bell size={16} /> Pending Money Requests ({pendingRequests.length})
                </span>
                <Link to="/pay-request/pending" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309' }}>
                  View All →
                </Link>
              </div>
              <div className="banking-card-body" style={{ padding: '12px' }}>
                {pendingRequests.map(req => (
                  <div key={req.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderBottom: '1px solid #FEF3C7',
                    background: '#FFFBEB',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1E293B' }}>
                        @{req.requesterUsername} ({req.requesterDisplayName}) requested <span style={{ color: '#C2410C' }}>{formatInr(req.amount)}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                        Reason: {req.reason} • Exp: {new Date(req.expiresAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handlePayRequestClick(req)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                      >
                        Pay {formatInr(req.amount)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECENT ACTIVITY */}
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">
                <Clock size={16} /> Recent Account Activity
              </span>
              <Link to="/accounts/transactions" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                Full Statement →
              </Link>
            </div>
            <div className="banking-card-body" style={{ padding: 0 }}>
              {recentTransactions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.825rem' }}>
                  No transactions yet. Click "+ Add Test Funds" above or use Pay & Request to begin transferring.
                </div>
              ) : (
                <table className="banking-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{tx.description}</div>
                          <div style={{ fontSize: '0.675rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                            {tx.transactionId}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${tx.isDebit ? 'danger' : 'success'}`}>
                            {tx.isDebit ? 'DEBIT' : 'CREDIT'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <AmountDisplay
                            amount={tx.amount}
                            type={tx.isDebit ? 'debit' : 'credit'}
                            showSign={true}
                            size="sm"
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                          {tx.balanceAfter !== null ? formatInr(tx.balanceAfter) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* IMPORTANT NOTICES */}
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">
                <Bell size={16} /> Important Banking Notices & Advisories
              </span>
            </div>
            <div className="banking-card-body" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notices.map(n => (
                  <div key={n.id} style={{
                    padding: '10px 12px',
                    borderLeft: `3px solid ${n.priority === 'HIGH' ? '#DC2626' : '#D84315'}`,
                    background: '#F9FAFB',
                    borderRadius: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '0.825rem', color: '#1E293B' }}>{n.title}</strong>
                      <span className={`status-badge ${n.priority === 'HIGH' ? 'danger' : 'info'}`}>
                        {n.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.765rem', color: '#4B5563', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* QUICK LINKS */}
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">Quick Links</span>
            </div>
            <div className="banking-card-body" style={{ padding: '8px 12px' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Download Account Statement', path: '/accounts/statement' },
                  { label: 'Detailed Transaction History', path: '/accounts/transactions' },
                  { label: 'Pay & Request Hub', path: '/pay-request' },
                  { label: 'Manage Beneficiaries', path: '/transfer/beneficiaries' },
                  { label: 'Cheque Book Request', path: '/services/cheque-book' },
                  { label: 'Open Fixed Deposit (FD)', path: '/invest/deposits' },
                  { label: 'Manage Virtual Debit Card', path: '/cards' },
                  { label: 'Security & Login History', path: '/profile/security' },
                  { label: 'Customer Care & Helpdesk', path: '/help' },
                ].map((item, idx) => (
                  <li key={idx} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '4px' }}>
                    <Link
                      to={item.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.785rem',
                        color: '#374151',
                        padding: '4px 0'
                      }}
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={14} color="#94A3B8" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SECURITY GUIDELINE PANEL */}
          <SecurityAlertBanner
            title="Safe Banking Habits"
            message="Never share your password, OTP, or Transaction PIN with anyone claiming to be a SecureBank employee. Report unauthorized activities immediately."
          />

          {/* CUSTOMER SUPPORT CARD */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '4px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '0.85rem', color: '#1E293B', marginBottom: '4px' }}>
              Customer Support Center
            </h4>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px' }}>
              Toll-Free Helpline (Simulated):
            </div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#D84315',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em'
            }}>
              1800-XXX-XXXX
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '6px' }}>
              Available 24x7 for Internet Banking Assistance
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TestDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        accountId={primaryAccount?.id || ''}
        onSuccess={() => {}}
      />

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => { setIsPinModalOpen(false); setSelectedPayReq(null); }}
        onSubmit={handleAuthorizePayRequest}
        amount={selectedPayReq?.amount}
        recipientName={`@${selectedPayReq?.requesterUsername}`}
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
