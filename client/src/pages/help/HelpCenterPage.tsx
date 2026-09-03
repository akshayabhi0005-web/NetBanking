import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { api } from '../../services/api';
import { HelpCircle, PhoneCall, Mail, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await api.getFaqs();
        if (res.success) {
          setFaqs(res.faqs || []);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    };
    loadFaqs();
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Help & Customer Support' }]} />

      <h2 style={{ fontSize: '1.25rem', color: '#1E293B', fontWeight: 800, marginBottom: '6px' }}>
        Customer Support & Frequently Asked Questions
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '20px' }}>
        Guides and answers on Internet Banking services, Pay & Request operations, and simulated transactions.
      </p>

      {/* Support Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', background: '#FFF3E0', color: '#D84315', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <PhoneCall size={18} />
          </div>
          <h4 style={{ fontSize: '0.85rem', color: '#1E293B', marginBottom: '4px' }}>Toll-Free Helpline</h4>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D84315', fontFamily: 'var(--font-mono)' }}>
            1800-XXX-XXXX
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>24x7 Simulated Assistance</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', background: '#DBEAFE', color: '#1D4ED8', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <Mail size={18} />
          </div>
          <h4 style={{ fontSize: '0.85rem', color: '#1E293B', marginBottom: '4px' }}>Customer Support Email</h4>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8' }}>
            support@securebank.sim
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>Response within 24 hours</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <ShieldAlert size={18} />
          </div>
          <h4 style={{ fontSize: '0.85rem', color: '#1E293B', marginBottom: '4px' }}>Report Fraud & Phishing</h4>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B91C1C' }}>
            fraud-reporting@securebank.sim
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>Immediate freeze facility</div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="banking-card">
        <div className="banking-card-header">
          <span className="banking-card-title">
            <HelpCircle size={16} /> Frequently Asked Questions
          </span>
        </div>
        <div className="banking-card-body" style={{ padding: '8px 18px' }}>
          {faqs.map(f => {
            const isOpen = openFaqId === f.id;
            return (
              <div key={f.id} style={{ borderBottom: '1px solid #F1F5F9', padding: '12px 0' }}>
                <div
                  onClick={() => toggleFaq(f.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: isOpen ? '#D84315' : '#1E293B' }}>
                    {f.question}
                  </strong>
                  {isOpen ? <ChevronUp size={16} color="#D84315" /> : <ChevronDown size={16} color="#94A3B8" />}
                </div>

                {isOpen && (
                  <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '8px', lineHeight: '1.5' }}>
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
