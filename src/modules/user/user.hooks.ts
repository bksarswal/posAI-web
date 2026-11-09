'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthProvider';
import type { ApiError } from '@/shared/lib/axios';
import { getMe, updateProfile } from './user.api';
import type {
  CurrentUserResponse,
  UpdateProfileApiBody,
  UpdateProfileResponse,
} from './user.types';

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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, ApiError, UpdateProfileApiBody>({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.me });
    },
  });
}
