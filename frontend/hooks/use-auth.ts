'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface User {
  id?: string;
  name: string;
  full_name?: string;
  username?: string;
  email: string;
  phone?: string;
  role: 'farmer' | 'retailer' | 'admin';
  location?: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Partial<User> & { password: string; confirmPassword: string }) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// --- Utility: check if token expired ---
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // treat invalid tokens as expired
  }
}

// --- Utility: refresh token ---
async function refreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  localStorage.setItem('authToken', data.access_token);
  return data.access_token;
}

/**
 * Hook for managing authentication state
 * Provides login, logout, register, and profile update functionality
 */
export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        let storedToken = localStorage.getItem('authToken');

        if (storedToken && isTokenExpired(storedToken)) {
          storedToken = await refreshToken();
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      const accessToken = data.access_token;
      const refreshTokenValue = data.refresh_token; // backend should return this

      const userResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user details');
      }

      const userData = await userResponse.json();

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', accessToken);
      if (refreshTokenValue) {
        localStorage.setItem('refreshToken', refreshTokenValue);
      }

      setUser(userData);
      setToken(accessToken);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (userData: Partial<User> & { password: string; confirmPassword: string }) => {
      setIsLoading(true);
      try {
        if (!userData.name || !userData.email) {
          throw new Error('Name and email are required');
        }
        if (userData.password !== userData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (userData.password && userData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            username: userData.name.toLowerCase().replace(/\s+/g, '_'),
            password: userData.password,
            full_name: userData.name,
            phone: userData.phone,
            role: userData.role || 'farmer',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Registration failed');
        }

        await login(userData.name.toLowerCase().replace(/\s+/g, '_'), userData.password);
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!user) {
        throw new Error('User not authenticated');
      }
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    user,
    token,
    loading: isLoading,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateProfile,
  };
}