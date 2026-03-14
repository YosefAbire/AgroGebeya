import { api } from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from './types';

const TOKEN_KEY = 'auth_token';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail);
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  },

  async register(data: RegisterData): Promise<User> {
    const user = await api.post<User>('/api/v1/auth/register', data);
    return user;
  },

  async getCurrentUser(token: string): Promise<User> {
    return api.get<User>('/api/v1/auth/me', token);
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  logout(): void {
    this.removeToken();
  },
};
