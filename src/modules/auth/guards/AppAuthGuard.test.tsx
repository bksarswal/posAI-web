import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppAuthGuard, getAuthRedirect, getOnboardingRedirect } from './AppAuthGuard';
import type { OnboardingContextLike } from './AppAuthGuard';
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

  describe('getOnboardingRedirect pure function', () => {
    const mockRestaurant = {
      id: 'rest-1',
      tenantId: 'tenant-1',
      name: 'Curry House',
      phone: '+919876543210',
      email: 'info@curryhouse.com',
      address: {
        line1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const mockBranch = {
      id: 'b-1',
      tenantId: 'tenant-1',
      restaurantId: 'rest-1',
      name: 'Main Branch',
      code: 'MAIN-01',
      address: {
        line1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      isMain: true,
      status: 'ACTIVE' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    it('getOnboardingRedirect table for every row + already-on-target', () => {
      const cases: {
        name: string;
        me: OnboardingContextLike | null | undefined;
        pathname: string;
        expected: string | null;
      }[] = [
        {
          name: 'OWNER, no restaurant -> /onboarding/restaurant',
          me: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/restaurant',
        },
        {
          name: 'OWNER, restaurant, 0 branches -> /onboarding/branch',
          me: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/branch',
        },
        {
          name: 'ADMIN, restaurant, 0 branches -> /onboarding/branch',
          me: {
            user: {
              id: 'u2',
              tenantId: 't1',
              name: 'Admin',
              email: 'admin@test.com',
              role: 'ADMIN',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/branch',
        },
        {
          name: 'ADMIN, no restaurant -> /onboarding/pending',
          me: {
            user: {
              id: 'u2',
              tenantId: 't1',
              name: 'Admin',
              email: 'admin@test.com',
              role: 'ADMIN',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/pending',
        },
        {
          name: 'MANAGER, no restaurant -> /onboarding/pending',
          me: {
            user: {
              id: 'u3',
              tenantId: 't1',
              name: 'Manager',
              email: 'mgr@test.com',
              role: 'MANAGER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/pending',
        },
        {
          name: 'WAITER, restaurant exists, 0 branches -> /onboarding/pending',
          me: {
            user: {
              id: 'u4',
              tenantId: 't1',
              name: 'Waiter',
              email: 'waiter@test.com',
              role: 'WAITER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/pending',
        },
        {
          name: 'CASHIER, 0 branches -> /onboarding/pending',
          me: {
            user: {
              id: 'u5',
              tenantId: 't1',
              name: 'Cashier',
              email: 'cashier@test.com',
              role: 'CASHIER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/pending',
        },
        {
          name: 'CHEF, 0 branches -> /onboarding/pending',
          me: {
            user: {
              id: 'u6',
              tenantId: 't1',
              name: 'Chef',
              email: 'chef@test.com',
              role: 'CHEF',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [],
          },
          pathname: '/dashboard',
          expected: '/onboarding/pending',
        },
        {
          name: 'OWNER, restaurant, 1 branch (fully onboarded) -> null',
          me: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: ['b-1'],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [mockBranch],
          },
          pathname: '/dashboard',
          expected: null,
        },
        {
          name: 'MANAGER, restaurant, 1 branch (fully onboarded) -> null',
          me: {
            user: {
              id: 'u3',
              tenantId: 't1',
              name: 'Manager',
              email: 'mgr@test.com',
              role: 'MANAGER',
              branchIds: ['b-1'],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [mockBranch],
          },
          pathname: '/dashboard',
          expected: null,
        },
        {
          name: 'already on target path (/onboarding/restaurant)',
          me: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
          pathname: '/onboarding/restaurant',
          expected: null,
        },
        {
          name: 'already on target path (/onboarding/branch)',
          me: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: mockRestaurant,
            branches: [],
          },
          pathname: '/onboarding/branch',
          expected: null,
        },
        {
          name: 'already on target path (/onboarding/pending)',
          me: {
            user: {
              id: 'u3',
              tenantId: 't1',
              name: 'Manager',
              email: 'mgr@test.com',
              role: 'MANAGER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
          pathname: '/onboarding/pending',
          expected: null,
        },
        {
          name: 'null or undefined me returns null',
          me: null,
          pathname: '/dashboard',
          expected: null,
        },
      ];

      for (const { me, pathname, expected } of cases) {
        expect(getOnboardingRedirect(me, pathname)).toBe(expected);
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
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
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
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('guard: OWNER without restaurant is sent to /onboarding/restaurant', async () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: true,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: null,
            branches: [],
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/restaurant');
      });
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('guard: OWNER with restaurant and 0 branches -> /onboarding/branch', async () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: true,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: {
              id: 'rest-1',
              tenantId: 't1',
              name: 'Spice Garden',
              phone: '+919876543210',
              email: 'contact@spice.com',
              address: {
                line1: '123 St',
                city: 'City',
                state: 'State',
                pincode: '560001',
              },
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            branches: [],
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/branch');
      });
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('guard: MANAGER with 0 branches -> /onboarding/pending', async () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isInitialized: true,
        isAuthenticated: true,
      });
      vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: {
              id: 'u2',
              tenantId: 't1',
              name: 'Manager',
              email: 'mgr@test.com',
              role: 'MANAGER',
              branchIds: [],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: {
              id: 'rest-1',
              tenantId: 't1',
              name: 'Spice Garden',
              phone: '+919876543210',
              email: 'contact@spice.com',
              address: {
                line1: '123 St',
                city: 'City',
                state: 'State',
                pincode: '560001',
              },
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            branches: [],
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

      renderGuard();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/pending');
      });
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
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
            user: {
              id: 'u1',
              tenantId: 't1',
              name: 'Owner',
              email: 'owner@test.com',
              role: 'OWNER',
              branchIds: ['b-1'],
              emailVerified: true,
              mustChangePassword: false,
            },
            tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
            restaurant: {
              id: 'rest-1',
              tenantId: 't1',
              name: 'Spice Garden',
              phone: '+919876543210',
              email: 'contact@spice.com',
              address: {
                line1: '123 St',
                city: 'City',
                state: 'State',
                pincode: '560001',
              },
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            branches: [
              {
                id: 'b-1',
                tenantId: 't1',
                restaurantId: 'rest-1',
                name: 'Main Branch',
                code: 'MAIN-01',
                address: {
                  line1: '123 St',
                  city: 'City',
                  state: 'State',
                  pincode: '560001',
                },
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                isMain: true,
                status: 'ACTIVE',
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
              },
            ],
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
