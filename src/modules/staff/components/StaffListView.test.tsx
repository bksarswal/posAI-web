import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';
import { StaffListView } from './StaffListView';
import * as userHooks from '@/modules/user/user.hooks';
import * as staffHooks from '../staff.hooks';
import type { StaffItem } from '../staff.types';

const mockMeData = {
  success: true as const,
  message: 'OK',
  data: {
    user: {
      id: 'u1',
      tenantId: 't1',
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'ADMIN',
      branchIds: ['b1'],
      emailVerified: true,
      mustChangePassword: false,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
    restaurant: null,
    branches: [
      {
        id: 'b1',
        tenantId: 't1',
        restaurantId: 'r1',
        name: 'Downtown Branch',
        code: 'DT-01',
        address: { line1: '123 Main', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        phone: '+919876543210',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isMain: true,
      },
    ],
  },
};

const mockStaffMember: StaffItem = {
  id: 's1',
  tenantId: 't1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+919876543210',
  role: 'WAITER',
  branchIds: ['b1'],
  status: 'ACTIVE',
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StaffListView />
    </QueryClientProvider>,
  );
}

describe('StaffListView (src/modules/staff/components/StaffListView.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: mockMeData,
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);
  });

  it('loading state is displayed while fetching staff', () => {
    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useStaff>);

    renderComponent();

    expect(screen.getAllByText(/loading staff/i).length).toBeGreaterThan(0);
  });

  it('empty state shows "No staff yet" when no staff members exist', () => {
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

    renderComponent();

    expect(screen.getByText('No staff yet')).toBeInTheDocument();
  });

  it('error state displays error message and retry button triggers refetch', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn().mockResolvedValue({});

    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError('Failed to load', 'INTERNAL_ERROR', 500),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof staffHooks.useStaff>);

    renderComponent();

    expect(screen.getByText('Failed to load staff')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await user.click(retryBtn);

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });

  it('renders success rows with staff details (name, email, role, status, mustChangePassword)', () => {
    const staffWithPasswordRequired: StaffItem = {
      ...mockStaffMember,
      id: 's2',
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'CASHIER',
      status: 'INACTIVE',
      mustChangePassword: true,
      branchIds: [],
    };

    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          items: [mockStaffMember, staffWithPasswordRequired],
          page: 1,
          limit: 20,
          total: 2,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useStaff>);

    renderComponent();

    // Check staff 1
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('WAITER')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();

    // Check staff 2
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('CASHIER')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('resolves branch IDs to branch names using me branches data', () => {
    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          items: [mockStaffMember],
          page: 1,
          limit: 20,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useStaff>);

    renderComponent();

    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
  });

  it('handles unknown branch ID gracefully without crashing', () => {
    const staffWithUnknownBranch: StaffItem = {
      ...mockStaffMember,
      id: 's3',
      name: 'Bob Unknown',
      email: 'bob@example.com',
      branchIds: ['unknown-branch-999'],
    };

    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          items: [staffWithUnknownBranch],
          page: 1,
          limit: 100,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useStaff>);

    renderComponent();

    expect(screen.getByText('Bob Unknown')).toBeInTheDocument();
    expect(screen.queryByText('unknown-branch-999')).not.toBeInTheDocument();
  });

  it('total > items.length shows "Showing X of Y" and does not silently hide data', () => {
    // Simulate the API returning limit=100 items but total=150 (edge case tenant)
    const visibleStaff: StaffItem[] = Array.from({ length: 100 }, (_, i) => ({
      ...mockStaffMember,
      id: `s${i + 1}`,
      name: `Staff Member ${i + 1}`,
      email: `staff${i + 1}@example.com`,
    }));

    vi.spyOn(staffHooks, 'useStaff').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          items: visibleStaff,
          page: 1,
          limit: 100,
          total: 150,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useStaff>);

    renderComponent();

    // Should show explicit "Showing X of Y" so the user knows data is truncated
    expect(screen.getByText(/showing 100 of 150/i)).toBeInTheDocument();
    // Should also show the truncation warning note
    expect(screen.getByText(/150 staff members but only the first 100/i)).toBeInTheDocument();
  });
});
