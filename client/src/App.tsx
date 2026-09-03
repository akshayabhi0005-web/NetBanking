import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BankingLayout } from './components/layout/BankingLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OnboardingWizard } from './pages/auth/OnboardingWizard';

// Main Banking Pages
import { BankingHomePage } from './pages/home/BankingHomePage';
import { AccountSummaryPage } from './pages/accounts/AccountSummaryPage';
import { AccountDetailsPage } from './pages/accounts/AccountDetailsPage';
import { TransactionHistoryPage } from './pages/accounts/TransactionHistoryPage';
import { AccountStatementPage } from './pages/accounts/AccountStatementPage';

// Transfers & Pay/Request
import { FundsTransferHub } from './pages/transfer/FundsTransferHub';
import { DirectTransferPage } from './pages/transfer/DirectTransferPage';
import { OwnAccountTransferPage } from './pages/transfer/OwnAccountTransferPage';
import { BeneficiariesPage } from './pages/transfer/BeneficiariesPage';
import { PayRequestHub } from './pages/payRequest/PayRequestHub';
import { UserDirectoryPage } from './pages/payRequest/UserDirectoryPage';
import { SendMoneyPage } from './pages/payRequest/SendMoneyPage';
import { RequestMoneyPage } from './pages/payRequest/RequestMoneyPage';
import { PendingRequestsPage } from './pages/payRequest/PendingRequestsPage';

// Bills, Cards, Deposits, Services
import { BillPaymentPage } from './pages/bills/BillPaymentPage';
import { BillHistoryPage } from './pages/bills/BillHistoryPage';
import { CardManagementPage } from './pages/cards/CardManagementPage';
import { DepositsPage } from './pages/invest/DepositsPage';
import { ServiceRequestsPage } from './pages/services/ServiceRequestsPage';

// Profile & Security
import { ProfileOverviewPage } from './pages/profile/ProfileOverviewPage';
import { SecuritySettingsPage } from './pages/profile/SecuritySettingsPage';
import { LoginHistoryPage } from './pages/profile/LoginHistoryPage';
import { NotificationCenterPage } from './pages/notifications/NotificationCenterPage';

// Help & Legal
import { HelpCenterPage } from './pages/help/HelpCenterPage';
import { SecurityAdvisoriesPage } from './pages/help/SecurityAdvisoriesPage';
import { TermsPage, PrivacyPage, DisclaimerPage } from './pages/legal/LegalPages';

// Styles
import './styles/variables.css';
import './styles/global.css';
import './styles/banking.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#D84315', marginBottom: '8px' }}>SECUREBANK</div>
          <div style={{ fontSize: '0.825rem', color: '#64748B' }}>Connecting to Secure Internet Banking Core...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isOnboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingWizard />
            </ProtectedRoute>
          } />

          {/* Authenticated Banking Portal Layout */}
          <Route element={
            <ProtectedRoute>
              <BankingLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<BankingHomePage />} />
            
            {/* Accounts */}
            <Route path="/accounts" element={<Navigate to="/accounts/summary" replace />} />
            <Route path="/accounts/summary" element={<AccountSummaryPage />} />
            <Route path="/accounts/details" element={<AccountDetailsPage />} />
            <Route path="/accounts/transactions" element={<TransactionHistoryPage />} />
            <Route path="/accounts/statement" element={<AccountStatementPage />} />

            {/* Funds Transfer */}
            <Route path="/transfer" element={<FundsTransferHub />} />
            <Route path="/transfer/direct" element={<DirectTransferPage />} />
            <Route path="/transfer/own" element={<OwnAccountTransferPage />} />
            <Route path="/transfer/beneficiaries" element={<BeneficiariesPage />} />

            {/* Pay & Request */}
            <Route path="/pay-request" element={<PayRequestHub />} />
            <Route path="/pay-request/directory" element={<UserDirectoryPage />} />
            <Route path="/pay-request/send" element={<SendMoneyPage />} />
            <Route path="/pay-request/request" element={<RequestMoneyPage />} />
            <Route path="/pay-request/pending" element={<PendingRequestsPage />} />

            {/* Bills & Cards */}
            <Route path="/bills" element={<BillPaymentPage />} />
            <Route path="/bills/history" element={<BillHistoryPage />} />
            <Route path="/cards" element={<CardManagementPage />} />

            {/* Services & Deposits */}
            <Route path="/services" element={<ServiceRequestsPage />} />
            <Route path="/services/cheque-book" element={<ServiceRequestsPage />} />
            <Route path="/services/stop-cheque" element={<ServiceRequestsPage />} />
            <Route path="/invest/deposits" element={<DepositsPage />} />

            {/* Profile & Security */}
            <Route path="/profile" element={<ProfileOverviewPage />} />
            <Route path="/profile/security" element={<SecuritySettingsPage />} />
            <Route path="/profile/security/login-history" element={<LoginHistoryPage />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />

            {/* Help & Legal */}
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/help/security" element={<SecurityAdvisoriesPage />} />
            <Route path="/legal/terms" element={<TermsPage />} />
            <Route path="/legal/privacy" element={<PrivacyPage />} />
            <Route path="/legal/disclaimer" element={<DisclaimerPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default App;
