import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr, AmountDisplay } from '../../components/common/AmountDisplay';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';
import { Search, UserCheck, SendHorizontal, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1 = Form, 2 = Review
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Live user search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.searchUsers(searchQuery);
        if (res.success) {
          setSearchResults(res.users || []);
        }
      } catch (err) {
        console.error('User search failed:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectRecipient = (u: any) => {
    setSelectedUser(u);
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage('');
  };

  const handleReviewStep = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!selectedUser) {
      setErrorMessage('Please search and select a verified SecureBank recipient.');
      return;
    }
    if (!num || num <= 0) {
      setErrorMessage('Please enter a valid transfer amount (> ₹0).');
      return;
    }
    if (primaryAccount && num > primaryAccount.balance) {
      setErrorMessage(`Insufficient balance. Your available balance is ${formatInr(primaryAccount.balance)}.`);
      return;
    }

    setErrorMessage('');
    setStep(2);
  };

  const handleAuthorizeTransfer = async (pin: string) => {
    if (!selectedUser || !primaryAccount) return;
    try {
      setIsAuthorizing(true);
      const res = await api.sendMoney({
        sourceAccountId: primaryAccount.id,
        recipientUserId: selectedUser.id,
        amount: Number(amount),
        transactionPin: pin,
        message: message.trim() || undefined
      });

      if (res.success) {
        setIsPinModalOpen(false);
        setReceiptData(res.receipt);
        await refreshUser();
        // Reset form
        setSelectedUser(null);
        setAmount('');
        setMessage('');
        setStep(1);
      }
    } catch (err: any) {
      alert(err.message || 'Transaction authorization failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Pay & Request', path: '/pay-request' }, { label: 'Send Money' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Send Virtual Funds to SecureBank Customer
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Instant intra-bank transfer with zero transmission fees and atomic settlement.
      </p>

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <SendHorizontal size={16} /> {step === 1 ? 'Transfer Details' : 'Review & Confirm Transfer'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D84315' }}>
              Step {step} of 2
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
              <form onSubmit={handleReviewStep}>
                {/* Source Account Info */}
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
                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Debited From</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>
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

                {/* Recipient Selection */}
                <div className="form-group">
                  <label className="form-label">
                    Search Recipient (@username or Full Name) <span className="required">*</span>
                  </label>

                  {selectedUser ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      padding: '10px 14px',
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#D84315', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {selectedUser.displayName.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.875rem', color: '#1E293B' }}>{selectedUser.displayName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#D84315' }}>@{selectedUser.username}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type @username or name to search directory..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '34px' }}
                      />
                      <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />

                      {/* Dropdown search results */}
                      {searchResults.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          boxShadow: 'var(--shadow-lg)',
                          borderRadius: '0 0 4px 4px',
                          zIndex: 50,
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}>
                          {searchResults.map(u => (
                            <div
                              key={u.id}
                              onClick={() => handleSelectRecipient(u)}
                              style={{
                                padding: '10px 14px',
                                borderBottom: '1px solid #F1F5F9',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'background var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#1E293B' }}>{u.displayName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#D84315' }}>@{u.username}</div>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 600 }}>Select →</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="form-help">Type at least 2 characters to search registered SecureBank customers.</div>
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label">
                    Transfer Amount (INR) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    className="form-control"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <div className="form-help">Single transaction limit: ₹50,000.00 | Daily limit: ₹1,00,000.00</div>
                </div>

                {/* Optional Message */}
                <div className="form-group">
                  <label className="form-label">Purpose / Remarks (Optional)</label>
                  <input
                    type="text"
                    maxLength={100}
                    className="form-control"
                    placeholder="e.g. Dinner, Rent share, Educational project"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!selectedUser || !amount}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Continue to Review</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Review */
              <div>
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div className="receipt-row">
                    <span className="receipt-label">Beneficiary Name:</span>
                    <span className="receipt-value">{selectedUser?.displayName}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Beneficiary Username:</span>
                    <span className="receipt-value" style={{ color: '#D84315' }}>@{selectedUser?.username}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Debited Account:</span>
                    <span className="receipt-value" style={{ fontFamily: 'var(--font-mono)' }}>{primaryAccount?.accountNumberMasked}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Transfer Amount:</span>
                    <span className="receipt-value" style={{ color: '#C2410C', fontSize: '1.1rem' }}>{formatInr(Number(amount))}</span>
                  </div>
                  {message && (
                    <div className="receipt-row">
                      <span className="receipt-label">Message / Purpose:</span>
                      <span className="receipt-value">"{message}"</span>
                    </div>
                  )}
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
        onSubmit={handleAuthorizeTransfer}
        amount={Number(amount)}
        recipientName={`${selectedUser?.displayName} (@${selectedUser?.username})`}
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
