import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';
import { StaffDeactivateDialog } from './StaffDeactivateDialog';
import * as staffHooks from '../staff.hooks';
import type { StaffItem } from '../staff.types';

const activeStaff: StaffItem = {
  id: 's1',
  tenantId: 't1',
  name: 'John Waiter',
  email: 'john@example.com',
  role: 'WAITER',
  branchIds: ['b1'],
  status: 'ACTIVE',
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const inactiveStaff: StaffItem = { ...activeStaff, status: 'INACTIVE' };

function renderDialog(props: { staff: StaffItem | null; onClose?: () => void }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <StaffDeactivateDialog open={true} staff={props.staff} onClose={props.onClose ?? vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('StaffDeactivateDialog (src/modules/staff/components/StaffDeactivateDialog.tsx)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows Deactivate action for an ACTIVE staff member', () => {
    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderDialog({ staff: activeStaff });
    expect(screen.getByRole('button', { name: /^deactivate$/i })).toBeInTheDocument();
    expect(screen.getByText(/deactivate/i, { selector: 'h2,div,span' })).toBeInTheDocument();
  });

  it('shows Activate action for an INACTIVE staff member', () => {
    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderDialog({ staff: inactiveStaff });
    expect(screen.getByRole('button', { name: /^activate$/i })).toBeInTheDocument();
  });

  it('calls mutateAsync with status INACTIVE and closes on confirm', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderDialog({ staff: activeStaff, onClose });

    await user.click(screen.getByRole('button', { name: /^deactivate$/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ status: 'INACTIVE' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows server error message on mutation rejection', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError('Cannot deactivate yourself', 'CANNOT_DEACTIVATE_SELF', 409));

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderDialog({ staff: activeStaff });

    await user.click(screen.getByRole('button', { name: /^deactivate$/i }));

    await waitFor(() =>
      expect(screen.getByText('You cannot deactivate your own account.')).toBeInTheDocument(),
    );
  });

  it('Cancel button calls onClose without mutating', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(staffHooks, 'useUpdateStaff').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useUpdateStaff>);

    renderDialog({ staff: activeStaff, onClose });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
