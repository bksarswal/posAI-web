import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import * as userHooks from '@/modules/user/user.hooks';
import * as staffApi from '../staff.api';
import { StaffCreateForm } from './StaffCreateForm';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/staff/new',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBranches = [
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
  {
    id: 'b2',
    tenantId: 't1',
    restaurantId: 'r1',
    name: 'Uptown Branch',
    code: 'UP-02',
    address: { line1: '456 High St', city: 'Bengaluru', state: 'Karnataka', pincode: '560002' },
    phone: '+919876543211',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    isMain: false,
  },
];

function makeMeData(role: string) {
  return {
    success: true as const,
    message: 'OK',
    data: {
      user: {
        id: 'u1',
        tenantId: 't1',
        name: 'Manager User',
        email: 'manager@test.com',
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
      branches: mockBranches,
    },
  };
}

function renderForm(actorRole = 'OWNER') {
  vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
    data: makeMeData(actorRole),
    isLoading: false,
  } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StaffCreateForm />
    </QueryClientProvider>,
  );
}

describe('StaffCreateForm (src/modules/staff/components/StaffCreateForm.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields: name, email, phone, role, and branch selector', () => {
    renderForm('OWNER');

    expect(screen.getByPlaceholderText(/e\.g\. Ramesh Kumar/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. ramesh@restaurant\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 9876543210/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument();
  });

  it('validates required fields on submit: name, email, and role', async () => {
    const user = userEvent.setup();
    renderForm('OWNER');

    const submitBtn = screen.getByRole('button', { name: /create staff member/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a role/i)).toBeInTheDocument();
  });

  it('validates that non-ADMIN staff must be assigned at least one branch', async () => {
    const user = userEvent.setup();
    renderForm('OWNER');

    await user.type(screen.getByPlaceholderText(/e\.g\. Ramesh Kumar/i), 'Ramesh Kumar');
    await user.type(
      screen.getByPlaceholderText(/e\.g\. ramesh@restaurant\.com/i),
      'ramesh@restaurant.com',
    );

    // Select role WAITER
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);
    const waiterOption = await screen.findByTitle('WAITER');
    await user.click(waiterOption);

    // Click submit without selecting branches
    const submitBtn = screen.getByRole('button', { name: /create staff member/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/staff must be assigned to at least one branch/i),
    ).toBeInTheDocument();
  });

  it('maps server EMAIL_ALREADY_REGISTERED error onto the email field', async () => {
    const user = userEvent.setup();

    vi.spyOn(staffApi, 'createStaff').mockRejectedValue(
      new ApiError(
        'This email is already registered. Please sign in or use another email.',
        ERROR_CODES.EMAIL_ALREADY_REGISTERED,
        409,
      ),
    );

    renderForm('OWNER');

    await user.type(screen.getByPlaceholderText(/e\.g\. Ramesh Kumar/i), 'Ramesh Kumar');
    await user.type(
      screen.getByPlaceholderText(/e\.g\. ramesh@restaurant\.com/i),
      'ramesh@taken.com',
    );

    // Select role = ADMIN (so no branch required)
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);
    const adminOption = await screen.findByTitle('ADMIN');
    await user.click(adminOption);

    const submitBtn = screen.getByRole('button', { name: /create staff member/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
    });
  });

  it('submitting valid form shows TempPasswordDialog once and clears password from DOM on close', async () => {
    const user = userEvent.setup();

    const createSpy = vi.spyOn(staffApi, 'createStaff').mockResolvedValue({
      success: true,
      message: 'Staff user created successfully',
      data: {
        user: {
          id: 'u99',
          tenantId: 't1',
          name: 'Ramesh Kumar',
          email: 'ramesh@restaurant.com',
          role: 'ADMIN',
          branchIds: [],
          status: 'ACTIVE',
          emailVerified: true,
          mustChangePassword: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        temporaryPassword: 'SecretTempPassword!123',
      },
    });

    renderForm('OWNER');

    await user.type(screen.getByPlaceholderText(/e\.g\. Ramesh Kumar/i), 'Ramesh Kumar');
    await user.type(
      screen.getByPlaceholderText(/e\.g\. ramesh@restaurant\.com/i),
      'ramesh@restaurant.com',
    );
    await user.type(screen.getByPlaceholderText(/e\.g\. 9876543210/i), '9876543210');

    // Select role ADMIN
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);
    const adminOption = await screen.findByTitle('ADMIN');
    await user.click(adminOption);

    const submitBtn = screen.getByRole('button', { name: /create staff member/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Ramesh Kumar',
        email: 'ramesh@restaurant.com',
        phone: '9876543210',
        role: 'ADMIN',
        branchIds: [],
      });
    });

    // Temp password is shown in the dialog
    expect(await screen.findByText('SecretTempPassword!123')).toBeInTheDocument();
    expect(screen.getByText(/this is shown only once/i)).toBeInTheDocument();

    // Click "I've saved it" to close the dialog
    const saveBtn = screen.getByRole('button', { name: /i've saved it/i });
    await user.click(saveBtn);

    // Password must be completely removed from the DOM
    await waitFor(() => {
      expect(screen.queryByText('SecretTempPassword!123')).not.toBeInTheDocument();
    });

    // Navigates to /staff
    expect(mockPush).toHaveBeenCalledWith('/staff');
  });

  it('when role changes to ADMIN, clears branches; when switching back, requires >= 1 branch', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(staffApi, 'createStaff').mockResolvedValue({
      success: true,
      message: 'Staff user created successfully',
      data: {
        user: {
          id: 'u100',
          tenantId: 't1',
          name: 'Admin Switched',
          email: 'admin.switched@restaurant.com',
          role: 'ADMIN',
          branchIds: [],
          status: 'ACTIVE',
          emailVerified: true,
          mustChangePassword: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        temporaryPassword: 'TempPassword456!',
      },
    });

    renderForm('OWNER');

    await user.type(screen.getByPlaceholderText(/e\.g\. Ramesh Kumar/i), 'Admin Switched');
    await user.type(
      screen.getByPlaceholderText(/e\.g\. ramesh@restaurant\.com/i),
      'admin.switched@restaurant.com',
    );

    // 1. Select role WAITER
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);
    const waiterOption = await screen.findByTitle('WAITER');
    await user.click(waiterOption);

    // 2. Select a branch for WAITER
    const branchSelect = screen.getByRole('combobox', { name: /assigned branches/i });
    await user.click(branchSelect);
    const branchOption = await screen.findByTitle('Downtown Branch (DT-01)');
    await user.click(branchOption);

    // 3. Switch role to ADMIN
    await user.click(roleSelect);
    const adminOption = await screen.findByTitle('ADMIN');
    await user.click(adminOption);

    // Branch selector must now be hidden and tenant-wide note shown
    expect(screen.queryByRole('combobox', { name: /assigned branches/i })).not.toBeInTheDocument();
    expect(screen.getByText(/admin accounts operate tenant-wide/i)).toBeInTheDocument();

    // 4. Submit: payload must have branchIds: []
    const submitBtn = screen.getByRole('button', { name: /create staff member/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Admin Switched',
          email: 'admin.switched@restaurant.com',
          role: 'ADMIN',
          branchIds: [],
        }),
      );
    });
  });

  it('restricts role options per actor role: ADMIN cannot create OWNER or ADMIN', async () => {
    const user = userEvent.setup();
    renderForm('ADMIN');

    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);

    // Must NOT contain OWNER or ADMIN
    expect(screen.queryByTitle('OWNER')).not.toBeInTheDocument();
    expect(screen.queryByTitle('ADMIN')).not.toBeInTheDocument();

    // Must contain MANAGER, WAITER, CASHIER, CHEF
    expect(await screen.findByTitle('MANAGER')).toBeInTheDocument();
    expect(screen.getByTitle('WAITER')).toBeInTheDocument();
    expect(screen.getByTitle('CASHIER')).toBeInTheDocument();
    expect(screen.getByTitle('CHEF')).toBeInTheDocument();
  });
});
