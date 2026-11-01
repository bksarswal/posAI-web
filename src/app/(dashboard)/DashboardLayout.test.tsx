/**
 * Dashboard layout route guard tests.
 *
 * The dashboard layout renders children only when the session is initialized and authenticated.
 * When !isAuthenticated after initialization, the user must be redirected to /login.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as authContext from '@/modules/auth/AuthProvider';
import * as authSession from '@/shared/lib/authSession';
import * as tokenStorage from '@/shared/lib/tokenStorage';
import DashboardLayout from './layout';

const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/dashboard');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DashboardLayout route guard (src/app/(dashboard)/layout.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken(null);
    authSession._resetAuthSessionForTesting();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderLayout = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <authContext.AuthProvider>
          <DashboardLayout>
            <div data-testid="protected-content">Protected</div>
          </DashboardLayout>
        </authContext.AuthProvider>
      </QueryClientProvider>,
    );

  it('redirects to /login when session is initialized but there is no access token', async () => {
    // refreshSession rejects → unauthenticated
    vi.spyOn(authSession, 'refreshSession').mockRejectedValue(new Error('No refresh token'));

    renderLayout();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
    });
  });
});
