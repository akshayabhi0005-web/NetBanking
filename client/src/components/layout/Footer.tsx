import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, PhoneCall, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="banking-footer">
      <div className="footer-top">
        {/* Col 1: About & Safety */}
        <div className="footer-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', marginBottom: '10px' }}>
            <ShieldCheck size={20} color="#FF9800" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em' }}>SECUREBANK</span>
          </div>
          <p style={{ lineHeight: '1.6', fontSize: '0.75rem', marginBottom: '12px', color: '#94A3B8' }}>
            SecureBank Internet Banking provides simulated 24x7 electronic funds transfer, Pay & Request peer transactions, utility bill payments, and investment deposit management.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: '#FCD34D' }}>
            <Lock size={13} />
            <span>256-Bit SSL Encrypted Simulation Environment</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="footer-col">
          <h4>Banking Services</h4>
          <ul className="footer-links">
            <li><Link to="/accounts/summary">Account Summary</Link></li>
            <li><Link to="/transfer">Funds Transfer</Link></li>
            <li><Link to="/pay-request">Pay & Request Hub</Link></li>
            <li><Link to="/bills">Utility Bill Payment</Link></li>
            <li><Link to="/invest/deposits">Fixed & Recurring Deposits</Link></li>
          </ul>
        </div>

        {/* Col 3: Customer Care & Security */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul className="footer-links">
            <li><Link to="/help">Help Center & FAQs</Link></li>
            <li><Link to="/help/security">Security Guidelines</Link></li>
            <li><Link to="/services">Service Requests</Link></li>
            <li>
              <span style={{ color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PhoneCall size={12} /> Helpline: 1800-XXX-XXXX
              </span>
            </li>
          </ul>
        </div>

        {/* Col 4: Legal & Policy */}
        <div className="footer-col">
          <h4>Legal & Policies</h4>
          <ul className="footer-links">
            <li><Link to="/legal/terms">Terms & Conditions</Link></li>
            <li><Link to="/legal/privacy">Privacy Policy</Link></li>
            <li><Link to="/help/security">Report Suspicious Activity</Link></li>
            <li><Link to="/legal/disclaimer">Demo Banking Disclaimer</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={14} />
            <span>DEMO BANKING ENVIRONMENT: Fictional simulated platform for educational purposes. No real financial accounts or gateways are connected.</span>
          </div>
          <div style={{ color: '#64748B', fontSize: '0.725rem' }}>
            © 2026 SECUREBANK. All rights reserved. Registered under Simulated Financial Portal Framework.
          </div>
        </div>
      </div>
    </footer>
  );
};
