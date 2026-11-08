import { apiClient } from '@/shared/lib/axios';
import type { CreateBranchApiBody, CreateBranchResponse } from './branch.types';

export async function createBranch(payload: CreateBranchApiBody): Promise<CreateBranchResponse> {
  const response = await apiClient.post<CreateBranchResponse>('/branches', payload);
  return response.data;
}
