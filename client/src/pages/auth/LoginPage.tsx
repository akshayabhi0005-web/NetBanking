import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your Customer ID or Username and Password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await api.login({ identifier: identifier.trim(), password });

      if (res.success && res.token) {
        login(res.token, res.user);
        if (!res.user.isOnboarded) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px'
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Left Column: Traditional Banking Login Form */}
        <div style={{ padding: '36px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              background: '#D84315',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D84315', letterSpacing: '0.04em' }}>
                SECUREBANK
              </h2>
              <div style={{ fontSize: '0.725rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Retail Internet Banking
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: '#475569',
            marginBottom: '20px',
            borderBottom: '2px solid #FED7AA',
            paddingBottom: '10px'
          }}>
            Enter your login credentials to access your SecureBank accounts safely.
          </div>

          {errorMessage && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderLeft: '4px solid #DC2626',
              padding: '10px 14px',
              borderRadius: '4px',
              color: '#991B1B',
              fontSize: '0.8rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">
                Customer ID / Username <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '34px' }}
                  placeholder="e.g. SBK482917 or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
                <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
              </div>
              <div className="form-help">Enter either your generated Customer ID or unique Username</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Login Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Enter your Internet Banking password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.775rem' }}>
              <span style={{ color: '#64748B' }}>Never share credentials</span>
              <Link to="/help" style={{ color: '#D84315', fontWeight: 600 }}>Need Help Logging In?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '0.9rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating Securely...' : 'Log In to Internet Banking'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.825rem', color: '#4B5563', marginBottom: '10px' }}>
              Don't have a SecureBank Internet Banking account?
            </div>
            <Link
              to="/register"
              className="btn btn-secondary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#D84315', borderColor: '#FED7AA' }}
            >
              <span>Open Bank Account (Instant Registration)</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Security Guidelines & Demo Advisory */}
        <div style={{
          background: '#FFF7ED',
          borderLeft: '1px solid #FED7AA',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C2410C', marginBottom: '14px' }}>
              <ShieldCheck size={22} />
              <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Security Advisory
              </h3>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.785rem', color: '#7C2D12' }}>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800 }}>•</span>
                <span>SecureBank officials will <strong>never ask</strong> for your Password, Transaction PIN, or simulated OTP.</span>
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800 }}>•</span>
                <span>Do not access Internet Banking from public Wi-Fi networks, kiosks, or shared cyber-cafe computers.</span>
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800 }}>•</span>
                <span>Always check for the HTTPS secure padlock in your browser's address bar.</span>
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800 }}>•</span>
                <span>Never install screen sharing applications (AnyDesk, TeamViewer) at the request of callers.</span>
              </li>
            </ul>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #FDBA74',
            borderRadius: '4px',
            padding: '12px',
            marginTop: '20px',
            fontSize: '0.725rem',
            color: '#9A3412',
            textAlign: 'center'
          }}>
            <strong>Simulated Educational Portal:</strong>
            <p style={{ marginTop: '4px', color: '#7C2D12' }}>
              All money is virtual INR inside our isolated database. Real money or financial networks are not connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
