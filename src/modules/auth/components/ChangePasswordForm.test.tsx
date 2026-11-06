import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChangePasswordForm } from './ChangePasswordForm';
import * as authApi from '../auth.api';
import * as tokenStorage from '@/shared/lib/tokenStorage';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { toast } from 'sonner';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/change-password',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ChangePasswordForm (src/modules/auth/components/ChangePasswordForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('initial-access-token');
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ChangePasswordForm />
      </QueryClientProvider>,
    );

  it('renders current password, new password, and confirm password fields', () => {
    renderComponent();

    expect(screen.getByText('Change password')).toBeInTheDocument();
    expect(screen.getByText('Current Password')).toBeInTheDocument();
    expect(screen.getByText('New Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('rejects submission and displays error when confirm password does not match (mismatch)', async () => {
    const changeSpy = vi.spyOn(authApi, 'changePassword');
    const user = userEvent.setup();

    renderComponent();

    const [currentInput, newInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(currentInput, 'CurrentPass123!');
    await user.type(newInput, 'NewSecretPass123!');
    await user.type(confirmInput, 'DifferentPass123!');

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  it('rejects submission and displays error when new password is the same as current password (same-as-current)', async () => {
    const changeSpy = vi.spyOn(authApi, 'changePassword');
    const user = userEvent.setup();

    renderComponent();

    const [currentInput, newInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(currentInput, 'SamePassword123!');
    await user.type(newInput, 'SamePassword123!');
    await user.type(confirmInput, 'SamePassword123!');

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('New password must be different from current password'),
      ).toBeInTheDocument();
      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  it('INVALID_CURRENT_PASSWORD shows a field error and does NOT log out', async () => {
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(
      new ApiError(
        'The current password you entered is incorrect.',
        ERROR_CODES.INVALID_CURRENT_PASSWORD,
        400,
      ),
    );
    const user = userEvent.setup();

    renderComponent();

    const [currentInput, newInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(currentInput, 'WrongCurrentPass123!');
    await user.type(newInput, 'ValidNewPassword123!');
    await user.type(confirmInput, 'ValidNewPassword123!');

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('The current password you entered is incorrect.'),
      ).toBeInTheDocument();
    });

    // Must NOT log out the user
    expect(tokenStorage.getAccessToken()).toBe('initial-access-token');
    expect(mockPush).not.toHaveBeenCalledWith('/login');
  });

  it('success clears token+cache and goes to /login', async () => {
    const changeSpy = vi.spyOn(authApi, 'changePassword').mockResolvedValue({
      success: true,
      message: 'Password changed successfully',
    });
    const clearSpy = vi.spyOn(queryClient, 'clear');
    const user = userEvent.setup();

    renderComponent();

    const [currentInput, newInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(currentInput, 'OldValidPass123!');
    await user.type(newInput, 'NewValidPass123!');
    await user.type(confirmInput, 'NewValidPass123!');

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(changeSpy).toHaveBeenCalledWith({
        currentPassword: 'OldValidPass123!',
        newPassword: 'NewValidPass123!',
      });
      // Clears access token
      expect(tokenStorage.getAccessToken()).toBeNull();
      // Clears query cache
      expect(clearSpy).toHaveBeenCalled();
      // Shows success toast
      expect(toast.success).toHaveBeenCalledWith('Password changed, please log in again');
      // Navigates to /login
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
