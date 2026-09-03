import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Wallet, 
  ArrowLeftRight, 
  SendHorizontal, 
  Receipt, 
  CreditCard, 
  Wrench, 
  TrendingUp, 
  HelpCircle, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const TopNavigation: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="top-nav-bar">
      <div className="top-nav-inner">
        {/* Mobile toggle button */}
        <div style={{ display: 'none', padding: '10px 16px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }} className="mobile-toggle-wrapper">
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>MENU NAVIGATION</span>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D84315' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* HOME */}
          <li className="nav-item">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <Home size={15} />
              <span>Home</span>
            </NavLink>
          </li>

          {/* ACCOUNTS */}
          <li className="nav-item">
            <NavLink to="/accounts/summary" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Wallet size={15} />
              <span>Accounts</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/accounts/summary" onClick={closeMobileMenu}>Account Summary</Link></li>
              <li className="dropdown-item"><Link to="/accounts/details" onClick={closeMobileMenu}>Account Details</Link></li>
              <li className="dropdown-item"><Link to="/accounts/transactions" onClick={closeMobileMenu}>Transaction History</Link></li>
              <li className="dropdown-item"><Link to="/accounts/statement" onClick={closeMobileMenu}>Account Statement</Link></li>
            </ul>
          </li>

          {/* FUNDS TRANSFER */}
          <li className="nav-item">
            <NavLink to="/transfer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowLeftRight size={15} />
              <span>Funds Transfer</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/transfer/direct" onClick={closeMobileMenu}>Within SecureBank (A/C + IFSC)</Link></li>
              <li className="dropdown-item"><Link to="/transfer/own" onClick={closeMobileMenu}>Own Account Transfer</Link></li>
              <li className="dropdown-item"><Link to="/transfer/beneficiaries" onClick={closeMobileMenu}>Manage Beneficiaries</Link></li>
            </ul>
          </li>

          {/* PAY & REQUEST */}
          <li className="nav-item">
            <NavLink to="/pay-request" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <SendHorizontal size={15} />
              <span>Pay & Request</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/pay-request/directory" onClick={closeMobileMenu}>User Directory (All Customers)</Link></li>
              <li className="dropdown-item"><Link to="/pay-request/send" onClick={closeMobileMenu}>Send Money (@username)</Link></li>
              <li className="dropdown-item"><Link to="/pay-request/request" onClick={closeMobileMenu}>Request Money</Link></li>
              <li className="dropdown-item"><Link to="/pay-request/pending" onClick={closeMobileMenu}>Pending Payment Requests</Link></li>
            </ul>
          </li>

          {/* BILL PAYMENT */}
          <li className="nav-item">
            <NavLink to="/bills" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={15} />
              <span>Bill Payment</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/bills" onClick={closeMobileMenu}>Pay Utility Bills</Link></li>
              <li className="dropdown-item"><Link to="/bills/history" onClick={closeMobileMenu}>Payment History</Link></li>
            </ul>
          </li>

          {/* CARDS */}
          <li className="nav-item">
            <NavLink to="/cards" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <CreditCard size={15} />
              <span>Cards</span>
            </NavLink>
          </li>

          {/* SERVICES */}
          <li className="nav-item">
            <NavLink to="/services" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Wrench size={15} />
              <span>Services</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/services" onClick={closeMobileMenu}>Service Requests Hub</Link></li>
              <li className="dropdown-item"><Link to="/services/cheque-book" onClick={closeMobileMenu}>Cheque Book Request</Link></li>
              <li className="dropdown-item"><Link to="/services/stop-cheque" onClick={closeMobileMenu}>Stop Cheque Payment</Link></li>
            </ul>
          </li>

          {/* INVEST */}
          <li className="nav-item">
            <NavLink to="/invest/deposits" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <TrendingUp size={15} />
              <span>Invest</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/invest/deposits" onClick={closeMobileMenu}>Fixed & Recurring Deposits</Link></li>
            </ul>
          </li>

          {/* HELP */}
          <li className="nav-item">
            <NavLink to="/help" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HelpCircle size={15} />
              <span>Help</span>
              <ChevronDown size={13} />
            </NavLink>
            <ul className="dropdown-menu">
              <li className="dropdown-item"><Link to="/help" onClick={closeMobileMenu}>Help Center & FAQs</Link></li>
              <li className="dropdown-item"><Link to="/help/security" onClick={closeMobileMenu}>Security Advisories</Link></li>
            </ul>
          </li>
        </ul>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mobile-toggle-wrapper { display: flex !important; }
          .nav-links {
            display: none;
            flex-direction: column;
            width: 100%;
            background: #FFFFFF;
            border-top: 1px solid #E5E7EB;
          }
          .nav-links.mobile-open {
            display: flex;
          }
          .dropdown-menu {
            position: static;
            display: block;
            box-shadow: none;
            border: none;
            background: #F9FAFB;
            padding-left: 20px;
          }
        }
      `}</style>
    </nav>
  );
};
