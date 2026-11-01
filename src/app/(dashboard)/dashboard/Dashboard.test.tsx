import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './page';
import * as authContext from '@/modules/auth/AuthProvider';
import * as authApi from '@/modules/auth/auth.api';
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
    // Return a pending promise so isLoading is true
    vi.spyOn(userApi, 'getMe').mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders user greeting, role, tenant, and restaurant on successful load', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isInitialized: true,
      isAuthenticated: true,
    });
    vi.spyOn(userApi, 'getMe').mockResolvedValue({
      success: true,
      message: 'Profile retrieved',
      data: {
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya Sharma',
          email: 'priya@spicegarden.com',
          role: 'OWNER',
          branchIds: ['b-1'],
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
      expect(screen.getByText('Welcome, Priya Sharma (OWNER)')).toBeInTheDocument();
      expect(screen.getByText('Spice Garden Indiranagar')).toBeInTheDocument();
      expect(screen.getByText('Spice Garden Enterprises')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });
  });

  it('handles logout button click and redirects to /login', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isInitialized: true,
      isAuthenticated: true,
    });
    vi.spyOn(userApi, 'getMe').mockResolvedValue({
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
        restaurant: null,
        branches: [],
      },
    });

    const logoutSpy = vi.spyOn(authApi, 'logout').mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
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
