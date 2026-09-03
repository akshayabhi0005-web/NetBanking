import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  HelpCircle 
} from 'lucide-react';

export const OrangeHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Format last login date
  const formatLastLogin = (dateStr?: string) => {
    if (!dateStr) return 'First Login Session';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <header className="orange-header-top">
      <div className="header-top-inner">
        {/* Brand / Logo */}
        <Link to="/" className="bank-logo-group" style={{ textDecoration: 'none' }}>
          <div className="bank-logo-icon">
            <Building2 size={22} color="#D84315" />
          </div>
          <div className="bank-logo-text">
            <span className="bank-brand-name">SECUREBANK</span>
            <span className="bank-tagline">Secure Banking. Simplified.</span>
          </div>
        </Link>

        {/* User Info & Quick Actions */}
        {user ? (
          <div className="header-user-info">
            <div className="header-user-badge">
              <span style={{ opacity: 0.85 }}>Cust ID: </span>
              <strong>{user.customerId}</strong>
              <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
              <span>{user.displayName}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.9 }}>
              <Clock size={13} />
              <span>Last Login: <strong>{formatLastLogin(user.lastLoginAt)}</strong></span>
            </div>

            <Link to="/notifications" className="header-btn" title="Notification Center">
              <Bell size={14} />
              <span>Alerts</span>
              {user.unreadNotifications > 0 && (
                <span style={{
                  background: '#FEF08A',
                  color: '#854D0E',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.675rem',
                  fontWeight: 800
                }}>
                  {user.unreadNotifications}
                </span>
              )}
            </Link>

            <Link to="/profile" className="header-btn" title="My Profile & Security">
              <User size={14} />
              <span>Profile</span>
            </Link>

            <Link to="/help" className="header-btn" title="Customer Support & FAQs">
              <HelpCircle size={14} />
              <span>Help</span>
            </Link>

            <button onClick={handleLogout} className="header-btn logout" title="Sign Out of Internet Banking">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="header-btn">
              <span>Internet Banking Login</span>
            </Link>
            <Link to="/register" className="header-btn" style={{ background: '#FFFFFF', color: '#D84315', fontWeight: 800 }}>
              <span>Open Bank Account</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
