const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface RequestOptions extends RequestInit {
  token?: string;
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

// --- Core request wrapper ---
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  let token = options.token || localStorage.getItem('authToken');

  // Refresh if expired
  if (token && isTokenExpired(token)) {
    token = await refreshToken();
    if (!token) throw new Error('Session expired. Please log in again.');
  }

  const { ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  }).catch((err) => {
    // Network-level failure — backend not running or unreachable
    throw new Error(
      `Cannot reach the server at ${API_BASE_URL}. Make sure the backend is running.\n(${err.message})`
    );
  });

  if (!response.ok) {
    let errorDetail;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = await response.text().catch(() => 'An error occurred');
    }
    throw new Error(`HTTP ${response.status}: ${errorDetail}`);
  }

  return response.json();
}

// --- Exported API methods ---
export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, data?: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  put: <T>(endpoint: string, data?: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token }),
};