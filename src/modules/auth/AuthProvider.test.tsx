import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthProvider';
import * as authSession from '@/shared/lib/authSession';
import * as tokenStorage from '@/shared/lib/tokenStorage';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function ConsumerComponent() {
  const { isInitialized, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="isInitialized">{String(isInitialized)}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
    </div>
  );
}

describe('AuthProvider (src/modules/auth/AuthProvider.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken(null);
    authSession._resetAuthSessionForTesting();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('attempts single-flight silent refresh on mount and initializes auth state', async () => {
    const refreshSpy = vi.spyOn(authSession, 'refreshSession').mockImplementation(async () => {
      tokenStorage.setAccessToken('test-token');
      return {
        accessToken: 'test-token',
        user: {
          id: '123',
          tenantId: 't1',
          name: 'User',
          email: 'user@posai.com',
          role: 'OWNER',
          branchIds: [],
          mustChangePassword: false,
        },
      };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Wait for refresh to complete and state to settle
    await waitFor(() => {
      expect(screen.getByTestId('isInitialized').textContent).toBe('true');
    });

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
  });

  it('initializes cleanly as unauthenticated when silent refresh fails (401)', async () => {
    vi.spyOn(authSession, 'refreshSession').mockRejectedValue(new Error('No refresh token'));

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('isInitialized').textContent).toBe('true');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('triggers onSessionEnded to clear query cache and redirect to /login', async () => {
    vi.spyOn(authSession, 'refreshSession').mockImplementation(async () => {
      tokenStorage.setAccessToken('token-1');
      return {
        accessToken: 'token-1',
        user: {
          id: '123',
          tenantId: 't1',
          name: 'User',
          email: 'user@posai.com',
          role: 'OWNER',
          branchIds: [],
          mustChangePassword: false,
        },
      };
    });

    const clearSpy = vi.spyOn(queryClient, 'clear');

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('isInitialized').textContent).toBe('true');
    });

    // Simulate session ended event
    act(() => {
      authSession.endSession('expired');
    });

    expect(clearSpy).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('makes exactly ONE refresh request even inside React.StrictMode (double-invoke)', async () => {
    const refreshSpy = vi.spyOn(authSession, 'refreshSession').mockImplementation(async () => {
      tokenStorage.setAccessToken('test-token');
      return {
        accessToken: 'test-token',
        user: {
          id: '123',
          tenantId: 't1',
          name: 'User',
          email: 'user@posai.com',
          role: 'OWNER',
          branchIds: [],
          mustChangePassword: false,
        },
      };
    });

    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ConsumerComponent />
          </AuthProvider>
        </QueryClientProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('isInitialized').textContent).toBe('true');
    });

    // StrictMode double-invokes effects in development, but hasRefreshedRef must prevent
    // a second refresh call — exactly one network request must be made.
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
  });
});
