import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import * as authApi from '../auth.api';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('ForgotPasswordForm (src/modules/auth/components/ForgotPasswordForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ForgotPasswordForm />
      </QueryClientProvider>,
    );

  it('renders email input, submit button, and back to sign in link', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('you@restaurant.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('shows the generic success message and enters cooldown on successful submission', async () => {
    const user = userEvent.setup();
    const forgotSpy = vi.spyOn(authApi, 'forgotPassword').mockResolvedValue({
      success: true,
      message: 'Reset email sent',
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    await user.type(emailInput, 'priya@restaurant.com');

    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(forgotSpy).toHaveBeenCalledWith('priya@restaurant.com');
      expect(screen.getByText('Link sent')).toBeInTheDocument();
      expect(screen.getByText('If an account exists, a reset link was sent.')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText(/Resend available in \d+s/i)).toBeInTheDocument();
    });
  });

  it('shows the exact same generic success message when backend returns an error that is not RATE_LIMITED', async () => {
    const user = userEvent.setup();
    // Simulate non-existent account or backend error (backend returns 404 or 400 internally)
    vi.spyOn(authApi, 'forgotPassword').mockRejectedValue(
      new ApiError('User not found', ERROR_CODES.NOT_FOUND, 404),
    );

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    await user.type(emailInput, 'nonexistent@restaurant.com');

    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitBtn);

    await waitFor(() => {
      // Must NOT leak user existence; shows same success message and starts cooldown
      expect(screen.getByText('Link sent')).toBeInTheDocument();
      expect(screen.getByText('If an account exists, a reset link was sent.')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText(/Resend available in \d+s/i)).toBeInTheDocument();
    });
  });

  it('triggers toast error and does not show success message when backend returns RATE_LIMITED', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'forgotPassword').mockRejectedValue(
      new ApiError('Too many attempts', ERROR_CODES.RATE_LIMITED, 429),
    );

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    await user.type(emailInput, 'ratelimited@restaurant.com');

    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Too many requests. Please wait a few moments before trying again.',
      );
      // Success message must NOT be displayed
      expect(screen.queryByText('Link sent')).not.toBeInTheDocument();
    });
  });

  it('cooldown timer counts down each second and re-enables submit button', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(authApi, 'forgotPassword').mockResolvedValue({
      success: true,
      message: 'Reset email sent',
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
      .type(emailInput, 'priya@restaurant.com');

    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) }).click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Resend available in 60s/i)).toBeInTheDocument();
    });

    // Advance 30s
    vi.advanceTimersByTime(30000);
    await waitFor(() => {
      expect(screen.getByText(/Resend available in 30s/i)).toBeInTheDocument();
    });

    // Advance remaining 30s
    vi.advanceTimersByTime(30000);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send reset link/i })).not.toBeDisabled();
    });
  });
});
