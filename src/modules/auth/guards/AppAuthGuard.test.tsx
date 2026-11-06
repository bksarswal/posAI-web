import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppAuthGuard, getAuthRedirect } from './AppAuthGuard';
import * as authContext from '@/modules/auth/AuthProvider';
import * as userHooks from '@/modules/user/user.hooks';

const mockPush = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

describe('AppAuthGuard (src/modules/auth/guards/AppAuthGuard.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/dashboard';
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  describe('getAuthRedirect pure function', () => {
    it('getAuthRedirect table test (no session, must-change, normal, already on /change-password)', () => {
      const cases = [
        {
          name: 'no session (null) on /dashboard',
          user: null,
          pathname: '/dashboard',
          expected: '/login?returnUrl=%2Fdashboard',
        },
        {
          name: 'no session (undefined) on nested path',
          user: undefined,
          pathname: '/branches/b-1',
          expected: '/login?returnUrl=%2Fbranches%2Fb-1',
        },
        {
          name: 'no session on malicious open redirect falls back to /dashboard',
          user: null,
          pathname: '//evil.com',
          expected: '/login?returnUrl=%2Fdashboard',
        },
        {
          name: 'must-change user on /dashboard',
          user: { mustChangePassword: true },
          pathname: '/dashboard',
          expected: '/change-password',
        },
        {
          name: 'already on /change-password with mustChangePassword=true',
          user: { mustChangePassword: true },
          pathname: '/change-password',
          expected: null,
        },
        {
          name: 'normal user on /dashboard',
          user: { mustChangePassword: false },
          pathname: '/dashboard',
          expected: null,
        },
        {
          name: 'already on /change-password with normal user (voluntary use)',
          user: { mustChangePassword: false },
          pathname: '/change-password',
          expected: null,
        },
      ];

      for (const { user, pathname, expected } of cases) {
        expect(getAuthRedirect(user, pathname)).toBe(expected);
      }
    });
  });

  describe('AppAuthGuard component', () => {
    const renderGuard = (children: React.ReactNode = <div>Protected Content</div>) =>
      render(
        <QueryClientProvider client={queryClient}>
          <AppAuthGuard>{children}</AppAuthGuard>
        </QueryClientProvider>,
      );

    it('redirects to /login when user has no session after initialization', async () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: false,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard');
      });
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to /change-password when user.mustChangePassword is true and user is on /dashboard', async () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: true,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { mustChangePassword: true, id: 'u1' },
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/change-password');
      });
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children and avoids redirect loop when user.mustChangePassword is true and already on /change-password', async () => {
      mockPathname = '/change-password';
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: true,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { mustChangePassword: true, id: 'u1' },
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('renders children when user is normal (mustChangePassword=false)', async () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: true,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { mustChangePassword: false, id: 'u1' },
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
