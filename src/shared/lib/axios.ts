import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { getAccessToken } from './tokenStorage';
import { refreshSession, endSession, getPasswordChangeRequiredHandler } from './authSession';
import { ERROR_CODES } from '../constants/errorCodes';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
    _sentToken?: string | null;
  }
}

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

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode?: number,
    errors?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Normalizes any error (AxiosError, ApiError, or generic Error) into a consistent ApiError instance.
 */
export function normalizeAxiosError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const axiosError = error as AxiosError<ApiErrorShape>;

  // Timeout Error
  if (axiosError.code === 'ECONNABORTED' || axiosError.message?.toLowerCase().includes('timeout')) {
    return new ApiError(
      'Request timed out. Please check your connection and try again.',
      ERROR_CODES.TIMEOUT,
      408,
    );
  }

  // Network Error (no response received from backend)
  if (!axiosError.response) {
    return new ApiError(
      'Network connection error. Please verify the server is reachable.',
      ERROR_CODES.NETWORK_ERROR,
    );
  }

  // Backend Response Error
  const status = axiosError.response.status;
  const responseData = axiosError.response.data;

  const message =
    typeof responseData?.message === 'string'
      ? responseData.message
      : axiosError.message || 'An unexpected server error occurred';

  const code =
    typeof responseData?.code === 'string'
      ? responseData.code
      : status === 500
        ? ERROR_CODES.INTERNAL_SERVER_ERROR
        : `HTTP_${status}`;

  return new ApiError(message, code, status, responseData?.errors);
}

export const AUTH_ENDPOINTS = [
  'login',
  'signup',
  'refresh',
  'logout',
  'verify-email',
  'resend-verification',
  'forgot-password',
  'reset-password',
] as const;

/**
 * Checks whether an endpoint is one of the core auth endpoints that should NEVER be refreshed/retried.
 */
export function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  const cleanPath = url.split('?')[0].replace(/\/+$/, '');
  return AUTH_ENDPOINTS.some((endpoint) => {
    return cleanPath.endsWith(`/${endpoint}`) || cleanPath === endpoint;
  });
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

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
      config._sentToken = token;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = normalizeAxiosError(error);
    const originalRequest = (error as AxiosError)?.config as InternalAxiosRequestConfig | undefined;

    // 1. Password change required gate (403): notify handler and do NOT log out
    if (apiError.statusCode === 403 && apiError.code === ERROR_CODES.PASSWORD_CHANGE_REQUIRED) {
      getPasswordChangeRequiredHandler()();
      return Promise.reject(apiError);
    }

    // 2. If no request config or not a 401 error, reject immediately
    if (!originalRequest || apiError.statusCode !== 401) {
      return Promise.reject(apiError);
    }

    // 3. Auth endpoints never trigger refresh-and-retry
    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(apiError);
    }

    // 4. Only handle 401 on requests that carried an access token
    const authHeader =
      originalRequest.headers?.Authorization || originalRequest.headers?.['authorization'];
    const carriedToken = Boolean(originalRequest._sentToken || authHeader);

    if (!carriedToken) {
      return Promise.reject(apiError);
    }

    // 5. Terminal session revocation codes on requests carrying tokens
    if (
      apiError.code === ERROR_CODES.TOKEN_REVOKED ||
      apiError.code === ERROR_CODES.UNAUTHORIZED ||
      apiError.code === ERROR_CODES.INVALID_REFRESH_TOKEN
    ) {
      endSession('revoked');
      return Promise.reject(apiError);
    }

    // 6. Handle TOKEN_EXPIRED with single-flight refresh and retry
    if (apiError.code === ERROR_CODES.TOKEN_EXPIRED) {
      // Replayed request failing again with 401 is never retried a second time
      if (originalRequest._retry) {
        return Promise.reject(apiError);
      }
      originalRequest._retry = true;

      // Check if token was already renewed by another concurrent request while this one was in flight
      const currentToken = getAccessToken();
      const sentToken =
        originalRequest._sentToken ||
        (typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null);

      if (currentToken && sentToken && currentToken !== sentToken) {
        // Replay with the already-renewed token without initiating a new refresh
        originalRequest.headers.set('Authorization', `Bearer ${currentToken}`);
        originalRequest._sentToken = currentToken;
        return apiClient(originalRequest);
      }

      // Initiate or join single-flight refresh
      try {
        const { accessToken: newToken } = await refreshSession();
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        originalRequest._sentToken = newToken;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        const refreshApiError = normalizeAxiosError(refreshErr);

        if (refreshApiError.code === ERROR_CODES.REFRESH_TOKEN_REUSED) {
          endSession('reused');
        } else if (
          refreshApiError.code === ERROR_CODES.TOKEN_REVOKED ||
          refreshApiError.code === ERROR_CODES.UNAUTHORIZED ||
          refreshApiError.code === ERROR_CODES.INVALID_REFRESH_TOKEN
        ) {
          endSession('revoked');
        } else {
          endSession('expired');
        }

        return Promise.reject(refreshApiError);
      }
    }

    // Any other 401 on a token-carrying request ends the session as revoked
    endSession('revoked');
    return Promise.reject(apiError);
  },
);
