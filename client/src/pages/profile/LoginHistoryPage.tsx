import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { ShieldCheck, Laptop, Smartphone, Clock } from 'lucide-react';

export const LoginHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await api.getLoginHistory();
        if (res.success) {
          setHistory(res.history || []);
        }
      } catch (err) {
        console.error('Failed to load login history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Profile', path: '/profile' }, { label: 'Login History' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Login History & Session Audit
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Log of recent Internet Banking access attempts, device categories, and authentication results.
      </p>

      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Clock size={16} /> Recent Access Logs ({history.length})
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          <table className="banking-table">
            <thead>
              <tr>
                <th>Access Timestamp</th>
                <th>IP Address</th>
                <th>Device Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ fontSize: '0.8rem' }}>
                    {new Date(h.loginTime).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>{h.ipAddress || '127.0.0.1'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {h.deviceType?.includes('Mobile') ? <Smartphone size={14} color="#D84315" /> : <Laptop size={14} color="#1D4ED8" />}
                      <span>{h.deviceType || 'Desktop Browser'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${h.status === 'SUCCESS' ? 'success' : 'danger'}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
