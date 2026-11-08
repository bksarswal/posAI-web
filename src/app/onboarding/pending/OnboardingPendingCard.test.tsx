import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingPendingCard } from './OnboardingPendingCard';
import * as userHooks from '@/modules/user/user.hooks';
import * as authHooks from '@/modules/auth/auth.hooks';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/onboarding/pending',
}));

describe('OnboardingPendingCard (src/app/onboarding/pending/OnboardingPendingCard.tsx)', () => {
  let queryClient: QueryClient;
  const mockRefetch = vi.fn();
  const mockLogoutMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.spyOn(authHooks, 'useLogout').mockReturnValue({
      mutate: mockLogoutMutate,
      isPending: false,
    } as unknown as ReturnType<typeof authHooks.useLogout>);
  });

  const renderCard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <OnboardingPendingCard />
      </QueryClientProvider>,
    );

  it('renders correct message when restaurant is null (no restaurant)', () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u2',
            tenantId: 't1',
            name: 'Admin User',
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
      },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderCard();

    expect(
      screen.getByText('Your owner is still setting up the restaurant. Please check back shortly.'),
    ).toBeInTheDocument();
  });

  it('renders correct message when restaurant exists but branches is 0 (no branch assigned)', () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u3',
            tenantId: 't1',
            name: 'Waiter User',
            email: 'waiter@test.com',
            role: 'WAITER',
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
              line1: '123 MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560001',
            },
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
          branches: [],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderCard();

    expect(
      screen.getByText(
        'No branch is assigned to you yet, ask your owner to assign you to a branch.',
      ),
    ).toBeInTheDocument();
  });

  it('Check again refetches', async () => {
    const user = userEvent.setup();

    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u3',
            tenantId: 't1',
            name: 'Waiter User',
            email: 'waiter@test.com',
            role: 'WAITER',
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
      isFetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderCard();

    const checkBtn = screen.getByRole('button', { name: /check again/i });
    await user.click(checkBtn);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('Logout clears token+cache -> /login', async () => {
    const user = userEvent.setup();

    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u3',
            tenantId: 't1',
            name: 'Waiter User',
            email: 'waiter@test.com',
            role: 'WAITER',
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
      isFetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderCard();

    const logoutBtn = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutBtn);

    expect(mockLogoutMutate).toHaveBeenCalled();
  });

  it('auto-redirect when onboarding is no longer needed', async () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u3',
            tenantId: 't1',
            name: 'Waiter User',
            email: 'waiter@test.com',
            role: 'WAITER',
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
              line1: '123 MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
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
                line1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
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
      isFetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderCard();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
