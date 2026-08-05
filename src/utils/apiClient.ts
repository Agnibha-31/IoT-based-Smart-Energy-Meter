const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined | null>;
  raw?: boolean;
};

let accessToken: string | null = localStorage.getItem('smartmeter_token');

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('smartmeter_token', token);
  } else {
    localStorage.removeItem('smartmeter_token');
  }
};

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const url = new URL(path, API_BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const request = async <T = any>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { query, body, headers, raw, ...rest } = options;
  const url = buildUrl(path, query);
  const init: RequestInit = {
    method: rest.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
  if (accessToken) {
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }
  if (body !== undefined && body !== null) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || `Request failed (${response.status})`);
  }
  if (raw) {
    // @ts-expect-error - caller handles response stream/blob
    return response;
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  // @ts-expect-error - fallback
  return response.text();
};

export const login = async (email: string, password: string) => {
  const result = await request<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setAccessToken(result.token);
  return result;
};

export const register = async (email: string, password: string, name: string) => {
  const result = await request<{ token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: { email, password, name },
  });
  setAccessToken(result.token);
  return result;
};

export const fetchCurrentUser = () =>
  request<{ user: any }>('/api/auth/me');

export const updatePreferences = (payload: Record<string, any>) =>
  request<{ user: any }>('/api/auth/preferences', {
    method: 'PATCH',
    body: payload,
  });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ success: boolean }>('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });

type SummaryParams = {
  period?: string;
  from?: string | number;
  to?: string | number;
  device_id?: string;
};

export const fetchSummary = (params: SummaryParams = {}) =>
  request('/api/analytics/summary', { query: params });

export const fetchVoltageHistory = (params: SummaryParams & { interval_seconds?: number } = {}) =>
  request('/api/analytics/voltage-history', { query: params });

export const fetchHistory = (params: SummaryParams & { interval_seconds?: number } = {}) =>
  request('/api/readings/history', { query: params });

export const fetchCostProjection = (params: SummaryParams = {}) =>
  request('/api/analytics/cost', { query: params });

export const getDownloadPreview = (params: Record<string, any>) =>
  request('/api/export/preview', { query: params });

export const downloadReadings = async (params: Record<string, any>) => {
  const response = await request<Response>('/api/export/readings', {
    query: params,
    raw: true,
  });
  const blob = await response.blob();
  return blob;
};

export const deleteHistoryBefore = (before: number, deviceId?: string) =>
  request('/api/readings/history', {
    method: 'DELETE',
    query: {
      before,
      device_id: deviceId,
    },
  });

export const getDatabaseStats = (deviceId?: string) =>
  request('/api/readings/stats', {
    query: deviceId ? { device_id: deviceId } : {},
  });

