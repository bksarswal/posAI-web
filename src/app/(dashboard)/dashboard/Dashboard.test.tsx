import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './page';
import * as authContext from '@/modules/auth/AuthProvider';
import * as userApi from '@/modules/user/user.api';
import { ApiError } from '@/shared/lib/axios';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('DashboardPage (src/app/(dashboard)/dashboard/page.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it('renders loading skeleton while fetching user data', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isInitialized: true,
      isAuthenticated: true,
    });
    vi.spyOn(userApi, 'getMe').mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('dashboard page: lists branches, shows Main badge, empty state', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isInitialized: true,
      isAuthenticated: true,
    });

    // 1. With branches and a Main branch
    vi.spyOn(userApi, 'getMe').mockResolvedValueOnce({
      success: true,
      message: 'Profile retrieved',
      data: {
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya Sharma',
          email: 'priya@spicegarden.com',
          role: 'OWNER',
          branchIds: ['b-1', 'b-2'],
          emailVerified: true,
          mustChangePassword: false,
        },
        tenant: {
          id: 't-1',
          name: 'Spice Garden Enterprises',
          slug: 'spice-garden',
          status: 'ACTIVE',
        },
        restaurant: {
          id: 'r-1',
          tenantId: 't-1',
          name: 'Spice Garden Indiranagar',
          phone: '+919876543210',
          email: 'indiranagar@spicegarden.com',
          address: {
            line1: '123 100ft Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
          },
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        branches: [
          {
            id: 'b-1',
            tenantId: 't-1',
            restaurantId: 'r-1',
            name: 'Indiranagar Flagship',
            code: 'INDIRA-01',
            address: {
              line1: '100ft Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560038',
            },
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            isMain: true,
            status: 'ACTIVE',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
          {
            id: 'b-2',
            tenantId: 't-1',
            restaurantId: 'r-1',
            name: 'Koramangala Express',
            code: 'KORA-02',
            address: {
              line1: '5th Block',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560095',
            },
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            isMain: false,
            status: 'ACTIVE',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
      },
    });

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // User greeting & role
      expect(screen.getByText('Welcome, Priya Sharma (OWNER)')).toBeInTheDocument();
      // Branches listed
      expect(screen.getByText('Indiranagar Flagship')).toBeInTheDocument();
      expect(screen.getByText('INDIRA-01')).toBeInTheDocument();
      expect(screen.getByText('Koramangala Express')).toBeInTheDocument();
      expect(screen.getByText('KORA-02')).toBeInTheDocument();
      // Main badge shown for main branch
      expect(screen.getByText('Main')).toBeInTheDocument();
    });

    unmount();

    // 2. Empty state when branches array is empty
    vi.spyOn(userApi, 'getMe').mockResolvedValueOnce({
      success: true,
      message: 'Profile retrieved',
      data: {
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya Sharma',
          email: 'priya@spicegarden.com',
          role: 'OWNER',
          branchIds: [],
          emailVerified: true,
          mustChangePassword: false,
        },
        tenant: {
          id: 't-1',
          name: 'Spice Garden Enterprises',
          slug: 'spice-garden',
          status: 'ACTIVE',
        },
        restaurant: {
          id: 'r-1',
          tenantId: 't-1',
          name: 'Spice Garden Indiranagar',
          phone: '+919876543210',
          email: 'indiranagar@spicegarden.com',
          address: {
            line1: '123 100ft Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
          },
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        branches: [],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No branches accessible')).toBeInTheDocument();
      expect(
        screen.getByText(/You are currently not assigned to any branches in this restaurant/i),
      ).toBeInTheDocument();
    });
  });

  it('displays error alert with retry button when profile fetch fails', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isInitialized: true,
      isAuthenticated: true,
    });
    vi.spyOn(userApi, 'getMe').mockRejectedValue(
      new ApiError('Failed to load profile from server', 'INTERNAL_ERROR', 500),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load user profile')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
