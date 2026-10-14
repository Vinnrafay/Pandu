import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export interface ApiErrorPayload {
  status: number;
  code: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = payload.status;
    this.code = payload.code;
  }
}

function resolveBaseUrl(): string | undefined {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw || raw.trim() === '') return undefined;
  return raw.trim().replace(/\/+$/, '');
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('pandu_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('pandu_token', token);
    } else {
      localStorage.removeItem('pandu_token');
    }
  } catch {
    // storage penuh / mode privat: abaikan, request jalan tanpa token
  }
}

function setAuthHeader(headers: InternalAxiosRequestConfig['headers'], token: string): void {
  const value = `Bearer ${token}`;
  const withSet = headers as unknown as { set?: (k: string, v: string) => void };
  if (typeof withSet.set === 'function') {
    withSet.set('Authorization', value);
  } else {
    (headers as unknown as Record<string, string>)['Authorization'] = value;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ code?: string; message?: string }>;
    const status = axiosError.response?.status ?? 0;
    const data = axiosError.response?.data;
    if (status === 0) {
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet.',
      });
    }
    return new ApiError({
      status,
      code: data?.code ?? `HTTP_${status}`,
      message: data?.message ?? axiosError.message ?? 'Terjadi kesalahan pada server',
    });
  }
  return new ApiError({
    status: 500,
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga',
  });
}

export const api: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) setAuthHeader(config.headers, token);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);
