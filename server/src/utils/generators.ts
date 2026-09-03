import { v4 as uuidv4 } from 'uuid';

export function generateCustomerId(): string {
  // Generates e.g. SBK482917
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SBK${randomNum}`;
}

export function generateAccountNumber(): string {
  // Generates 12-digit Indian style account number e.g. 108945127823
  const prefix = '1089';
  const middle = Math.floor(1000 + Math.random() * 9000);
  const end = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${middle}${end}`;
}

export function generateTransactionId(): string {
  // Generates e.g. SBKTXN82917361
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `SBKTXN${rand}`;
}

export function generateRequestId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SBKREQ${rand}`;
}

export function generateServiceRequestId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SR${rand}`;
}

export function generateVirtualCardNumber(): string {
  // Generates 16-digit card number starting with 4829 (SecureBank RuPay/Visa style)
  const part2 = Math.floor(1000 + Math.random() * 9000);
  const part3 = Math.floor(1000 + Math.random() * 9000);
  const part4 = Math.floor(1000 + Math.random() * 9000);
  return `4829${part2}${part3}${part4}`;
}

export function maskAccountNumber(accNo: string): string {
  if (!accNo || accNo.length < 4) return accNo;
  const last4 = accNo.slice(-4);
  return `••••••••${last4}`;
}

export function maskCardNumber(cardNo: string): string {
  if (!cardNo || cardNo.length < 4) return 'XXXX XXXX XXXX 0000';
  const clean = cardNo.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return `XXXX XXXX XXXX ${last4}`;
}
