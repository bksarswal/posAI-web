'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select } from 'antd';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { indianPhoneSchema } from '@/shared/lib/validators';
import { useCurrentUser } from '@/modules/user/user.hooks';
import type { UserRole } from '@/shared/lib/navigation';
import { useCreateStaff } from '../staff.hooks';
import { creatableRoles } from '../staff.permissions';
import { buildCreateStaffPayload, type StaffCreateFieldValues } from '../staff.payloadBuilder';
import { TempPasswordDialog } from './TempPasswordDialog';

export function StaffCreateForm() {
  const [form] = Form.useForm<StaffCreateFieldValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tempPasswordState, setTempPasswordState] = useState<{
    staffName: string;
    temporaryPassword: string;
  } | null>(null);

  const router = useRouter();
  const { data: meData } = useCurrentUser();
  const createStaffMutation = useCreateStaff();

  const actorRole = meData?.data?.user?.role as UserRole | undefined;
  const accessibleBranches = meData?.data?.branches ?? [];
  const allowedRoles = actorRole ? creatableRoles(actorRole) : [];

  const selectedRole = Form.useWatch('role', form);
  const isAdminRole = selectedRole === 'ADMIN';

  // Automatically clear branch selection when switching to ADMIN
  useEffect(() => {
    if (isAdminRole) {
      form.setFieldValue('branchIds', []);
    }
  }, [isAdminRole, form]);

  const handleSubmit = async (values: StaffCreateFieldValues) => {
    setErrorMessage(null);

    const payload = buildCreateStaffPayload(values);

    try {
      const res = await createStaffMutation.mutateAsync(payload);
      form.resetFields();
      const temporaryPassword = res?.data?.temporaryPassword;
      const staffName = res?.data?.user?.name || values.name || 'Staff Member';

      // Immediately reset mutation state so sensitive temporary password does not linger in TanStack Query
      createStaffMutation.reset();

      if (temporaryPassword) {
        setTempPasswordState({ staffName, temporaryPassword });
      } else {
        router.push('/staff');
      }
    } catch (err) {
      if (err) {
        const parsed = parseApiError(err);
        const formFieldErrors = toFormFieldErrors(err);
        if (formFieldErrors.length > 0) {
          const fields: Parameters<typeof form.setFields>[0] = [];
          for (const f of formFieldErrors) {
            const key = f.name[0];
            if (
              key === 'name' ||
              key === 'email' ||
              key === 'phone' ||
              key === 'role' ||
              key === 'branchIds'
            ) {
              fields.push({
                name: [key],
                errors: f.errors,
              });
            }
          }
          if (fields.length > 0) {
            form.setFields(fields);
            return;
          }
        }
        setErrorMessage(parsed.message || 'Failed to create staff member. Please try again.');
      }
    }
  };

  return (
    <>
      <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                New Staff Member
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Create a new staff account and generate their initial credentials.
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
            onValuesChange={(changedValues) => {
              if ('role' in changedValues && changedValues.role === 'ADMIN') {
                form.setFieldValue('branchIds', []);
              }
            }}
            requiredMark={false}
            className="space-y-4"
          >
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-slate-700">Full Name *</span>}
              rules={[
                { required: true, message: 'Full name is required' },
                { min: 2, max: 100, message: 'Name must be between 2 and 100 characters' },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. Ramesh Kumar"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span className="text-sm font-medium text-slate-700">Email Address *</span>}
              rules={[
                { required: true, message: 'Email address is required' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
              className="mb-0"
            >
              <Input
                type="email"
                placeholder="e.g. ramesh@restaurant.com"
                className="h-11 rounded-lg border-slate-300 text-base"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="text-sm font-medium text-slate-700">Phone (Optional)</span>}
              rules={[
                {
                  validator: async (_, value) => {
                    const strVal = typeof value === 'string' ? value.trim() : '';
                    if (!strVal) return Promise.resolve();
                    const res = indianPhoneSchema.safeParse(strVal);
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
              name="role"
              label={<span className="text-sm font-medium text-slate-700">Role *</span>}
              rules={[{ required: true, message: 'Please select a role' }]}
              className="mb-0"
            >
              <Select
                placeholder="Select role..."
                className="h-11 rounded-lg text-base"
                options={allowedRoles.map((role) => ({
                  label: role,
                  value: role,
                }))}
              />
            </Form.Item>

            {isAdminRole ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                ADMIN accounts operate tenant-wide across all branches. No branch assignment is
                required.
              </div>
            ) : (
              <Form.Item
                name="branchIds"
                label={
                  <span className="text-sm font-medium text-slate-700">Assigned Branches *</span>
                }
                rules={[
                  {
                    validator: async (_, value) => {
                      if (
                        !isAdminRole &&
                        (!value || (Array.isArray(value) && value.length === 0))
                      ) {
                        return Promise.reject(
                          new Error('Staff must be assigned to at least one branch'),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                className="mb-0"
              >
                <Select
                  mode="multiple"
                  placeholder="Select assigned branches..."
                  className="min-h-11 rounded-lg text-base"
                  options={accessibleBranches.map((branch) => ({
                    label: branch.name ? `${branch.name} (${branch.code})` : branch.code,
                    value: branch.id,
                  }))}
                />
              </Form.Item>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={createStaffMutation.isPending}
                className="h-11 w-full text-base font-medium shadow-sm transition-all"
              >
                {createStaffMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating staff member...
                  </>
                ) : (
                  'Create Staff Member'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <TempPasswordDialog
        open={Boolean(tempPasswordState)}
        staffName={tempPasswordState?.staffName}
        temporaryPassword={tempPasswordState?.temporaryPassword}
        onClose={() => {
          setTempPasswordState(null);
          router.push('/staff');
        }}
      />
    </>
  );
}
