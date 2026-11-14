import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as antd from 'antd';
import { ApiError } from '@/shared/lib/axios';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { BranchEditForm } from './BranchEditForm';
import * as branchHooks from '../branch.hooks';
import * as branchApi from '../branch.api';
import type { Branch } from '../branch.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/branches/b1/edit',
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Ant Design Modal confirm: auto-call onOk in tests
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof antd>();
  return {
    ...actual,
    Modal: {
      ...actual.Modal,
      confirm: ({ onOk }: { onOk?: () => void }) => {
        onOk?.();
      },
    },
  };
});

const baseBranch: Branch = {
  id: 'b1',
  tenantId: 't1',
  restaurantId: 'r1',
  name: 'Main Branch',
  code: 'MAIN-01',
  address: {
    line1: '123 MG Road',
    line2: 'Suite 1',
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
};

const secondaryBranch: Branch = {
  ...baseBranch,
  id: 'b2',
  name: 'South Branch',
  code: 'SOUTH-01',
  isMain: false,
};

function makeBranchResponse(branch: Branch = baseBranch) {
  return {
    success: true as const,
    message: 'OK',
    data: { branch },
  };
}

function makeUpdateResponse(overrides: Partial<Branch> = {}) {
  return {
    success: true as const,
    message: 'OK',
    data: { branch: { ...baseBranch, ...overrides } },
  };
}

function renderForm(branchId = 'b1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchEditForm branchId={branchId} />
    </QueryClientProvider>,
  );
}

describe('BranchEditForm (src/modules/branch/components/BranchEditForm.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('edit: code is read-only', () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    renderForm();

    const codeInput = screen.getByDisplayValue('MAIN-01');
    expect(codeInput).toBeDisabled();
  });

  it('edit: changing only the name sends {name}', async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(branchApi, 'updateBranch')
      .mockResolvedValue(makeUpdateResponse({ name: 'Main Branch Renamed' }));

    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue(
      (() => {
        const mutation = {
          mutateAsync: (payload: unknown) => updateSpy('b1', payload as never),
          isPending: false,
        };
        return mutation;
      })() as unknown as ReturnType<typeof branchHooks.useUpdateBranch>,
    );

    renderForm();

    const nameInput = screen.getByDisplayValue('Main Branch');
    await user.clear(nameInput);
    await user.type(nameInput, 'Main Branch Renamed');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeEnabled();
    await user.click(saveBtn);

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    const payload = updateSpy.mock.calls[0][1];
    expect(payload).toEqual({ name: 'Main Branch Renamed' });
    expect(payload).not.toHaveProperty('code');
    expect(payload).not.toHaveProperty('address');
  });

  it('edit: changing one address field sends the complete address object', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(branchApi, 'updateBranch').mockResolvedValue(makeUpdateResponse());

    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue(
      (() => ({
        mutateAsync: (payload: unknown) => updateSpy('b1', payload as never),
        isPending: false,
      }))() as unknown as ReturnType<typeof branchHooks.useUpdateBranch>,
    );

    renderForm();

    const cityInput = screen.getByDisplayValue('Bengaluru');
    await user.clear(cityInput);
    await user.type(cityInput, 'Chennai');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    const payload = updateSpy.mock.calls[0][1];
    expect(payload).toHaveProperty('address');
    expect(payload.address).toMatchObject({
      line1: '123 MG Road',
      city: 'Chennai',
      state: 'Karnataka',
      pincode: '560001',
    });
    expect(payload).not.toHaveProperty('name');
  });

  it('edit: clearing a filled optional field (phone, line2) is blocked with a message', async () => {
    const user = userEvent.setup();

    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    renderForm();

    // Clear phone (which had a value)
    const phoneInput = screen.getByDisplayValue('+919876543210');
    await user.clear(phoneInput);

    // Try to also change name so form is dirty
    const nameInput = screen.getByDisplayValue('Main Branch');
    await user.clear(nameInput);
    await user.type(nameInput, 'Main Branch X');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/this field can't be removed here/i)).toBeInTheDocument();
    });
  });

  it('edit: deactivating the main branch is disabled in the UI when isMain is true', () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse({ ...baseBranch, isMain: true, status: 'ACTIVE' }),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    renderForm('b1');

    // The main branch shows "Toggle disabled" text, not a Deactivate button
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
    expect(screen.getByText(/toggle disabled/i)).toBeInTheDocument();
  });

  it('edit: server rejection with CANNOT_DEACTIVATE_MAIN_BRANCH shows error message and preserves ACTIVE status', async () => {
    const user = userEvent.setup();

    const updateSpy = vi
      .spyOn(branchApi, 'updateBranch')
      .mockRejectedValue(
        new ApiError(
          'The main branch cannot be deactivated.',
          ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH,
          409,
        ),
      );

    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse({ ...secondaryBranch, isMain: false, status: 'ACTIVE' }),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue(
      (() => ({
        mutateAsync: (payload: unknown) => updateSpy('b2', payload as never),
        isPending: false,
      }))() as unknown as ReturnType<typeof branchHooks.useUpdateBranch>,
    );

    renderForm('b2');

    // Deactivate button is visible because isMain: false
    const deactivateBtn = screen.getByRole('button', { name: /deactivate/i });
    expect(deactivateBtn).toBeInTheDocument();

    await user.click(deactivateBtn);

    // Dialog is confirmed (Modal.confirm auto-calls onOk in mock)
    await waitFor(() => expect(updateSpy).toHaveBeenCalledWith('b2', { status: 'INACTIVE' }));

    // User-facing error message is shown
    await waitFor(() => {
      expect(screen.getByText(/the main branch cannot be deactivated/i)).toBeInTheDocument();
    });

    // Status remains ACTIVE
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('edit: a normal (non-main) branch deactivates after confirmation', async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(branchApi, 'updateBranch')
      .mockResolvedValue(makeUpdateResponse({ ...secondaryBranch, status: 'INACTIVE' }));

    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(secondaryBranch),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue(
      (() => ({
        mutateAsync: (payload: unknown) => updateSpy('b2', payload as never),
        isPending: false,
      }))() as unknown as ReturnType<typeof branchHooks.useUpdateBranch>,
    );

    renderForm('b2');

    const deactivateBtn = screen.getByRole('button', { name: /deactivate/i });
    await user.click(deactivateBtn);

    // Modal.confirm is mocked to auto-call onOk
    await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    const payload = updateSpy.mock.calls[0][1];
    expect(payload).toEqual({ status: 'INACTIVE' });
  });

  it('edit: 404 shows the not-found state with a link back to /branches', () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError('Branch not found', 'NOT_FOUND', 404),
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    renderForm('missing-id');

    expect(screen.getByText(/branch not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to branches/i })).toHaveAttribute(
      'href',
      '/branches',
    );
  });

  it('regression: renders the form normally when the query succeeds (error === null)', () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(baseBranch),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    renderForm('b1');

    expect(screen.getByText('Edit Branch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main Branch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MAIN-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('INR')).toBeInTheDocument();
    expect(screen.queryByText(/branch not found/i)).not.toBeInTheDocument();
  });

  it("edit: read-only currency shows the branch's currency", () => {
    vi.spyOn(branchHooks, 'useBranch').mockReturnValue({
      data: makeBranchResponse(baseBranch),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof branchHooks.useBranch>);
    vi.spyOn(branchHooks, 'useUpdateBranch').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof branchHooks.useUpdateBranch>);

    renderForm('b1');

    const currencyInput = screen.getByDisplayValue('INR');
    expect(currencyInput).toBeDisabled();
  });
});
