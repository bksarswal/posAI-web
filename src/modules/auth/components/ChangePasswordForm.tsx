'use client';

import { useState } from 'react';
import { Form, Input } from 'antd';
import { AlertCircle, KeyRound, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { passwordSchema } from '@/shared/lib/validators';
import { useChangePassword, useLogout } from '../auth.hooks';
import type { ChangePasswordInput } from '../auth.types';

export function ChangePasswordForm() {
  const [form] = Form.useForm<ChangePasswordInput>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changePasswordMutation = useChangePassword();
  const logoutMutation = useLogout();

  const handleSubmit = async (values: ChangePasswordInput) => {
    setErrorMessage(null);

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    } catch (err) {
      const parsed = parseApiError(err);

      if (parsed.code === ERROR_CODES.INVALID_CURRENT_PASSWORD) {
        form.setFields([
          {
            name: 'currentPassword',
            errors: [parsed.message || 'The current password you entered is incorrect.'],
          },
        ]);
        return;
      }

      if (parsed.code === ERROR_CODES.RATE_LIMITED) {
        toast.error('Too many attempts. Please wait a few moments before trying again.');
        return;
      }

      if (Object.keys(parsed.fieldErrors).length > 0) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      setErrorMessage(parsed.message || 'Failed to change password. Please try again.');
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Change password
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          Enter your current password and choose a new password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorMessage && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-medium text-red-900">Error</AlertTitle>
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
            name="currentPassword"
            label={<span className="text-sm font-medium text-slate-700">Current Password</span>}
            rules={[{ required: true, message: 'Please enter your current password' }]}
            className="mb-4"
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 rounded-lg border-slate-300 text-base"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-slate-700">New Password</span>
                <span className="text-xs text-slate-500">Min. 8 characters</span>
              </div>
            }
            dependencies={['currentPassword']}
            rules={[
              { required: true, message: 'Please enter a new password' },
              createZodAntdRule(passwordSchema),
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const current = getFieldValue('currentPassword');
                  if (current && value === current) {
                    return Promise.reject(
                      new Error('New password must be different from current password'),
                    );
                  }
                  return Promise.resolve();
                },
              }),
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
            label={<span className="text-sm font-medium text-slate-700">Confirm New Password</span>}
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
            disabled={changePasswordMutation.isPending || logoutMutation.isPending}
            className="h-11 w-full text-base font-medium shadow-sm transition-all"
          >
            {changePasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </Form>

        <div className="text-center pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending || changePasswordMutation.isPending}
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
