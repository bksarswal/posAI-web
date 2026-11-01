import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResendVerificationForm } from './ResendVerificationForm';
import * as authApi from '../auth.api';

let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

describe('ResendVerificationForm (src/modules/auth/components/ResendVerificationForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
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
        <ResendVerificationForm />
      </QueryClientProvider>,
    );

  it('pre-fills email when ?email= is passed in search params', () => {
    mockSearchParams = new URLSearchParams('email=user@restaurant.com');
    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com') as HTMLInputElement;
    expect(emailInput.value).toBe('user@restaurant.com');
  });

  it('submits email, displays success alert, and enters 60-second cooldown', async () => {
    const user = userEvent.setup();
    const resendSpy = vi.spyOn(authApi, 'resendVerification').mockResolvedValue({
      success: true,
      message: 'Verification link sent',
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    await user.type(emailInput, 'priya@restaurant.com');

    const submitBtn = screen.getByRole('button', { name: /resend verification link/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(resendSpy).toHaveBeenCalledWith('priya@restaurant.com');
      expect(screen.getByText('Link sent')).toBeInTheDocument();
      expect(
        screen.getByText(/If an account exists for priya@restaurant.com/i),
      ).toBeInTheDocument();
      // Button enters cooldown and is disabled
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText(/Resend available in \d+s/i)).toBeInTheDocument();
    });
  });

  it('counts down the timer during cooldown and re-enables submit button', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(authApi, 'resendVerification').mockResolvedValue({
      success: true,
      message: 'Verification link sent',
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
      .type(emailInput, 'priya@restaurant.com');

    const submitBtn = screen.getByRole('button', { name: /resend verification link/i });
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) }).click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Resend available in 60s/i)).toBeInTheDocument();
    });

    // Advance 30 seconds
    vi.advanceTimersByTime(30000);
    await waitFor(() => {
      expect(screen.getByText(/Resend available in 30s/i)).toBeInTheDocument();
    });

    // Advance remaining 30 seconds
    vi.advanceTimersByTime(30000);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend verification link/i })).not.toBeDisabled();
    });
  });
});
