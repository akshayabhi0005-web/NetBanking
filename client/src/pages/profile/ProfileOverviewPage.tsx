import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Mail, Phone, MapPin, Building2, Shield, CheckCircle2 } from 'lucide-react';

export const ProfileOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProfile();
      if (res.success && res.profile) {
        setProfile(res.profile);
        setEmail(res.profile.email);
        setMobile(res.profile.mobile);
        setAddress(res.profile.address);
        setCity(res.profile.city);
        setState(res.profile.state);
        setPincode(res.profile.pincode);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.updateContact({
        email,
        mobile,
        address,
        city,
        state,
        pincode
      });

      if (res.success) {
        setSuccessMessage('Contact details updated successfully.');
        setIsEditing(false);
        await fetchProfile();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Profile', path: '/profile' }, { label: 'Personal Information' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Customer Profile & Contact Settings
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Registered personal records and communication parameters.
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Profile Card */}
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <User size={16} /> KYC Verified Personal Information
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              {isEditing ? 'Cancel Editing' : 'Update Contact Info'}
            </button>
          </div>

          <div className="banking-card-body">
            {isEditing ? (
              <form onSubmit={handleUpdateContact}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '14px' }}>
                  <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
                    {isLoading ? 'Saving...' : 'Save Updated Details'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '0.825rem' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Full Name</span>
                  <strong style={{ fontSize: '0.95rem', display: 'block', color: '#1E293B' }}>{profile?.displayName}</strong>
                </div>

                <div>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Customer ID</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{profile?.customerId}</strong>
                </div>

                <div>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Public Username</span>
                  <strong style={{ color: '#D84315' }}>@{profile?.username}</strong>
                </div>

                <div>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Date of Birth</span>
                  <span>{profile?.dob}</span>
                </div>

                <div>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Email Address</span>
                  <span>{profile?.email}</span>
                </div>

                <div>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Mobile Number</span>
                  <span>+91 {profile?.mobile}</span>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span className="text-muted" style={{ fontSize: '0.725rem', textTransform: 'uppercase' }}>Communication Address</span>
                  <div>{profile?.address}, {profile?.city}, {profile?.state} - {profile?.pincode}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security & Access Snapshot */}
        <div>
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">
                <Shield size={16} /> Security Credentials
              </span>
            </div>
            <div className="banking-card-body" style={{ fontSize: '0.8rem' }}>
              <div style={{ marginBottom: '12px' }}>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  Account Status
                </span>
                <span className="status-badge success">ACTIVE & SECURED</span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  Member Since
                </span>
                <span>{profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-IN') : 'Recent'}</span>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <a href="/profile/security" className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                  Change Password & PIN →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
