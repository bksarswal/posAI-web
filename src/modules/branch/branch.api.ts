import { apiClient } from '@/shared/lib/axios';
import type {
  CreateBranchApiBody,
  CreateBranchResponse,
  ListBranchesResponse,
  GetBranchResponse,
  UpdateBranchApiBody,
  UpdateBranchResponse,
} from './branch.types';

export async function createBranch(payload: CreateBranchApiBody): Promise<CreateBranchResponse> {
  const response = await apiClient.post<CreateBranchResponse>('/branches', payload);
  return response.data;
}

export async function listBranches(): Promise<ListBranchesResponse> {
  const response = await apiClient.get<ListBranchesResponse>('/branches');
  return response.data;
}

export async function getBranch(id: string): Promise<GetBranchResponse> {
  const response = await apiClient.get<GetBranchResponse>(`/branches/${id}`);
  return response.data;
}

export async function updateBranch(
  id: string,
  payload: UpdateBranchApiBody,
): Promise<UpdateBranchResponse> {
  const response = await apiClient.patch<UpdateBranchResponse>(`/branches/${id}`, payload);
  return response.data;
}
