import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { EmptyState } from '../../components/common/EmptyState';
import { Users, Search, ArrowUpRight, ArrowDownLeft, ShieldCheck, UserCheck } from 'lucide-react';

export const UserDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        setIsLoading(true);
        const res = await api.getUserDirectory();
        if (res.success) {
          setUsers(res.users || []);
        }
      } catch (err) {
        console.error('Failed to load user directory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().replace('@', '');
    return u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
  });

  return (
    <div>
      <Breadcrumb items={[{ label: 'Pay & Request', path: '/pay-request' }, { label: 'Registered Customers Directory' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Registered Bank Customers Directory</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Discover and interact with other verified SecureBank customer accounts for peer transfers and payment requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/pay-request/send" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpRight size={14} />
            <span>Send Money</span>
          </Link>
          <Link to="/pay-request/request" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowDownLeft size={14} />
            <span>Request Money</span>
          </Link>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderLeft: '4px solid #2563EB',
        borderRadius: '4px',
        padding: '10px 14px',
        fontSize: '0.785rem',
        color: '#1E40AF',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <ShieldCheck size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Privacy Safeguard:</strong> In accordance with Indian Internet Banking standards, only public Display Names and handles are visible. Account numbers, mobile numbers, and balances remain strictly confidential.
        </span>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '16px', maxWidth: '400px', position: 'relative' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Filter by customer name or @username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '34px' }}
        />
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
      </div>

      {/* Customer Directory Table */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Users size={16} /> Verified SecureBank Account Holders ({filteredUsers.length})
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '0.85rem' }}>
              Loading registered customers...
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No Other Registered Users Found"
              description={searchQuery ? 'No customers match your search query.' : 'You are currently the only registered active customer. Register a second user in another window to test peer transfers!'}
            />
          ) : (
            <div className="banking-table-container" style={{ border: 'none' }}>
              <table className="banking-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Public Handle</th>
                    <th>Member Since</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#FFF3E0',
                            color: '#D84315',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem'
                          }}>
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#1E293B' }}>{u.displayName}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Verified Customer</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#D84315',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          background: '#FFF7ED',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #FED7AA'
                        }}>
                          @{u.username}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {u.memberSince ? new Date(u.memberSince).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                      </td>
                      <td>
                        <span className="status-badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={12} /> ACTIVE
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <Link
                            to={`/pay-request/send?user=${encodeURIComponent(u.username)}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 10px', fontSize: '0.725rem' }}
                          >
                            Pay
                          </Link>
                          <Link
                            to={`/pay-request/request?user=${encodeURIComponent(u.username)}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 10px', fontSize: '0.725rem' }}
                          >
                            Request
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
