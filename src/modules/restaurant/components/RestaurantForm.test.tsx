import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantForm } from './RestaurantForm';
import * as userHooks from '@/modules/user/user.hooks';
import * as restaurantApi from '../restaurant.api';
import { ERROR_CODES } from '@/shared/constants/errorCodes';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/onboarding/restaurant',
}));

describe('RestaurantForm (src/modules/restaurant/components/RestaurantForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock: OWNER without a restaurant
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u1',
            tenantId: 't1',
            name: 'Owner User',
            email: 'owner@test.com',
            role: 'OWNER',
            branchIds: [],
            emailVerified: true,
            mustChangePassword: false,
          },
          tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
          restaurant: null,
          branches: [],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);
  });

  const renderForm = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <RestaurantForm />
      </QueryClientProvider>,
    );

  it('renders all required and optional fields', () => {
    renderForm();

    expect(screen.getByPlaceholderText('e.g. Spice Garden')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 9876543210')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contact@restaurant.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('29ABCDE1234F1Z5')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('14-digit FSSAI number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Street address, building name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Apartment, suite, unit (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('State')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('6-digit PIN')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create restaurant & continue/i }),
    ).toBeInTheDocument();
  });

  it('required-field validation prevents submission when fields are empty', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(restaurantApi, 'createRestaurant');

    renderForm();

    const submitBtn = screen.getByRole('button', { name: /create restaurant & continue/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Restaurant name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Address line1 is required')).toBeInTheDocument();
      expect(screen.getByText('City is required')).toBeInTheDocument();
      expect(screen.getByText('State is required')).toBeInTheDocument();
      expect(screen.getByText('PIN code is required')).toBeInTheDocument();
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('invalid GSTIN message from the API is shown on the GSTIN field', async () => {
    const user = userEvent.setup();

    vi.spyOn(restaurantApi, 'createRestaurant').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [{ field: 'gstin', message: 'Invalid GSTIN format provided by API' }],
        },
      },
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Spice Garden'), 'Spice Garden');
    await user.type(screen.getByPlaceholderText('e.g. 9876543210'), '9876543210');
    await user.type(screen.getByPlaceholderText('contact@restaurant.com'), 'contact@spice.com');
    await user.type(screen.getByPlaceholderText('29ABCDE1234F1Z5'), '29ABCDE1234F1Z5');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create restaurant & continue/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid GSTIN format provided by API')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('success invalidates me and navigates', async () => {
    const user = userEvent.setup();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

    vi.spyOn(restaurantApi, 'createRestaurant').mockResolvedValueOnce({
      success: true,
      message: 'Restaurant created successfully',
      data: {
        restaurant: {
          id: 'rest-new',
          tenantId: 't1',
          name: 'Spice Garden',
          phone: '+919876543210',
          email: 'contact@spice.com',
          address: {
            line1: '123 MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      },
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Spice Garden'), 'Spice Garden');
    await user.type(screen.getByPlaceholderText('e.g. 9876543210'), '9876543210');
    await user.type(screen.getByPlaceholderText('contact@restaurant.com'), 'contact@spice.com');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create restaurant & continue/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
      expect(mockPush).toHaveBeenCalledWith('/onboarding/branch');
    });
  });

  it('RESTAURANT_ALREADY_EXISTS continues without an error banner', async () => {
    const user = userEvent.setup();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

    vi.spyOn(restaurantApi, 'createRestaurant').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          code: ERROR_CODES.RESTAURANT_ALREADY_EXISTS,
          message: 'A restaurant profile already exists for this tenant.',
        },
      },
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Spice Garden'), 'Spice Garden');
    await user.type(screen.getByPlaceholderText('e.g. 9876543210'), '9876543210');
    await user.type(screen.getByPlaceholderText('contact@restaurant.com'), 'contact@spice.com');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create restaurant & continue/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
      expect(mockPush).toHaveBeenCalledWith('/onboarding/branch');
    });

    // Make sure no error alert was rendered
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(
      screen.queryByText('A restaurant profile already exists for this tenant.'),
    ).not.toBeInTheDocument();
  });

  it('non-OWNER is redirected away', async () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u2',
            tenantId: 't1',
            name: 'Manager User',
            email: 'manager@test.com',
            role: 'MANAGER',
            branchIds: [],
            emailVerified: true,
            mustChangePassword: false,
          },
          tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
          restaurant: null,
          branches: [],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderForm();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    // Does not render form content
    expect(screen.queryByPlaceholderText('e.g. Spice Garden')).not.toBeInTheDocument();
  });

  it('OWNER who already has a restaurant is redirected away', async () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u1',
            tenantId: 't1',
            name: 'Owner User',
            email: 'owner@test.com',
            role: 'OWNER',
            branchIds: [],
            emailVerified: true,
            mustChangePassword: false,
          },
          tenant: { id: 't1', name: 'T1', slug: 't1', status: 'ACTIVE' },
          restaurant: {
            id: 'rest-1',
            tenantId: 't1',
            name: 'Spice Garden',
            phone: '+919876543210',
            email: 'contact@spice.com',
            address: {
              line1: '123 MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560001',
            },
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
          branches: [],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderForm();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(screen.queryByPlaceholderText('e.g. Spice Garden')).not.toBeInTheDocument();
  });
});
