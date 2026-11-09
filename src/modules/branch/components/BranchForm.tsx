'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Input } from 'antd';
import { AlertCircle, GitBranch, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { indianPhoneSchema, pincodeSchema } from '@/shared/lib/validators';
import { useCurrentUser } from '@/modules/user/user.hooks';
import type { CurrentUserResponse } from '@/modules/user/user.types';
import { useCreateBranch } from '../branch.hooks';
import { createBranchSchema } from '../branch.schema';
import type { CreateBranchApiBody } from '../branch.types';

export function BranchForm() {
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: meData, isLoading: isMeLoading } = useCurrentUser();
  const meContext = meData?.data;
  const user = meContext?.user;
  const branches = useMemo(() => meContext?.branches ?? [], [meContext?.branches]);

  const createBranchMutation = useCreateBranch();

  // Role & setup redirect checks:
  // - Roles other than OWNER/ADMIN who open it -> /dashboard
  // - Already has a branch -> /dashboard
  useEffect(() => {
    if (isMeLoading || !user) return;

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (branches.length > 0) {
      router.push('/dashboard');
    }
  }, [isMeLoading, user, branches, router]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setErrorMessage(null);

    // Validate with createBranchSchema
    const parsedResult = createBranchSchema.safeParse({
      ...values,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    });

    if (!parsedResult.success) {
      const fieldErrors: Parameters<typeof form.setFields>[0] = [];
      for (const issue of parsedResult.error.issues) {
        fieldErrors.push({
          name: issue.path as (string | number)[],
          errors: [issue.message],
        });
      }
      form.setFields(fieldErrors);
      return;
    }

    // Payload: ensure isMain, tenantId, etc. are never included
    const payload: CreateBranchApiBody = {
      name: parsedResult.data.name,
      code: parsedResult.data.code,
      address: {
        line1: parsedResult.data.address.line1,
        ...(parsedResult.data.address.line2 ? { line2: parsedResult.data.address.line2 } : {}),
        city: parsedResult.data.address.city,
        state: parsedResult.data.address.state,
        pincode: parsedResult.data.address.pincode,
      },
      ...(parsedResult.data.phone ? { phone: parsedResult.data.phone } : {}),
      timezone: parsedResult.data.timezone,
      currency: parsedResult.data.currency,
    };

    try {
      await createBranchMutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
      router.push('/dashboard');
    } catch (err) {
      const parsed = parseApiError(err);

      // BRANCH_CODE_EXISTS -> error on the code field
      if (parsed.code === ERROR_CODES.BRANCH_CODE_EXISTS) {
        form.setFields([
          {
            name: ['code'],
            errors: [
              parsed.message ||
                'A branch with this code already exists. Please choose a unique code.',
            ],
          },
        ]);
        return;
      }

      // RESTAURANT_REQUIRED -> refetch me (guard will redirect)
      if (parsed.code === ERROR_CODES.RESTAURANT_REQUIRED) {
        await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
        return;
      }

      // BRANCH_CREATION_CONFLICT -> refetch me; if a branch exists, go on, else show a retry message
      if (parsed.code === ERROR_CODES.BRANCH_CREATION_CONFLICT) {
        await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
        const latestData = queryClient.getQueryData<CurrentUserResponse>(['users', 'me']);
        const branchCount = latestData?.data?.branches?.length ?? 0;

        if (branchCount > 0) {
          router.push('/dashboard');
          return;
        }

        setErrorMessage('Branch creation conflicted, please try again');
        return;
      }

      if (Object.keys(parsed.fieldErrors).length > 0) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      setErrorMessage(parsed.message || 'Failed to create branch. Please try again.');
    }
  };

  if (
    isMeLoading ||
    !user ||
    (user.role !== 'OWNER' && user.role !== 'ADMIN') ||
    branches.length > 0
  ) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <GitBranch className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Create First Branch
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          Set up your primary restaurant outlet to begin taking orders.
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
          initialValues={{
            timezone: 'Asia/Kolkata',
            currency: 'INR',
          }}
          className="space-y-4"
        >
          {/* Branch Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-slate-700">Branch Name *</span>}
              rules={[
                { required: true, message: 'Branch name is required' },
                { min: 2, max: 100, message: 'Branch name must be between 2 and 100 characters' },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. Main Branch"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>

            <Form.Item
              name="code"
              label={<span className="text-sm font-medium text-slate-700">Branch Code *</span>}
              rules={[
                { required: true, message: 'Branch code is required' },
                {
                  validator: async (_, value) => {
                    if (!value) return Promise.resolve();
                    const trimmed = String(value).trim().toUpperCase();
                    if (!/^[A-Z0-9-]{2,10}$/.test(trimmed)) {
                      return Promise.reject(
                        new Error(
                          'Branch code must be 2-10 characters consisting of uppercase letters, digits, or hyphens',
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. MAIN-01"
                className="h-11 rounded-lg border-slate-300 text-base uppercase"
                onChange={(e) => {
                  form.setFieldValue('code', e.target.value.toUpperCase());
                }}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="phone"
              label={<span className="text-sm font-medium text-slate-700">Phone (Optional)</span>}
              rules={[
                {
                  validator: async (_, value) => {
                    if (!value || String(value).trim() === '') return Promise.resolve();
                    const res = indianPhoneSchema.safeParse(value);
                    if (!res.success) {
                      return Promise.reject(
                        new Error(
                          'Invalid Indian phone number. Must be 10 digits starting with 6-9, optionally prefixed with +91',
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. 9876543210"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>

            <Form.Item
              name="timezone"
              label={<span className="text-sm font-medium text-slate-700">Timezone</span>}
              className="mb-0"
            >
              <Input
                disabled
                className="h-11 rounded-lg border-slate-300 bg-slate-50 text-slate-600 text-base"
              />
            </Form.Item>

            <Form.Item
              name="currency"
              label={<span className="text-sm font-medium text-slate-700">Currency</span>}
              className="mb-0"
            >
              <Input
                disabled
                className="h-11 rounded-lg border-slate-300 bg-slate-50 text-slate-600 text-base"
              />
            </Form.Item>
          </div>

          {/* Address Section */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Address Details</h3>

            <div className="space-y-4">
              <Form.Item
                name={['address', 'line1']}
                label={<span className="text-sm font-medium text-slate-700">Address Line 1 *</span>}
                rules={[{ required: true, message: 'Address line1 is required' }]}
                className="mb-0"
              >
                <Input
                  placeholder="Street address, building name"
                  className="h-11 rounded-lg border-slate-300 text-base"
                />
              </Form.Item>

              <Form.Item
                name={['address', 'line2']}
                label={
                  <span className="text-sm font-medium text-slate-700">
                    Address Line 2 (Optional)
                  </span>
                }
                className="mb-0"
              >
                <Input
                  placeholder="Apartment, suite, unit (optional)"
                  className="h-11 rounded-lg border-slate-300 text-base"
                />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  name={['address', 'city']}
                  label={<span className="text-sm font-medium text-slate-700">City *</span>}
                  rules={[{ required: true, message: 'City is required' }]}
                  className="mb-0"
                >
                  <Input
                    placeholder="City"
                    className="h-11 rounded-lg border-slate-300 text-base"
                  />
                </Form.Item>

                <Form.Item
                  name={['address', 'state']}
                  label={<span className="text-sm font-medium text-slate-700">State *</span>}
                  rules={[{ required: true, message: 'State is required' }]}
                  className="mb-0"
                >
                  <Input
                    placeholder="State"
                    className="h-11 rounded-lg border-slate-300 text-base"
                  />
                </Form.Item>

                <Form.Item
                  name={['address', 'pincode']}
                  label={<span className="text-sm font-medium text-slate-700">PIN Code *</span>}
                  rules={[
                    { required: true, message: 'PIN code is required' },
                    createZodAntdRule(pincodeSchema),
                  ]}
                  className="mb-0"
                >
                  <Input
                    placeholder="6-digit PIN"
                    className="h-11 rounded-lg border-slate-300 text-base"
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={createBranchMutation.isPending}
              className="h-11 w-full text-base font-medium shadow-sm transition-all"
            >
              {createBranchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating branch...
                </>
              ) : (
                'Create Branch & Complete Setup'
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
