'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Modal } from 'antd';
import { AlertCircle, GitBranch, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { getErrorMessage } from '@/shared/constants/errorMessages';
import { indianPhoneSchema, pincodeSchema } from '@/shared/lib/validators';
import { useBranch, useUpdateBranch, BRANCH_QUERY_KEYS } from '../branch.hooks';
import type { UpdateBranchApiBody } from '../branch.types';
import { buildUpdateBranchPayload, type BranchEditFieldValues } from '../branch.payloadBuilder';
import { BranchFormFields } from './BranchFormFields';

export interface BranchEditFormProps {
  branchId: string;
}

export function BranchEditForm({ branchId }: BranchEditFormProps) {
  const [form] = Form.useForm<BranchEditFieldValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: branchData, isLoading, error } = useBranch(branchId);
  const updateBranchMutation = useUpdateBranch(branchId);

  const branch = branchData?.data?.branch;

  const originalValues = useMemo<BranchEditFieldValues>(() => {
    if (!branch) return {};
    return {
      name: branch.name ?? '',
      phone: branch.phone ?? '',
      timezone: branch.timezone ?? 'Asia/Kolkata',
      status: branch.status,
      address: {
        line1: branch.address?.line1 ?? '',
        line2: branch.address?.line2 ?? '',
        city: branch.address?.city ?? '',
        state: branch.address?.state ?? '',
        pincode: branch.address?.pincode ?? '',
      },
    };
  }, [branch]);

  useEffect(() => {
    if (branch) {
      form.setFieldsValue({
        name: branch.name,
        phone: branch.phone ?? '',
        timezone: branch.timezone,
        address: {
          line1: branch.address?.line1 ?? '',
          line2: branch.address?.line2 ?? '',
          city: branch.address?.city ?? '',
          state: branch.address?.state ?? '',
          pincode: branch.address?.pincode ?? '',
        },
      });
    }
  }, [branch, form]);

  const watchedValues = Form.useWatch([], form);

  const currentName = (watchedValues?.name ?? '').trim();
  const currentPhone = (watchedValues?.phone ?? '').trim();
  const currentTimezone = (watchedValues?.timezone ?? '').trim();
  const currentStatus = watchedValues?.status;

  const currentAddress = {
    line1: (watchedValues?.address?.line1 ?? '').trim(),
    line2: (watchedValues?.address?.line2 ?? '').trim(),
    city: (watchedValues?.address?.city ?? '').trim(),
    state: (watchedValues?.address?.state ?? '').trim(),
    pincode: (watchedValues?.address?.pincode ?? '').trim(),
  };

  const origName = (originalValues.name ?? '').trim();
  const origPhone = (originalValues.phone ?? '').trim();
  const origTimezone = (originalValues.timezone ?? '').trim();
  const origStatus = originalValues.status;

  const origAddress = {
    line1: (originalValues.address?.line1 ?? '').trim(),
    line2: (originalValues.address?.line2 ?? '').trim(),
    city: (originalValues.address?.city ?? '').trim(),
    state: (originalValues.address?.state ?? '').trim(),
    pincode: (originalValues.address?.pincode ?? '').trim(),
  };

  const nameChanged = currentName !== origName;
  const phoneChanged = currentPhone !== origPhone;
  const timezoneChanged = currentTimezone !== origTimezone;
  const statusChanged = currentStatus !== origStatus;

  const anyAddressChanged =
    currentAddress.line1 !== origAddress.line1 ||
    currentAddress.line2 !== origAddress.line2 ||
    currentAddress.city !== origAddress.city ||
    currentAddress.state !== origAddress.state ||
    currentAddress.pincode !== origAddress.pincode;

  const isDirty =
    nameChanged || phoneChanged || timezoneChanged || statusChanged || anyAddressChanged;

  // Block saving if a previously filled optional field (phone, line2) was cleared
  const hasClearedFilledField = Boolean(
    (origPhone && !currentPhone) || (origAddress.line2 && !currentAddress.line2),
  );

  // Basic validity checks
  const isNameValid = currentName.length >= 2 && currentName.length <= 100;
  const isPhoneValid = !currentPhone || indianPhoneSchema.safeParse(currentPhone).success;
  const isAddressValid =
    currentAddress.line1.length >= 1 &&
    currentAddress.city.length >= 1 &&
    currentAddress.state.length >= 1 &&
    pincodeSchema.safeParse(currentAddress.pincode).success;

  const isValid = !hasClearedFilledField && isNameValid && isPhoneValid && isAddressValid;
  const isSaveDisabled = !isDirty || !isValid || updateBranchMutation.isPending;

  const handleSubmit = async (values: BranchEditFieldValues) => {
    setErrorMessage(null);

    // Block saving if any previously filled optional field was cleared
    if (origPhone && !values.phone?.trim()) {
      form.setFields([{ name: ['phone'], errors: ["This field can't be removed here"] }]);
      return;
    }
    if (origAddress.line2 && !values.address?.line2?.trim()) {
      form.setFields([
        { name: ['address', 'line2'], errors: ["This field can't be removed here"] },
      ]);
      return;
    }

    const payload = buildUpdateBranchPayload(values, originalValues);

    if (Object.keys(payload).length === 0) return;

    try {
      const res = await updateBranchMutation.mutateAsync(payload as UpdateBranchApiBody);

      await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
      await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.all });
      await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(branchId) });
      await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.detail(branchId) });
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'me'] });

      const updatedBranch = res?.data?.branch;
      if (updatedBranch) {
        form.setFieldsValue({
          name: updatedBranch.name,
          phone: updatedBranch.phone ?? '',
          timezone: updatedBranch.timezone,
          address: {
            line1: updatedBranch.address?.line1 ?? '',
            line2: updatedBranch.address?.line2 ?? '',
            city: updatedBranch.address?.city ?? '',
            state: updatedBranch.address?.state ?? '',
            pincode: updatedBranch.address?.pincode ?? '',
          },
        });
      }

      toast.success('Branch updated successfully');
    } catch (err) {
      const parsed = parseApiError(err);

      if (parsed.code === ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH) {
        setErrorMessage(getErrorMessage(ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH, parsed.message));
        return;
      }

      if (parsed.code === ERROR_CODES.FORBIDDEN) {
        setErrorMessage(getErrorMessage(ERROR_CODES.FORBIDDEN, parsed.message));
        return;
      }

      if (Object.keys(parsed.fieldErrors).length > 0) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      setErrorMessage(parsed.message || 'Failed to update branch. Please try again.');
    }
  };

  const handleStatusToggle = () => {
    if (!branch) return;

    const newStatus: 'ACTIVE' | 'INACTIVE' = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (newStatus === 'INACTIVE') {
      if (branch.isMain) {
        setErrorMessage(getErrorMessage(ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH));
        return;
      }

      Modal.confirm({
        title: 'Deactivate Branch',
        content: `Are you sure you want to deactivate "${branch.name}"? Staff assigned to this branch will lose access.`,
        okText: 'Deactivate',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            setErrorMessage(null);
            await updateBranchMutation.mutateAsync({ status: 'INACTIVE' });
            await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
            await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.all });
            await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(branchId) });
            await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.detail(branchId) });
            await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
            await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
            toast.success('Branch deactivated');
          } catch (err) {
            const parsed = parseApiError(err);
            if (parsed.code === ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH) {
              setErrorMessage(
                getErrorMessage(ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH, parsed.message),
              );
            } else {
              setErrorMessage(parsed.message || 'Failed to deactivate branch.');
            }
          }
        },
      });
    } else {
      // Re-activate: no confirmation needed
      updateBranchMutation
        .mutateAsync({ status: 'ACTIVE' })
        .then(async () => {
          await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
          await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.all });
          await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(branchId) });
          await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.detail(branchId) });
          await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
          await queryClient.refetchQueries({ queryKey: ['users', 'me'] });
          toast.success('Branch activated');
        })
        .catch((err) => {
          const parsed = parseApiError(err);
          setErrorMessage(parsed.message || 'Failed to activate branch.');
        });
    }
  };

  // 404 state
  const status = error ? parseApiError(error).status : undefined;
  if (!isLoading && status === 404) {
    return (
      <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <GitBranch className="mx-auto h-12 w-12 text-slate-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Branch not found</h2>
            <p className="text-sm text-slate-500 mt-1">
              This branch does not exist or you don&apos;t have access to it.
            </p>
          </div>
          <Link
            href="/branches"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Branches
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !branch) {
    return (
      <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
        <CardContent className="space-y-4 py-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                Edit Branch
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                {branch.name} &middot; {branch.code}
                {branch.isMain && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Main
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {/* Status toggle */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                branch.status === 'ACTIVE'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {branch.status}
            </span>
            {branch.isMain ? (
              <span
                title="Main branch cannot be deactivated"
                className="text-xs text-slate-400 cursor-not-allowed"
              >
                Toggle disabled
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStatusToggle}
                disabled={updateBranchMutation.isPending}
              >
                {branch.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        </div>
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
          <BranchFormFields
            codeReadOnly={true}
            codeValue={branch.code}
            currencyValue={branch.currency}
            originalValues={originalValues}
            isSettings={true}
          />

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSaveDisabled}
              className="h-11 w-full text-base font-medium shadow-sm transition-all"
            >
              {updateBranchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Form>

        <div className="pt-2 border-t border-slate-100">
          <Link href="/branches" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to Branches
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
