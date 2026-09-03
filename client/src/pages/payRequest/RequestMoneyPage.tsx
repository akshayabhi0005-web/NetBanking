import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { Search, ArrowDownLeft, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export const RequestMoneyPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!selectedUser) {
      setErrorMessage('Please search and select a SecureBank customer to request funds from.');
      return;
    }
    if (!num || num <= 0) {
      setErrorMessage('Please enter a valid request amount (> ₹0).');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await api.requestMoney({
        payerUserId: selectedUser.id,
        amount: num,
        reason: reason.trim() || 'Simulated Money Request'
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          navigate('/pay-request/pending');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit money request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Pay & Request', path: '/pay-request' }, { label: 'Request Money' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Request Virtual Funds from Customer
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Initiate a money request to any registered customer. They can approve the request from their dashboard.
      </p>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <ArrowDownLeft size={16} /> Money Request Form
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

            {successMessage && (
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderLeft: '4px solid #16A34A',
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

            <form onSubmit={handleSubmit}>
              {/* Recipient to request from */}
              <div className="form-group">
                <label className="form-label">
                  Request Funds From (@username or Name) <span className="required">*</span>
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
                      placeholder="Search recipient by @username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '34px' }}
                    />
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />

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
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>{u.displayName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#D84315' }}>@{u.username}</div>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 600 }}>Select →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">
                  Requested Amount (INR) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50000"
                  className="form-control"
                  placeholder="e.g. 750"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Reason / Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose / Reason <span className="required">*</span></label>
                <input
                  type="text"
                  maxLength={100}
                  className="form-control"
                  placeholder="e.g. Lunch split, Project contribution, Book reimbursement"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !selectedUser || !amount}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{isLoading ? 'Sending Request...' : 'Send Payment Request'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
