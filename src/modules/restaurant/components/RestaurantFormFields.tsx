'use client';

import { Form, Input } from 'antd';
import {
  indianPhoneSchema,
  gstinSchema,
  fssaiSchema,
  pincodeSchema,
} from '@/shared/lib/validators';

export interface RestaurantFieldValues {
  name?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  gstin?: string;
  fssai?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export interface RestaurantFormFieldsProps {
  originalValues?: RestaurantFieldValues;
  isSettings?: boolean;
}

export function RestaurantFormFields({
  originalValues,
  isSettings = false,
}: RestaurantFormFieldsProps) {
  return (
    <>
      {/* Restaurant Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="name"
          label={<span className="text-sm font-medium text-slate-700">Restaurant Name *</span>}
          rules={[
            {
              validator: async (_, value) => {
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (!strVal) {
                  if (isSettings && originalValues?.name?.trim()) {
                    return Promise.reject(new Error("This field can't be removed here"));
                  }
                  return Promise.reject(new Error('Restaurant name is required'));
                }
                if (strVal.length < 2 || strVal.length > 100) {
                  return Promise.reject(
                    new Error('Restaurant name must be between 2 and 100 characters'),
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
            placeholder="e.g. Spice Garden"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label={<span className="text-sm font-medium text-slate-700">Phone Number *</span>}
          rules={[
            {
              validator: async (_, value) => {
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (!strVal) {
                  if (isSettings && originalValues?.phone?.trim()) {
                    return Promise.reject(new Error("This field can't be removed here"));
                  }
                  return Promise.reject(new Error('Phone number is required'));
                }
                const res = indianPhoneSchema.safeParse(strVal);
                if (!res.success) {
                  return Promise.reject(new Error(res.error.issues[0]?.message));
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="email"
          label={<span className="text-sm font-medium text-slate-700">Email Address *</span>}
          rules={[
            {
              validator: async (_, value) => {
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (!strVal) {
                  if (isSettings && originalValues?.email?.trim()) {
                    return Promise.reject(new Error("This field can't be removed here"));
                  }
                  return Promise.reject(new Error('Email address is required'));
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(strVal)) {
                  return Promise.reject(new Error('Invalid email address'));
                }
                return Promise.resolve();
              },
            },
          ]}
          validateTrigger={['onChange', 'onBlur']}
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
          label={<span className="text-sm font-medium text-slate-700">Logo URL (Optional)</span>}
          rules={[
            {
              validator: async (_, value) => {
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (isSettings && originalValues?.logoUrl?.trim() && !strVal) {
                  return Promise.reject(new Error("This field can't be removed here"));
                }
                if (!strVal) return Promise.resolve();
                if (strVal.length > 500) {
                  return Promise.reject(new Error('logoUrl cannot exceed 500 characters'));
                }
                if (!strVal.startsWith('https://')) {
                  return Promise.reject(new Error('logoUrl must be a secure https URL'));
                }
                try {
                  new URL(strVal);
                } catch {
                  return Promise.reject(new Error('logoUrl must be a valid URL'));
                }
                return Promise.resolve();
              },
            },
          ]}
          validateTrigger={['onChange', 'onBlur']}
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
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (isSettings && originalValues?.gstin?.trim() && !strVal) {
                  return Promise.reject(new Error("This field can't be removed here"));
                }
                if (!strVal) return Promise.resolve();
                const res = gstinSchema.safeParse(strVal);
                if (!res.success) {
                  return Promise.reject(
                    new Error(res.error.issues[0]?.message || 'Invalid GSTIN format'),
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
                const strVal = typeof value === 'string' ? value.trim() : '';
                if (isSettings && originalValues?.fssai?.trim() && !strVal) {
                  return Promise.reject(new Error("This field can't be removed here"));
                }
                if (!strVal) return Promise.resolve();
                const res = fssaiSchema.safeParse(strVal);
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
          validateTrigger={['onChange', 'onBlur']}
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
            rules={[
              {
                validator: async (_, value) => {
                  const strVal = typeof value === 'string' ? value.trim() : '';
                  if (!strVal) {
                    if (isSettings && originalValues?.address?.line1?.trim()) {
                      return Promise.reject(new Error("This field can't be removed here"));
                    }
                    return Promise.reject(new Error('Address line1 is required'));
                  }
                  return Promise.resolve();
                },
              },
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
              rules={[
                {
                  validator: async (_, value) => {
                    const strVal = typeof value === 'string' ? value.trim() : '';
                    if (!strVal) {
                      if (isSettings && originalValues?.address?.city?.trim()) {
                        return Promise.reject(new Error("This field can't be removed here"));
                      }
                      return Promise.reject(new Error('City is required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              validateTrigger={['onChange', 'onBlur']}
              className="mb-0"
            >
              <Input placeholder="City" className="h-11 rounded-lg border-slate-300 text-base" />
            </Form.Item>

            <Form.Item
              name={['address', 'state']}
              label={<span className="text-sm font-medium text-slate-700">State *</span>}
              rules={[
                {
                  validator: async (_, value) => {
                    const strVal = typeof value === 'string' ? value.trim() : '';
                    if (!strVal) {
                      if (isSettings && originalValues?.address?.state?.trim()) {
                        return Promise.reject(new Error("This field can't be removed here"));
                      }
                      return Promise.reject(new Error('State is required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              validateTrigger={['onChange', 'onBlur']}
              className="mb-0"
            >
              <Input placeholder="State" className="h-11 rounded-lg border-slate-300 text-base" />
            </Form.Item>

            <Form.Item
              name={['address', 'pincode']}
              label={<span className="text-sm font-medium text-slate-700">PIN Code *</span>}
              rules={[
                {
                  validator: async (_, value) => {
                    const strVal = typeof value === 'string' ? value.trim() : '';
                    if (!strVal) {
                      if (isSettings && originalValues?.address?.pincode?.trim()) {
                        return Promise.reject(new Error("This field can't be removed here"));
                      }
                      return Promise.reject(new Error('PIN code is required'));
                    }
                    const res = pincodeSchema.safeParse(strVal);
                    if (!res.success) {
                      return Promise.reject(
                        new Error(
                          res.error.issues[0]?.message || 'PIN code must be exactly 6 digits',
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
