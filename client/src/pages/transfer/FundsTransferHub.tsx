import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { ArrowLeftRight, Building2, UserCheck, Users, ShieldAlert, ArrowRight } from 'lucide-react';

export const FundsTransferHub: React.FC = () => {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Funds Transfer' }]} />

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Funds Transfer Center</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
          Simulated electronic fund transfer facilities within SecureBank network.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Link to="/transfer/direct" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #D84315' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              background: '#FFF3E0',
              color: '#D84315',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Building2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#1E293B', marginBottom: '6px' }}>Within SecureBank</h3>
            <p style={{ fontSize: '0.785rem', color: '#64748B', lineHeight: '1.4' }}>
              Transfer using 12-digit Account Number and SecureBank IFSC code (SECB0001089).
            </p>
            <span className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>
              Transfer Funds →
            </span>
          </div>
        </Link>

        <Link to="/transfer/own" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #D97706' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              background: '#FEF3C7',
              color: '#D97706',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <ArrowLeftRight size={26} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#1E293B', marginBottom: '6px' }}>Own Account Transfer</h3>
            <p style={{ fontSize: '0.785rem', color: '#64748B', lineHeight: '1.4' }}>
              Instant balance transfers between your own primary Savings and secondary accounts.
            </p>
            <span className="btn btn-secondary btn-sm" style={{ marginTop: '14px', color: '#D97706', borderColor: '#FDE68A' }}>
              Own Transfer →
            </span>
          </div>
        </Link>

        <Link to="/transfer/beneficiaries" className="banking-card" style={{ textDecoration: 'none', borderTop: '3px solid #16A34A' }}>
          <div className="banking-card-body" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              background: '#DCFCE7',
              color: '#16A34A',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Users size={26} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#1E293B', marginBottom: '6px' }}>Manage Beneficiaries</h3>
            <p style={{ fontSize: '0.785rem', color: '#64748B', lineHeight: '1.4' }}>
              Register frequent payees, set custom limits, and streamline recurring payments.
            </p>
            <span className="btn btn-secondary btn-sm" style={{ marginTop: '14px', color: '#16A34A', borderColor: '#BBF7D0' }}>
              Beneficiary Book →
            </span>
          </div>
        </Link>
      </div>

      <div style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '4px',
        padding: '14px 18px',
        fontSize: '0.785rem',
        color: '#92400E',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <span>
          <strong>Simulated Transfer Engine:</strong> IMPS / NEFT / RTGS transfer modes presented in this portal are internal simulations. No real financial networks are contacted.
        </span>
      </div>
    </div>
  );
};
