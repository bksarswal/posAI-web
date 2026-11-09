import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewBranchPage from '@/app/(dashboard)/branches/new/page';
import EditBranchPage from '@/app/(dashboard)/branches/[id]/edit/page';
import * as userHooks from '@/modules/user/user.hooks';
import * as branchHooks from '../branch.hooks';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/branches/new',
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

function renderWithRole(role: string, ui: React.ReactElement) {
  vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
    data: makeMeData(role),
    isLoading: false,
  } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('/branches/new and /branches/[id]/edit redirect non-OWNER/ADMIN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('/branches/new and /branches/[id]/edit redirect non-OWNER/ADMIN', async () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    const nonAllowedRoles = ['MANAGER', 'WAITER', 'CASHIER', 'CHEF'] as const;

    // 1. /branches/new real page component
    for (const role of nonAllowedRoles) {
      const { unmount } = renderWithRole(role, <NewBranchPage />);
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
      expect(screen.queryByRole('button', { name: /create branch/i })).not.toBeInTheDocument();
      unmount();
      mockPush.mockClear();
    }

    // 2. /branches/[id]/edit real page component
    for (const role of nonAllowedRoles) {
      const page = await EditBranchPage({ params: Promise.resolve({ id: 'b1' }) });
      const { unmount } = renderWithRole(role, page);
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
      unmount();
      mockPush.mockClear();
    }
  });

  it('renders real pages for OWNER and ADMIN', async () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          branch: {
            id: 'b1',
            tenantId: 't1',
            restaurantId: 'r1',
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
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    for (const role of ['OWNER', 'ADMIN'] as const) {
      // New page
      const { unmount: unmountNew } = renderWithRole(role, <NewBranchPage />);
      expect(screen.getByRole('button', { name: /create branch/i })).toBeInTheDocument();
      unmountNew();

      // Edit page
      const page = await EditBranchPage({ params: Promise.resolve({ id: 'b1' }) });
      const { unmount: unmountEdit } = renderWithRole(role, page);
      expect(screen.getByText('Edit Branch')).toBeInTheDocument();
      unmountEdit();
    }
  });
});
