import type { paths } from '@/shared/types/api';

export type UserProfile =
  paths['/api/v1/users/me']['get']['responses'][200]['content']['application/json']['data']['user'];

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface RestaurantProfile {
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
}

export interface BranchInfo {
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
}

export interface CurrentUserResponse {
  success: true;
  message: string;
  data: {
    user: UserProfile;
    tenant: TenantInfo;
    restaurant: RestaurantProfile | null;
    branches: BranchInfo[];
  };
}

export type UpdateProfileApiBody = NonNullable<
  paths['/api/v1/users/me']['patch']['requestBody']
>['content']['application/json'];

export type UpdateProfileResponse =
  paths['/api/v1/users/me']['patch']['responses'][200]['content']['application/json'];
