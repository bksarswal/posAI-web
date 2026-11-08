'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/lib/axios';
import { createRestaurant } from './restaurant.api';
import type { CreateRestaurantInput, CreateRestaurantResponse } from './restaurant.types';

export const RESTAURANT_QUERY_KEYS = {
  all: ['restaurant'] as const,
};

export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation<CreateRestaurantResponse, ApiError, CreateRestaurantInput>({
    mutationFn: (data) => createRestaurant(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}
