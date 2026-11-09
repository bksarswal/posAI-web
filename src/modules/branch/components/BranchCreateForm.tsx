'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Form } from 'antd';
import { AlertCircle, GitBranch, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { createBranchSchema } from '../branch.schema';
import type { CreateBranchApiBody } from '../branch.types';
import { useCreateBranch, BRANCH_QUERY_KEYS } from '../branch.hooks';
import { BranchFormFields, type BranchFieldValues } from './BranchFormFields';

export function BranchCreateForm() {
  const [form] = Form.useForm<BranchFieldValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const createBranchMutation = useCreateBranch();

  const handleSubmit = async (values: BranchFieldValues) => {
    setErrorMessage(null);

    const parsedResult = createBranchSchema.safeParse({
      ...values,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    });

    if (!parsedResult.success) {
      const fieldErrors: Parameters<typeof form.setFields>[0] = [];
      for (const issue of parsedResult.error.issues) {
        const p0 = issue.path[0];
        const p1 = issue.path[1];
        if (p0 === 'name' || p0 === 'code' || p0 === 'phone') {
          fieldErrors.push({
            name: [p0],
            errors: [issue.message],
          });
        } else if (p0 === 'address' && typeof p1 === 'string') {
          fieldErrors.push({
            name: ['address', p1],
            errors: [issue.message],
          });
        }
      }
      form.setFields(fieldErrors);
      return;
    }

    // Build payload: never send isMain
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
      await queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
      await queryClient.refetchQueries({ queryKey: BRANCH_QUERY_KEYS.all });
      toast.success('Branch created successfully');
      router.push('/branches');
    } catch (err) {
      const parsed = parseApiError(err);

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

      if (Object.keys(parsed.fieldErrors).length > 0) {
        form.setFields(toFormFieldErrors(err) as unknown as Parameters<typeof form.setFields>[0]);
        return;
      }

      setErrorMessage(parsed.message || 'Failed to create branch. Please try again.');
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
              New Branch
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Add a new branch to your restaurant.
            </CardDescription>
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
          initialValues={{
            timezone: 'Asia/Kolkata',
            currency: 'INR',
          }}
          className="space-y-4"
        >
          <BranchFormFields codeReadOnly={false} />

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
                'Create Branch'
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
