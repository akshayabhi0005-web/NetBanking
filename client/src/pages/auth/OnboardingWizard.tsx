import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { VirtualDebitCard } from '../../components/cards/VirtualDebitCard';

export const OnboardingWizard: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [transactionPin, setTransactionPin] = useState('');
  const [confirmTxPin, setConfirmTxPin] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [confirmCardPin, setConfirmCardPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const primaryAccount = user?.accounts?.[0];

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionPin || transactionPin.length < 4 || transactionPin.length > 6) {
      setErrorMessage('Transaction PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (transactionPin !== confirmTxPin) {
      setErrorMessage('Transaction PIN confirmation does not match.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardPin || cardPin.length !== 4) {
      setErrorMessage('Debit Card PIN must be exactly 4 numeric digits.');
      return;
    }
    if (cardPin !== confirmCardPin) {
      setErrorMessage('Card PIN confirmation does not match.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await api.setupOnboarding({
        transactionPin,
        cardPin
      });

      if (res.success && res.token) {
        login(res.token, { isOnboarded: true });
        setCurrentStep(4);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Onboarding setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px'
    }}>
      <div style={{
        maxWidth: '780px',
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Top Header with Step Progress */}
        <div style={{
          background: 'var(--bg-header)',
          color: '#FFFFFF',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Welcome to SecureBank</h2>
            <div style={{ fontSize: '0.75rem', color: '#FFE0B2' }}>
              First-Time Internet Banking Security Setup
            </div>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            Step {currentStep} of 4
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          {errorMessage && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderLeft: '4px solid #DC2626',
              padding: '10px 14px',
              borderRadius: '4px',
              color: '#991B1B',
              fontSize: '0.8rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Account Overview */}
          {currentStep === 1 && (
            <div>
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '4px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <CheckCircle2 size={24} color="#15803D" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ color: '#166534', fontSize: '0.95rem', marginBottom: '4px' }}>
                    Congratulations, {user?.displayName || 'Customer'}!
                  </h4>
                  <p style={{ color: '#14532D', fontSize: '0.8rem', lineHeight: '1.5' }}>
                    Your primary SecureBank Savings Bank Account has been successfully generated and linked to your Internet Banking profile.
                  </p>
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Generated Banking Credentials & Account
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.825rem' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Customer ID:</span>
                    <strong style={{ display: 'block', color: '#1E293B', fontFamily: 'var(--font-mono)' }}>
                      {user?.customerId || 'Generating...'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Username:</span>
                    <strong style={{ display: 'block', color: '#D84315' }}>
                      @{user?.username}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Account Number:</span>
                    <strong style={{ display: 'block', color: '#1E293B', fontFamily: 'var(--font-mono)' }}>
                      {primaryAccount?.accountNumber || '1089XXXXXXXX'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>IFSC Code:</span>
                    <strong style={{ display: 'block', color: '#1E293B', fontFamily: 'var(--font-mono)' }}>
                      {primaryAccount?.ifsc || 'SECB0001089'}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Step 2: Create Transaction PIN</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Create Transaction PIN */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#D84315' }}>
                <KeyRound size={20} />
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase' }}>Create Your Transaction PIN</h3>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '18px', lineHeight: '1.5' }}>
                The Transaction PIN is required to authorize money transfers, Pay & Request payments, fixed deposits, and bill settlements.
                It is securely hashed with bcrypt and never stored in plaintext.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Set 4 to 6-Digit PIN <span className="required">*</span></label>
                  <input
                    type="password"
                    maxLength={6}
                    className="form-control"
                    placeholder="••••"
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em' }}
                    value={transactionPin}
                    onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Transaction PIN <span className="required">*</span></label>
                  <input
                    type="password"
                    maxLength={6}
                    className="form-control"
                    placeholder="••••"
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em' }}
                    value={confirmTxPin}
                    onChange={(e) => setConfirmTxPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-secondary btn-sm">
                  Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Step 3: Issue Virtual Debit Card</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Issue Virtual Debit Card & Set Card PIN */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#D84315' }}>
                <CreditCard size={20} />
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase' }}>Activate Virtual Debit Card</h3>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '18px' }}>
                SecureBank automatically issues a complimentary simulated Classic RuPay/Visa virtual card for online purchases.
              </p>

              <VirtualDebitCard
                cardNumberMasked="XXXX XXXX XXXX 8291"
                cardholderName={user?.displayName || 'SECUREBANK CUSTOMER'}
                expiry="09/31"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Set 4-Digit Card ATM/POS PIN <span className="required">*</span></label>
                  <input
                    type="password"
                    maxLength={4}
                    className="form-control"
                    placeholder="••••"
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em' }}
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Card PIN <span className="required">*</span></label>
                  <input
                    type="password"
                    maxLength={4}
                    className="form-control"
                    placeholder="••••"
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em' }}
                    value={confirmCardPin}
                    onChange={(e) => setConfirmCardPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button type="button" onClick={() => setCurrentStep(2)} disabled={isLoading} className="btn btn-secondary btn-sm">
                  Back
                </button>
                <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>{isLoading ? 'Activating Credentials...' : 'Complete Security Setup'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success & Ready */}
          {currentStep === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#DCFCE7',
                color: '#15803D',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <ShieldCheck size={36} />
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '8px' }}>
                Internet Banking Setup Complete!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                Your Transaction PIN and Virtual Debit Card are now active. You have full access to transfer funds, pay bills, and use Pay & Request.
              </p>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.9rem' }}
              >
                Go to Internet Banking Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
