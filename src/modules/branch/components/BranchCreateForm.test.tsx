import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { BranchCreateForm } from './BranchCreateForm';
import * as branchApi from '../branch.api';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/branches/new',
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockBranchResponse = {
  success: true as const,
  message: 'OK',
  data: {
    branch: {
      id: 'b2',
      tenantId: 't1',
      restaurantId: 'r1',
      name: 'South Branch',
      code: 'SOUTH-01',
      address: {
        line1: '456 Inner Ring',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560002',
      },
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      isMain: false,
      status: 'ACTIVE' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
};

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchCreateForm />
    </QueryClientProvider>,
  );
}

describe('BranchCreateForm (src/modules/branch/components/BranchCreateForm.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create: BRANCH_CODE_EXISTS lands on the code field', async () => {
    const user = userEvent.setup();

    vi.spyOn(branchApi, 'createBranch').mockRejectedValue(
      new ApiError('A branch with this code already exists.', ERROR_CODES.BRANCH_CODE_EXISTS, 409),
    );

    renderForm();

    await user.type(screen.getByPlaceholderText(/e\.g\. Main Branch/i), 'South Branch');
    await user.type(screen.getByPlaceholderText(/e\.g\. MAIN-01/i), 'SOUTH-01');
    await user.type(screen.getByPlaceholderText(/Street address, building name/i), '456 Ring Rd');
    await user.type(screen.getByPlaceholderText(/City/i), 'Bengaluru');
    await user.type(screen.getByPlaceholderText(/State/i), 'Karnataka');
    await user.type(screen.getByPlaceholderText(/6-digit PIN/i), '560002');

    await user.click(screen.getByRole('button', { name: /create branch/i }));

    await waitFor(() => {
      expect(screen.getByText(/branch with this code already exists/i)).toBeInTheDocument();
    });
  });

  it('create: success refetches and navigates to /branches; isMain never in the body', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(branchApi, 'createBranch').mockResolvedValue(mockBranchResponse);

    renderForm();

    await user.type(screen.getByPlaceholderText(/e\.g\. Main Branch/i), 'South Branch');
    await user.type(screen.getByPlaceholderText(/e\.g\. MAIN-01/i), 'SOUTH-01');
    await user.type(screen.getByPlaceholderText(/Street address, building name/i), '456 Ring Rd');
    await user.type(screen.getByPlaceholderText(/City/i), 'Bengaluru');
    await user.type(screen.getByPlaceholderText(/State/i), 'Karnataka');
    await user.type(screen.getByPlaceholderText(/6-digit PIN/i), '560002');

    await user.click(screen.getByRole('button', { name: /create branch/i }));

    await waitFor(() => expect(createSpy).toHaveBeenCalled());

    const payload = createSpy.mock.calls[0][0];
    expect(payload).not.toHaveProperty('isMain');
    expect(payload).toHaveProperty('name', 'South Branch');
    expect(payload).toHaveProperty('code', 'SOUTH-01');

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/branches'));
  });
});
