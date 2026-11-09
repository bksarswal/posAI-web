'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Form } from 'antd';
import { AlertCircle, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { RestaurantFormFields } from './RestaurantFormFields';
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
          <RestaurantFormFields />

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
