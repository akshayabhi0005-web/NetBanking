import React from 'react';

interface AmountDisplayProps {
  amount: number | null | undefined;
  type?: 'credit' | 'debit' | 'neutral';
  showSign?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const formatInr = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return '₹' + Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  type = 'neutral',
  showSign = false,
  className = '',
  size = 'md'
}) => {
  const num = Number(amount) || 0;
  const formatted = formatInr(Math.abs(num));

  let colorClass = 'text-main';
  let sign = '';

  if (type === 'credit' || (showSign && num > 0)) {
    colorClass = 'text-success';
    if (showSign) sign = '+';
  } else if (type === 'debit' || (showSign && num < 0)) {
    colorClass = 'text-danger';
    if (showSign) sign = '-';
  }

  const sizeStyles: Record<string, { fontSize: string; fontWeight: number }> = {
    sm: { fontSize: '0.8rem', fontWeight: 600 },
    md: { fontSize: '0.925rem', fontWeight: 700 },
    lg: { fontSize: '1.25rem', fontWeight: 800 },
    xl: { fontSize: '1.75rem', fontWeight: 800 }
  };

  return (
    <span
      className={`tabular-nums ${colorClass} ${className}`}
      style={{ ...sizeStyles[size], display: 'inline-flex', alignItems: 'center' }}
    >
      {sign} {formatted}
    </span>
  );
};
