import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { Printer, Download, FileText, Calendar, Building2 } from 'lucide-react';

export const AccountStatementPage: React.FC = () => {
  const { user } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [period, setPeriod] = useState('30DAYS');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statementData, setStatementData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatement = async () => {
    if (!primaryAccount?.id) return;
    try {
      setIsLoading(true);
      const params: Record<string, string> = { period };
      if (period === 'CUSTOM' && fromDate && toDate) {
        params.fromDate = fromDate;
        params.toDate = toDate;
      }

      const res = await api.getAccountStatement(primaryAccount.id, params);
      if (res.success) {
        setStatementData(res.statement);
      }
    } catch (err) {
      console.error('Failed to fetch statement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [primaryAccount?.id, period]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!statementData || !statementData.transactions) return;

    const headers = ['Date', 'Transaction ID', 'Description', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)', 'Status'];
    const rows = statementData.transactions.map((t: any) => [
      t.date,
      t.transactionId,
      `"${t.description.replace(/"/g, '""')}"`,
      t.debit || '',
      t.credit || '',
      t.balance !== null ? t.balance : '',
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SecureBank_Statement_${primaryAccount?.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Accounts', path: '/accounts/summary' }, { label: 'Account Statement' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Account Statement</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Generate, print, or export official periodic ledger account statements.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleDownloadCsv} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={14} />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Period Selection Controls */}
      <div className="banking-card" style={{ marginBottom: '16px' }}>
        <div className="banking-card-body" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#D84315" />
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#374151' }}>Statement Period:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: '30DAYS', label: 'Last 30 Days' },
              { id: '3MONTHS', label: 'Last 3 Months' },
              { id: '6MONTHS', label: 'Last 6 Months' },
              { id: 'CUSTOM', label: 'Custom Range' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: period === p.id ? '#D84315' : '#CBD5E1',
                  background: period === p.id ? '#FFF3E0' : '#FFFFFF',
                  color: period === p.id ? '#D84315' : '#475569'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                className="form-control"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button onClick={fetchStatement} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Official Formatted Statement Document (Print Friendly) */}
      <div className="banking-card" id="printable-statement" style={{ background: '#FFFFFF', padding: '24px' }}>
        {/* Header of Statement */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D84315', marginBottom: '4px' }}>
              <Building2 size={24} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.04em' }}>SECUREBANK</h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Main Financial Branch, Mumbai • IFSC: {primaryAccount?.ifsc || 'SECB0001089'}
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
            <div>Statement Ref: <strong style={{ fontFamily: 'var(--font-mono)' }}>{statementData?.statementId}</strong></div>
            <div>Generated: {statementData ? new Date(statementData.generatedAt).toLocaleString('en-IN') : '-'}</div>
            <div style={{ color: '#D84315', fontWeight: 700, marginTop: '2px' }}>Simulated Electronic Statement</div>
          </div>
        </div>

        {/* Customer & Account Details Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', background: '#F8FAFC', padding: '14px', borderRadius: '4px', marginBottom: '18px', fontSize: '0.8rem' }}>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase' }}>Customer Name & Address:</div>
            <strong style={{ fontSize: '0.9rem', color: '#1E293B', display: 'block', marginTop: '2px' }}>
              {statementData?.customer?.name}
            </strong>
            <div style={{ color: '#4B5563', marginTop: '2px' }}>{statementData?.customer?.address}</div>
            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Cust ID: {statementData?.customer?.customerId} | Mobile: {statementData?.customer?.mobile}</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase' }}>Account Details:</div>
            <strong style={{ fontSize: '0.9rem', color: '#D84315', display: 'block', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {primaryAccount?.accountType}: {statementData?.account?.accountNumber}
            </strong>
            <div style={{ color: '#4B5563', marginTop: '2px' }}>IFSC: {statementData?.account?.ifsc}</div>
            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Period: {statementData?.period?.from} to {statementData?.period?.to}</div>
          </div>
        </div>

        {/* Summary Balance Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Opening Balance</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {formatInr(statementData?.openingBalance || 0)}
            </div>
          </div>

          <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '4px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '0.7rem', color: '#991B1B', textTransform: 'uppercase' }}>Total Debits (-)</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {formatInr(statementData?.totalDebits || 0)}
            </div>
          </div>

          <div style={{ background: '#F0FDF4', padding: '10px', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>Total Credits (+)</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16A34A', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {formatInr(statementData?.totalCredits || 0)}
            </div>
          </div>

          <div style={{ background: '#FFF7ED', padding: '10px', borderRadius: '4px', border: '1px solid #FFEDD5' }}>
            <div style={{ fontSize: '0.7rem', color: '#9A3412', textTransform: 'uppercase' }}>Closing Balance</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#C2410C', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {formatInr(statementData?.closingBalance || 0)}
            </div>
          </div>
        </div>

        {/* Statement Line Items Table */}
        <div className="banking-table-container" style={{ border: '1px solid #E2E8F0' }}>
          <table className="banking-table">
            <thead>
              <tr>
                <th>Txn Date</th>
                <th>Txn Ref ID</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ textAlign: 'right' }}>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {statementData?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                    No transactions recorded during this statement cycle.
                  </td>
                </tr>
              ) : (
                statementData?.transactions?.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{tx.valueDate}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#D84315' }}>{tx.transactionId}</td>
                    <td style={{ fontSize: '0.8rem' }}>{tx.description}</td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {tx.debit ? formatInr(tx.debit) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: '#16A34A', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {tx.credit ? formatInr(tx.credit) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', fontWeight: 700 }}>
                      {tx.balance !== null ? formatInr(tx.balance) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer of Statement */}
        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
          <span>* End of Statement *</span>
          <span>Computer Generated Simulated Document - No Signature Required</span>
        </div>
      </div>
    </div>
  );
};
