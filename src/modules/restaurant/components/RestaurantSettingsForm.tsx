'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Form } from 'antd';
import { AlertCircle, Building2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { getErrorMessage } from '@/shared/constants/errorMessages';
import {
  indianPhoneSchema,
  gstinSchema,
  fssaiSchema,
  pincodeSchema,
} from '@/shared/lib/validators';
import { useCurrentUser } from '@/modules/user/user.hooks';
import type { CurrentUserResponse } from '@/modules/user/user.types';
import { useUpdateRestaurant } from '../restaurant.hooks';
import { RestaurantFormFields, type RestaurantFieldValues } from './RestaurantFormFields';

export interface RestaurantSettingsPayload {
  name?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  fssai?: string;
  logoUrl?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export function buildUpdateRestaurantPayload(
  currentValues: RestaurantFieldValues,
  originalValues: RestaurantFieldValues,
): RestaurantSettingsPayload {
  const payload: RestaurantSettingsPayload = {};

  const currentName = (currentValues.name ?? '').trim();
  const currentPhone = (currentValues.phone ?? '').trim();
  const currentEmail = (currentValues.email ?? '').trim();
  const currentGstin = (currentValues.gstin ?? '').trim();
  const currentFssai = (currentValues.fssai ?? '').trim();
  const currentLogoUrl = (currentValues.logoUrl ?? '').trim();

  const currentAddress = {
    line1: (currentValues.address?.line1 ?? '').trim(),
    line2: (currentValues.address?.line2 ?? '').trim(),
    city: (currentValues.address?.city ?? '').trim(),
    state: (currentValues.address?.state ?? '').trim(),
    pincode: (currentValues.address?.pincode ?? '').trim(),
  };

  const origName = (originalValues.name ?? '').trim();
  const origPhone = (originalValues.phone ?? '').trim();
  const origEmail = (originalValues.email ?? '').trim();
  const origGstin = (originalValues.gstin ?? '').trim();
  const origFssai = (originalValues.fssai ?? '').trim();
  const origLogoUrl = (originalValues.logoUrl ?? '').trim();

  const origAddress = {
    line1: (originalValues.address?.line1 ?? '').trim(),
    line2: (originalValues.address?.line2 ?? '').trim(),
    city: (originalValues.address?.city ?? '').trim(),
    state: (originalValues.address?.state ?? '').trim(),
    pincode: (originalValues.address?.pincode ?? '').trim(),
  };

  const nameChanged = currentName !== origName;
  const phoneChanged = currentPhone !== origPhone;
  const emailChanged = currentEmail !== origEmail;
  const gstinChanged = currentGstin !== origGstin;
  const fssaiChanged = currentFssai !== origFssai;
  const logoUrlChanged = currentLogoUrl !== origLogoUrl;

  const line1Changed = currentAddress.line1 !== origAddress.line1;
  const line2Changed = currentAddress.line2 !== origAddress.line2;
  const cityChanged = currentAddress.city !== origAddress.city;
  const stateChanged = currentAddress.state !== origAddress.state;
  const pincodeChanged = currentAddress.pincode !== origAddress.pincode;

  const anyAddressChanged =
    line1Changed || line2Changed || cityChanged || stateChanged || pincodeChanged;

  if (nameChanged && currentName) {
    payload.name = currentName;
  }

  if (phoneChanged && currentPhone) {
    const parsedPhone = indianPhoneSchema.safeParse(currentPhone);
    payload.phone = parsedPhone.success ? parsedPhone.data : currentPhone;
  }

  if (emailChanged && currentEmail) {
    payload.email = currentEmail.toLowerCase();
  }

  if (gstinChanged && currentGstin) {
    payload.gstin = currentGstin.toUpperCase();
  }

  if (fssaiChanged && currentFssai) {
    payload.fssai = currentFssai;
  }

  if (logoUrlChanged && currentLogoUrl) {
    payload.logoUrl = currentLogoUrl;
  }

  // If any address field changed, send the complete address object
  if (anyAddressChanged) {
    payload.address = {
      line1: currentAddress.line1,
      ...(currentAddress.line2 ? { line2: currentAddress.line2 } : {}),
      city: currentAddress.city,
      state: currentAddress.state,
      pincode: currentAddress.pincode,
    };
  }

  return payload;
}

export function RestaurantSettingsForm() {
  const [form] = Form.useForm<RestaurantFieldValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: meData, isLoading } = useCurrentUser();
  const updateRestaurantMutation = useUpdateRestaurant();

  const restaurant = meData?.data?.restaurant;

  // Derive original values from me.restaurant in cache
  const originalValues = useMemo<RestaurantFieldValues>(() => {
    if (!restaurant) return {};
    return {
      name: restaurant.name ?? '',
      phone: restaurant.phone ?? '',
      email: restaurant.email ?? '',
      logoUrl: restaurant.logoUrl ?? '',
      gstin: restaurant.gstin ?? '',
      fssai: restaurant.fssai ?? '',
      address: {
        line1: restaurant.address?.line1 ?? '',
        line2: restaurant.address?.line2 ?? '',
        city: restaurant.address?.city ?? '',
        state: restaurant.address?.state ?? '',
        pincode: restaurant.address?.pincode ?? '',
      },
    };
  }, [restaurant]);

  // Sync form initial values when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      form.setFieldsValue(originalValues);
    }
  }, [restaurant, originalValues, form]);

  const watchedValues = Form.useWatch([], form);

  const currentName = (
    watchedValues?.name !== undefined ? watchedValues.name : (restaurant?.name ?? '')
  ).trim();
  const currentPhone = (
    watchedValues?.phone !== undefined ? watchedValues.phone : (restaurant?.phone ?? '')
  ).trim();
  const currentEmail = (
    watchedValues?.email !== undefined ? watchedValues.email : (restaurant?.email ?? '')
  ).trim();
  const currentGstin = (
    watchedValues?.gstin !== undefined ? (watchedValues.gstin ?? '') : (restaurant?.gstin ?? '')
  ).trim();
  const currentFssai = (
    watchedValues?.fssai !== undefined ? (watchedValues.fssai ?? '') : (restaurant?.fssai ?? '')
  ).trim();
  const currentLogoUrl = (
    watchedValues?.logoUrl !== undefined
      ? (watchedValues.logoUrl ?? '')
      : (restaurant?.logoUrl ?? '')
  ).trim();

  const currentAddress = {
    line1: (watchedValues?.address?.line1 !== undefined
      ? watchedValues.address.line1
      : (restaurant?.address?.line1 ?? '')
    ).trim(),
    line2: (watchedValues?.address?.line2 !== undefined
      ? (watchedValues.address.line2 ?? '')
      : (restaurant?.address?.line2 ?? '')
    ).trim(),
    city: (watchedValues?.address?.city !== undefined
      ? watchedValues.address.city
      : (restaurant?.address?.city ?? '')
    ).trim(),
    state: (watchedValues?.address?.state !== undefined
      ? watchedValues.address.state
      : (restaurant?.address?.state ?? '')
    ).trim(),
    pincode: (watchedValues?.address?.pincode !== undefined
      ? watchedValues.address.pincode
      : (restaurant?.address?.pincode ?? '')
    ).trim(),
  };

  // Change detection
  const nameChanged = currentName !== (originalValues.name ?? '').trim();
  const phoneChanged = currentPhone !== (originalValues.phone ?? '').trim();
  const emailChanged = currentEmail !== (originalValues.email ?? '').trim();
  const gstinChanged = currentGstin !== (originalValues.gstin ?? '').trim();
  const fssaiChanged = currentFssai !== (originalValues.fssai ?? '').trim();
  const logoUrlChanged = currentLogoUrl !== (originalValues.logoUrl ?? '').trim();

  const line1Changed = currentAddress.line1 !== (originalValues.address?.line1 ?? '').trim();
  const line2Changed = currentAddress.line2 !== (originalValues.address?.line2 ?? '').trim();
  const cityChanged = currentAddress.city !== (originalValues.address?.city ?? '').trim();
  const stateChanged = currentAddress.state !== (originalValues.address?.state ?? '').trim();
  const pincodeChanged = currentAddress.pincode !== (originalValues.address?.pincode ?? '').trim();

  const anyAddressChanged =
    line1Changed || line2Changed || cityChanged || stateChanged || pincodeChanged;

  const isDirty =
    nameChanged ||
    phoneChanged ||
    emailChanged ||
    gstinChanged ||
    fssaiChanged ||
    logoUrlChanged ||
    anyAddressChanged;

  // Check if any field that previously had a value is now cleared
  const hasClearedFilledField = Boolean(
    (originalValues.gstin?.trim() && !currentGstin) ||
    (originalValues.fssai?.trim() && !currentFssai) ||
    (originalValues.logoUrl?.trim() && !currentLogoUrl) ||
    (originalValues.address?.line2?.trim() && !currentAddress.line2) ||
    (originalValues.address?.line1?.trim() && !currentAddress.line1) ||
    (originalValues.address?.city?.trim() && !currentAddress.city) ||
    (originalValues.address?.state?.trim() && !currentAddress.state) ||
    (originalValues.address?.pincode?.trim() && !currentAddress.pincode),
  );

  // Field validation
  const isNameValid = currentName.length >= 2 && currentName.length <= 100;
  const isPhoneValid = indianPhoneSchema.safeParse(currentPhone).success;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail);
  const isGstinValid = !currentGstin || gstinSchema.safeParse(currentGstin).success;
  const isFssaiValid = !currentFssai || fssaiSchema.safeParse(currentFssai).success;
  const isLogoValid =
    !currentLogoUrl ||
    (currentLogoUrl.length <= 500 &&
      currentLogoUrl.startsWith('https://') &&
      (() => {
        try {
          new URL(currentLogoUrl);
          return true;
        } catch {
          return false;
        }
      })());

  const isAddressValid =
    currentAddress.line1.length >= 1 &&
    currentAddress.city.length >= 1 &&
    currentAddress.state.length >= 1 &&
    pincodeSchema.safeParse(currentAddress.pincode).success;

  const isValid =
    !hasClearedFilledField &&
    isNameValid &&
    isPhoneValid &&
    isEmailValid &&
    isGstinValid &&
    isFssaiValid &&
    isLogoValid &&
    isAddressValid;

  const isSaveDisabled = !isDirty || !isValid || updateRestaurantMutation.isPending;

  const handleSubmit = async (values: RestaurantFieldValues) => {
    setErrorMessage(null);

    // Block saving if any previously filled field was cleared
    if (originalValues.gstin?.trim() && !values.gstin?.trim()) {
      form.setFields([{ name: ['gstin'], errors: ["This field can't be removed here"] }]);
      return;
    }
    if (originalValues.fssai?.trim() && !values.fssai?.trim()) {
      form.setFields([{ name: ['fssai'], errors: ["This field can't be removed here"] }]);
      return;
    }
    if (originalValues.logoUrl?.trim() && !values.logoUrl?.trim()) {
      form.setFields([{ name: ['logoUrl'], errors: ["This field can't be removed here"] }]);
      return;
    }
    if (originalValues.address?.line2?.trim() && !values.address?.line2?.trim()) {
      form.setFields([
        { name: ['address', 'line2'], errors: ["This field can't be removed here"] },
      ]);
      return;
    }

    // Build partial request body: send ONLY changed fields
    const payload = buildUpdateRestaurantPayload(values, originalValues);

    // If nothing changed, do not send
    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      const res = await updateRestaurantMutation.mutateAsync(payload);

      // Refetch ['users', 'me'] and read cache via getQueryData
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'me'] });

      const freshMe = queryClient.getQueryData<CurrentUserResponse>(['users', 'me']);

      // Ensure cache is updated even if mock refetch did not hit network
      if (
        res?.data?.restaurant &&
        (!freshMe || freshMe.data.restaurant?.name !== res.data.restaurant.name)
      ) {
        queryClient.setQueryData<CurrentUserResponse>(['users', 'me'], (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              restaurant: {
                ...old.data.restaurant,
                ...res.data.restaurant,
              },
            },
          };
        });
      }

      const updatedRest = freshMe?.data?.restaurant ?? res?.data?.restaurant;
      if (updatedRest) {
        form.setFieldsValue({
          name: updatedRest.name,
          phone: updatedRest.phone,
          email: updatedRest.email,
          logoUrl: updatedRest.logoUrl ?? '',
          gstin: updatedRest.gstin ?? '',
          fssai: updatedRest.fssai ?? '',
          address: {
            line1: updatedRest.address.line1,
            line2: updatedRest.address.line2 ?? '',
            city: updatedRest.address.city,
            state: updatedRest.address.state,
            pincode: updatedRest.address.pincode,
          },
        });
      }

      toast.success('Restaurant settings updated successfully');
    } catch (err) {
      const parsed = parseApiError(err);

      // Map VALIDATION_ERROR field errors onto the form fields
      if (
        parsed.code === ERROR_CODES.VALIDATION_ERROR &&
        Object.keys(parsed.fieldErrors).length > 0
      ) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      // Handle 403 Forbidden
      if (parsed.status === 403 || parsed.code === ERROR_CODES.FORBIDDEN) {
        setErrorMessage(
          parsed.message ||
            getErrorMessage(
              ERROR_CODES.FORBIDDEN,
              'You do not have permission to update restaurant settings.',
            ),
        );
        return;
      }

      setErrorMessage(parsed.message || 'Failed to update restaurant settings. Please try again.');
    }
  };

  if (isLoading || !restaurant) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Card className="border-slate-200">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Restaurant Settings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your restaurant profile, legal registrations, contact information, and primary
          address.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Unable to update settings</AlertTitle>
          <AlertDescription className="text-sm mt-1">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Profile & Registration
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Keep your business details up to date. Address updates require complete postal details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={originalValues}
            requiredMark={false}
            className="space-y-4"
          >
            <RestaurantFormFields originalValues={originalValues} isSettings />

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isSaveDisabled}
                className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {updateRestaurantMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
