'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input } from 'antd';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { useLogin } from '../auth.hooks';
import { loginSchema } from '../auth.schema';
import type { LoginInput } from '../auth.types';

type LoginBannerType =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_DISABLED'
  | 'TENANT_SUSPENDED'
  | 'GENERIC';

interface BannerState {
  type: LoginBannerType;
  message: string;
  email?: string;
}

export function LoginForm() {
  const [form] = Form.useForm<LoginInput>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [banner, setBanner] = useState<BannerState | null>(null);
  const loginMutation = useLogin();

  const handleSubmit = async (values: LoginInput) => {
    setBanner(null);

    try {
      const response = await loginMutation.mutateAsync(values);

      if (response.data.user.mustChangePassword) {
        router.push('/change-password?forced=true');
        return;
      }

      router.push(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard');
    } catch (err) {
      const parsed = parseApiError(err);

      // 1. Attach field-level errors to Ant Design form inputs
      const formErrors = toFormFieldErrors(err);
      if (formErrors.length > 0) {
        form.setFields(formErrors as unknown as Parameters<typeof form.setFields>[0]);
      }

      // 2. Specific banner & toast handling based on backend error codes
      if (parsed.code === ERROR_CODES.INVALID_CREDENTIALS) {
        setBanner({
          type: 'INVALID_CREDENTIALS',
          message: 'The email or password you entered is incorrect.',
        });
      } else if (parsed.code === ERROR_CODES.EMAIL_NOT_VERIFIED) {
        setBanner({
          type: 'EMAIL_NOT_VERIFIED',
          message: 'Your email address is not verified yet.',
          email: values.email,
        });
      } else if (parsed.code === ERROR_CODES.ACCOUNT_DISABLED) {
        setBanner({
          type: 'ACCOUNT_DISABLED',
          message: 'This account has been disabled. Please contact your manager or support.',
        });
      } else if (parsed.code === ERROR_CODES.TENANT_SUSPENDED) {
        setBanner({
          type: 'TENANT_SUSPENDED',
          message: 'Your organization account is suspended. Please contact customer support.',
        });
      } else if (parsed.code === ERROR_CODES.RATE_LIMITED) {
        toast.error('Too many sign-in attempts. Please wait a moment before trying again.');
      } else {
        setBanner({
          type: 'GENERIC',
          message: parsed.message || 'Failed to sign in. Please try again.',
        });
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {banner && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-medium text-red-900">
            {banner.type === 'INVALID_CREDENTIALS' && 'Invalid credentials'}
            {banner.type === 'EMAIL_NOT_VERIFIED' && 'Email verification required'}
            {banner.type === 'ACCOUNT_DISABLED' && 'Account disabled'}
            {banner.type === 'TENANT_SUSPENDED' && 'Tenant suspended'}
            {banner.type === 'GENERIC' && 'Unable to sign in'}
          </AlertTitle>
          <AlertDescription className="text-sm text-red-800">
            {banner.message}{' '}
            {banner.type === 'EMAIL_NOT_VERIFIED' && banner.email && (
              <Link
                href={`/resend-verification?email=${encodeURIComponent(banner.email)}`}
                className="font-medium underline underline-offset-2 hover:text-red-950"
              >
                Resend verification email
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="space-y-4"
      >
        <Form.Item
          name="email"
          label={<span className="text-sm font-medium text-slate-700">Email</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            createZodAntdRule(loginSchema.shape.email),
          ]}
          className="mb-4"
        >
          <Input
            type="email"
            placeholder="you@restaurant.com"
            autoComplete="email"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>
          }
          rules={[{ required: true, message: 'Please enter your password' }]}
          className="mb-6"
        >
          <Input.Password
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="h-11 w-full text-base font-medium shadow-sm transition-all"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </Form>

      <div className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
