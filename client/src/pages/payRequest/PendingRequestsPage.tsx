import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { EmptyState } from '../../components/common/EmptyState';
import { TransactionPinModal } from '../../components/modals/TransactionPinModal';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';
import { Clock, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const PendingRequestsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayReq, setSelectedPayReq] = useState<any | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPaymentRequests();
      if (res.success) {
        setIncoming(res.incoming || []);
        setOutgoing(res.outgoing || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handlePayClick = (req: any) => {
    setSelectedPayReq(req);
    setIsPinModalOpen(true);
  };

  const handleAuthorizePay = async (pin: string) => {
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
        await refreshUser();
        await fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDecline = async (id: string) => {
    if (!confirm('Decline this money request?')) return;
    try {
      await api.declinePaymentRequest(id);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to decline.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this outbound money request?')) return;
    try {
      await api.cancelPaymentRequest(id);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="status-badge success">PAID</span>;
      case 'PENDING': return <span className="status-badge warning">PENDING</span>;
      case 'DECLINED': return <span className="status-badge danger">DECLINED</span>;
      case 'CANCELLED': return <span className="status-badge info">CANCELLED</span>;
      default: return <span className="status-badge info">{status}</span>;
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Pay & Request', path: '/pay-request' }, { label: 'Pending Requests' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Payment Requests Hub</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Manage incoming money requests from others and track outbound requests you created.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.825rem',
            border: '1px solid',
            borderColor: activeTab === 'incoming' ? '#D84315' : '#E2E8F0',
            background: activeTab === 'incoming' ? '#FFF3E0' : '#FFFFFF',
            color: activeTab === 'incoming' ? '#D84315' : '#475569',
            cursor: 'pointer'
          }}
        >
          Inbound Requests ({incoming.filter(r => r.status === 'PENDING').length} Pending)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.825rem',
            border: '1px solid',
            borderColor: activeTab === 'outgoing' ? '#D84315' : '#E2E8F0',
            background: activeTab === 'outgoing' ? '#FFF3E0' : '#FFFFFF',
            color: activeTab === 'outgoing' ? '#D84315' : '#475569',
            cursor: 'pointer'
          }}
        >
          Outbound Requests Sent ({outgoing.length})
        </button>
      </div>

      {/* Content Table */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Clock size={16} /> {activeTab === 'incoming' ? 'Inbound Payment Requests (Requested from You)' : 'Outbound Requests (Created by You)'}
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {activeTab === 'incoming' ? (
            incoming.length === 0 ? (
              <EmptyState
                title="No Inbound Requests"
                description="No one has requested money from your account."
              />
            ) : (
              <div className="banking-table-container" style={{ border: 'none' }}>
                <table className="banking-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Requester</th>
                      <th>Reason / Purpose</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Requested Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incoming.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#D84315' }}>
                          {req.requestId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>{req.requesterDisplayName}</div>
                          <div style={{ fontSize: '0.725rem', color: '#D84315' }}>@{req.requesterUsername}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{req.reason}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#C2410C' }}>
                          {formatInr(req.amount)}
                        </td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(req.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {req.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleDecline(req.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handlePayClick(req)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 10px', fontSize: '0.7rem' }}
                              >
                                Pay {formatInr(req.amount)}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{req.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            outgoing.length === 0 ? (
              <EmptyState
                title="No Outbound Requests"
                description="You haven't requested funds from any customers yet."
              />
            ) : (
              <div className="banking-table-container" style={{ border: 'none' }}>
                <table className="banking-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Requested From</th>
                      <th>Reason / Purpose</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outgoing.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#D84315' }}>
                          {req.requestId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>{req.payerDisplayName}</div>
                          <div style={{ fontSize: '0.725rem', color: '#D84315' }}>@{req.payerUsername}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{req.reason}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#15803D' }}>
                          {formatInr(req.amount)}
                        </td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(req.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {req.status === 'PENDING' ? (
                            <button
                              onClick={() => handleCancel(req.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                            >
                              Cancel Request
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handleAuthorizePay}
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
