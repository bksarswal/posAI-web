import { apiClient } from '@/shared/lib/axios';
import type {
  ListStaffResponse,
  StaffListQuery,
  CreateStaffApiBody,
  CreateStaffResponse,
  UpdateStaffApiBody,
  UpdateStaffResponse,
  ResetStaffPasswordResponse,
} from './staff.types';

export async function listStaff(params?: StaffListQuery): Promise<ListStaffResponse> {
  const response = await apiClient.get<ListStaffResponse>('/users', { params });
  return response.data;
}

export async function createStaff(payload: CreateStaffApiBody): Promise<CreateStaffResponse> {
  const response = await apiClient.post<CreateStaffResponse>('/users', payload);
  return response.data;
}

export async function updateStaff(
  id: string,
  payload: UpdateStaffApiBody,
): Promise<UpdateStaffResponse> {
  const response = await apiClient.patch<UpdateStaffResponse>(`/users/${id}`, payload);
  return response.data;
}

export async function resetStaffPassword(id: string): Promise<ResetStaffPasswordResponse> {
  const response = await apiClient.post<ResetStaffPasswordResponse>(`/users/${id}/reset-password`);
  return response.data;
}
