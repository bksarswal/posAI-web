import type { paths, components } from '@/shared/types/api';

export type CreateBranchApiBody =
  paths['/api/v1/branches']['post']['requestBody']['content']['application/json'];

export type CreateBranchResponse =
  paths['/api/v1/branches']['post']['responses'][201]['content']['application/json'];

export type Branch = components['schemas']['SuccessResponse'] & {
  data: {
    branch: {
      id: string;
      tenantId: string;
      restaurantId: string;
      name: string;
      code: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
      };
      phone?: string;
      timezone: string;
      currency: string;
      isMain: boolean;
      status: 'ACTIVE' | 'INACTIVE';
      createdAt: string;
      updatedAt: string;
    };
  };
};
