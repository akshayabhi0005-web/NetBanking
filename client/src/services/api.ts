const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('securebank_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ message: 'Server communication error.' }));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('securebank_token');
      localStorage.removeItem('securebank_user');
      window.dispatchEvent(new Event('securebank_logout'));
    }
    throw new ApiError(data.message || 'Request failed.', response.status);
  }

  return data;
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  setupOnboarding: (data: any) => request<any>('/auth/onboarding/setup', { method: 'POST', body: JSON.stringify(data) }),

  // Accounts
  getAccounts: () => request<any>('/accounts'),
  getAccountSummary: () => request<any>('/accounts/summary'),
  getAccountDetails: (id: string) => request<any>(`/accounts/${id}`),
  getTransactions: (id: string, params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/accounts/${id}/transactions${query ? `?${query}` : ''}`);
  },
  getAccountStatement: (id: string, params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/accounts/${id}/statement${query ? `?${query}` : ''}`);
  },
  depositTestFunds: (data: { accountId: string; amount: number; description?: string }) =>
    request<any>('/accounts/deposit-funds', { method: 'POST', body: JSON.stringify(data) }),

  // Pay & Request
  searchUsers: (query: string) => request<any>(`/pay-request/search-users?q=${encodeURIComponent(query)}`),
  getUserDirectory: () => request<any>('/pay-request/directory'),
  sendMoney: (data: any) => request<any>('/pay-request/send', { method: 'POST', body: JSON.stringify(data) }),
  requestMoney: (data: any) => request<any>('/pay-request/request', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentRequests: () => request<any>('/pay-request/requests'),
  payPaymentRequest: (id: string, data: any) => request<any>(`/pay-request/requests/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  declinePaymentRequest: (id: string) => request<any>(`/pay-request/requests/${id}/decline`, { method: 'POST' }),
  cancelPaymentRequest: (id: string) => request<any>(`/pay-request/requests/${id}/cancel`, { method: 'POST' }),

  // Transfers
  directTransfer: (data: any) => request<any>('/transfers/direct', { method: 'POST', body: JSON.stringify(data) }),
  ownAccountTransfer: (data: any) => request<any>('/transfers/own-account', { method: 'POST', body: JSON.stringify(data) }),

  // Beneficiaries
  getBeneficiaries: () => request<any>('/beneficiaries'),
  addBeneficiary: (data: any) => request<any>('/beneficiaries', { method: 'POST', body: JSON.stringify(data) }),
  deleteBeneficiary: (id: string) => request<any>(`/beneficiaries/${id}`, { method: 'DELETE' }),

  // Bills
  getBillers: (category?: string) => request<any>(`/bills/billers${category ? `?category=${category}` : ''}`),
  payBill: (data: any) => request<any>('/bills/pay', { method: 'POST', body: JSON.stringify(data) }),
  getBillHistory: () => request<any>('/bills/history'),

  // Cards
  getCards: () => request<any>('/cards'),
  setCardStatus: (id: string, status: 'ACTIVE' | 'BLOCKED') => request<any>(`/cards/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  updateCardSettings: (id: string, data: any) => request<any>(`/cards/${id}/settings`, { method: 'POST', body: JSON.stringify(data) }),
  changeCardPin: (id: string, data: any) => request<any>(`/cards/${id}/change-pin`, { method: 'POST', body: JSON.stringify(data) }),

  // Deposits
  calculateFd: (params: { principal: number; tenureMonths: number }) =>
    request<any>(`/deposits/calculator?principal=${params.principal}&tenureMonths=${params.tenureMonths}`),
  getDeposits: () => request<any>('/deposits/list'),
  openFd: (data: any) => request<any>('/deposits/open-fd', { method: 'POST', body: JSON.stringify(data) }),

  // Services
  getServiceRequests: () => request<any>('/services/requests'),
  requestChequeBook: (data: any) => request<any>('/services/cheque-book', { method: 'POST', body: JSON.stringify(data) }),
  stopChequePayment: (data: any) => request<any>('/services/stop-cheque', { method: 'POST', body: JSON.stringify(data) }),
  requestGeneralService: (data: any) => request<any>('/services/general', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Profile
  getProfile: () => request<any>('/profile'),
  updateContact: (data: any) => request<any>('/profile/contact', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => request<any>('/profile/change-password', { method: 'POST', body: JSON.stringify(data) }),
  changeTransactionPin: (data: any) => request<any>('/profile/change-pin', { method: 'POST', body: JSON.stringify(data) }),
  getLoginHistory: () => request<any>('/profile/login-history'),

  // Content
  getNotices: () => request<any>('/content/notices'),
  getSecurityAdvisories: () => request<any>('/content/security-advisories'),
  getFaqs: () => request<any>('/content/faqs'),
  getHealth: () => request<any>('/content/health')
};
