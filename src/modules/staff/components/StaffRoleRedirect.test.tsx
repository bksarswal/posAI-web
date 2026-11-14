import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StaffPage from '@/app/(dashboard)/staff/page';
import * as userHooks from '@/modules/user/user.hooks';
import * as staffHooks from '../staff.hooks';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/staff',
}));

function makeMeData(role: string) {
  return {
    success: true as const,
    message: 'OK',
    data: {
      user: {
        id: 'u1',
        tenantId: 't1',
        name: 'User',
        email: 'u@test.com',
        role,
        branchIds: [],
        emailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
      restaurant: null,
      branches: [],
    },
  };
}

function renderWithRole(role: string) {
  vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
    data: makeMeData(role),
    isLoading: false,
  } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StaffPage />
    </QueryClientProvider>,
  );
}

describe('/staff redirects non-OWNER/ADMIN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          items: [],
          page: 1,
          limit: 20,
          total: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useStaff>);
  });

  it('WAITER and other non-OWNER/ADMIN roles cannot access /staff and are redirected to /dashboard', async () => {
    const nonAllowedRoles = ['WAITER', 'MANAGER', 'CASHIER', 'CHEF'] as const;

    for (const role of nonAllowedRoles) {
      const { unmount } = renderWithRole(role);
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
      expect(screen.queryByRole('heading', { name: 'Staff' })).not.toBeInTheDocument();
      unmount();
      mockPush.mockClear();
    }
  });

  it('OWNER and ADMIN can access /staff without redirection', () => {
    for (const role of ['OWNER', 'ADMIN'] as const) {
      const { unmount } = renderWithRole(role);
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Staff' })).toBeInTheDocument();
      unmount();
    }
  });
});
