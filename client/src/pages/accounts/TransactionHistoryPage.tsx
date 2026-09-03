import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AmountDisplay, formatInr } from '../../components/common/AmountDisplay';
import { EmptyState } from '../../components/common/EmptyState';
import { ReceiptModal, ReceiptData } from '../../components/modals/ReceiptModal';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const TransactionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const primaryAccount = user?.accounts?.[0];

  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const fetchTransactions = async (page = 1, type = selectedType, search = searchQuery) => {
    if (!primaryAccount?.id) return;
    try {
      setIsLoading(true);
      const res = await api.getTransactions(primaryAccount.id, {
        page: String(page),
        limit: '15',
        type: type !== 'ALL' ? type : '',
        search
      });

      if (res.success) {
        setTransactions(res.transactions || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, selectedType, searchQuery);
  }, [primaryAccount?.id, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(1, selectedType, searchQuery);
  };

  const handleRowClick = (tx: any) => {
    setSelectedReceipt({
      transactionId: tx.transactionId,
      amount: tx.amount,
      status: tx.status,
      recipientDisplayName: tx.party,
      sourceAccountMasked: primaryAccount?.accountNumberMasked,
      message: tx.description,
      timestamp: tx.date,
      balanceAfter: tx.balanceAfter
    });
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Accounts', path: '/accounts/summary' }, { label: 'Transaction History' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Transaction History</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Account: <strong>{primaryAccount?.accountType} ({primaryAccount?.accountNumberMasked})</strong>
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search description / ID..."
              className="form-control"
              style={{ paddingLeft: '32px', width: '220px', padding: '6px 12px 6px 32px', fontSize: '0.8rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          </form>

          <select
            className="form-control"
            style={{ width: '150px', padding: '6px 10px', fontSize: '0.8rem' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="CREDIT">Credits Only</option>
            <option value="DEBIT">Debits Only</option>
            <option value="TRANSFER">Fund Transfers</option>
            <option value="BILL_PAYMENT">Bill Payments</option>
            <option value="DEPOSIT">Deposits</option>
          </select>
        </div>
      </div>

      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <FileText size={16} /> Account Ledger Statements ({totalCount} entries)
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {transactions.length === 0 ? (
            <EmptyState
              title="No transactions matching filter"
              description="No ledger entries found for the selected account and criteria."
            />
          ) : (
            <div className="banking-table-container" style={{ border: 'none' }}>
              <table className="banking-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Transaction Reference</th>
                    <th>Description / Narration</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                    <th style={{ textAlign: 'center' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#475569' }}>
                        <div>{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: '0.675rem', color: '#94A3B8' }}>{new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', fontWeight: 600, color: '#D84315' }}>
                        {tx.transactionId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B' }}>{tx.description}</div>
                        {tx.message && <div style={{ fontSize: '0.7rem', color: '#64748B' }}>"{tx.message}"</div>}
                      </td>
                      <td>
                        <span className={`status-badge ${tx.isDebit ? 'danger' : 'success'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#B91C1C', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {tx.isDebit ? formatInr(tx.amount) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#15803D', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {!tx.isDebit ? formatInr(tx.amount) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', fontWeight: 600 }}>
                        {tx.balanceAfter !== null ? formatInr(tx.balanceAfter) : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleRowClick(tx)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              borderTop: '1px solid #E5E7EB',
              background: '#F8FAFC'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Page {currentPage} of {totalPages} ({totalCount} total transactions)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => fetchTransactions(currentPage - 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => fetchTransactions(currentPage + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};
