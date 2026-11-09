import { apiClient } from '@/shared/lib/axios';
import type { CreateRestaurantApiBody, CreateRestaurantResponse } from './restaurant.types';

export async function createRestaurant(
  payload: CreateRestaurantApiBody,
): Promise<CreateRestaurantResponse> {
  const response = await apiClient.post<CreateRestaurantResponse>('/restaurant', payload);
  return response.data;
}
