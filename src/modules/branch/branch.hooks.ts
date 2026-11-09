'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/lib/axios';
import { parseApiError } from '@/shared/lib/apiError';
import { createBranch, listBranches, getBranch, updateBranch } from './branch.api';
import type {
  CreateBranchApiBody,
  CreateBranchResponse,
  ListBranchesResponse,
  GetBranchResponse,
  UpdateBranchApiBody,
  UpdateBranchResponse,
} from './branch.types';

export const BRANCH_QUERY_KEYS = {
  all: ['branches'] as const,
  detail: (id: string) => ['branches', id] as const,
};

export function useBranches() {
  return useQuery<ListBranchesResponse, ApiError>({
    queryKey: BRANCH_QUERY_KEYS.all,
    queryFn: listBranches,
  });
}

export function useBranch(id: string) {
  return useQuery<GetBranchResponse, ApiError>({
    queryKey: BRANCH_QUERY_KEYS.detail(id),
    queryFn: () => getBranch(id),
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      // Do not retry on 404
      if (parseApiError(error).status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation<CreateBranchResponse, ApiError, CreateBranchApiBody>({
    mutationFn: (data) => createBranch(data),
    onSuccess: async (data) => {
      const id = data?.data?.branch?.id;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all }),
        ...(id ? [queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) })] : []),
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
      ]);
    },
  });
}

export function useUpdateBranch(id: string) {
  const queryClient = useQueryClient();

  return useMutation<UpdateBranchResponse, ApiError, UpdateBranchApiBody>({
    mutationFn: (data) => updateBranch(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
      ]);
    },
  });
}

export function useDeactivateBranch(id: string) {
  const queryClient = useQueryClient();

  return useMutation<UpdateBranchResponse, ApiError, void>({
    mutationFn: () => updateBranch(id, { status: 'INACTIVE' }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
      ]);
    },
  });
}
