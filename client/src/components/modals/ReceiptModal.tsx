import React from 'react';
import { CheckCircle2, Copy, Printer, X, Download, Building2 } from 'lucide-react';
import { formatInr } from '../common/AmountDisplay';

export interface ReceiptData {
  transactionId: string;
  amount: number;
  status: string;
  senderDisplayName?: string;
  senderUsername?: string;
  recipientDisplayName?: string;
  recipientUsername?: string;
  sourceAccountMasked?: string;
  destAccountMasked?: string;
  billerName?: string;
  consumerNumber?: string;
  transferMode?: string;
  message?: string;
  timestamp?: string;
  balanceAfter?: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTxn = () => {
    navigator.clipboard.writeText(receipt.transactionId);
    alert(`Transaction ID ${receipt.transactionId} copied to clipboard.`);
  };

  const formattedDate = receipt.timestamp
    ? new Date(receipt.timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleString('en-IN');

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#15803D" />
            <span>Transaction Acknowledgment Receipt</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Official Bank Receipt Card */}
          <div className="banking-receipt" id="printable-receipt">
            <div className="receipt-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building2 size={20} color="#D84315" />
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#D84315', letterSpacing: '0.05em' }}>
                  SECUREBANK
                </span>
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Internet Banking Electronic Fund Transfer Advice
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#DCFCE7',
                color: '#15803D',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                marginTop: '8px'
              }}>
                <CheckCircle2 size={14} />
                <span>PAYMENT SUCCESSFUL</span>
              </div>
            </div>

            <div style={{ margin: '14px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Amount Transferred</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', fontFamily: 'var(--font-mono)' }}>
                {formatInr(receipt.amount)}
              </div>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Transaction Reference ID:</span>
              <span className="receipt-value" style={{ fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {receipt.transactionId}
                <button
                  type="button"
                  onClick={handleCopyTxn}
                  title="Copy Reference ID"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D84315', padding: '2px' }}
                >
                  <Copy size={12} />
                </button>
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Date & Time:</span>
              <span className="receipt-value">{formattedDate}</span>
            </div>

            {receipt.sourceAccountMasked && (
              <div className="receipt-row">
                <span className="receipt-label">Debited From Account:</span>
                <span className="receipt-value" style={{ fontFamily: 'var(--font-mono)' }}>{receipt.sourceAccountMasked}</span>
              </div>
            )}

            {receipt.recipientDisplayName && (
              <div className="receipt-row">
                <span className="receipt-label">Beneficiary Name:</span>
                <span className="receipt-value">{receipt.recipientDisplayName} {receipt.recipientUsername ? `(@${receipt.recipientUsername})` : ''}</span>
              </div>
            )}

            {receipt.billerName && (
              <div className="receipt-row">
                <span className="receipt-label">Biller Organization:</span>
                <span className="receipt-value">{receipt.billerName}</span>
              </div>
            )}

            {receipt.consumerNumber && (
              <div className="receipt-row">
                <span className="receipt-label">Consumer / Account ID:</span>
                <span className="receipt-value">{receipt.consumerNumber}</span>
              </div>
            )}

            {receipt.message && (
              <div className="receipt-row">
                <span className="receipt-label">Remarks / Purpose:</span>
                <span className="receipt-value">{receipt.message}</span>
              </div>
            )}

            {receipt.balanceAfter !== undefined && (
              <div className="receipt-row" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '4px' }}>
                <span className="receipt-label">Updated Account Balance:</span>
                <span className="receipt-value" style={{ color: '#C2410C' }}>{formatInr(receipt.balanceAfter)}</span>
              </div>
            )}

            <div style={{
              marginTop: '16px',
              paddingTop: '10px',
              borderTop: '1px solid #E2E8F0',
              fontSize: '0.675rem',
              color: '#94A3B8',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              This is a system-generated electronic receipt for a simulated banking transaction. No signature required.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={14} />
            <span>Print Receipt</span>
          </button>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
