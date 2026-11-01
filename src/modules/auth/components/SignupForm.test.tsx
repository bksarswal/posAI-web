import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignupForm } from './SignupForm';
import * as authApi from '../auth.api';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignupForm (src/modules/auth/components/SignupForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <SignupForm />
      </QueryClientProvider>,
    );

  it('renders all registration fields, optional phone, and submit button', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('Spice Garden')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('priya@spicegarden.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+91 98765 43210')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /get started/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter your business or restaurant name')).toBeInTheDocument();
      expect(screen.getByText('Please enter your name')).toBeInTheDocument();
      expect(screen.getByText('Please enter your work email')).toBeInTheDocument();
      expect(screen.getByText('Please enter a password')).toBeInTheDocument();
    });
  });

  it('navigates directly to /dashboard when user is auto-verified (AUTO_VERIFY_EMAIL=true)', async () => {
    const user = userEvent.setup();
    const signupSpy = vi.spyOn(authApi, 'signup').mockResolvedValue({
      success: true,
      message: 'Account created',
      data: {
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya Sharma',
          email: 'priya@spicegarden.com',
          role: 'OWNER',
          emailVerified: true, // auto-verified
        },
      },
    });

    renderComponent();

    await user.type(screen.getByPlaceholderText('Spice Garden'), 'Spice Garden');
    await user.type(screen.getByPlaceholderText('Priya Sharma'), 'Priya Sharma');
    await user.type(screen.getByPlaceholderText('priya@spicegarden.com'), 'priya@spicegarden.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(signupSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'Spice Garden',
          name: 'Priya Sharma',
          email: 'priya@spicegarden.com',
          password: 'Password123!',
        }),
      );
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays "Check your email" confirmation screen when email verification is required', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'signup').mockResolvedValue({
      success: true,
      message: 'Account created',
      data: {
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya Sharma',
          email: 'unverified@spicegarden.com',
          role: 'OWNER',
          emailVerified: false, // verification required
        },
      },
    });

    renderComponent();

    await user.type(screen.getByPlaceholderText('Spice Garden'), 'Spice Garden');
    await user.type(screen.getByPlaceholderText('Priya Sharma'), 'Priya Sharma');
    await user.type(
      screen.getByPlaceholderText('priya@spicegarden.com'),
      'unverified@spicegarden.com',
    );
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText('unverified@spicegarden.com')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /resend verification email/i })).toHaveAttribute(
        'href',
        '/resend-verification?email=unverified%40spicegarden.com',
      );
      expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });
  });

  it('shows an alert and field error when email is already registered', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'signup').mockRejectedValue(
      new ApiError(
        'An account with this email already exists',
        ERROR_CODES.EMAIL_ALREADY_REGISTERED,
        409,
      ),
    );

    renderComponent();

    await user.type(screen.getByPlaceholderText('Spice Garden'), 'Spice Garden');
    await user.type(screen.getByPlaceholderText('Priya Sharma'), 'Priya Sharma');
    await user.type(
      screen.getByPlaceholderText('priya@spicegarden.com'),
      'existing@spicegarden.com',
    );
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(screen.getByText('Unable to create account')).toBeInTheDocument();
    });
  });
});
