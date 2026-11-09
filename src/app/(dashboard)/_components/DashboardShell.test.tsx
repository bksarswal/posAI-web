import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardShell } from './DashboardShell';
import * as userHooks from '@/modules/user/user.hooks';
import * as authApi from '@/modules/auth/auth.api';
import * as tokenStorage from '@/shared/lib/tokenStorage';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

describe('DashboardShell (src/app/(dashboard)/_components/DashboardShell.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
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
            name: 'Spice Enterprises',
            slug: 'spice-enterprises',
            status: 'ACTIVE',
          },
          restaurant: {
            id: 'rest-1',
            tenantId: 't-1',
            name: 'Spice Garden Indiranagar',
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
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);
  });

  const renderShell = (children = <div>Dashboard Body</div>) =>
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardShell>{children}</DashboardShell>
      </QueryClientProvider>,
    );

  it('shell: shows restaurant name and user name/role', () => {
    renderShell();

    // Restaurant name in top bar
    expect(screen.getByText('Spice Garden Indiranagar')).toBeInTheDocument();
    // User name and role in top bar
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getAllByText('OWNER').length).toBeGreaterThan(0);
    // Navigation items
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('Logout clears token and cache and goes to /login', async () => {
    const user = userEvent.setup();
    const logoutSpy = vi.spyOn(authApi, 'logout').mockResolvedValue(undefined);
    const clearSpy = vi.spyOn(queryClient, 'clear');

    tokenStorage.setAccessToken('sample-token');

    renderShell();

    // Open user menu dropdown
    const userMenuButton = screen.getByLabelText(/user menu/i);
    await user.click(userMenuButton);

    // Click logout
    const logoutBtn = screen.getByRole('menuitem', { name: /log out/i });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(tokenStorage.getAccessToken()).toBeNull();
      expect(clearSpy).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('mobile menu opens and closes', async () => {
    const user = userEvent.setup();

    renderShell();

    // Initially mobile dialog is not present
    expect(
      screen.queryByRole('dialog', { name: /mobile navigation menu/i }),
    ).not.toBeInTheDocument();

    // Click hamburger button
    const hamburgerBtn = screen.getByLabelText(/open sidebar menu/i);
    await user.click(hamburgerBtn);

    // Drawer is now open
    expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByLabelText(/close sidebar menu/i);
    await user.click(closeBtn);

    expect(
      screen.queryByRole('dialog', { name: /mobile navigation menu/i }),
    ).not.toBeInTheDocument();

    // Re-open and close via Escape key
    await user.click(hamburgerBtn);
    expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: /mobile navigation menu/i }),
    ).not.toBeInTheDocument();
  });
});
