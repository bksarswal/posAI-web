import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VerifyEmailCard } from './VerifyEmailCard';
import * as authApi from '../auth.api';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';

let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

describe('VerifyEmailCard (src/modules/auth/components/VerifyEmailCard.tsx)', () => {
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
        <VerifyEmailCard />
      </QueryClientProvider>,
    );

  it('shows missing token error state when ?token= is absent', () => {
    mockSearchParams = new URLSearchParams(); // no token
    renderComponent();

    expect(screen.getByText('Missing verification token')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request new verification link/i })).toHaveAttribute(
      'href',
      '/resend-verification',
    );
  });

  it('shows loading state and triggers verifyEmail API call on mount', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    let resolveVerification: (val: { success: true; message: string }) => void;
    const verifyPromise = new Promise<{ success: true; message: string }>((resolve) => {
      resolveVerification = resolve;
    });
    const verifySpy = vi.spyOn(authApi, 'verifyEmail').mockReturnValue(verifyPromise);

    renderComponent();

    expect(screen.getByText('Verifying your email')).toBeInTheDocument();
    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith('valid-token-123');
    });

    // Settle promise
    resolveVerification!({ success: true, message: 'Verified' });
    await waitFor(() => {
      expect(screen.getByText('Email verified!')).toBeInTheDocument();
    });
  });

  it('displays success state and continue to login button on successful verification', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    vi.spyOn(authApi, 'verifyEmail').mockResolvedValue({
      success: true,
      message: 'Email verified successfully',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Email verified!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /continue to sign in/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });
  });

  it('displays error state with backend message when verification fails (e.g. expired)', async () => {
    mockSearchParams = new URLSearchParams('token=expired-token-123');
    vi.spyOn(authApi, 'verifyEmail').mockRejectedValue(
      new ApiError(
        'This link has expired or has already been used',
        ERROR_CODES.INVALID_OR_EXPIRED_TOKEN,
        400,
      ),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
      expect(
        screen.getByText('The verification or reset link is invalid or has expired.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /request new verification link/i })).toHaveAttribute(
        'href',
        '/resend-verification',
      );
    });
  });

  it('calls the verifyEmail API exactly once inside React.StrictMode (double-invoke guard)', async () => {
    mockSearchParams = new URLSearchParams('token=strict-mode-token');
    const verifySpy = vi.spyOn(authApi, 'verifyEmail').mockResolvedValue({
      success: true,
      message: 'Email verified successfully',
    });

    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <VerifyEmailCard />
        </QueryClientProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText('Email verified!')).toBeInTheDocument();
    });

    // StrictMode double-invokes effects in development; hasTriggeredRef must prevent
    // a second verifyEmail call — the API must be called exactly once.
    expect(verifySpy).toHaveBeenCalledTimes(1);
    expect(verifySpy).toHaveBeenCalledWith('strict-mode-token');
  });
});
