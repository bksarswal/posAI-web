import { z } from 'zod';
import { indianPhoneSchema, emptyToUndefined } from '@/shared/lib/validators';

export const staffRoles = ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF'] as const;

export type StaffRole = (typeof staffRoles)[number];

export const allUserRoles = ['OWNER', ...staffRoles] as const;
export type UserRole = (typeof allUserRoles)[number];

export const createStaffSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 100 characters')
      .max(100, 'Name must be between 2 and 100 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    phone: emptyToUndefined(indianPhoneSchema),
    role: z.enum(staffRoles, {
      message: 'Role is required and cannot be OWNER',
    }),
    branchIds: z.array(z.string()).default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.role === 'ADMIN') {
      if (data.branchIds && data.branchIds.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ADMIN accounts must not be assigned to branches',
          path: ['branchIds'],
        });
      }
    } else {
      if (!data.branchIds || data.branchIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Staff must be assigned to at least one branch',
          path: ['branchIds'],
        });
      }
    }
  });

export type CreateStaffInput = z.input<typeof createStaffSchema>;
export type CreateStaffOutput = z.output<typeof createStaffSchema>;

export const updateStaffSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 100 characters')
      .max(100, 'Name must be between 2 and 100 characters')
      .optional(),
    phone: emptyToUndefined(indianPhoneSchema),
    role: z.enum(staffRoles).optional(),
    branchIds: z.array(z.string()).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Update payload must contain at least one field')
  .superRefine((data, ctx) => {
    if (data.role === 'ADMIN' && data.branchIds && data.branchIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ADMIN accounts must not be assigned to branches',
        path: ['branchIds'],
      });
    }
    if (data.role && data.role !== 'ADMIN' && data.branchIds && data.branchIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Staff must be assigned to at least one branch',
        path: ['branchIds'],
      });
    }
  });

export type UpdateStaffInput = z.input<typeof updateStaffSchema>;
export type UpdateStaffOutput = z.output<typeof updateStaffSchema>;

/**
 * Self profile update schema (PATCH /users/me):
 * Allows modifying own name and phone.
 */
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 100 characters')
      .max(100, 'Name must be between 2 and 100 characters')
      .optional(),
    phone: emptyToUndefined(indianPhoneSchema),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Update payload must contain at least one field');

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileOutput = z.output<typeof updateProfileSchema>;
