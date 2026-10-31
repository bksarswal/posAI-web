import { z } from 'zod';
import {
  indianPhoneSchema,
  pincodeSchema,
  ianaTimezoneSchema,
  branchCodeSchema,
  emptyToUndefined,
} from '@/shared/lib/validators';

export const branchAddressSchema = z
  .object({
    line1: z.string().trim().min(1, 'Address line1 is required'),
    line2: emptyToUndefined(z.string().trim()),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    pincode: pincodeSchema,
  })
  .strict();

export type BranchAddress = z.infer<typeof branchAddressSchema>;

export const createBranchSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Branch name must be between 2 and 100 characters')
      .max(100, 'Branch name must be between 2 and 100 characters'),
    code: branchCodeSchema,
    address: branchAddressSchema,
    phone: emptyToUndefined(indianPhoneSchema),
    timezone: ianaTimezoneSchema.default('Asia/Kolkata'),
    currency: z.literal('INR').default('INR'),
  })
  .strict();

export type CreateBranchInput = z.input<typeof createBranchSchema>;
export type CreateBranchOutput = z.output<typeof createBranchSchema>;

/**
 * Update branch schema:
 * Partial update: name, address, phone, timezone, status.
 * Notice: code, isMain, and restaurantId are strictly uneditable.
 */
export const updateBranchSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Branch name must be between 2 and 100 characters')
      .max(100, 'Branch name must be between 2 and 100 characters')
      .optional(),
    address: branchAddressSchema.optional(),
    phone: emptyToUndefined(indianPhoneSchema),
    timezone: emptyToUndefined(ianaTimezoneSchema),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Update payload must contain at least one field');

export type UpdateBranchInput = z.input<typeof updateBranchSchema>;
export type UpdateBranchOutput = z.output<typeof updateBranchSchema>;
