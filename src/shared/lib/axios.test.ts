import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { apiClient, isAuthEndpoint, AUTH_ENDPOINTS } from './axios';
import { bareApiClient, registerAuthHandlers, _resetAuthSessionForTesting } from './authSession';
import { getAccessToken, setAccessToken } from './tokenStorage';
import { ERROR_CODES } from '../constants/errorCodes';

describe('apiClient and Axios Interceptors', () => {
  beforeEach(() => {
    _resetAuthSessionForTesting();
    vi.restoreAllMocks();
  });

  it('attaches Bearer header when token is set and omits it when null (Test 1)', async () => {
    let capturedHeaders: Record<string, unknown> = {};

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      capturedHeaders = config.headers ? (config.headers as Record<string, unknown>) : {};
      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      };
    };

    // Case 1: Token is null
    setAccessToken(null);
    await apiClient.get('/test-endpoint');
    expect(capturedHeaders['Authorization']).toBeUndefined();

    // Case 2: Token is set
    setAccessToken('token-abc');
    await apiClient.get('/test-endpoint');
    expect(capturedHeaders['Authorization']).toBe('Bearer token-abc');

    // Case 3: skipAuth is set -> no Authorization header even if token exists
    await apiClient.get('/test-endpoint', { skipAuth: true });
    expect(capturedHeaders['Authorization']).toBeUndefined();
  });

  it('TOKEN_EXPIRED -> exactly one refresh, the request is replayed with the new token and succeeds (Test 2)', async () => {
    setAccessToken('old-token');

    let refreshCalls = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      refreshCalls++;
      return {
        data: {
          success: true,
          message: 'Refreshed',
          data: {
            accessToken: 'new-token',
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

    let mainCalls = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      mainCalls++;
      const authHeader = config.headers?.Authorization;

      if (authHeader === 'Bearer old-token') {
        throw new AxiosError(
          'Token expired',
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
              message: 'Token expired',
              code: ERROR_CODES.TOKEN_EXPIRED,
            },
          },
        );
      }

      if (authHeader === 'Bearer new-token') {
        return {
          data: { success: true, user: 'data' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        };
      }

      throw new Error(`Unexpected auth header: ${String(authHeader)}`);
    };

    const response = await apiClient.get('/users/me');
    expect(response.data).toEqual({ success: true, user: 'data' });
    expect(refreshCalls).toBe(1);
    expect(mainCalls).toBe(2);
    expect(getAccessToken()).toBe('new-token');
  });

  it('Five CONCURRENT requests all get TOKEN_EXPIRED -> exactly ONE refresh call; all five succeed (Test 3)', async () => {
    setAccessToken('expired-token');

    let refreshCalls = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      refreshCalls++;
      // Slight delay to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 20));
      return {
        data: {
          success: true,
          message: 'Refreshed',
          data: {
            accessToken: 'shared-refreshed-token',
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

    let mainCallCount = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      mainCallCount++;
      const authHeader = config.headers?.Authorization;

      if (authHeader === 'Bearer expired-token') {
        throw new AxiosError(
          'Token expired',
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
              message: 'Token expired',
              code: ERROR_CODES.TOKEN_EXPIRED,
            },
          },
        );
      }

      if (authHeader === 'Bearer shared-refreshed-token') {
        return {
          data: { success: true, url: config.url },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        };
      }

      throw new Error(`Unexpected auth header: ${String(authHeader)}`);
    };

    const requests = [
      apiClient.get('/req-1'),
      apiClient.get('/req-2'),
      apiClient.get('/req-3'),
      apiClient.get('/req-4'),
      apiClient.get('/req-5'),
    ];

    const results = await Promise.all(requests);
    expect(results).toHaveLength(5);
    results.forEach((res, i) => {
      expect(res.data).toEqual({ success: true, url: `/req-${i + 1}` });
    });

    expect(refreshCalls).toBe(1); // Exactly ONE refresh call
    expect(mainCallCount).toBe(10); // 5 initial failures + 5 successful replays
    expect(getAccessToken()).toBe('shared-refreshed-token');
  });

  it('A request that carried an old token and gets TOKEN_EXPIRED after the token was already renewed is replayed with no new refresh (Test 4)', async () => {
    setAccessToken('old-token');

    let refreshCalls = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      refreshCalls++;
      return {
        data: {
          success: true,
          message: 'Refreshed',
          data: {
            accessToken: 'renewed-token',
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

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const authHeader = config.headers?.Authorization;

      if (authHeader === 'Bearer old-token') {
        // While this request was in flight, another call renewed the token
        setAccessToken('already-renewed-token');

        throw new AxiosError(
          'Token expired',
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
              message: 'Token expired',
              code: ERROR_CODES.TOKEN_EXPIRED,
            },
          },
        );
      }

      if (authHeader === 'Bearer already-renewed-token') {
        return {
          data: { success: true, replayed: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        };
      }

      throw new Error(`Unexpected auth header: ${String(authHeader)}`);
    };

    const res = await apiClient.get('/test-stale-token');
    expect(res.data).toEqual({ success: true, replayed: true });
    expect(refreshCalls).toBe(0); // NO new refresh call was made!
  });

  it('401 INVALID_CREDENTIALS on login -> no refresh, no session end, normalized error is thrown (Test 8)', async () => {
    let refreshCalls = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      refreshCalls++;
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      };
    };

    const onSessionEnded = vi.fn();
    registerAuthHandlers({ onSessionEnded });

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Invalid credentials',
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
            message: 'Invalid email or password',
            code: ERROR_CODES.INVALID_CREDENTIALS,
          },
        },
      );
    };

    await expect(
      apiClient.post('/auth/login', { email: 'bad@posai.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      code: ERROR_CODES.INVALID_CREDENTIALS,
      statusCode: 401,
      message: 'Invalid email or password',
    });

    expect(refreshCalls).toBe(0);
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  it('Each auth endpoint in the skip list never triggers a refresh (parameterized test) (Test 9)', async () => {
    let refreshCalls = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      refreshCalls++;
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      };
    };

    const onSessionEnded = vi.fn();
    registerAuthHandlers({ onSessionEnded });

    for (const endpoint of AUTH_ENDPOINTS) {
      expect(isAuthEndpoint(`/auth/${endpoint}`)).toBe(true);
      expect(isAuthEndpoint(endpoint)).toBe(true);

      apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        throw new AxiosError(
          'Unauthorized',
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
              message: 'Auth endpoint failure',
              code: ERROR_CODES.UNAUTHORIZED,
            },
          },
        );
      };

      await expect(apiClient.post(`/auth/${endpoint}`, {})).rejects.toMatchObject({
        code: ERROR_CODES.UNAUTHORIZED,
        statusCode: 401,
      });

      expect(refreshCalls).toBe(0);
      expect(onSessionEnded).not.toHaveBeenCalled();
    }
  });

  it('A replayed request that gets 401 again is not retried again (no infinite loop) (Test 10)', async () => {
    setAccessToken('token-1');

    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      return {
        data: {
          success: true,
          message: 'Refreshed',
          data: {
            accessToken: 'token-2',
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

    let attempts = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      attempts++;
      throw new AxiosError(
        'Still unauthorized',
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
            message: 'Token expired again',
            code: ERROR_CODES.TOKEN_EXPIRED,
          },
        },
      );
    };

    await expect(apiClient.get('/orders')).rejects.toMatchObject({
      code: ERROR_CODES.TOKEN_EXPIRED,
      statusCode: 401,
    });

    // Exactly 2 attempts: initial request + 1 replay. No infinite loop!
    expect(attempts).toBe(2);
  });

  it('TOKEN_REVOKED and UNAUTHORIZED on a normal request -> endSession, no refresh call (Test 11)', async () => {
    let refreshCalls = 0;
    bareApiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      refreshCalls++;
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      };
    };

    for (const code of [ERROR_CODES.TOKEN_REVOKED, ERROR_CODES.UNAUTHORIZED]) {
      setAccessToken('active-token');
      const onSessionEnded = vi.fn();
      registerAuthHandlers({ onSessionEnded });

      apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        throw new AxiosError(
          'Token revoked',
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
              message: 'Revoked',
              code,
            },
          },
        );
      };

      await expect(apiClient.get('/dashboard/data')).rejects.toMatchObject({
        code,
        statusCode: 401,
      });

      expect(refreshCalls).toBe(0);
      expect(onSessionEnded).toHaveBeenCalledWith('revoked');
      expect(getAccessToken()).toBeNull();
    }
  });

  it('403 PASSWORD_CHANGE_REQUIRED -> the handler is called, no logout (Test 12)', async () => {
    setAccessToken('active-token');
    const onPasswordChangeRequired = vi.fn();
    const onSessionEnded = vi.fn();
    registerAuthHandlers({ onPasswordChangeRequired, onSessionEnded });

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Password change required',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config,
          data: {
            success: false,
            message: 'Password change required',
            code: ERROR_CODES.PASSWORD_CHANGE_REQUIRED,
          },
        },
      );
    };

    await expect(apiClient.get('/menu')).rejects.toMatchObject({
      code: ERROR_CODES.PASSWORD_CHANGE_REQUIRED,
      statusCode: 403,
    });

    expect(onPasswordChangeRequired).toHaveBeenCalledTimes(1);
    expect(onSessionEnded).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('active-token'); // Did NOT log out
  });

  it('A network failure -> normalized NETWORK_ERROR (Test 13)', async () => {
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      // Simulate network disconnection (no response property)
      throw new AxiosError('Network Error', 'ERR_NETWORK', config, {});
    };

    await expect(apiClient.get('/data')).rejects.toMatchObject({
      name: 'ApiError',
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Network connection error. Please verify the server is reachable.',
    });
  });

  it('A timeout failure -> normalized TIMEOUT (Test 13b)', async () => {
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED', config, {});
    };

    await expect(apiClient.get('/data')).rejects.toMatchObject({
      name: 'ApiError',
      code: ERROR_CODES.TIMEOUT,
      statusCode: 408,
      message: 'Request timed out. Please check your connection and try again.',
    });
  });
});
