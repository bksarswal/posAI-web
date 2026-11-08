import { apiClient } from '@/shared/lib/axios';
import type { CreateRestaurantInput, CreateRestaurantResponse } from './restaurant.types';

export async function createRestaurant(
  payload: CreateRestaurantInput,
): Promise<CreateRestaurantResponse> {
  const response = await apiClient.post<CreateRestaurantResponse>('/restaurant', payload);
  return response.data;
}
