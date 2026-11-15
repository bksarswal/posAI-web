import { apiClient } from '@/shared/lib/axios';
import type {
  ListStaffResponse,
  StaffListQuery,
  CreateStaffApiBody,
  CreateStaffResponse,
} from './staff.types';

export async function listStaff(params?: StaffListQuery): Promise<ListStaffResponse> {
  const response = await apiClient.get<ListStaffResponse>('/users', { params });
  return response.data;
}

export async function createStaff(payload: CreateStaffApiBody): Promise<CreateStaffResponse> {
  const response = await apiClient.post<CreateStaffResponse>('/users', payload);
  return response.data;
}
