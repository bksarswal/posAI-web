import { apiClient } from '@/shared/lib/axios';
import type {
  SignupInput,
  SignupResponse,
  LoginInput,
  LoginResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
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
