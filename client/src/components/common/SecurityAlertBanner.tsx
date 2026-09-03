import React from 'react';
import { ShieldAlert, Info, AlertTriangle } from 'lucide-react';

interface SecurityAlertBannerProps {
  type?: 'warning' | 'info' | 'danger';
  title?: string;
  message?: string;
}

export const SecurityAlertBanner: React.FC<SecurityAlertBannerProps> = ({
  type = 'warning',
  title = 'Important Security Guidelines',
  message = 'SecureBank will NEVER ask you for your Internet Banking Password, Transaction PIN, Card PIN, or OTP. Never share credentials with anyone.'
}) => {
  const isDanger = type === 'danger';
  const isInfo = type === 'info';

  const icon = isDanger ? (
    <AlertTriangle size={18} color="#B91C1C" />
  ) : isInfo ? (
    <Info size={18} color="#1D4ED8" />
  ) : (
    <ShieldAlert size={18} color="#D97706" />
  );

  return (
    <div className={`security-alert-box ${isDanger ? 'status-badge danger' : isInfo ? 'status-badge info' : ''}`} style={{ width: '100%' }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
      <div>
        <strong style={{ display: 'block', marginBottom: '2px', fontSize: '0.825rem' }}>{title}</strong>
        <span style={{ lineHeight: '1.4', fontSize: '0.785rem' }}>{message}</span>
      </div>
    </div>
  );
};
