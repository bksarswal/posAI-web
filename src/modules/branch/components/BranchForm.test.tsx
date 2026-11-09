import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BranchForm } from './BranchForm';
import * as userHooks from '@/modules/user/user.hooks';
import * as branchApi from '../branch.api';
import { ERROR_CODES } from '@/shared/constants/errorCodes';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/onboarding/branch',
}));

describe('BranchForm (src/modules/branch/components/BranchForm.tsx)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock: OWNER with restaurant and 0 branches
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
  });

  const renderForm = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BranchForm />
      </QueryClientProvider>,
    );

  it('renders required and optional fields, with default timezone and currency', () => {
    renderForm();

    expect(screen.getByPlaceholderText('e.g. Main Branch')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. MAIN-01')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 9876543210')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Asia/Kolkata')).toBeInTheDocument();
    expect(screen.getByDisplayValue('INR')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Street address, building name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Apartment, suite, unit (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('State')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('6-digit PIN')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create branch & complete setup/i }),
    ).toBeInTheDocument();
  });

  it('required validation prevents submission when required fields are empty', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(branchApi, 'createBranch');

    renderForm();

    const submitBtn = screen.getByRole('button', { name: /create branch & complete setup/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Branch name is required')).toBeInTheDocument();
      expect(screen.getByText('Branch code is required')).toBeInTheDocument();
      expect(screen.getByText('Address line1 is required')).toBeInTheDocument();
      expect(screen.getByText('City is required')).toBeInTheDocument();
      expect(screen.getByText('State is required')).toBeInTheDocument();
      expect(screen.getByText('PIN code is required')).toBeInTheDocument();
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('BRANCH_CODE_EXISTS on the code field', async () => {
    const user = userEvent.setup();

    vi.spyOn(branchApi, 'createBranch').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          code: ERROR_CODES.BRANCH_CODE_EXISTS,
          message: 'A branch with this code already exists. Please choose a unique code.',
        },
      },
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Main Branch'), 'Main Branch');
    await user.type(screen.getByPlaceholderText('e.g. MAIN-01'), 'MAIN-01');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create branch & complete setup/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('A branch with this code already exists. Please choose a unique code.'),
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('BRANCH_CREATION_CONFLICT: navigates to /dashboard if refetched me has at least one branch', async () => {
    const user = userEvent.setup();

    vi.spyOn(branchApi, 'createBranch').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          code: ERROR_CODES.BRANCH_CREATION_CONFLICT,
          message: 'Concurrent branch creation conflict.',
        },
      },
    });

    // Mock refetchQueries to populate query cache with a branch
    vi.spyOn(queryClient, 'refetchQueries').mockImplementationOnce(async () => {
      queryClient.setQueryData(['users', 'me'], {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u1',
            tenantId: 't1',
            name: 'Owner User',
            email: 'owner@test.com',
            role: 'OWNER',
            branchIds: ['b-1'],
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
          branches: [
            {
              id: 'b-1',
              tenantId: 't1',
              restaurantId: 'rest-1',
              name: 'Main Branch',
              code: 'MAIN-01',
              address: {
                line1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
              },
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
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Main Branch'), 'Main Branch');
    await user.type(screen.getByPlaceholderText('e.g. MAIN-01'), 'MAIN-01');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create branch & complete setup/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(
      screen.queryByText('Branch creation conflicted, please try again'),
    ).not.toBeInTheDocument();
  });

  it('BRANCH_CREATION_CONFLICT: shows retry message if refetched me has 0 branches', async () => {
    const user = userEvent.setup();

    vi.spyOn(branchApi, 'createBranch').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          code: ERROR_CODES.BRANCH_CREATION_CONFLICT,
          message: 'Concurrent branch creation conflict.',
        },
      },
    });

    // Mock refetchQueries to populate query cache with 0 branches
    vi.spyOn(queryClient, 'refetchQueries').mockImplementationOnce(async () => {
      queryClient.setQueryData(['users', 'me'], {
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
      });
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Main Branch'), 'Main Branch');
    await user.type(screen.getByPlaceholderText('e.g. MAIN-01'), 'MAIN-01');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create branch & complete setup/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Branch creation conflicted, please try again')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('success awaits me refetch before navigating and isMain/tenantId never in the request body', async () => {
    const user = userEvent.setup();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

    let capturedPayload: unknown = null;
    vi.spyOn(branchApi, 'createBranch').mockImplementationOnce(async (payload) => {
      capturedPayload = payload;
      return {
        success: true,
        message: 'Branch created successfully',
        data: {
          branch: {
            id: 'b-new',
            tenantId: 't1',
            restaurantId: 'rest-1',
            name: 'Main Branch',
            code: 'MAIN-01',
            address: {
              line1: '123 MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560001',
            },
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            isMain: true,
            status: 'ACTIVE',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        },
      };
    });

    renderForm();

    await user.type(screen.getByPlaceholderText('e.g. Main Branch'), 'Main Branch');
    await user.type(screen.getByPlaceholderText('e.g. MAIN-01'), 'MAIN-01');
    await user.type(screen.getByPlaceholderText('Street address, building name'), '123 MG Road');
    await user.type(screen.getByPlaceholderText('City'), 'Bengaluru');
    await user.type(screen.getByPlaceholderText('State'), 'Karnataka');
    await user.type(screen.getByPlaceholderText('6-digit PIN'), '560001');

    const submitBtn = screen.getByRole('button', { name: /create branch & complete setup/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    // Check payload: isMain and tenantId must NEVER be sent
    expect(capturedPayload).not.toBeNull();
    const payloadObj = capturedPayload as Record<string, unknown>;
    expect(payloadObj).not.toHaveProperty('isMain');
    expect(payloadObj).not.toHaveProperty('tenantId');
    expect(payloadObj).not.toHaveProperty('role');
    expect(payloadObj.name).toBe('Main Branch');
    expect(payloadObj.code).toBe('MAIN-01');
    expect(payloadObj.timezone).toBe('Asia/Kolkata');
    expect(payloadObj.currency).toBe('INR');
  });

  it('non-OWNER/ADMIN redirected away', async () => {
    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: {
            id: 'u3',
            tenantId: 't1',
            name: 'Waiter User',
            email: 'waiter@test.com',
            role: 'WAITER',
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

    expect(screen.queryByPlaceholderText('e.g. Main Branch')).not.toBeInTheDocument();
  });

  it('user who already has a branch is redirected away', async () => {
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
            branchIds: ['b-1'],
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
          branches: [
            {
              id: 'b-1',
              tenantId: 't1',
              restaurantId: 'rest-1',
              name: 'Main Branch',
              code: 'MAIN-01',
              address: {
                line1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
              },
              timezone: 'Asia/Kolkata',
              currency: 'INR',
              isMain: true,
              status: 'ACTIVE',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof userHooks.useCurrentUser>);

    renderForm();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(screen.queryByPlaceholderText('e.g. Main Branch')).not.toBeInTheDocument();
  });
});
