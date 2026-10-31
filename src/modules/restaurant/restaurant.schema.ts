import { z } from 'zod';
import {
  indianPhoneSchema,
  gstinSchema,
  fssaiSchema,
  pincodeSchema,
  emptyToUndefined,
} from '@/shared/lib/validators';

export const restaurantAddressSchema = z
  .object({
    line1: z.string().trim().min(1, 'Address line1 is required'),
    line2: emptyToUndefined(z.string().trim()),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    pincode: pincodeSchema,
  })
  .strict();

export type RestaurantAddress = z.infer<typeof restaurantAddressSchema>;

export const createRestaurantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Restaurant name must be between 2 and 100 characters')
      .max(100, 'Restaurant name must be between 2 and 100 characters'),
    gstin: emptyToUndefined(gstinSchema),
    fssai: emptyToUndefined(fssaiSchema),
    phone: indianPhoneSchema,
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    address: restaurantAddressSchema,
    logoUrl: emptyToUndefined(
      z
        .string()
        .trim()
        .max(500, 'logoUrl cannot exceed 500 characters')
        .url('logoUrl must be a valid URL')
        .refine((url) => url.startsWith('https://'), 'logoUrl must be a secure https URL'),
    ),
  })
  .strict();

export type CreateRestaurantInput = z.input<typeof createRestaurantSchema>;
export type CreateRestaurantOutput = z.output<typeof createRestaurantSchema>;

export const updateRestaurantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Restaurant name must be between 2 and 100 characters')
      .max(100, 'Restaurant name must be between 2 and 100 characters')
      .optional(),
    gstin: emptyToUndefined(gstinSchema),
    fssai: emptyToUndefined(fssaiSchema),
    phone: emptyToUndefined(indianPhoneSchema),
    email: emptyToUndefined(z.string().trim().email('Invalid email address').toLowerCase()),
    address: restaurantAddressSchema.optional(),
    logoUrl: emptyToUndefined(
      z
        .string()
        .trim()
        .max(500, 'logoUrl cannot exceed 500 characters')
        .url('logoUrl must be a valid URL')
        .refine((url) => url.startsWith('https://'), 'logoUrl must be a secure https URL'),
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Update payload must contain at least one field');

export type UpdateRestaurantInput = z.input<typeof updateRestaurantSchema>;
export type UpdateRestaurantOutput = z.output<typeof updateRestaurantSchema>;
