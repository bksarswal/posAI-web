'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/lib/axios';
import { createRestaurant, updateRestaurant } from './restaurant.api';
import type {
  CreateRestaurantApiBody,
  CreateRestaurantResponse,
  UpdateRestaurantApiBody,
  UpdateRestaurantResponse,
} from './restaurant.types';

export const RESTAURANT_QUERY_KEYS = {
  all: ['restaurant'] as const,
};

export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation<CreateRestaurantResponse, ApiError, CreateRestaurantApiBody>({
    mutationFn: (data) => createRestaurant(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation<UpdateRestaurantResponse, ApiError, UpdateRestaurantApiBody>({
    mutationFn: (data) => updateRestaurant(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.all });
    },
  });
}
