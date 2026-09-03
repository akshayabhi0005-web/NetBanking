import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';

export const SecurityAdvisoriesPage: React.FC = () => {
  const [advisories, setAdvisories] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdvisories = async () => {
      try {
        const res = await api.getSecurityAdvisories();
        if (res.success) {
          setAdvisories(res.advisories || []);
        }
      } catch (err) {
        console.error('Failed to load advisories:', err);
      }
    };
    fetchAdvisories();
  }, []);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Help', path: '/help' }, { label: 'Security Advisories' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Internet Banking Security Guidelines & Fraud Advisory
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Essential precautions to protect your banking credentials, PINs, and electronic transactions.
      </p>

      {/* Primary Guidelines Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {advisories.map(a => (
          <div key={a.id} className="banking-card" style={{ marginBottom: 0 }}>
            <div className="banking-card-header">
              <span className="banking-card-title">
                <ShieldCheck size={16} color="#D84315" /> {a.title}
              </span>
              <span className="status-badge warning">{a.category}</span>
            </div>
            <div className="banking-card-body">
              <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: '1.5' }}>
                {a.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ten Golden Rules of Safe Internet Banking */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Lock size={16} /> Ten Golden Rules of Safe Internet Banking
          </span>
        </div>
        <div className="banking-card-body">
          <ul style={{ paddingLeft: '20px', fontSize: '0.825rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
            <li><strong>1.</strong> SecureBank will NEVER ask for your password, Transaction PIN, card PIN, or simulated OTP via phone, email, or SMS.</li>
            <li><strong>2.</strong> Never share simulated OTPs or credentials with anyone, including friends or family.</li>
            <li><strong>3.</strong> Never install remote-access software (AnyDesk, TeamViewer, RustDesk) because someone claiming to be a bank employee requests it.</li>
            <li><strong>4.</strong> Always verify the browser address bar for official HTTPS indicators before entering credentials.</li>
            <li><strong>5.</strong> Do not use Internet Banking from public Wi-Fi networks or shared computers in cyber cafes.</li>
            <li><strong>6.</strong> Always log out after completing your session instead of closing the browser window directly.</li>
            <li><strong>7.</strong> Never share CVV, Card PIN, card number, or login passwords on unsecured forms.</li>
            <li><strong>8.</strong> Beware of fake customer-care phone numbers posted on search engines and social media.</li>
            <li><strong>9.</strong> Do not click suspicious links received through SMS, WhatsApp, or email claiming KYC expiry or electricity disconnection.</li>
            <li><strong>10.</strong> Report unauthorized transactions immediately to customer care for card and account freeze.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
