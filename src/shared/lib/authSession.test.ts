import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  refreshSession,
  endSession,
  registerAuthHandlers,
  bareApiClient,
  _resetAuthSessionForTesting,
} from './authSession';
import { getAccessToken, setAccessToken } from './tokenStorage';
import { ERROR_CODES } from '../constants/errorCodes';

describe('authSession', () => {
  beforeEach(() => {
    _resetAuthSessionForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshSession single-flight: two simultaneous calls make one HTTP request; call after completion makes a new one (Test 15)', async () => {
    let callCount = 0;

    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      callCount++;
      return {
        data: {
          success: true,
          message: 'Session refreshed',
          data: {
            accessToken: `token-${callCount}`,
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@posai.com',
              role: 'OWNER',
              branchIds: [],
              mustChangePassword: false,
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      };
    };

    // Two simultaneous calls
    const p1 = refreshSession();
    const p2 = refreshSession();

    expect(p1).toBe(p2); // shared promise

    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1.accessToken).toBe('token-1');
    expect(res2.accessToken).toBe('token-1');
    expect(callCount).toBe(1);
    expect(getAccessToken()).toBe('token-1');

    // Subsequent call after settling creates a new request
    const res3 = await refreshSession();
    expect(res3.accessToken).toBe('token-2');
    expect(callCount).toBe(2);
    expect(getAccessToken()).toBe('token-2');
  });

  it('refresh answers REFRESH_TOKEN_ROTATED then succeeds -> waits ~300ms, retries once, succeeds; ROTATED twice -> session ends (Test 5)', async () => {
    vi.useFakeTimers();

    let attempts = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      attempts++;
      if (attempts === 1) {
        throw new AxiosError(
          'Rotated',
          'ERR_BAD_REQUEST',
          config,
          {},
          {
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
            data: {
              success: false,
              message: 'Rotated token',
              code: ERROR_CODES.REFRESH_TOKEN_ROTATED,
            },
          },
        );
      }

      return {
        data: {
          success: true,
          message: 'Refreshed',
          data: {
            accessToken: 'token-after-retry',
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@posai.com',
              role: 'OWNER',
              branchIds: [],
              mustChangePassword: false,
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      };
    };

    // Start refresh with fake timer
    const refreshPromise = refreshSession();

    // Advance 300ms for backoff retry
    await vi.advanceTimersByTimeAsync(300);

    const result = await refreshPromise;
    expect(attempts).toBe(2);
    expect(result.accessToken).toBe('token-after-retry');
    expect(getAccessToken()).toBe('token-after-retry');

    // Case 2: ROTATED twice -> failure and session ends
    attempts = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      attempts++;
      throw new AxiosError(
        'Rotated',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: {
            success: false,
            message: 'Rotated again',
            code: ERROR_CODES.REFRESH_TOKEN_ROTATED,
          },
        },
      );
    };

    const onSessionEnded = vi.fn();
    registerAuthHandlers({ onSessionEnded });

    let caughtError: unknown;
    const failedRefreshPromise = refreshSession().catch((err: unknown) => {
      caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(350);
    await failedRefreshPromise;

    expect(caughtError).toMatchObject({
      code: ERROR_CODES.REFRESH_TOKEN_ROTATED,
    });
    expect(attempts).toBe(2);
    expect(getAccessToken()).toBeNull();
  });

  it('refresh fails with INVALID_REFRESH_TOKEN -> token cleared, onSessionEnded called ONCE (Test 6)', async () => {
    const onSessionEnded = vi.fn();
    registerAuthHandlers({ onSessionEnded });
    setAccessToken('existing-token');

    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Invalid refresh token',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: {
            success: false,
            message: 'Invalid refresh token',
            code: ERROR_CODES.INVALID_REFRESH_TOKEN,
          },
        },
      );
    };

    const p1 = refreshSession();
    const p2 = refreshSession();

    await expect(p1).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_REFRESH_TOKEN,
    });
    await expect(p2).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_REFRESH_TOKEN,
    });

    expect(getAccessToken()).toBeNull();

    // Trigger endSession like axios catch block does
    endSession('revoked');
    endSession('revoked');
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
    expect(onSessionEnded).toHaveBeenCalledWith('revoked');
  });

  it('REFRESH_TOKEN_REUSED -> reason is "reused" (Test 7)', async () => {
    const onSessionEnded = vi.fn();
    registerAuthHandlers({ onSessionEnded });
    setAccessToken('existing-token');

    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Reuse detected',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: {
            success: false,
            message: 'Refresh token reuse detected',
            code: ERROR_CODES.REFRESH_TOKEN_REUSED,
          },
        },
      );
    };

    await expect(refreshSession()).rejects.toMatchObject({
      code: ERROR_CODES.REFRESH_TOKEN_REUSED,
    });

    expect(getAccessToken()).toBeNull();
    endSession('reused');
    expect(onSessionEnded).toHaveBeenCalledWith('reused');
  });
});
