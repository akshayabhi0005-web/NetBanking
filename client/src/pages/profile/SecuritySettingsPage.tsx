import React, { useState } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const SecuritySettingsPage: React.FC = () => {
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Transaction PIN state
  const [pinCurrentPwd, setPinCurrentPwd] = useState('');
  const [newTxPin, setNewTxPin] = useState('');
  const [confirmTxPin, setConfirmTxPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setPwdLoading(true);
      setPwdError('');
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPwdSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwdError(err.message || 'Password update failed.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTxPin.length < 4 || newTxPin.length > 6) {
      setPinError('Transaction PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (newTxPin !== confirmTxPin) {
      setPinError('New PIN confirmation does not match.');
      return;
    }

    try {
      setPinLoading(true);
      setPinError('');
      const res = await api.changeTransactionPin({ currentPassword: pinCurrentPwd, newPin: newTxPin });
      if (res.success) {
        setPinSuccess('Transaction PIN changed successfully.');
        setPinCurrentPwd('');
        setNewTxPin('');
        setConfirmTxPin('');
      }
    } catch (err: any) {
      setPinError(err.message || 'PIN change failed.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Profile', path: '/profile' }, { label: 'Security Settings' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Security & Authentication Settings
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Update your login password and authorization Transaction PIN.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* Change Password Card */}
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <Lock size={16} /> Change Login Password
            </span>
          </div>
          <div className="banking-card-body">
            {pwdSuccess && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: '4px', color: '#166534', fontSize: '0.8rem', marginBottom: '12px' }}>
                {pwdSuccess}
              </div>
            )}
            {pwdError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: '4px', color: '#991B1B', fontSize: '0.8rem', marginBottom: '12px' }}>
                {pwdError}
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <button type="submit" disabled={pwdLoading} className="btn btn-primary btn-sm">
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Transaction PIN Card */}
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <KeyRound size={16} /> Change Transaction PIN
            </span>
          </div>
          <div className="banking-card-body">
            {pinSuccess && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: '4px', color: '#166534', fontSize: '0.8rem', marginBottom: '12px' }}>
                {pinSuccess}
              </div>
            )}
            {pinError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: '4px', color: '#991B1B', fontSize: '0.8rem', marginBottom: '12px' }}>
                {pinError}
              </div>
            )}

            <form onSubmit={handlePinChange}>
              <div className="form-group">
                <label className="form-label">Verify Login Password <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  value={pinCurrentPwd}
                  onChange={(e) => setPinCurrentPwd(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New 4 to 6-Digit PIN <span className="required">*</span></label>
                <input
                  type="password"
                  maxLength={6}
                  className="form-control"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }}
                  value={newTxPin}
                  onChange={(e) => setNewTxPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New PIN <span className="required">*</span></label>
                <input
                  type="password"
                  maxLength={6}
                  className="form-control"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }}
                  value={confirmTxPin}
                  onChange={(e) => setConfirmTxPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <button type="submit" disabled={pinLoading} className="btn btn-primary btn-sm">
                  {pinLoading ? 'Updating...' : 'Update Transaction PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
