import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are currently no items to display in this section.',
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '36px 20px',
      background: '#F9FAFB',
      border: '1px dashed #E5E7EB',
      borderRadius: '4px',
      margin: '12px 0'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#FFF3E0',
        color: '#D84315',
        marginBottom: '12px'
      }}>
        {icon || <Inbox size={24} />}
      </div>
      <h4 style={{ fontSize: '0.925rem', color: '#374151', marginBottom: '6px' }}>{title}</h4>
      <p style={{ fontSize: '0.785rem', color: '#6B7280', maxWidth: '400px', margin: '0 auto 16px', lineHeight: '1.5' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
