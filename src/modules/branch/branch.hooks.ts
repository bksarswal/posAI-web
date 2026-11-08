'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/lib/axios';
import { createBranch } from './branch.api';
import type { CreateBranchApiBody, CreateBranchResponse } from './branch.types';

export const BRANCH_QUERY_KEYS = {
  all: ['branches'] as const,
};

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation<CreateBranchResponse, ApiError, CreateBranchApiBody>({
    mutationFn: (data) => createBranch(data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
        queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all }),
      ]);
    },
  });
}
