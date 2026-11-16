import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';
import { StaffResetPasswordDialog } from './StaffResetPasswordDialog';
import * as staffHooks from '../staff.hooks';
import type { StaffItem } from '../staff.types';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const staffMember: StaffItem = {
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

function renderDialog(onClose = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <StaffResetPasswordDialog open={true} staff={staffMember} onClose={onClose} />
    </QueryClientProvider>,
  );
}

describe('StaffResetPasswordDialog (src/modules/staff/components/StaffResetPasswordDialog.tsx)', () => {
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore clipboard after each test
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('renders confirm dialog with staff name and Reset Password button', () => {
    vi.spyOn(staffHooks, 'useResetStaffPassword').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useResetStaffPassword>);

    renderDialog();
    expect(screen.getByText(/john waiter/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows temp password dialog on success, password visible in DOM', async () => {
    const user = userEvent.setup();
    const mockReset = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue({
      success: true,
      message: 'OK',
      data: { temporaryPassword: 'TempPwd999!' },
    });

    // Set up clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    vi.spyOn(staffHooks, 'useResetStaffPassword').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: mockReset,
    } as unknown as ReturnType<typeof staffHooks.useResetStaffPassword>);

    renderDialog();

    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // After success, TempPasswordDialog should appear
    await waitFor(() => expect(screen.getByText('TempPwd999!')).toBeInTheDocument());
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('after TempPasswordDialog is closed, password is gone from DOM', async () => {
    const user = userEvent.setup();
    const mockReset = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue({
      success: true,
      message: 'OK',
      data: { temporaryPassword: 'TempPwd999!' },
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    vi.spyOn(staffHooks, 'useResetStaffPassword').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: mockReset,
    } as unknown as ReturnType<typeof staffHooks.useResetStaffPassword>);

    const onClose = vi.fn();
    renderDialog(onClose);

    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(screen.getByText('TempPwd999!')).toBeInTheDocument());

    // Click the "I've saved it" button in TempPasswordDialog
    const savedBtn = screen.getByRole('button', { name: /i've saved it/i });
    await user.click(savedBtn);

    // Password should be gone and onClose called
    await waitFor(() => expect(screen.queryByText('TempPwd999!')).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows server error on mutation failure', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429));

    vi.spyOn(staffHooks, 'useResetStaffPassword').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useResetStaffPassword>);

    renderDialog();

    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument());
  });

  it('Cancel button closes without mutating', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(staffHooks, 'useResetStaffPassword').mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof staffHooks.useResetStaffPassword>);

    renderDialog(onClose);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
