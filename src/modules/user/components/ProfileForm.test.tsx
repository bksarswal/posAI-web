import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/axios';
import { ProfileForm } from './ProfileForm';
import { DashboardShell } from '@/app/(dashboard)/_components/DashboardShell';
import * as userApi from '../user.api';
import type { CurrentUserResponse, UpdateProfileResponse } from '../user.types';
import { USER_QUERY_KEYS } from '../user.hooks';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
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

const createMockMeData = (
  overrides?: Partial<CurrentUserResponse['data']['user']>,
): CurrentUserResponse => ({
  success: true,
  message: 'OK',
  data: {
    user: {
      id: 'u-1',
      tenantId: 't-1',
      name: 'Priya Sharma',
      email: 'priya@spicegarden.com',
      phone: '+919876543210',
      role: 'OWNER',
      branchIds: ['b-1'],
      emailVerified: true,
      mustChangePassword: false,
      ...overrides,
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
      address: {
        line1: '123 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
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
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
  },
});

type UpdatedUser = UpdateProfileResponse['data']['user'];

const makeUpdatedUser = (overrides?: Partial<UpdatedUser>): UpdatedUser => ({
  id: 'u-1',
  tenantId: 't-1',
  name: 'Priya Sharma',
  email: 'priya@spicegarden.com',
  phone: '+919876543210',
  role: 'OWNER',
  branchIds: ['b-1'],
  status: 'ACTIVE',
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('ProfileForm (src/modules/user/components/ProfileForm.tsx)', () => {
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
    queryClient.setQueryData(USER_QUERY_KEYS.me, initialData);
    vi.spyOn(userApi, 'getMe').mockResolvedValue(initialData);

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it('shows read-only email/role/restaurant/branches', () => {
    renderComponent(<ProfileForm />);

    // Read-only user details
    expect(screen.getByText('priya@spicegarden.com')).toBeInTheDocument();
    expect(screen.getAllByText('OWNER').length).toBeGreaterThan(0);
    expect(screen.getByText('Spice Garden Indiranagar')).toBeInTheDocument();
    expect(screen.getByText(/Indiranagar Main/i)).toBeInTheDocument();

    // Password change instruction and link to /change-password
    expect(
      screen.getByText(/Changing your password signs you out of every device/i),
    ).toBeInTheDocument();
    const changePasswordLink = screen.getByRole('link', { name: /change password/i });
    expect(changePasswordLink).toBeInTheDocument();
    expect(changePasswordLink).toHaveAttribute('href', '/change-password');
  });

  it('save disabled until dirty+valid; invalid phone message', async () => {
    const user = userEvent.setup();
    renderComponent(<ProfileForm />);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    const nameInput = screen.getByPlaceholderText(/your full name/i);
    const phoneInput = screen.getByPlaceholderText(/\+919876543210/i);

    // Initially clean -> Save button is disabled
    expect(saveButton).toBeDisabled();

    // Make dirty with valid name -> Save button enabled
    await user.type(nameInput, ' Extra');
    expect(saveButton).toBeEnabled();

    // Type invalid Indian phone number
    await user.clear(phoneInput);
    await user.type(phoneInput, '12345');

    // Save disabled due to validation failure
    expect(saveButton).toBeDisabled();
    expect(
      await screen.findByText(
        /Invalid Indian phone number\. Must be 10 digits starting with 6-9, optionally prefixed with \+91/i,
      ),
    ).toBeInTheDocument();

    // Fix phone with valid Indian number -> Save button re-enabled
    await user.clear(phoneInput);
    await user.type(phoneInput, '9876543210');
    expect(saveButton).toBeEnabled();
  });

  it('success updates the cache and the top-bar name', async () => {
    const user = userEvent.setup();
    const initialData = createMockMeData({ name: 'Old Name' });
    const updatedData = createMockMeData({ name: 'New Top Bar Name' });

    vi.spyOn(userApi, 'updateProfile').mockResolvedValue({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: makeUpdatedUser({
          name: 'New Top Bar Name',
        }),
      },
    });

    vi.spyOn(userApi, 'getMe').mockResolvedValue(updatedData);

    renderComponent(
      <DashboardShell>
        <ProfileForm />
      </DashboardShell>,
      initialData,
    );

    // Initial name in top bar and form
    expect(screen.getByText('Old Name')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/your full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Top Bar Name');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    // Success toast shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    // Query cache is updated
    const cached = queryClient.getQueryData<CurrentUserResponse>(USER_QUERY_KEYS.me);
    expect(cached?.data?.user?.name).toBe('New Top Bar Name');

    // Top-bar updates without reload
    await waitFor(() => {
      expect(screen.getByText('New Top Bar Name')).toBeInTheDocument();
      expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
    });
  });

  it('VALIDATION_ERROR maps onto the field', async () => {
    const user = userEvent.setup();

    const apiValidationError = new ApiError('Validation failed', 'VALIDATION_ERROR', 400, [
      { field: 'name', message: 'Name contains invalid characters' },
    ]);

    vi.spyOn(userApi, 'updateProfile').mockRejectedValue(apiValidationError);

    renderComponent(<ProfileForm />);

    const nameInput = screen.getByPlaceholderText(/your full name/i);
    await user.type(nameInput, ' Special');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    // Field-level error from backend VALIDATION_ERROR is mapped onto the form
    expect(await screen.findByText('Name contains invalid characters')).toBeInTheDocument();
  });

  it('request body contains only name and phone', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(userApi, 'updateProfile').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        user: makeUpdatedUser({
          name: 'Strict Payload Name',
          phone: '+919988776655',
        }),
      },
    });

    renderComponent(<ProfileForm />);

    const nameInput = screen.getByPlaceholderText(/your full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Strict Payload Name');

    const phoneInput = screen.getByPlaceholderText(/\+919876543210/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, '9988776655');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());

    const sentPayload = updateSpy.mock.calls[0][0];

    // Body contains name and phone ONLY
    expect(sentPayload).toEqual({
      name: 'Strict Payload Name',
      phone: '+919988776655',
    });

    // Strictly forbidden fields
    const keys = Object.keys(sentPayload);
    expect(keys.sort()).toEqual(['name', 'phone']);
    expect(sentPayload).not.toHaveProperty('email');
    expect(sentPayload).not.toHaveProperty('role');
    expect(sentPayload).not.toHaveProperty('tenantId');
    expect(sentPayload).not.toHaveProperty('branchIds');
  });

  it('prefill shows the saved phone', () => {
    const mockData = createMockMeData({
      phone: '+919876543210',
    });
    renderComponent(<ProfileForm />, mockData);

    const phoneInput = screen.getByPlaceholderText(/\+919876543210/i);
    expect(phoneInput).toHaveValue('+919876543210');
  });

  it('changing only the name sends {name} without phone', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(userApi, 'updateProfile').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        user: makeUpdatedUser({
          name: 'Updated Name Only',
        }),
      },
    });

    renderComponent(<ProfileForm />);

    const nameInput = screen.getByPlaceholderText(/your full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name Only');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());

    const sentPayload = updateSpy.mock.calls[0][0];
    expect(sentPayload).toEqual({
      name: 'Updated Name Only',
    });
    expect(sentPayload).not.toHaveProperty('phone');
  });

  it('clearing the phone is blocked with a message', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(userApi, 'updateProfile');

    renderComponent(<ProfileForm />);

    const phoneInput = screen.getByPlaceholderText(/\+919876543210/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Initially save is disabled
    expect(saveButton).toBeDisabled();

    // Clear the phone field
    await user.clear(phoneInput);

    // Blocked with a message
    expect(await screen.findByText('Phone number cannot be removed here')).toBeInTheDocument();

    // Save button must remain disabled
    expect(saveButton).toBeDisabled();

    // Even if name is changed, cleared phone still blocks save
    const nameInput = screen.getByPlaceholderText(/your full name/i);
    await user.type(nameInput, ' Altered');
    expect(saveButton).toBeDisabled();
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
