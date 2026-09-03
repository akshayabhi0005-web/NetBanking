import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, ShieldAlert, ArrowLeftRight, Wrench, AlertCircle } from 'lucide-react';

export const NotificationCenterPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION': return <ArrowLeftRight size={16} color="#15803D" />;
      case 'SECURITY': return <ShieldAlert size={16} color="#B91C1C" />;
      case 'SERVICE': return <Wrench size={16} color="#1D4ED8" />;
      default: return <Bell size={16} color="#D84315" />;
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Notifications' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Notification Center</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Real-time transaction SMS alerts, security updates, and money request notifications.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCheck size={14} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <Bell size={16} /> Notification Alerts ({notifications.length})
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: 0 }}>
          {notifications.length === 0 ? (
            <EmptyState
              title="No Notifications"
              description="You have no unread transaction alerts or security messages."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 18px',
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: n.isRead ? '#FFFFFF' : '#FFFBF7',
                    cursor: !n.isRead ? 'pointer' : 'default',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: n.isRead ? '#F1F5F9' : '#FFF3E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {getIcon(n.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#1E293B' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D84315', marginTop: '6px' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
