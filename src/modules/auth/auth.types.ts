export type { SignupInput, LoginInput } from './auth.schema';

export interface SignupUserData {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'OWNER';
  emailVerified: boolean;
}

export interface SignupResponse {
  success: true;
  message: string;
  data: {
    user: SignupUserData;
  };
}

export interface LoginUserData {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'CHEF';
  emailVerified?: boolean;
  branchIds: string[];
  mustChangePassword: boolean;
}

export interface LoginResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    user: LoginUserData;
  };
}

export interface VerifyEmailResponse {
  success: true;
  message: string;
}

export interface ResendVerificationResponse {
  success: true;
  message: string;
}
