import { apiClient } from '@/shared/lib/axios';
import type {
  SignupInput,
  SignupResponse,
  LoginInput,
  LoginResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  ForgotPasswordResponse,
  ResetPasswordApiInput,
  ResetPasswordResponse,
  ChangePasswordOutput,
  ChangePasswordResponse,
} from './auth.types';

export async function signup(payload: SignupInput): Promise<SignupResponse> {
  const response = await apiClient.post<SignupResponse>('/auth/signup', payload);
  return response.data;
}

export async function login(payload: LoginInput): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await apiClient.post<VerifyEmailResponse>('/auth/verify-email', { token });
  return response.data;
}

export async function resendVerification(email: string): Promise<ResendVerificationResponse> {
  const response = await apiClient.post<ResendVerificationResponse>('/auth/resend-verification', {
    email,
  });
  return response.data;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
    email,
  });
  return response.data;
}

export async function resetPassword(
  payload: ResetPasswordApiInput,
): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload);
  return response.data;
}

export async function changePassword(
  payload: ChangePasswordOutput,
): Promise<ChangePasswordResponse> {
  const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', payload);
  return response.data;
}
