import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { EmptyState } from '../../components/common/EmptyState';
import { Wrench, BookOpen, AlertOctagon, FileCheck, CheckCircle2, Clock } from 'lucide-react';

export const ServiceRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [activeTab, setActiveTab] = useState<'list' | 'cheque' | 'stop' | 'cert'>('list');
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cheque Form
  const [leavesCount, setLeavesCount] = useState(25);
  const [deliveryAddress, setDeliveryAddress] = useState('Registered Residential Address');

  // Stop Cheque Form
  const [chequeNo, setChequeNo] = useState('');
  const [stopReason, setStopReason] = useState('Lost Cheque Leaf');

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.getServiceRequests();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Failed to load service requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChequeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryAccount) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.requestChequeBook({
        accountId: primaryAccount.id,
        leavesCount,
        deliveryAddress
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setActiveTab('list');
        await fetchRequests();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Cheque book request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopChequeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryAccount || !chequeNo.trim()) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.stopChequePayment({
        accountId: primaryAccount.id,
        chequeNumber: chequeNo.trim(),
        reason: stopReason
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setChequeNo('');
        setActiveTab('list');
        await fetchRequests();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Stop cheque instruction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificateSubmit = async (type: string) => {
    if (!primaryAccount) return;
    try {
      setIsLoading(true);
      const res = await api.requestGeneralService({
        accountId: primaryAccount.id,
        requestType: type,
        description: `Request for official ${type} for Financial Year 2025-26.`
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setActiveTab('list');
        await fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Services', path: '/services' }, { label: 'Service Requests' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Service Requests & Helpdesk</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Submit and track cheque book dispatches, stop payment instructions, and interest certificates.
          </p>
        </div>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'list', label: `My Requests (${requests.length})`, icon: Clock },
          { id: 'cheque', label: 'Cheque Book Request', icon: BookOpen },
          { id: 'stop', label: 'Stop Cheque Payment', icon: AlertOctagon },
          { id: 'cert', label: 'Banking Certificates', icon: FileCheck },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTab(t.id as any); setSuccessMessage(''); setErrorMessage(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.8rem',
                border: '1px solid',
                borderColor: activeTab === t.id ? '#D84315' : '#CBD5E1',
                background: activeTab === t.id ? '#FFF3E0' : '#FFFFFF',
                color: activeTab === t.id ? '#D84315' : '#475569',
                cursor: 'pointer'
              }}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Request History */}
      {activeTab === 'list' && (
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <Clock size={16} /> Track Service Request Status
            </span>
          </div>
          <div className="banking-card-body" style={{ padding: 0 }}>
            {requests.length === 0 ? (
              <EmptyState
                title="No Service Requests"
                description="You haven't submitted any service requests yet."
                actionLabel="Request Cheque Book"
                onAction={() => setActiveTab('cheque')}
              />
            ) : (
              <table className="banking-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#D84315', fontWeight: 600 }}>
                        {r.requestId}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td><strong>{r.requestType}</strong></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.accountNumberMasked}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.description}</td>
                      <td><span className="status-badge warning">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Cheque Book */}
      {activeTab === 'cheque' && (
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">
                <BookOpen size={16} /> Cheque Book Dispatch Request
              </span>
            </div>
            <div className="banking-card-body">
              <form onSubmit={handleChequeSubmit}>
                <div className="form-group">
                  <label className="form-label">Linked Account</label>
                  <input
                    type="text"
                    disabled
                    className="form-control"
                    value={`${primaryAccount?.accountType} (${primaryAccount?.accountNumberMasked})`}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Cheque Leaves</label>
                  <select
                    className="form-control"
                    value={leavesCount}
                    onChange={(e) => setLeavesCount(Number(e.target.value))}
                  >
                    <option value={20}>20 Leaves (Personal)</option>
                    <option value={25}>25 Leaves (Standard)</option>
                    <option value={50}>50 Leaves (High Volume)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>

                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
                    {isLoading ? 'Submitting...' : 'Submit Cheque Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Stop Cheque */}
      {activeTab === 'stop' && (
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">
                <AlertOctagon size={16} /> Stop Cheque Payment Instruction
              </span>
            </div>
            <div className="banking-card-body">
              <form onSubmit={handleStopChequeSubmit}>
                <div className="form-group">
                  <label className="form-label">6-Digit Cheque Number <span className="required">*</span></label>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-control"
                    placeholder="e.g. 102938"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Stop Payment</label>
                  <select
                    className="form-control"
                    value={stopReason}
                    onChange={(e) => setStopReason(e.target.value)}
                  >
                    <option value="Lost Cheque Leaf">Lost Cheque Leaf</option>
                    <option value="Incorrect Amount Written">Incorrect Amount Written</option>
                    <option value="Beneficiary Disputed">Beneficiary Disputed</option>
                    <option value="Other Safety Reasons">Other Safety Reasons</option>
                  </select>
                </div>

                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  <button type="submit" disabled={isLoading || !chequeNo} className="btn btn-danger btn-sm">
                    {isLoading ? 'Processing...' : 'Register Stop Instruction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Certificates */}
      {activeTab === 'cert' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">TDS / Interest Certificate</span>
            </div>
            <div className="banking-card-body">
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '14px' }}>
                Download simulated official interest earned statement for Income Tax filing.
              </p>
              <button
                onClick={() => handleCertificateSubmit('INTEREST_CERTIFICATE')}
                className="btn btn-primary btn-sm"
              >
                Generate Interest Certificate
              </button>
            </div>
          </div>

          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">Balance Confirmation Certificate</span>
            </div>
            <div className="banking-card-body">
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '14px' }}>
                Official verification of standing balances for visa, loan, or audit purposes.
              </p>
              <button
                onClick={() => handleCertificateSubmit('BALANCE_CONFIRMATION')}
                className="btn btn-secondary btn-sm"
              >
                Request Balance Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
