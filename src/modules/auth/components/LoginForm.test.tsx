import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';
import * as authApi from '../auth.api';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { toast } from 'sonner';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('LoginForm (src/modules/auth/components/LoginForm.tsx)', () => {
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
        <LoginForm />
      </QueryClientProvider>,
    );

  it('renders email input, password input, submit button, and links', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('you@restaurant.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email')).toBeInTheDocument();
      expect(screen.getByText('Please enter your password')).toBeInTheDocument();
    });
  });

  it('submits form and navigates to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    const loginSpy = vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'access-123',
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya',
          email: 'priya@restaurant.com',
          role: 'OWNER',
          branchIds: [],
          mustChangePassword: false,
        },
      },
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('you@restaurant.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'priya@restaurant.com');
    await user.type(passwordInput, 'validPassword123!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'priya@restaurant.com',
        password: 'validPassword123!',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates to returnUrl on successful login if present in search params', async () => {
    mockSearchParams = new URLSearchParams('returnUrl=/profile');
    const user = userEvent.setup();
    vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'access-123',
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Priya',
          email: 'priya@restaurant.com',
          role: 'OWNER',
          branchIds: [],
          mustChangePassword: false,
        },
      },
    });

    renderComponent();

    await user.type(screen.getByPlaceholderText('you@restaurant.com'), 'priya@restaurant.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'validPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  it('navigates to /change-password?forced=true when user.mustChangePassword is true', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: 'access-123',
        user: {
          id: 'u-1',
          tenantId: 't-1',
          name: 'Staff Member',
          email: 'staff@restaurant.com',
          role: 'WAITER',
          branchIds: ['b-1'],
          mustChangePassword: true,
        },
      },
    });

    renderComponent();

    await user.type(screen.getByPlaceholderText('you@restaurant.com'), 'staff@restaurant.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'tempPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/change-password?forced=true');
    });
  });

  it('displays an alert banner when backend returns INVALID_CREDENTIALS', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS, 401),
    );

    renderComponent();

    await user.type(screen.getByPlaceholderText('you@restaurant.com'), 'wrong@restaurant.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(
        screen.getByText('The email or password you entered is incorrect.'),
      ).toBeInTheDocument();
    });
  });

  it('displays an alert banner with a resend verification link on EMAIL_NOT_VERIFIED', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError('Email not verified', ERROR_CODES.EMAIL_NOT_VERIFIED, 403),
    );

    renderComponent();

    await user.type(screen.getByPlaceholderText('you@restaurant.com'), 'unverified@posai.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Email verification required')).toBeInTheDocument();
      const resendLink = screen.getByRole('link', { name: /resend verification email/i });
      expect(resendLink).toBeInTheDocument();
      expect(resendLink).toHaveAttribute(
        'href',
        '/resend-verification?email=unverified%40posai.com',
      );
    });
  });

  it('displays account disabled alert on ACCOUNT_DISABLED error code', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError('Account disabled', ERROR_CODES.ACCOUNT_DISABLED, 403),
    );

    renderComponent();

    await user.type(screen.getByPlaceholderText('you@restaurant.com'), 'disabled@posai.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Account disabled')).toBeInTheDocument();
      expect(
        screen.getByText('This account has been disabled. Please contact your manager or support.'),
      ).toBeInTheDocument();
    });
  });

  it('triggers toast error on RATE_LIMITED response', async () => {
    const user = userEvent.setup();
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError('Too many attempts', ERROR_CODES.RATE_LIMITED, 429),
    );

    renderComponent();

    await user.type(screen.getByPlaceholderText('you@restaurant.com'), 'ratelimited@posai.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Too many sign-in attempts. Please wait a moment before trying again.',
      );
    });
  });
});
