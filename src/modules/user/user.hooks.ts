'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthProvider';
import type { ApiError } from '@/shared/lib/axios';
import { getMe } from './user.api';
import type { CurrentUserResponse } from './user.types';

export const USER_QUERY_KEYS = {
  me: ['users', 'me'] as const,
};

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery<CurrentUserResponse, ApiError>({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: getMe,
    enabled: isAuthenticated,
  });
}
