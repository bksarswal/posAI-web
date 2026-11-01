export interface UserProfile {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'CHEF';
  branchIds: string[];
  emailVerified: boolean;
  mustChangePassword: boolean;
}

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
