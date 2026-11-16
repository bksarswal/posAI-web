import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';
import { StaffEditModal } from './StaffEditModal';
import * as staffHooks from '../staff.hooks';
import * as userHooks from '@/modules/user/user.hooks';
import type { StaffItem } from '../staff.types';

const mockMeData = {
  success: true as const,
  message: 'OK',
  data: {
    user: {
      id: 'actor-1',
      tenantId: 't1',
      name: 'Owner User',
      email: 'owner@test.com',
      role: 'OWNER',
      branchIds: ['b1'],
      emailVerified: true,
      mustChangePassword: false,
    },
    tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
    restaurant: null,
    branches: [
      {
        id: 'b1',
        tenantId: 't1',
        restaurantId: 'r1',
        name: 'Downtown',
        code: 'DT-01',
        address: { line1: '1 Main', city: 'City', state: 'State', pincode: '000001' },
        phone: '+919000000000',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isMain: true,
      },
      {
        id: 'b2',
        tenantId: 't1',
        restaurantId: 'r1',
        name: 'Uptown',
        code: 'UP-01',
        address: { line1: '2 High', city: 'City', state: 'State', pincode: '000002' },
        phone: '+919000000001',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isMain: false,
      },
    ],
  },
};

const targetStaff: StaffItem = {
  id: 'target-1',
  tenantId: 't1',
  name: 'Jane Waiter',
  email: 'jane@example.com',
  role: 'WAITER',
  branchIds: ['b1'],
  status: 'ACTIVE',
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderModal(onClose = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <StaffEditModal open={true} staff={targetStaff} onClose={onClose} />
    </QueryClientProvider>,
  );
}

describe('StaffEditModal (src/modules/staff/components/StaffEditModal.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: mockMeData,
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);
  });

  it('pre-populates form fields with current staff values', async () => {
    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderModal();

    // name field should be populated
    const nameInput = screen.getByDisplayValue('Jane Waiter');
    expect(nameInput).toBeInTheDocument();
  });

  it('calls mutateAsync with only changed fields (name changed, nothing else)', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderModal(onClose);

    // Clear and retype name
    const nameInput = screen.getByDisplayValue('Jane Waiter');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Manager');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Manager' })),
    );
    // Should not contain email or tenantId
    const callArg = mutateAsync.mock.calls[0][0] as Record<string, unknown>;
    expect('email' in callArg).toBe(false);
    expect('tenantId' in callArg).toBe(false);
  });

  it('closes without mutating when nothing has changed', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderModal(onClose);

    // Submit without changing anything
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('when role changes to ADMIN, branchIds sent as [] in payload', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderModal();

    // Change role to ADMIN via the select combobox
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);

    const adminOption = await screen.findByTitle('ADMIN');
    await user.click(adminOption);

    // Verify branch selector is now hidden
    expect(screen.queryByRole('combobox', { name: /assigned branches/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN', branchIds: [] }),
      ),
    );
  });

  it('changing role from ADMIN to WAITER requires at least one branch', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    const adminStaff: StaffItem = {
      ...targetStaff,
      id: 'target-admin',
      name: 'Admin Person',
      role: 'ADMIN',
      branchIds: [],
    };

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <StaffEditModal open={true} staff={adminStaff} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    // Initial state: ADMIN has no branch selector
    expect(screen.queryByRole('combobox', { name: /assigned branches/i })).not.toBeInTheDocument();

    // Switch role to WAITER
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleSelect);
    const waiterOption = await screen.findByTitle('WAITER');
    await user.click(waiterOption);

    // Branch selector is now visible
    expect(await screen.findByRole('combobox', { name: /assigned branches/i })).toBeInTheDocument();

    // Try to save without selecting a branch -> validation fails
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(
      await screen.findByText(/staff must be assigned to at least one branch/i),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    // Now select a branch
    const branchSelect = screen.getByRole('combobox', { name: /assigned branches/i });
    await user.click(branchSelect);
    const branchOption = await screen.findByTitle('Downtown (DT-01)');
    await user.click(branchOption);

    // Save again -> succeeds and sends role: WAITER with selected branchIds
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'WAITER',
          branchIds: ['b1'],
        }),
      );
    });
  });

  it('shows server error on mutation failure', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError('Only OWNER can modify ADMIN', 'FORBIDDEN', 403));

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderModal();

    // Change something to trigger submit
    const nameInput = screen.getByDisplayValue('Jane Waiter');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Changed');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(
        screen.getByText('You do not have permission to perform this action.'),
      ).toBeInTheDocument(),
    );
  });

  it('Cancel button calls onClose without mutating', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderModal(onClose);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('open modal for staff A, cause a server error, close it, open for staff B -> no stale error shown', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError('Permission denied', 'FORBIDDEN', 403));

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    const staffA: StaffItem = {
      ...targetStaff,
      id: 'staff-a',
      name: 'Staff Alpha',
    };

    const staffB: StaffItem = {
      ...targetStaff,
      id: 'staff-b',
      name: 'Staff Beta',
    };

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const onClose = vi.fn();

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <StaffEditModal open={true} staff={staffA} onClose={onClose} />
      </QueryClientProvider>,
    );

    // Cause a server error for Staff A
    const nameInput = screen.getByDisplayValue('Staff Alpha');
    await user.clear(nameInput);
    await user.type(nameInput, 'Staff Alpha Changed');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(
      await screen.findByText('You do not have permission to perform this action.'),
    ).toBeInTheDocument();

    // Close the modal
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();

    // Re-render closed, then open for Staff B
    rerender(
      <QueryClientProvider client={qc}>
        <StaffEditModal open={false} staff={null} onClose={onClose} />
      </QueryClientProvider>,
    );

    rerender(
      <QueryClientProvider client={qc}>
        <StaffEditModal open={true} staff={staffB} onClose={onClose} />
      </QueryClientProvider>,
    );

    // Assert no stale error is shown and Staff Beta form is displayed
    expect(
      screen.queryByText('You do not have permission to perform this action.'),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Staff Beta')).toBeInTheDocument();
  });
});
