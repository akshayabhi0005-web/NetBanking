import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '1998-05-15',
    mobile: '9876543210',
    email: '',
    address: 'Flat 402, Royal Palms',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestion: 'What was your first childhood pet name?',
    securityAnswer: 'Rocky'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      setErrorMessage('Please fill in all mandatory personal details.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please recheck.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await api.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob,
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      });

      if (res.success && res.token) {
        login(res.token, res.user);
        navigate('/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
        maxWidth: '840px',
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header Bar */}
        <div style={{
          background: 'var(--bg-header)',
          color: '#FFFFFF',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#FFFFFF', padding: '6px', borderRadius: '4px', display: 'flex' }}>
              <Building2 size={24} color="#D84315" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em' }}>SECUREBANK</h2>
              <div style={{ fontSize: '0.75rem', color: '#FFE0B2', textTransform: 'uppercase' }}>
                Open Savings Bank Account & Internet Banking
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            Step {step} of 2
          </div>
        </div>

        {/* Prominent Educational Banking Disclaimer */}
        <div style={{
          background: '#FFFBEB',
          borderBottom: '1px solid #FDE68A',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.775rem',
          color: '#92400E'
        }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Demo Banking Environment:</strong> This application is a simulated banking platform.
            Do not enter real banking credentials, real card details, or government IDs (Aadhaar / PAN).
          </span>
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
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Personal Information */
            <form onSubmit={handleStep1Submit}>
              <h3 style={{ fontSize: '1rem', color: '#D84315', marginBottom: '14px', textTransform: 'uppercase', borderBottom: '1px solid #FED7AA', paddingBottom: '6px' }}>
                1. Customer Profile & Contact Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-control"
                    placeholder="e.g. Akash"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-control"
                    placeholder="e.g. Kumar"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Date of Birth <span className="required">*</span></label>
                  <input
                    type="date"
                    name="dob"
                    className="form-control"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number (Simulated) <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="mobile"
                    className="form-control"
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="e.g. akash@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <div className="form-help">Used for e-statements and security notifications</div>
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address <span className="required">*</span></label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  placeholder="Flat/House No., Street, Landmark"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">City <span className="required">*</span></label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State <span className="required">*</span></label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PIN Code <span className="required">*</span></label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    className="form-control"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ fontSize: '0.825rem', color: '#64748B' }}>
                  Already have an account? Log In
                </Link>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Proceed to Credential Setup</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Internet Banking Credentials */
            <form onSubmit={handleFinalSubmit}>
              <h3 style={{ fontSize: '1rem', color: '#D84315', marginBottom: '14px', textTransform: 'uppercase', borderBottom: '1px solid #FED7AA', paddingBottom: '6px' }}>
                2. Internet Banking Access & Security
              </h3>

              <div className="form-group">
                <label className="form-label">Username <span className="required">*</span></label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="e.g. akashk (letters, numbers, underscores)"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <div className="form-help">Other SecureBank users can send virtual money to you via @{formData.username || 'username'}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Login Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Min 8 chars (Upper, lower, number, symbol)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Security Question</label>
                  <select
                    name="securityQuestion"
                    className="form-control"
                    value={formData.securityQuestion}
                    onChange={handleChange}
                  >
                    <option value="What was your first childhood pet name?">What was your first childhood pet name?</option>
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="In which city were you born?">In which city were you born?</option>
                    <option value="What was the name of your first school?">What was the name of your first school?</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Security Answer</label>
                  <input
                    type="text"
                    name="securityAnswer"
                    className="form-control"
                    placeholder="Answer for password recovery"
                    value={formData.securityAnswer}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '12px 16px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#475569',
                margin: '16px 0'
              }}>
                <strong>Upon opening your account, SecureBank will automatically:</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '6px', lineHeight: '1.5' }}>
                  <li>Generate your unique Customer ID (e.g. SBK482917)</li>
                  <li>Open your primary Savings Bank Account (12-digit number)</li>
                  <li>Assign IFSC code (SECB0001089)</li>
                  <li>Prompt you for 4-digit Transaction PIN and Virtual Debit Card setup</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isLoading ? 'Creating Bank Account...' : 'Open Account & Proceed'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
