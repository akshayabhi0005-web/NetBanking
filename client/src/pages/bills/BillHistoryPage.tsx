import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { formatInr } from '../../components/common/AmountDisplay';
import { EmptyState } from '../../components/common/EmptyState';
import { Receipt, CheckCircle2 } from 'lucide-react';

export const BillHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await api.getBillHistory();
        if (res.success) {
          setHistory(res.history || []);
        }
      } catch (err) {
        console.error('Failed to load bill history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Bill Payment', path: '/bills' }, { label: 'Payment History' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Utility Bill Payment History
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Log of settled utility bills, consumer identifiers, and transaction acknowledgments.
      </p>

      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Receipt size={16} /> Settled Utility Payments ({history.length})
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {history.length === 0 ? (
            <EmptyState
              title="No Bill Payments"
              description="You haven't made any utility bill payments yet."
            />
          ) : (
            <table className="banking-table">
              <thead>
                <tr>
                  <th>Paid Date</th>
                  <th>Transaction ID</th>
                  <th>Biller Organization</th>
                  <th>Category</th>
                  <th>Consumer ID</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {new Date(h.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#D84315' }}>
                      {h.transactionId}
                    </td>
                    <td><strong>{h.billerName}</strong></td>
                    <td><span className="status-badge info">{h.category}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.consumerNumber}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#C2410C' }}>
                      {formatInr(h.amount)}
                    </td>
                    <td><span className="status-badge success">{h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
