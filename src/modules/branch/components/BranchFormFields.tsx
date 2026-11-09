'use client';

import { Form, Input } from 'antd';
import { indianPhoneSchema, pincodeSchema } from '@/shared/lib/validators';

export interface BranchFieldValues {
  name?: string;
  code?: string;
  phone?: string;
  timezone?: string;
  currency?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export interface BranchFormFieldsProps {
  /**
   * When true: code field is read-only (edit mode).
   * When false: code field is editable (create mode).
   */
  codeReadOnly?: boolean;
  codeValue?: string;
  /**
   * Original branch values used for "can't remove" guards in edit mode.
   */
  originalValues?: BranchFieldValues;
  isSettings?: boolean;
}

export function BranchFormFields({
  codeReadOnly = false,
  codeValue,
  originalValues,
  isSettings = false,
}: BranchFormFieldsProps) {
  return (
    <>
      {/* Branch Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="name"
          label={<span className="text-sm font-medium text-slate-700">Branch Name *</span>}
          rules={[
            { required: true, message: 'Branch name is required' },
            { min: 2, max: 100, message: 'Branch name must be between 2 and 100 characters' },
            ...(isSettings && originalValues?.name?.trim()
              ? [
                  {
                    validator: async (_: unknown, value: unknown) => {
                      const strVal = typeof value === 'string' ? value.trim() : '';
                      if (!strVal && originalValues?.name?.trim()) {
                        return Promise.reject(new Error("This field can't be removed here"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]
              : []),
          ]}
          validateTrigger={['onChange', 'onBlur']}
          className="mb-0"
        >
          <Input
            placeholder="e.g. Main Branch"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        {codeReadOnly ? (
          <Form.Item
            label={<span className="text-sm font-medium text-slate-700">Branch Code *</span>}
            className="mb-0"
          >
            <Input
              value={codeValue}
              placeholder="e.g. MAIN-01"
              className="h-11 rounded-lg border-slate-300 text-base uppercase"
              disabled
            />
          </Form.Item>
        ) : (
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
            normalize={(val: string) => (typeof val === 'string' ? val.toUpperCase() : val)}
            className="mb-0"
          >
            <Input
              placeholder="e.g. MAIN-01"
              className="h-11 rounded-lg border-slate-300 text-base uppercase"
            />
          </Form.Item>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Form.Item
          name="phone"
          label={<span className="text-sm font-medium text-slate-700">Phone (Optional)</span>}
          rules={[
            {
              validator: async (_, value) => {
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (isSettings && originalValues?.phone?.trim() && !strVal) {
                  return Promise.reject(new Error("This field can't be removed here"));
                }
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
          validateTrigger={['onChange', 'onBlur']}
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
            rules={[
              { required: true, message: 'Address line1 is required' },
              ...(isSettings && originalValues?.address?.line1?.trim()
                ? [
                    {
                      validator: async (_: unknown, value: unknown) => {
                        const strVal = typeof value === 'string' ? value.trim() : '';
                        if (!strVal && originalValues?.address?.line1?.trim()) {
                          return Promise.reject(new Error("This field can't be removed here"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]
                : []),
            ]}
            validateTrigger={['onChange', 'onBlur']}
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
              <span className="text-sm font-medium text-slate-700">Address Line 2 (Optional)</span>
            }
            rules={[
              {
                validator: async (_, value) => {
                  const strVal = typeof value === 'string' ? value.trim() : '';
                  if (isSettings && originalValues?.address?.line2?.trim() && !strVal) {
                    return Promise.reject(new Error("This field can't be removed here"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateTrigger={['onChange', 'onBlur']}
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
              validateTrigger={['onChange', 'onBlur']}
              className="mb-0"
            >
              <Input placeholder="City" className="h-11 rounded-lg border-slate-300 text-base" />
            </Form.Item>

            <Form.Item
              name={['address', 'state']}
              label={<span className="text-sm font-medium text-slate-700">State *</span>}
              rules={[{ required: true, message: 'State is required' }]}
              validateTrigger={['onChange', 'onBlur']}
              className="mb-0"
            >
              <Input placeholder="State" className="h-11 rounded-lg border-slate-300 text-base" />
            </Form.Item>

            <Form.Item
              name={['address', 'pincode']}
              label={<span className="text-sm font-medium text-slate-700">PIN Code *</span>}
              rules={[
                { required: true, message: 'PIN code is required' },
                {
                  validator: async (_, value) => {
                    const strVal = typeof value === 'string' ? value.trim() : '';
                    if (!strVal) return Promise.resolve();
                    const res = pincodeSchema.safeParse(strVal);
                    if (!res.success) {
                      return Promise.reject(
                        new Error(res.error.issues[0]?.message || 'Invalid Indian PIN code'),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              validateTrigger={['onChange', 'onBlur']}
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
    </>
  );
}
