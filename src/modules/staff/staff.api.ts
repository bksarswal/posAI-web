import { apiClient } from '@/shared/lib/axios';
import type { ListStaffResponse, StaffListQuery } from './staff.types';

export async function listStaff(params?: StaffListQuery): Promise<ListStaffResponse> {
  const response = await apiClient.get<ListStaffResponse>('/users', { params });
  return response.data;
}
