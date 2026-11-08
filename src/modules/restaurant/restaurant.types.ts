import type { paths, components } from '@/shared/types/api';

export type CreateRestaurantInput =
  paths['/api/v1/restaurant']['post']['requestBody']['content']['application/json'];

export type CreateRestaurantResponse =
  paths['/api/v1/restaurant']['post']['responses'][201]['content']['application/json'];

export type Restaurant = components['schemas']['SuccessResponse'] & {
  data: {
    restaurant: {
      id: string;
      tenantId: string;
      name: string;
      gstin?: string;
      fssai?: string;
      phone: string;
      email: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
      };
      logoUrl?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};
