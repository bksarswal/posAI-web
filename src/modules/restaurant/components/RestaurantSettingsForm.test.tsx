import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/axios';
import { RequireRole } from '@/app/(dashboard)/_components/RequireRole';
import { DashboardShell } from '@/app/(dashboard)/_components/DashboardShell';
import { RestaurantSettingsForm } from './RestaurantSettingsForm';
import * as restaurantApi from '../restaurant.api';
import type { CurrentUserResponse } from '@/modules/user/user.types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/restaurant',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/modules/auth/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true, isInitialized: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/modules/auth/auth.hooks', () => ({
  useLogout: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const createMockMeData = (overrides?: {
  role?: 'OWNER' | 'ADMIN' | 'MANAGER';
  restaurantOverrides?: Partial<NonNullable<CurrentUserResponse['data']['restaurant']>>;
}): CurrentUserResponse => ({
  success: true,
  message: 'OK',
  data: {
    user: {
      id: 'u-1',
      tenantId: 't-1',
      name: 'Priya Sharma',
      email: 'priya@spicegarden.com',
      phone: '+919876543210',
      role: overrides?.role ?? 'OWNER',
      branchIds: ['b-1'],
      emailVerified: true,
      mustChangePassword: false,
    },
    tenant: {
      id: 't-1',
      name: 'Spice Enterprises',
      slug: 'spice-enterprises',
      status: 'ACTIVE',
    },
    restaurant: {
      id: 'rest-1',
      tenantId: 't-1',
      name: 'Spice Garden Indiranagar',
      phone: '+919876543210',
      email: 'contact@spicegarden.com',
      logoUrl: 'https://example.com/logo.png',
      gstin: '29ABCDE1234F1Z5',
      fssai: '12345678901234',
      address: {
        line1: '123 MG Road',
        line2: 'Suite 200',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides?.restaurantOverrides,
    },
    branches: [
      {
        id: 'b-1',
        tenantId: 't-1',
        restaurantId: 'rest-1',
        name: 'Indiranagar Main',
        code: 'IND-01',
        address: {
          line1: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        phone: '+919876543210',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isMain: true,
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
});

describe('RestaurantSettingsForm (src/modules/restaurant/components/RestaurantSettingsForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = (ui: React.ReactElement, initialData = createMockMeData()) => {
    queryClient.setQueryData(['users', 'me'], initialData);

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it('OWNER/ADMIN see the form prefilled; MANAGER is redirected to /dashboard', async () => {
    // 1. OWNER sees prefilled form
    const ownerData = createMockMeData({ role: 'OWNER' });
    const { unmount } = renderComponent(
      <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
        <RestaurantSettingsForm />
      </RequireRole>,
      ownerData,
    );

    expect(screen.getByPlaceholderText(/e\.g\. Spice Garden/i)).toHaveValue(
      'Spice Garden Indiranagar',
    );
    expect(screen.getByPlaceholderText(/e\.g\. 9876543210/i)).toHaveValue('+919876543210');
    expect(screen.getByPlaceholderText(/contact@restaurant\.com/i)).toHaveValue(
      'contact@spicegarden.com',
    );
    expect(screen.getByPlaceholderText(/29ABCDE1234F1Z5/i)).toHaveValue('29ABCDE1234F1Z5');
    expect(screen.getByPlaceholderText(/14-digit FSSAI number/i)).toHaveValue('12345678901234');
    expect(screen.getByPlaceholderText(/Street address, building name/i)).toHaveValue(
      '123 MG Road',
    );
    expect(screen.getByPlaceholderText(/Apartment, suite, unit/i)).toHaveValue('Suite 200');
    expect(screen.getByPlaceholderText(/City/i)).toHaveValue('Bengaluru');
    expect(screen.getByPlaceholderText(/State/i)).toHaveValue('Karnataka');
    expect(screen.getByPlaceholderText(/6-digit PIN/i)).toHaveValue('560001');

    unmount();

    // 2. MANAGER is redirected to /dashboard
    const managerData = createMockMeData({ role: 'MANAGER' });
    renderComponent(
      <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
        <RestaurantSettingsForm />
      </RequireRole>,
      managerData,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    expect(screen.queryByText(/Restaurant Settings/i)).not.toBeInTheDocument();
  });

  it('save disabled until dirty+valid', async () => {
    const user = userEvent.setup();
    renderComponent(<RestaurantSettingsForm />);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    const nameInput = screen.getByPlaceholderText(/e\.g\. Spice Garden/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9876543210/i);

    // Clean form: Save disabled
    expect(saveButton).toBeDisabled();

    // Dirty with valid name: Save enabled
    await user.type(nameInput, ' Extended');
    expect(saveButton).toBeEnabled();

    // Invalid phone: Save disabled
    await user.clear(phoneInput);
    await user.type(phoneInput, '123');
    expect(saveButton).toBeDisabled();

    // Valid phone restored: Save re-enabled
    await user.clear(phoneInput);
    await user.type(phoneInput, '9876543210');
    expect(saveButton).toBeEnabled();
  });

  it('changing only the name sends {name}', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(restaurantApi, 'updateRestaurant').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        restaurant: {
          ...createMockMeData().data.restaurant!,
          name: 'Spice Garden Koramangala',
        },
      },
    });

    renderComponent(<RestaurantSettingsForm />);

    const nameInput = screen.getByPlaceholderText(/e\.g\. Spice Garden/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Spice Garden Koramangala');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());

    const payload = updateSpy.mock.calls[0][0];
    expect(payload).toEqual({
      name: 'Spice Garden Koramangala',
    });
    expect(payload).not.toHaveProperty('phone');
    expect(payload).not.toHaveProperty('address');
    expect(payload).not.toHaveProperty('email');
  });

  it('changing one address field sends the complete address object', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(restaurantApi, 'updateRestaurant').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        restaurant: {
          ...createMockMeData().data.restaurant!,
          address: {
            ...createMockMeData().data.restaurant!.address,
            city: 'Mysuru',
          },
        },
      },
    });

    renderComponent(<RestaurantSettingsForm />);

    const cityInput = screen.getByPlaceholderText(/City/i);
    await user.clear(cityInput);
    await user.type(cityInput, 'Mysuru');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());

    const payload = updateSpy.mock.calls[0][0];
    expect(payload).toEqual({
      address: {
        line1: '123 MG Road',
        line2: 'Suite 200',
        city: 'Mysuru',
        state: 'Karnataka',
        pincode: '560001',
      },
    });
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('phone');
  });

  it('clearing a filled optional field is blocked with a message', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(restaurantApi, 'updateRestaurant');

    renderComponent(<RestaurantSettingsForm />);

    const gstinInput = screen.getByPlaceholderText(/29ABCDE1234F1Z5/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Clear GSTIN field that originally had a value
    await user.clear(gstinInput);

    expect(await screen.findByText("This field can't be removed here")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Even if name is edited, clearing GSTIN prevents submission
    const nameInput = screen.getByPlaceholderText(/e\.g\. Spice Garden/i);
    await user.type(nameInput, ' Changed');

    expect(saveButton).toBeDisabled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('VALIDATION_ERROR maps onto a nested address field', async () => {
    const user = userEvent.setup();

    const apiValidationError = new ApiError('Validation failed', 'VALIDATION_ERROR', 400, [
      { field: 'address.pincode', message: 'PIN code not serviceable' },
    ]);

    vi.spyOn(restaurantApi, 'updateRestaurant').mockRejectedValue(apiValidationError);

    renderComponent(<RestaurantSettingsForm />);

    const nameInput = screen.getByPlaceholderText(/e\.g\. Spice Garden/i);
    await user.type(nameInput, ' Extra');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    expect(await screen.findByText('PIN code not serviceable')).toBeInTheDocument();
  });

  it('success updates the cache and the top-bar restaurant name', async () => {
    const user = userEvent.setup();
    const initialData = createMockMeData();
    const updatedRestaurantName = 'Brand New Restaurant Name';

    vi.spyOn(restaurantApi, 'updateRestaurant').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        restaurant: {
          ...initialData.data.restaurant!,
          name: updatedRestaurantName,
        },
      },
    });

    renderComponent(
      <DashboardShell>
        <RestaurantSettingsForm />
      </DashboardShell>,
      initialData,
    );

    // Initial restaurant name shown in top bar
    expect(screen.getByText('Spice Garden Indiranagar')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\. Spice Garden/i);
    await user.clear(nameInput);
    await user.type(nameInput, updatedRestaurantName);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Restaurant settings updated successfully');
    });

    // Query cache is updated
    const cached = queryClient.getQueryData<CurrentUserResponse>(['users', 'me']);
    expect(cached?.data?.restaurant?.name).toBe(updatedRestaurantName);

    // Top-bar updates without reload
    await waitFor(() => {
      expect(screen.getByText(updatedRestaurantName)).toBeInTheDocument();
      expect(screen.queryByText('Spice Garden Indiranagar')).not.toBeInTheDocument();
    });
  });
});
