import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BranchListView } from './BranchListView';
import * as userHooks from '@/modules/user/user.hooks';
import * as branchHooks from '../branch.hooks';
import type { Branch } from '../branch.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/branches',
}));

const mockBranch: Branch = {
  id: 'b1',
  tenantId: 't1',
  restaurantId: 'r1',
  name: 'Main Branch',
  code: 'MAIN-01',
  address: { line1: '123 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  phone: '+919876543210',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  isMain: true,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeMeData(role: string) {
  return {
    success: true as const,
    message: 'OK',
    data: {
      user: {
        id: 'u1',
        tenantId: 't1',
        name: 'Test User',
        email: 'test@test.com',
        role,
        branchIds: ['b1'],
        emailVerified: true,
        mustChangePassword: false,
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
      restaurant: null,
      branches: [mockBranch],
    },
  };
}

function makeBranchesResponse(branches: Branch[] = [mockBranch]) {
  return {
    success: true as const,
    message: 'OK',
    data: { branches },
  };
}

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchListView />
    </QueryClientProvider>,
  );
}

describe('BranchListView (src/modules/branch/components/BranchListView.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list: OWNER sees New Branch button and Edit action; MANAGER sees a read-only list', async () => {
    // OWNER
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: makeMeData('OWNER'),
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    vi.spyOn(branchHooks, 'useBranches').mockReturnValue({
      data: makeBranchesResponse(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof branchHooks.useBranches>);

    const { unmount } = renderComponent();

    expect(screen.getByRole('link', { name: /new branch/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit main branch/i })).toBeInTheDocument();
    expect(screen.getByText('Main Branch')).toBeInTheDocument();
    expect(screen.getByText('MAIN-01')).toBeInTheDocument();

    unmount();

    // MANAGER - read-only list
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: makeMeData('MANAGER'),
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    vi.spyOn(branchHooks, 'useBranches').mockReturnValue({
      data: makeBranchesResponse(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof branchHooks.useBranches>);

    renderComponent();

    expect(screen.queryByRole('link', { name: /new branch/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit main branch/i })).not.toBeInTheDocument();
    expect(screen.getByText('Main Branch')).toBeInTheDocument();
  });

  it('list: empty state shown when no branches', () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: makeMeData('OWNER'),
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    vi.spyOn(branchHooks, 'useBranches').mockReturnValue({
      data: makeBranchesResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof branchHooks.useBranches>);

    renderComponent();

    expect(screen.getByText(/no branches yet/i)).toBeInTheDocument();
  });

  it('list: error state shows retry button and retry works', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn().mockResolvedValue({});

    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: makeMeData('OWNER'),
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    vi.spyOn(branchHooks, 'useBranches').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' },
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof branchHooks.useBranches>);

    renderComponent();

    expect(screen.getByText(/failed to load branches/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await user.click(retryBtn);

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });
});
