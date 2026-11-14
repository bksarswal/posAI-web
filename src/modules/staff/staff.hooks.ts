'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/shared/lib/axios';
import { parseApiError } from '@/shared/lib/apiError';
import { listStaff } from './staff.api';
import type { ListStaffResponse, StaffListQuery } from './staff.types';

export const STAFF_QUERY_KEYS = {
  all: ['staff'] as const,
  // Always include params (or empty object as sentinel) so the key is stable
  // and cache-busting via invalidateQueries({ queryKey: ['staff'] }) still works
  // as a prefix match against ['staff', {...}].
  list: (params: StaffListQuery = {}) => [...STAFF_QUERY_KEYS.all, params] as const,
};

export function useStaff(params?: StaffListQuery) {
  const resolvedParams: StaffListQuery = params ?? {};
  return useQuery<ListStaffResponse, ApiError>({
    queryKey: STAFF_QUERY_KEYS.list(resolvedParams),
    queryFn: () => listStaff(resolvedParams),
    retry: (failureCount, error) => {
      const status = error ? parseApiError(error).status : undefined;
      // Do not retry on 4xx client errors
      if (typeof status === 'number' && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
