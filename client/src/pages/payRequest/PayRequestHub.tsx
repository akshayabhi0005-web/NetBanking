import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { SendHorizontal, ArrowDownLeft, Clock, ShieldCheck, Users, ArrowRight } from 'lucide-react';

export const PayRequestHub: React.FC = () => {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Pay & Request' }]} />

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Pay & Request Hub</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
          Transfer or request simulated funds effortlessly using SecureBank public usernames (@username) without needing account numbers.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Link to="/pay-request/directory" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #2563EB' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '20px 14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#EFF6FF',
              color: '#2563EB',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '4px' }}>User Directory</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
              View all registered bank customers and initiate instant transfers.
            </p>
            <span className="btn btn-secondary btn-sm" style={{ marginTop: '12px', color: '#2563EB', borderColor: '#BFDBFE', fontSize: '0.725rem' }}>
              Browse Users →
            </span>
          </div>
        </Link>

        <Link to="/pay-request/send" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #D84315' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '20px 14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#FFF3E0',
              color: '#D84315',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <SendHorizontal size={24} />
            </div>
            <h3 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '4px' }}>Send Money</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
              Search by @username and transfer funds with PIN authorization.
            </p>
            <span className="btn btn-primary btn-sm" style={{ marginTop: '12px', fontSize: '0.725rem' }}>
              Send Funds →
            </span>
          </div>
        </Link>

        <Link to="/pay-request/request" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #D97706' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '20px 14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#FEF3C7',
              color: '#D97706',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <ArrowDownLeft size={24} />
            </div>
            <h3 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '4px' }}>Request Money</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
              Request simulated funds from any customer with customized reason.
            </p>
            <span className="btn btn-secondary btn-sm" style={{ marginTop: '12px', color: '#D97706', borderColor: '#FDE68A', fontSize: '0.725rem' }}>
              Request Funds →
            </span>
          </div>
        </Link>

        <Link to="/pay-request/pending" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #16A34A' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '20px 14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#DCFCE7',
              color: '#16A34A',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '4px' }}>Pending Requests</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
              Review incoming requests from others and approve or decline.
            </p>
            <span className="btn btn-secondary btn-sm" style={{ marginTop: '12px', color: '#16A34A', borderColor: '#BBF7D0', fontSize: '0.725rem' }}>
              Manage Requests →
            </span>
          </div>
        </Link>
      </div>

      {/* Security Info Banner */}
      <div style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '4px',
        padding: '14px 18px',
        fontSize: '0.8rem',
        color: '#92400E',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldCheck size={20} style={{ flexShrink: 0 }} />
        <span>
          <strong>Safe & Private Discovery:</strong> Pay & Request enables registered customers to transfer simulated funds without sharing 12-digit account numbers. All peer-to-peer transfers are validated with your 4-digit Transaction PIN.
        </span>
      </div>
    </div>
  );
};
