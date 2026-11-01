import { apiClient } from '@/shared/lib/axios';
import type { CurrentUserResponse } from './user.types';

export async function getMe(): Promise<CurrentUserResponse> {
  const response = await apiClient.get<CurrentUserResponse>('/users/me');
  return response.data;
}
