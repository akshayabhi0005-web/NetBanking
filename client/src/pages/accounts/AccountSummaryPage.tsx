import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Eye, EyeOff, PlusCircle, ArrowUpRight, ArrowDownLeft, FileText, Download } from 'lucide-react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { AmountDisplay, formatInr } from '../../components/common/AmountDisplay';
import { TestDepositModal } from '../../components/modals/TestDepositModal';

export const AccountSummaryPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAccountSummary();
      if (res.success) {
        setSummaryData(res.summary);
      }
    } catch (err) {
      console.error('Failed to load account summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Accounts', path: '/accounts/summary' }, { label: 'Account Summary' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Account Summary</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Comprehensive overview of your Savings, Current, and Term Deposit accounts.
          </p>
        </div>
      </div>

      {/* Overview Totals Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
          border: '1px solid #FED7AA',
          borderLeft: '4px solid #D84315',
          borderRadius: '4px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9A3412', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Savings Balance
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {formatInr(summaryData?.totalSavingsBalance || 0)}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
            Active Accounts: {summaryData?.activeAccountsCount || 1}
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '4px solid #D97706',
          borderRadius: '4px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Fixed Deposits
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {formatInr(summaryData?.totalFdAmount || 0)}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
            Active FDs: {summaryData?.activeFdCount || 0}
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '4px solid #16A34A',
          borderRadius: '4px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
            Simulated Total Net Worth
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803D', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {formatInr(summaryData?.totalNetWorth || 0)}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
            Currency: INR (Virtual)
          </div>
        </div>
      </div>

      {/* Account Table */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Wallet size={16} /> Operational Accounts (Savings & Current)
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          <table className="banking-table">
            <thead>
              <tr>
                <th>Account Type</th>
                <th>Account Number</th>
                <th>Branch & IFSC</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Available Balance</th>
                <th style={{ textAlign: 'right' }}>Ledger Balance</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summaryData?.accounts?.map((acc: any) => (
                <tr key={acc.id}>
                  <td>
                    <strong>{acc.accountType}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Primary Currency: INR</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {acc.accountNumberMasked}
                  </td>
                  <td>
                    <div>{acc.branch}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{acc.ifsc}</div>
                  </td>
                  <td>
                    <span className="status-badge success">{acc.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <AmountDisplay amount={acc.balance} size="md" />
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {formatInr(acc.ledgerBalance)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <Link to="/accounts/transactions" className="btn btn-secondary btn-sm" title="View Statement">
                        Statement
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setIsDepositModalOpen(true);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#16A34A', borderColor: '#15803D' }}
                      >
                        + Deposit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TestDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        accountId={selectedAccountId || summaryData?.accounts?.[0]?.id || ''}
        onSuccess={loadSummary}
      />
    </div>
  );
};
