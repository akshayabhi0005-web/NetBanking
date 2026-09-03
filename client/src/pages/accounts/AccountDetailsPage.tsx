import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AmountDisplay, formatInr } from '../../components/common/AmountDisplay';
import { Building2, ShieldCheck, User, Calendar, Hash } from 'lucide-react';

export const AccountDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const primaryAccount = user?.accounts?.[0];
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!primaryAccount?.id) return;
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const res = await api.getAccountDetails(primaryAccount.id);
        if (res.success) {
          setDetails(res.account);
        }
      } catch (err) {
        console.error('Failed to load account details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [primaryAccount?.id]);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Accounts', path: '/accounts/summary' }, { label: 'Account Details' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Account Profile & Branch Details
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Official banking registration, KYC standing, nomination, and branch parameters.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="banking-card">
          <div className="banking-card-header">
            <span className="banking-card-title">
              <Building2 size={16} /> Account Parameters & Standing
            </span>
            <span className="status-badge success">ACTIVE / KYC COMPLIANT</span>
          </div>
          <div className="banking-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', fontSize: '0.825rem' }}>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Primary Account Holder</span>
                <strong style={{ fontSize: '0.95rem', color: '#1E293B' }}>{details?.customerName || user?.displayName}</strong>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Customer Identification (CIF / Cust ID)</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{details?.customerId || user?.customerId}</strong>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Full Account Number</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#D84315' }}>{details?.accountNumber}</strong>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Account Scheme</span>
                <strong>{details?.accountType}</strong>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>IFSC Code</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{details?.ifsc}</strong>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>MICR Code</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{details?.micrCode}</strong>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Branch Name & Address</span>
                <span>{details?.branch}</span>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Mode of Operation</span>
                <span>{details?.modeOfOperation}</span>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Nomination Facility</span>
                <span className="text-success" style={{ fontWeight: 600 }}>{details?.nomineeRegistered}</span>
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase' }}>Account Opening Date</span>
                <span>{details?.openedAt ? new Date(details.openedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Today'}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="banking-card">
            <div className="banking-card-header">
              <span className="banking-card-title">Balance Information</span>
            </div>
            <div className="banking-card-body">
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Available Balance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)' }}>
                  {formatInr(details?.balance || 0)}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Ledger Balance</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', fontFamily: 'var(--font-mono)' }}>
                  {formatInr(details?.ledgerBalance || 0)}
                </div>
              </div>

              <div style={{ fontSize: '0.725rem', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                * All balances are virtual funds simulated in SecureBank database.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
