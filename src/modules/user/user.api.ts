import { apiClient } from '@/shared/lib/axios';
import type {
  CurrentUserResponse,
  UpdateProfileApiBody,
  UpdateProfileResponse,
} from './user.types';

export async function getMe(): Promise<CurrentUserResponse> {
  const response = await apiClient.get<CurrentUserResponse>('/users/me');
  return response.data;
}

export async function updateProfile(payload: UpdateProfileApiBody): Promise<UpdateProfileResponse> {
  const response = await apiClient.patch<UpdateProfileResponse>('/users/me', payload);
  return response.data;
}
