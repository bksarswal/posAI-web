'use client';

import { useEffect, useState } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { AlertCircle, Loader2, UserCog } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { indianPhoneSchema } from '@/shared/lib/validators';
import { useCurrentUser } from '@/modules/user/user.hooks';
import type { UserRole } from '@/shared/lib/navigation';
import { useUpdateStaff } from '../staff.hooks';
import { creatableRoles } from '../staff.permissions';
import { buildUpdateStaffPayload, type StaffEditFieldValues } from '../staff.payloadBuilder';
import type { StaffItem } from '../staff.types';

const EDITABLE_FIELDS = ['name', 'phone', 'role', 'branchIds'] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

function isEditableField(v: unknown): v is EditableField {
  return (EDITABLE_FIELDS as readonly unknown[]).includes(v);
}

export interface StaffEditModalProps {
  open: boolean;
  staff: StaffItem | null;
  onClose: () => void;
}

export function StaffEditModal({ open, staff, onClose }: StaffEditModalProps) {
  const [form] = Form.useForm<StaffEditFieldValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prevStaffId, setPrevStaffId] = useState(staff?.id);
  if (staff?.id !== prevStaffId) {
    setPrevStaffId(staff?.id);
    setErrorMessage(null);
  }

  const { data: meData } = useCurrentUser();
  const updateMutation = useUpdateStaff(staff?.id ?? '');

  const actorRole = meData?.data?.user?.role as UserRole | undefined;
  const accessibleBranches = meData?.data?.branches ?? [];

  // Roles the actor can assign — OWNER can also assign ADMIN
  const editableRoles = actorRole ? creatableRoles(actorRole) : [];
  // Also include the target's current role in the list (even if actor can't promote there)
  const roleOptions = staff
    ? [...new Set([...(staff.role !== 'OWNER' ? [staff.role] : []), ...editableRoles])]
    : editableRoles;

  const watchedRole = Form.useWatch('role', form);
  const effectiveRole = watchedRole ?? staff?.role;
  const isAdminRole = effectiveRole === 'ADMIN';

  useEffect(() => {
    if (open && staff) {
      form.setFieldsValue({
        name: staff.name,
        phone: staff.phone ?? '',
        role: staff.role,
        branchIds: staff.branchIds,
      });
    }
  }, [open, staff, form]);

  // Clear branchIds when switching to ADMIN
  useEffect(() => {
    if (isAdminRole) {
      form.setFieldValue('branchIds', []);
    }
  }, [isAdminRole, form]);

  const handleClose = () => {
    form.resetFields();
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (values: StaffEditFieldValues) => {
    if (!staff) return;
    setErrorMessage(null);

    const original: StaffEditFieldValues = {
      name: staff.name,
      phone: staff.phone ?? '',
      role: staff.role,
      branchIds: staff.branchIds,
    };

    const payload = buildUpdateStaffPayload(original, values);

    // Nothing changed
    if (Object.keys(payload).length === 0) {
      handleClose();
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      handleClose();
    } catch (err) {
      if (err) {
        const formFieldErrors = toFormFieldErrors(err);
        const matchingFields: { name: [EditableField]; errors: string[] }[] = [];
        const unmappedErrors: string[] = [];

        for (const f of formFieldErrors) {
          const fieldName = f.name[0];
          if (f.name.length === 1 && isEditableField(fieldName)) {
            matchingFields.push({ name: [fieldName], errors: f.errors });
          } else {
            unmappedErrors.push(...f.errors);
          }
        }

        if (matchingFields.length > 0) {
          form.setFields(matchingFields);
        }

        if (unmappedErrors.length > 0) {
          setErrorMessage(unmappedErrors.join(', '));
        } else if (matchingFields.length === 0) {
          setErrorMessage(parseApiError(err).message || 'Failed to update staff member.');
        }
      }
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      centered
      title={
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
          <UserCog className="h-5 w-5 text-blue-600" />
          <span>Edit Staff Member</span>
        </div>
      }
    >
      <div className="pt-2 space-y-4">
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
          initialValues={
            staff
              ? {
                  name: staff.name,
                  phone: staff.phone ?? '',
                  role: staff.role,
                  branchIds: staff.branchIds,
                }
              : undefined
          }
          onFinish={handleSubmit}
          onValuesChange={(changedValues) => {
            if ('role' in changedValues && changedValues.role === 'ADMIN') {
              form.setFieldValue('branchIds', []);
            }
          }}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={<span className="text-sm font-medium text-slate-700">Full Name *</span>}
            rules={[
              { required: true, message: 'Full name is required' },
              { min: 2, max: 100, message: 'Name must be between 2 and 100 characters' },
            ]}
            className="mb-4"
          >
            <Input className="h-10 rounded-lg border-slate-300" />
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
            className="mb-4"
          >
            <Input className="h-10 rounded-lg border-slate-300" />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span className="text-sm font-medium text-slate-700">Role *</span>}
            rules={[{ required: true, message: 'Please select a role' }]}
            className="mb-4"
          >
            <Select className="h-10" options={roleOptions.map((r) => ({ label: r, value: r }))} />
          </Form.Item>

          {isAdminRole ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 mb-4">
              ADMIN accounts operate tenant-wide across all branches. No branch assignment is
              required.
            </div>
          ) : (
            <Form.Item
              name="branchIds"
              dependencies={['role']}
              label={
                <span className="text-sm font-medium text-slate-700">Assigned Branches *</span>
              }
              rules={[
                {
                  validator: async (_, value) => {
                    if (!isAdminRole && (!value || (Array.isArray(value) && value.length === 0))) {
                      return Promise.reject(
                        new Error('Staff must be assigned to at least one branch'),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="mb-4"
            >
              <Select
                mode="multiple"
                placeholder="Select branches..."
                options={accessibleBranches.map((b) => ({
                  label: b.name ? `${b.name} (${b.code})` : b.code,
                  value: b.id,
                }))}
              />
            </Form.Item>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
