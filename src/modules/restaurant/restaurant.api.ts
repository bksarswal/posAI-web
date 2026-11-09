import { apiClient } from '@/shared/lib/axios';
import type {
  CreateRestaurantApiBody,
  CreateRestaurantResponse,
  UpdateRestaurantApiBody,
  UpdateRestaurantResponse,
} from './restaurant.types';

export async function createRestaurant(
  payload: CreateRestaurantApiBody,
): Promise<CreateRestaurantResponse> {
  const response = await apiClient.post<CreateRestaurantResponse>('/restaurant', payload);
  return response.data;
}

export async function updateRestaurant(
  payload: UpdateRestaurantApiBody,
): Promise<UpdateRestaurantResponse> {
  const response = await apiClient.patch<UpdateRestaurantResponse>('/restaurant', payload);
  return response.data;
}
