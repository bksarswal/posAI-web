'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Form, Input } from 'antd';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { parseApiError } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { passwordSchema } from '@/shared/lib/validators';
import { useResetPassword } from '../auth.hooks';

interface FormValues {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordForm() {
  const [form] = Form.useForm<FormValues>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorState, setErrorState] = useState<'invalid_or_expired' | 'generic' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const resetPasswordMutation = useResetPassword();

  // 1. Missing token state: render clear message with link to /forgot-password
  if (!token) {
    return (
      <Card className="border-slate-200 shadow-sm text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Missing reset token
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            No password reset token was provided. Please check your reset link or request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/forgot-password"
            className={buttonVariants({ className: 'h-11 w-full text-base font-medium' })}
          >
            Request new reset link
          </Link>
          <div>
            <Link
              href="/login"
              className={buttonVariants({
                variant: 'ghost',
                className: 'h-11 w-full text-base text-slate-600',
              })}
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Success state: show "Password updated" and link to /login (no auto-login)
  if (isSuccess) {
    return (
      <Card className="border-slate-200 shadow-sm text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Password updated
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            Your password has been reset successfully. You can now log in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/login"
            className={buttonVariants({ className: 'h-11 w-full text-base font-medium' })}
          >
            Continue to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (values: FormValues) => {
    setErrorState(null);
    setErrorMessage('');

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: values.newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      const parsed = parseApiError(err);

      if (parsed.code === ERROR_CODES.INVALID_OR_EXPIRED_TOKEN) {
        setErrorState('invalid_or_expired');
      } else if (parsed.code === ERROR_CODES.RATE_LIMITED) {
        toast.error('Too many attempts. Please wait a few moments before trying again.');
      } else {
        setErrorState('generic');
        setErrorMessage(parsed.message || 'Failed to reset password. Please try again.');
      }
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Reset password
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          Create a new password for your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorState === 'invalid_or_expired' && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-medium text-red-900">Invalid or expired link</AlertTitle>
            <AlertDescription className="text-sm text-red-800">
              The reset link is invalid or has expired.{' '}
              <Link
                href="/forgot-password"
                className="font-medium underline underline-offset-2 hover:text-red-950"
              >
                Request a new link
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {errorState === 'generic' && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-medium text-red-900">Unable to reset password</AlertTitle>
            <AlertDescription className="text-sm text-red-800">{errorMessage}</AlertDescription>
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
            name="newPassword"
            label={
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-slate-700">New Password</span>
                <span className="text-xs text-slate-500">Min. 8 characters</span>
              </div>
            }
            rules={[
              { required: true, message: 'Please enter a new password' },
              createZodAntdRule(passwordSchema),
            ]}
            className="mb-4"
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-11 rounded-lg border-slate-300 text-base"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span className="text-sm font-medium text-slate-700">Confirm Password</span>}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
            className="mb-6"
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-11 rounded-lg border-slate-300 text-base"
            />
          </Form.Item>

          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="h-11 w-full text-base font-medium shadow-sm transition-all"
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </Form>

        <div className="text-center">
          <Link
            href="/login"
            className={buttonVariants({
              variant: 'ghost',
              className:
                'text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5',
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
