import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RequireRole } from './RequireRole';
import * as userHooks from '@/modules/user/user.hooks';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('RequireRole (src/app/(dashboard)/_components/RequireRole.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RequireRole redirects a disallowed role and renders for an allowed one', async () => {
    // 1. Disallowed role (WAITER trying to access OWNER/ADMIN page)
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u-1',
            tenantId: 't-1',
            name: 'Waiter Person',
            email: 'waiter@test.com',
            role: 'WAITER',
            branchIds: ['b-1'],
            emailVerified: true,
            mustChangePassword: false,
          },
          tenant: { id: 't-1', name: 'Tenant', slug: 'tenant', status: 'ACTIVE' },
          restaurant: null,
          branches: [],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    const { unmount } = render(
      <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
        <div>Staff Management Content</div>
      </RequireRole>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    expect(screen.queryByText('Staff Management Content')).not.toBeInTheDocument();

    unmount();

    // 2. Allowed role (OWNER accessing OWNER/ADMIN page)
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u-2',
            tenantId: 't-1',
            name: 'Owner Person',
            email: 'owner@test.com',
            role: 'OWNER',
            branchIds: ['b-1'],
            emailVerified: true,
            mustChangePassword: false,
          },
          tenant: { id: 't-1', name: 'Tenant', slug: 'tenant', status: 'ACTIVE' },
          restaurant: null,
          branches: [],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    render(
      <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
        <div>Staff Management Content</div>
      </RequireRole>,
    );

    expect(screen.getByText('Staff Management Content')).toBeInTheDocument();
  });
});
