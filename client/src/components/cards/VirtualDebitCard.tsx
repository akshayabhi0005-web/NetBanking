import React from 'react';
import { Building2, ShieldCheck, Wifi } from 'lucide-react';

interface CardProps {
  cardNumberMasked: string;
  cardholderName: string;
  expiry: string;
  cardStatus?: string;
  isOnlineEnabled?: boolean;
  dailyLimit?: number;
}

export const VirtualDebitCard: React.FC<CardProps> = ({
  cardNumberMasked,
  cardholderName,
  expiry,
  cardStatus = 'ACTIVE',
  isOnlineEnabled = true,
  dailyLimit = 25000
}) => {
  const isBlocked = cardStatus === 'BLOCKED';

  return (
    <div className="virtual-debit-card-wrapper">
      <div className="virtual-debit-card" style={isBlocked ? { filter: 'grayscale(0.85)' } : {}}>
        {/* Card Header: Brand + Chip + Contactless */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#FFFFFF', padding: '4px', borderRadius: '4px', display: 'flex' }}>
              <Building2 size={16} color="#D84315" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em' }}>SECUREBANK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wifi size={16} color="#FDE68A" style={{ transform: 'rotate(90deg)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FCD34D', letterSpacing: '0.05em' }}>
              PLATINUM
            </span>
          </div>
        </div>

        {/* EMV Chip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="card-chip" />
          {isBlocked && (
            <span style={{ background: '#B91C1C', color: '#FFFFFF', padding: '2px 8px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 800 }}>
              CARD BLOCKED
            </span>
          )}
        </div>

        {/* Masked Card Number */}
        <div className="card-number-display">
          {cardNumberMasked}
        </div>

        {/* Card Footer: Name & Expiry */}
        <div className="card-footer-info">
          <div>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>
              Cardholder
            </div>
            <div className="cardholder-name">
              {cardholderName || 'SECUREBANK CUSTOMER'}
            </div>
          </div>

          <div>
            <div className="card-valid-thru">
              VALID THRU
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>
              {expiry}
            </div>
          </div>
        </div>

        {/* RuPay / Visa Hologram Badge */}
        <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.85 }}>
          <span style={{ fontWeight: 800, fontStyle: 'italic', fontSize: '0.85rem', color: '#F59E0B' }}>
            RuPay<span style={{ fontSize: '0.65rem', fontStyle: 'normal', color: '#FFFFFF' }}> SIM</span>
          </span>
        </div>
      </div>
    </div>
  );
};
