import React from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { ShieldCheck, AlertTriangle, FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Legal' }, { label: 'Terms & Conditions' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Terms and Conditions of Internet Banking
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Educational Simulated Banking Portal Terms of Use.
      </p>

      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <FileText size={16} /> User Agreement & Simulated Terms
          </span>
        </div>
        <div className="banking-card-body" style={{ fontSize: '0.825rem', color: '#374151', lineHeight: '1.6' }}>
          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>1. Educational and Simulation Nature</h4>
          <p style={{ marginBottom: '14px' }}>
            SecureBank is an educational and portfolio simulation application. All accounts, account numbers, IFSC codes, debit cards, balances, and transactions created within this application represent virtual entities maintained in an isolated database. No real money, real bank accounts, or actual payment gateways are connected.
          </p>

          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>2. Account Creation and Security</h4>
          <p style={{ marginBottom: '14px' }}>
            Users must register with non-sensitive simulated data. Users are responsible for keeping their login passwords and Transaction PIN confidential within the demo application.
          </p>

          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>3. Pay & Request and Inter-User Transfers</h4>
          <p style={{ marginBottom: '14px' }}>
            The Pay & Request functionality enables registered users of this demo application to send and request virtual INR balances between each other. Transactions update database records atomically with ACID guarantees.
          </p>

          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>4. Limitation of Liability</h4>
          <p>
            SecureBank does not hold real monetary deposits or provide real financial services. The operators of this educational project are not liable for misunderstandings regarding the virtual nature of the platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Legal' }, { label: 'Privacy Policy' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Privacy Policy
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        How application data is handled in the SecureBank environment.
      </p>

      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <ShieldCheck size={16} /> Data Storage & Security Safeguards
          </span>
        </div>
        <div className="banking-card-body" style={{ fontSize: '0.825rem', color: '#374151', lineHeight: '1.6' }}>
          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>1. Information Collected</h4>
          <p style={{ marginBottom: '14px' }}>
            SecureBank collects basic registration profile fields (Name, email, mobile, residential city/state), cryptographic password hashes, Transaction PIN hashes, and transaction audit logs strictly to simulate an authentic Internet Banking experience.
          </p>

          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>2. Password and PIN Security</h4>
          <p style={{ marginBottom: '14px' }}>
            All passwords, transaction PINs, and debit card PINs are hashed using bcrypt before database insertion. Plaintext credentials are never stored or logged in backend systems.
          </p>

          <h4 style={{ color: '#D84315', marginBottom: '6px' }}>3. Privacy in User Search</h4>
          <p>
            When other registered users search for recipients via Pay & Request, only the Public Display Name and @username are visible. Bank account numbers, phone numbers, and balances are strictly hidden.
          </p>
        </div>
      </div>
    </div>
  );
};

export const DisclaimerPage: React.FC = () => {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Legal' }, { label: 'Demo Disclaimer' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Demo Banking Disclaimer
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Fictional educational banking notice.
      </p>

      <div className="banking-card" style={{ borderLeftColor: '#D97706' }}>
        <div className="banking-card-header" style={{ background: '#FFFBEB' }}>
          <span className="banking-card-title" style={{ color: '#92400E' }}>
            <AlertTriangle size={16} /> Important Simulation Notice
          </span>
        </div>
        <div className="banking-card-body" style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '14px' }}>
            <strong>SecureBank</strong> is a fictional banking portal built for educational demonstration.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>No connections exist to real banking networks, RBI, NPCI, NEFT, RTGS, IMPS, or real payment gateways.</li>
            <li>All monetary amounts (₹ INR) displayed in the application are simulated database units.</li>
            <li>Virtual Debit Cards are non-functional mock instruments for simulation only.</li>
            <li>Do not enter actual real-life banking passwords, card PINs, or government identity numbers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
