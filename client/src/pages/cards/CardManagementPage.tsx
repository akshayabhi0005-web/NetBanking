import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { VirtualDebitCard } from '../../components/cards/VirtualDebitCard';
import { CreditCard, Lock, ShieldAlert, KeyRound, CheckCircle2, Sliders, Shield } from 'lucide-react';

export const CardManagementPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Settings State
  const [dailyLimit, setDailyLimit] = useState(25000);
  const [isOnlineEnabled, setIsOnlineEnabled] = useState(true);
  const [isInternationalEnabled, setIsInternationalEnabled] = useState(false);

  // Change PIN State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCards();
      if (res.success && res.cards?.[0]) {
        const c = res.cards[0];
        setCards(res.cards);
        setDailyLimit(c.dailyLimit || 25000);
        setIsOnlineEnabled(c.isOnlineEnabled);
        setIsInternationalEnabled(c.isInternationalEnabled);
      }
    } catch (err) {
      console.error('Failed to load card:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const currentCard = cards[0];

  const handleToggleBlock = async () => {
    if (!currentCard) return;
    const nextStatus = currentCard.cardStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const confirmMsg = nextStatus === 'BLOCKED'
      ? 'Are you sure you want to temporarily BLOCK your debit card? You can unblock it anytime.'
      : 'Unblock and reactivate your debit card?';

    if (!confirm(confirmMsg)) return;

    try {
      setIsLoading(true);
      const res = await api.setCardStatus(currentCard.id, nextStatus);
      if (res.success) {
        setSuccessMessage(res.message);
        await fetchCards();
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update card status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.updateCardSettings(currentCard.id, {
        dailyLimit,
        isOnlineEnabled,
        isInternationalEnabled
      });

      if (res.success) {
        setSuccessMessage(res.message);
        await fetchCards();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update limits.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setErrorMessage('Card PIN must be 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage('New PIN confirmation does not match.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.changeCardPin(currentCard.id, {
        currentPassword,
        newPin
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setShowPinModal(false);
        setCurrentPassword('');
        setNewPin('');
        setConfirmPin('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'PIN change failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Cards', path: '/cards' }, { label: 'Virtual Debit Card' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Virtual Debit Card Management
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Control card limits, online e-commerce permissions, temporary blocking, and ATM PIN.
      </p>

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

      {errorMessage && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          padding: '10px 14px',
          borderRadius: '4px',
          color: '#991B1B',
          fontSize: '0.8rem',
          marginBottom: '16px'
        }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Visual Card + Quick Actions */}
        <div>
          {currentCard ? (
            <VirtualDebitCard
              cardNumberMasked={currentCard.cardNumberMasked}
              cardholderName={currentCard.cardholderName}
              expiry={currentCard.expiry}
              cardStatus={currentCard.cardStatus}
              isOnlineEnabled={currentCard.isOnlineEnabled}
              dailyLimit={currentCard.dailyLimit}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
              Loading card details...
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleToggleBlock}
              className={`btn ${currentCard?.cardStatus === 'ACTIVE' ? 'btn-danger' : 'btn-success'} btn-sm`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={14} />
              <span>{currentCard?.cardStatus === 'ACTIVE' ? 'Temporarily Block Card' : 'Unblock Card'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <KeyRound size={14} />
              <span>Change Card PIN</span>
            </button>
          </div>
        </div>

        {/* Right Column: Limits & Channel Switches */}
        <div>
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">
                <Sliders size={16} /> Card Usage & Limits Control
              </span>
            </div>
            <div className="banking-card-body">
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label className="form-label">
                    Daily E-Commerce / POS Limit: <strong>{formatInr(dailyLimit)}</strong>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    style={{ width: '100%', accentColor: '#D84315' }}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div style={{ margin: '18px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem', cursor: 'pointer' }}>
                    <div>
                      <strong>Domestic Online E-Commerce</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Enable virtual card for online portals</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isOnlineEnabled}
                      onChange={(e) => setIsOnlineEnabled(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#D84315' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem', cursor: 'pointer' }}>
                    <div>
                      <strong>International Transactions</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Disabled by default for security</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isInternationalEnabled}
                      onChange={(e) => setIsInternationalEnabled(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#D84315' }}
                    />
                  </label>
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  {isLoading ? 'Saving...' : 'Apply Security Preferences'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Change Card PIN Modal */}
      {showPinModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} color="#D84315" />
                <span>Update 4-Digit Debit Card PIN</span>
              </div>
            </div>
            <form onSubmit={handleChangePin}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Internet Banking Login Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter login password to verify identity"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">New 4-Digit PIN <span className="required">*</span></label>
                    <input
                      type="password"
                      maxLength={4}
                      className="form-control"
                      placeholder="••••"
                      style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em' }}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm PIN <span className="required">*</span></label>
                    <input
                      type="password"
                      maxLength={4}
                      className="form-control"
                      placeholder="••••"
                      style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em' }}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPinModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
