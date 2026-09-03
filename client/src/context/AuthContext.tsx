import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface UserAccount {
  id: string;
  accountNumber: string;
  accountNumberMasked: string;
  accountType: string;
  ifsc: string;
  branch: string;
  balance: number;
  ledgerBalance: number;
  currency: string;
  status: string;
}

export interface UserProfile {
  id: string;
  customerId: string;
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  isOnboarded: boolean;
  lastLoginAt?: string;
  unreadNotifications: number;
  pendingRequestsCount: number;
  accounts: UserAccount[];
  card?: {
    id: string;
    cardNumberMasked: string;
    cardholderName: string;
    expiry: string;
    cardStatus: string;
    isOnlineEnabled: boolean;
    isInternationalEnabled: boolean;
    dailyLimit: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('securebank_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('securebank_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleLogoutEvent = () => {
      logout();
    };
    window.addEventListener('securebank_logout', handleLogoutEvent);
    return () => window.removeEventListener('securebank_logout', handleLogoutEvent);
  }, [refreshUser]);

  const login = (newToken: string, userData: any) => {
    localStorage.setItem('securebank_token', newToken);
    setToken(newToken);
    if (userData) {
      setUser(prev => ({ ...prev, ...userData }));
    }
    refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('securebank_token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
