'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { safeJsonParse } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ACCOUNT_ADMIN' | 'USER';
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Verify token and get user info
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      console.log('Verifying token on refresh...');
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await safeJsonParse(response);
        const userData = data.user || data; // Handle both wrapped and unwrapped responses
        console.log('Token verification successful, user role:', userData.role);
        setUser(userData);
        setToken(token);
      } else {
        console.log('Token verification failed, response status:', response.status);
        // Token is invalid
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await safeJsonParse(response);
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await safeJsonParse(response);
      const { token, user } = data;

      // Store token and user data
      localStorage.setItem('authToken', token);
      setToken(token);
      setUser(user);

      // Redirect based on user role
      switch (user.role) {
        case 'SUPER_ADMIN':
          router.push('/admin');
          break;
        case 'ACCOUNT_ADMIN':
          router.push('/admin/organization');
          break;
        case 'USER':
          router.push('/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};