'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Input } from 'antd';
import { AlertCircle, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import {
  indianPhoneSchema,
  gstinSchema,
  fssaiSchema,
  pincodeSchema,
} from '@/shared/lib/validators';
import { useCurrentUser } from '@/modules/user/user.hooks';
import { useCreateRestaurant } from '../restaurant.hooks';
import { createRestaurantSchema } from '../restaurant.schema';
import type { CreateRestaurantFormInput } from '../restaurant.schema';

export function RestaurantForm() {
  const [form] = Form.useForm<CreateRestaurantFormInput>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: meData, isLoading: isMeLoading } = useCurrentUser();
  const meContext = meData?.data;
  const user = meContext?.user;
  const restaurant = meContext?.restaurant;

  const createRestaurantMutation = useCreateRestaurant();

  // Redirect checks:
  // - Non-OWNER who opens this page: redirect to /dashboard
  // - OWNER who already has a restaurant: redirect to /dashboard
  useEffect(() => {
    if (isMeLoading || !user) return;

    if (user.role !== 'OWNER' || restaurant !== null) {
      router.push('/dashboard');
    }
  }, [isMeLoading, user, restaurant, router]);

  const handleSubmit = async (values: CreateRestaurantFormInput) => {
    setErrorMessage(null);

    // Validate with Zod schema to ensure transformations and parsing
    const parsedResult = createRestaurantSchema.safeParse(values);
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

    try {
      await createRestaurantMutation.mutateAsync(parsedResult.data);
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
      router.push('/onboarding/branch');
    } catch (err) {
      const parsed = parseApiError(err);

      // RESTAURANT_ALREADY_EXISTS: treat as already done, refetch me, go on.
      if (parsed.code === ERROR_CODES.RESTAURANT_ALREADY_EXISTS) {
        await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
        router.push('/onboarding/branch');
        return;
      }

      // Check if GSTIN error from API
      if (parsed.code === 'INVALID_GSTIN' || parsed.fieldErrors['gstin']) {
        form.setFields([
          {
            name: ['gstin'],
            errors: parsed.fieldErrors['gstin'] || [parsed.message || 'Invalid GSTIN format'],
          },
        ]);
        return;
      }

      if (Object.keys(parsed.fieldErrors).length > 0) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      setErrorMessage(parsed.message || 'Failed to create restaurant. Please try again.');
    }
  };

  if (isMeLoading || !user || user.role !== 'OWNER' || restaurant !== null) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Building2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Create Restaurant
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          Enter your restaurant details to get started with POSAI.
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
          {/* Restaurant Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-slate-700">Restaurant Name *</span>}
              rules={[
                { required: true, message: 'Restaurant name is required' },
                {
                  min: 2,
                  max: 100,
                  message: 'Restaurant name must be between 2 and 100 characters',
                },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. Spice Garden"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="text-sm font-medium text-slate-700">Phone Number *</span>}
              rules={[
                { required: true, message: 'Phone number is required' },
                createZodAntdRule(indianPhoneSchema),
              ]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. 9876543210"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label={<span className="text-sm font-medium text-slate-700">Email Address *</span>}
              rules={[
                { required: true, message: 'Email address is required' },
                { type: 'email', message: 'Invalid email address' },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="contact@restaurant.com"
                type="email"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>

            <Form.Item
              name="logoUrl"
              label={
                <span className="text-sm font-medium text-slate-700">Logo URL (Optional)</span>
              }
              className="mb-0"
            >
              <Input
                placeholder="https://example.com/logo.png"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>
          </div>

          {/* Tax & Registration (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="gstin"
              label={<span className="text-sm font-medium text-slate-700">GSTIN (Optional)</span>}
              rules={[
                {
                  validator: async (_, value) => {
                    if (!value || String(value).trim() === '') return Promise.resolve();
                    const res = gstinSchema.safeParse(value);
                    if (!res.success) {
                      return Promise.reject(
                        new Error(res.error.issues[0]?.message || 'Invalid GSTIN format'),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="29ABCDE1234F1Z5"
                className="h-11 rounded-lg border-slate-300 text-base uppercase"
              />
            </Form.Item>

            <Form.Item
              name="fssai"
              label={
                <span className="text-sm font-medium text-slate-700">FSSAI Number (Optional)</span>
              }
              rules={[
                {
                  validator: async (_, value) => {
                    if (!value || String(value).trim() === '') return Promise.resolve();
                    const res = fssaiSchema.safeParse(value);
                    if (!res.success) {
                      return Promise.reject(
                        new Error(
                          res.error.issues[0]?.message ||
                            'FSSAI license number must be exactly 14 digits',
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
                placeholder="14-digit FSSAI number"
                className="h-11 rounded-lg border-slate-300 text-base"
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
              disabled={createRestaurantMutation.isPending}
              className="h-11 w-full text-base font-medium shadow-sm transition-all"
            >
              {createRestaurantMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating restaurant...
                </>
              ) : (
                'Create Restaurant & Continue'
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
