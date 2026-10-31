import axios from 'axios';
import { env } from './env';
import { getAccessToken, setAccessToken, subscribe } from './tokenStorage';
import { ERROR_CODES } from '../constants/errorCodes';
import { ApiError, normalizeAxiosError } from './axios';

export type SessionEndedReason = 'expired' | 'reused' | 'revoked';

export interface RefreshUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'CHEF';
  emailVerified?: boolean;
  branchIds: string[];
  mustChangePassword: boolean;
}

export interface RefreshResult {
  accessToken: string;
  user: RefreshUser;
}

export interface AuthHandlers {
  onSessionEnded?: (reason: SessionEndedReason) => void;
  onPasswordChangeRequired?: () => void;
}

let sessionEndedHandler: (reason: SessionEndedReason) => void = () => {};
let passwordChangeRequiredHandler: () => void = () => {};
let isSessionEnded = false;

// When a non-null token is stored, reset the ended-session notification guard
subscribe(() => {
  if (getAccessToken() !== null) {
    isSessionEnded = false;
  }
});

/**
 * Bare Axios instance dedicated for token refresh and unintercepted auth calls.
 * Does NOT carry request/response interceptors to avoid circular refresh loops.
 */
export const bareApiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Registers global auth callbacks. The default callbacks do nothing.
 */
export function registerAuthHandlers(handlers: AuthHandlers): void {
  if (handlers.onSessionEnded) {
    sessionEndedHandler = handlers.onSessionEnded;
  }
  if (handlers.onPasswordChangeRequired) {
    passwordChangeRequiredHandler = handlers.onPasswordChangeRequired;
  }
}

/**
 * Returns the currently registered password change handler.
 */
export function getPasswordChangeRequiredHandler(): () => void {
  return passwordChangeRequiredHandler;
}

/**
 * Clears the in-memory access token and triggers onSessionEnded exactly once per ended session.
 */
export function endSession(reason: SessionEndedReason): void {
  setAccessToken(null);
  if (!isSessionEnded) {
    isSessionEnded = true;
    try {
      sessionEndedHandler(reason);
    } catch (err) {
      console.error('Error executing onSessionEnded handler', err);
    }
  }
}

let refreshPromise: Promise<RefreshResult> | null = null;

/**
 * Single-flight session refresh:
 * - Simultaneous callers share a single in-flight POST /auth/refresh promise.
 * - On 401 REFRESH_TOKEN_ROTATED: waits ~300 ms and retries ONCE.
 * - On success: saves the renewed token to tokenStorage and returns { accessToken, user }.
 * - On failure: clears in-memory token and throws the normalized ApiError.
 * - Settles so subsequent callers initiate a new refresh request.
 */
export function refreshSession(): Promise<RefreshResult> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<RefreshResult> => {
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const response = await bareApiClient.post<{
          success: true;
          message: string;
          data: RefreshResult;
        }>('/auth/refresh', {});

        const data = response.data.data;
        setAccessToken(data.accessToken);
        return data;
      } catch (err) {
        const apiError = normalizeAxiosError(err);

        // If rotated within grace window and first attempt, wait 300ms and retry once
        if (apiError.code === ERROR_CODES.REFRESH_TOKEN_ROTATED && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        // On any failure, clear token and throw normalized error
        setAccessToken(null);
        throw apiError;
      }
    }

    setAccessToken(null);
    throw new ApiError('Refresh failed', ERROR_CODES.INTERNAL_ERROR);
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Testing helper to reset internal session state between isolated test cases.
 */
export function _resetAuthSessionForTesting(): void {
  sessionEndedHandler = () => {};
  passwordChangeRequiredHandler = () => {};
  isSessionEnded = false;
  refreshPromise = null;
  setAccessToken(null);
}
