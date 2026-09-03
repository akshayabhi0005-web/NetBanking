import React from 'react';
import { Outlet } from 'react-router-dom';
import { OrangeHeader } from './OrangeHeader';
import { TopNavigation } from './TopNavigation';
import { Footer } from './Footer';

export const BankingLayout: React.FC = () => {
  return (
    <div className="app-container">
      {/* Background Bank Building Watermark */}
      <div className="bank-watermark-bg" />

      {/* Top Corporate Orange Header */}
      <OrangeHeader />

      {/* Traditional Top Navigation */}
      <TopNavigation />

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
