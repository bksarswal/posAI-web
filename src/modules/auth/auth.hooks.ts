'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/shared/lib/tokenStorage';
import type { ApiError } from '@/shared/lib/axios';
import { signup, login, logout, verifyEmail, resendVerification } from './auth.api';
import type {
  SignupInput,
  SignupResponse,
  LoginInput,
  LoginResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
} from './auth.types';

export function useSignup() {
  return useMutation<SignupResponse, ApiError, SignupInput>({
    mutationFn: (data) => signup(data),
  });
}

export function useLogin() {
  return useMutation<LoginResponse, ApiError, LoginInput>({
    mutationFn: (data) => login(data),
    onSuccess: (data) => {
      setAccessToken(data.data.accessToken);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => logout(),
    onSettled: () => {
      setAccessToken(null);
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useVerifyEmail() {
  return useMutation<VerifyEmailResponse, ApiError, string>({
    mutationFn: (token) => verifyEmail(token),
  });
}

export function useResendVerification() {
  return useMutation<ResendVerificationResponse, ApiError, string>({
    mutationFn: (email) => resendVerification(email),
  });
}
