import axios, { type AxiosError } from 'axios';
import { env } from './env';

export interface ApiErrorShape {
  success: false;
  message: string;
  code: string;
  errors?: unknown;
}

export class ApiError extends Error implements ApiErrorShape {
  public readonly success = false as const;
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly errors?: unknown;

  constructor(message: string, code = 'INTERNAL_ERROR', statusCode?: number, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    // ──────────────────────────────────────────────────────────────
    // [PLACEHOLDER] TOKEN REFRESH INTERCEPTOR:
    // Auth does not exist yet. When implemented in Sprint 1, catch
    // 401 Unauthorized responses here, request /auth/refresh with
    // refreshToken cookies, and replay the pending requests.
    // ──────────────────────────────────────────────────────────────

    // Timeout Error
    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return Promise.reject(
        new ApiError(
          'Request timed out. Please check your connection and try again.',
          'TIMEOUT',
          408,
        ),
      );
    }

    // Network Error (no response received from backend)
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          'Network connection error. Please verify the server is reachable.',
          'NETWORK_ERROR',
        ),
      );
    }

    // Backend Response Error
    const status = error.response.status;
    const responseData = error.response.data;

    const message =
      typeof responseData?.message === 'string'
        ? responseData.message
        : error.message || 'An unexpected server error occurred';

    const code = typeof responseData?.code === 'string' ? responseData.code : `HTTP_${status}`;

    return Promise.reject(new ApiError(message, code, status, responseData?.errors));
  },
);
