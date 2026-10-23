import { apiClient } from './axios';
import type { ApiData, ApiResponse } from '@/shared/types/api';

export type HealthData = ApiData<'/health', 'get'>;
export type HealthResponse = ApiResponse<'/health', 'get'>;

// Type-level assertions: typecheck fails if the OpenAPI contract breaks.
type AssertStatus = HealthData['status'] extends 'healthy' | 'unhealthy' ? true : never;
type AssertUptime = HealthData['uptime'] extends number ? true : never;
type AssertDb = HealthData['db'] extends string ? true : never;

export type _HealthContractVerification = [AssertStatus, AssertUptime, AssertDb];

/**
 * Typed client function calling the /health endpoint using the single Axios instance.
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}
