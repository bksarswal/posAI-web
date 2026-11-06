import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResetPasswordForm } from './ResetPasswordForm';
import * as authApi from '../auth.api';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { toast } from 'sonner';

let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('ResetPasswordForm (src/modules/auth/components/ResetPasswordForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ResetPasswordForm />
      </QueryClientProvider>,
    );

  it('renders missing token state with link to /forgot-password when ?token= is absent', () => {
    mockSearchParams = new URLSearchParams(); // No token param
    renderComponent();

    expect(screen.getByText('Missing reset token')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No password reset token was provided. Please check your reset link or request a new one.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request new reset link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('renders password and confirm password inputs when valid token is present', () => {
    mockSearchParams = new URLSearchParams('token=valid-reset-token-123');
    renderComponent();

    // CardTitle heading + submit button both say "Reset password"; use getAllByText and check at least one
    expect(screen.getAllByText('Reset password').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('rejects submission and displays error when confirm password does not match', async () => {
    mockSearchParams = new URLSearchParams('token=valid-reset-token-123');
    const resetSpy = vi.spyOn(authApi, 'resetPassword');
    const user = userEvent.setup();

    renderComponent();

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'DifferentPassword123!');

    const submitBtn = screen.getByRole('button', { name: /reset password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  it('resets password successfully, displays "Password updated" screen with login link, and does not auto-login', async () => {
    mockSearchParams = new URLSearchParams('token=valid-reset-token-123');
    const resetSpy = vi.spyOn(authApi, 'resetPassword').mockResolvedValue({
      success: true,
      message: 'Password reset successfully',
    });
    const user = userEvent.setup();

    renderComponent();

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.type(confirmInput, 'ValidPassword123!');

    const submitBtn = screen.getByRole('button', { name: /reset password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith({
        token: 'valid-reset-token-123',
        newPassword: 'ValidPassword123!',
      });
      // Shows success confirmation
      expect(screen.getByText('Password updated')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your password has been reset successfully. You can now log in with your new password.',
        ),
      ).toBeInTheDocument();
      // Link to sign in — no auto login
      expect(screen.getByRole('link', { name: /continue to sign in/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });
  });

  it('displays INVALID_OR_EXPIRED_TOKEN error state with link to request a new link', async () => {
    mockSearchParams = new URLSearchParams('token=expired-token-123');
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(
      new ApiError(
        'The verification or reset link is invalid or has expired',
        ERROR_CODES.INVALID_OR_EXPIRED_TOKEN,
        400,
      ),
    );
    const user = userEvent.setup();

    renderComponent();

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.type(confirmInput, 'ValidPassword123!');

    const submitBtn = screen.getByRole('button', { name: /reset password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired link')).toBeInTheDocument();
      expect(screen.getByText(/The reset link is invalid or has expired\./i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute(
        'href',
        '/forgot-password',
      );
    });
  });

  it('triggers toast error on RATE_LIMITED response', async () => {
    mockSearchParams = new URLSearchParams('token=some-token');
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(
      new ApiError('Too many attempts', ERROR_CODES.RATE_LIMITED, 429),
    );
    const user = userEvent.setup();

    renderComponent();

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.type(confirmInput, 'ValidPassword123!');

    const submitBtn = screen.getByRole('button', { name: /reset password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Too many attempts. Please wait a few moments before trying again.',
      );
    });
  });
});
