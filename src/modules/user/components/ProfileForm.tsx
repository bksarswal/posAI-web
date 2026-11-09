'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Input } from 'antd';
import { AlertCircle, GitBranch, KeyRound, Loader2, Mail, Shield, Store, User } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { indianPhoneSchema } from '@/shared/lib/validators';
import { useCurrentUser, useUpdateProfile, USER_QUERY_KEYS } from '@/modules/user';
import type { CurrentUserResponse, UpdateProfileApiBody } from '@/modules/user';
import { profileFormSchema } from '../user.schema';

const nameValidationSchema = z
  .string()
  .trim()
  .min(2, 'Name must be between 2 and 100 characters')
  .max(100, 'Name must be between 2 and 100 characters');

export function ProfileForm() {
  const [form] = Form.useForm<{ name: string; phone?: string }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: meData, isLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();

  const user = meData?.data?.user;
  const restaurant = meData?.data?.restaurant;
  const branches = meData?.data?.branches ?? [];

  // Derive original values from user profile using useMemo
  const originalValues = useMemo(
    () => ({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    }),
    [user?.name, user?.phone],
  );

  // Sync form fields when user loads/updates
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user, form]);

  const watchedName = Form.useWatch('name', form);
  const watchedPhone = Form.useWatch('phone', form);

  const currentName = (watchedName !== undefined ? watchedName : (user?.name ?? '')).trim();
  const currentPhone = (
    watchedPhone !== undefined ? (watchedPhone ?? '') : (user?.phone ?? '')
  ).trim();
  const origName = originalValues.name.trim();
  const origPhone = originalValues.phone.trim();

  // If the phone was previously set, the user cannot remove it here
  const isPhoneCleared = Boolean(origPhone && !currentPhone);
  const isDirty = currentName !== origName || currentPhone !== origPhone;
  const isPhoneValid =
    !isPhoneCleared && (currentPhone === '' || indianPhoneSchema.safeParse(currentPhone).success);
  const isNameValid = currentName.length >= 2 && currentName.length <= 100;
  const isValid = !isPhoneCleared && isNameValid && isPhoneValid;
  const isSaveDisabled = !isDirty || !isValid || updateProfileMutation.isPending;

  const phoneRule = {
    validator: async (_: unknown, value: unknown) => {
      const strVal = typeof value === 'string' ? value.trim() : '';
      if (origPhone && !strVal) {
        return Promise.reject(new Error('Phone number cannot be removed here'));
      }
      if (!strVal) {
        return Promise.resolve();
      }
      const parsed = indianPhoneSchema.safeParse(strVal);
      if (!parsed.success) {
        return Promise.reject(new Error(parsed.error.issues[0]?.message));
      }
      return Promise.resolve();
    },
  };

  const handleSubmit = async (values: { name: string; phone?: string }) => {
    setErrorMessage(null);

    // Block clearing phone if it was previously set
    if (origPhone && !(values.phone ?? '').trim()) {
      form.setFields([
        {
          name: ['phone'],
          errors: ['Phone number cannot be removed here'],
        },
      ]);
      return;
    }

    const parsedResult = profileFormSchema.safeParse(values);
    if (!parsedResult.success) {
      const fieldErrors: Parameters<typeof form.setFields>[0] = [];
      for (const issue of parsedResult.error.issues) {
        const field = issue.path[0];
        if (field === 'name' || field === 'phone') {
          fieldErrors.push({
            name: [field],
            errors: [issue.message],
          });
        }
      }
      form.setFields(fieldErrors);
      return;
    }

    // STRICT: send name and phone ONLY when changed. Never send empty-string phone.
    const nameChanged = currentName !== origName;
    const phoneChanged = currentPhone !== origPhone;

    const payload: UpdateProfileApiBody = {};

    if (nameChanged) {
      payload.name = parsedResult.data.name;
    }

    if (phoneChanged && parsedResult.data.phone) {
      payload.phone = parsedResult.data.phone;
    }

    // If nothing changed, do not send
    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      const res = await updateProfileMutation.mutateAsync(payload);

      // Invalidate and await refetch of ['users', 'me']
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.me });
      await queryClient.refetchQueries({ queryKey: USER_QUERY_KEYS.me });

      // In TanStack Query v5, refetchQueries returns void. Read cache via getQueryData.
      const freshMe = queryClient.getQueryData<CurrentUserResponse>(USER_QUERY_KEYS.me);

      // Ensure cache is updated even if mocked network refetch did not populate
      if (res?.data?.user && (!freshMe || freshMe.data.user.name !== res.data.user.name)) {
        queryClient.setQueryData<CurrentUserResponse>(USER_QUERY_KEYS.me, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              user: {
                ...old.data.user,
                ...res.data.user,
              },
            },
          };
        });
      }

      const updatedUser = freshMe?.data?.user ?? res?.data?.user;
      const savedName = updatedUser?.name ?? payload.name ?? origName;
      const savedPhone = updatedUser?.phone ?? payload.phone ?? origPhone;

      form.setFieldsValue({
        name: savedName,
        phone: savedPhone,
      });

      toast.success('Profile updated successfully');
    } catch (err) {
      const parsed = parseApiError(err);

      // Map VALIDATION_ERROR field errors onto form fields
      if (
        parsed.code === ERROR_CODES.VALIDATION_ERROR &&
        Object.keys(parsed.fieldErrors).length > 0
      ) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      setErrorMessage(parsed.message || 'Failed to update profile. Please try again.');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Card className="border-slate-200">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Profile</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your personal account settings, restaurant association, and security credentials.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Unable to update profile</AlertTitle>
          <AlertDescription className="text-sm mt-1">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Read-Only Account Information Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Account Information
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            These system properties are assigned by your organization administrator and are
            read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </div>
              <p className="text-sm font-medium text-slate-900 break-all">{user.email}</p>
            </div>

            {/* Role */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <Shield className="h-3.5 w-3.5" />
                Role
              </div>
              <div className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {user.role}
              </div>
            </div>

            {/* Restaurant */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <Store className="h-3.5 w-3.5" />
                Restaurant
              </div>
              <p className="text-sm font-medium text-slate-900">
                {restaurant?.name ?? 'No restaurant assigned'}
              </p>
            </div>

            {/* Accessible Branches */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <GitBranch className="h-3.5 w-3.5" />
                Accessible Branches
              </div>
              {branches.length === 0 ? (
                <p className="text-sm text-slate-500">None</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {branches.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-800 border border-slate-200"
                    >
                      {b.name}
                      {b.isMain && (
                        <span className="ml-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                          Main
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Personal Details Form Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Personal Details
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Update your display name and Indian contact phone number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              name: user.name ?? '',
              phone: user.phone ?? '',
            }}
            requiredMark={false}
          >
            {/* Full Name Field */}
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-slate-700">Full Name</span>}
              rules={[createZodAntdRule(nameValidationSchema)]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input
                placeholder="Your full name"
                className="h-10 rounded-md border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </Form.Item>

            {/* Phone Number Field */}
            <Form.Item
              name="phone"
              label={
                <span className="text-sm font-medium text-slate-700">
                  Phone Number{' '}
                  <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </span>
              }
              rules={[phoneRule]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input
                placeholder="+919876543210"
                className="h-10 rounded-md border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm font-mono"
              />
            </Form.Item>

            <div className="flex items-center justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaveDisabled}
                className="min-w-[130px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Security / Password Management Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600" />
            Security & Authentication
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Manage your password and active sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Change Password</h4>
                <p className="text-sm text-slate-600 mt-0.5">
                  Changing your password signs you out of every device.
                </p>
              </div>
              <Link
                href="/change-password"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs border border-slate-300 hover:bg-slate-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
              >
                Change password
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
