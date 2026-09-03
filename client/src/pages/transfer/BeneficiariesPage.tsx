import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { EmptyState } from '../../components/common/EmptyState';
import { Users, UserPlus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Beneficiary State
  const [nickname, setNickname] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('SecureBank');
  const [ifsc, setIfsc] = useState('SECB0001089');
  const [transferLimit, setTransferLimit] = useState('50000');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchBeneficiaries = async () => {
    try {
      setIsLoading(true);
      const res = await api.getBeneficiaries();
      if (res.success) {
        setBeneficiaries(res.beneficiaries || []);
      }
    } catch (err) {
      console.error('Failed to load beneficiaries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !beneficiaryName.trim() || !accountNumber.trim() || !ifsc.trim()) {
      setErrorMessage('Please fill in all mandatory beneficiary details.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.addBeneficiary({
        nickname: nickname.trim(),
        beneficiaryName: beneficiaryName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        ifsc: ifsc.trim(),
        transferLimit: Number(transferLimit) || 50000
      });

      if (res.success) {
        setSuccessMessage(res.message);
        // Reset form
        setNickname('');
        setBeneficiaryName('');
        setAccountNumber('');
        setShowAddForm(false);
        await fetchBeneficiaries();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add beneficiary.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this beneficiary from your list?')) return;
    try {
      await api.deleteBeneficiary(id);
      await fetchBeneficiaries();
    } catch (err: any) {
      alert(err.message || 'Failed to delete beneficiary.');
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Funds Transfer', path: '/transfer' }, { label: 'Manage Beneficiaries' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Manage Beneficiaries</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Store and manage registered bank accounts for routine fund transfers.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <UserPlus size={14} />
          <span>{showAddForm ? 'Close Form' : '+ Add Beneficiary'}</span>
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

      {/* Add Beneficiary Panel */}
      {showAddForm && (
        <div className="banking-card" style={{ marginBottom: '20px', borderLeftColor: '#16A34A' }}>
          <div className="banking-card-header" style={{ background: '#F0FDF4' }}>
            <span className="banking-card-title" style={{ color: '#166534' }}>
              <UserPlus size={16} /> Register New Beneficiary
            </span>
          </div>
          <div className="banking-card-body">
            {errorMessage && (
              <div style={{ color: '#DC2626', fontSize: '0.8rem', marginBottom: '12px' }}>
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleAddSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Beneficiary Nickname <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Landlord, Office Colleague"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Beneficiary Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="As per bank records"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Account Number <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Code <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '14px' }}>
                <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
                  {isLoading ? 'Saving...' : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beneficiary List */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Users size={16} /> Registered Payees ({beneficiaries.length})
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {beneficiaries.length === 0 ? (
            <EmptyState
              title="No Beneficiaries Added"
              description="Add registered bank accounts for easy recurring transfers."
              actionLabel="+ Add Beneficiary"
              onAction={() => setShowAddForm(true)}
            />
          ) : (
            <table className="banking-table">
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Beneficiary Name</th>
                  <th>Account Number</th>
                  <th>Bank & IFSC</th>
                  <th style={{ textAlign: 'right' }}>Transfer Limit</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.nickname}</strong></td>
                    <td>{b.beneficiaryName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{b.accountNumberMasked}</td>
                    <td>
                      <div>{b.bankName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{b.ifsc}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatInr(b.transferLimit)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        title="Delete Beneficiary"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
