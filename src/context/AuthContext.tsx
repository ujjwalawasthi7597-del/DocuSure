import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, IOrganization, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  organization: IOrganization | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (payload: {
    orgName: string;
    industry: string;
    adminName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('docusure_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const storedToken = localStorage.getItem('docusure_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setOrganization(data.organization);
    } catch (err) {
      console.warn('Session expired or invalid, logging out');
      localStorage.removeItem('docusure_token');
      setToken(null);
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('docusure_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    orgName: string;
    industry: string;
    adminName: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await authApi.registerOrg(payload);
      localStorage.setItem('docusure_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('docusure_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const quickSwitchRole = async (role: UserRole) => {
    let email = 'admin@apexglobal.com';
    if (role === 'reviewer') email = 'reviewer@apexglobal.com';
    if (role === 'uploader') email = 'uploader@apexglobal.com';
    await login(email, 'Password123!');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setOrganization(data.organization);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isLoading,
        login,
        register,
        logout,
        quickSwitchRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
