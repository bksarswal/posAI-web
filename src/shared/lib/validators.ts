import { z } from 'zod';

/**
 * Preprocessor helper for optional Ant Design Form inputs:
 * Ant Design inputs produce "" when cleared by the user.
 * Strict backend schemas reject empty strings for optional fields (e.g. phone, gstin, logoUrl).
 * This helper converts "", whitespace-only strings, null, and undefined to undefined before validation.
 */
export function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
  }, schema.optional());
}

/**
 * Validates password:
 * - Minimum 8 characters
 * - Maximum 72 BYTES via TextEncoder (bcrypt truncation safety)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((val) => new TextEncoder().encode(val).length <= 72, 'Password cannot exceed 72 bytes');

/**
 * Validates and normalizes Indian phone numbers:
 * - Accepts 10 digits starting with 6-9, or prefixed with +91.
 * - Strips whitespace and hyphens.
 * - Normalizes to +91XXXXXXXXXX.
 */
export const indianPhoneSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ''))
  .refine((val) => /^(\+91)?[6-9]\d{9}$/.test(val), {
    message:
      'Invalid Indian phone number. Must be 10 digits starting with 6-9, optionally prefixed with +91',
  })
  .transform((val) => (val.startsWith('+91') ? val : `+91${val}`));

/**
 * GSTIN regex: 2 digits, 5 uppercase letters (PAN), 4 digits, 1 letter, 1 alphanumeric entity code, 'Z', 1 alphanumeric check code.
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * Validates and normalizes GSTIN (trims and converts to uppercase).
 */
export const gstinSchema = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val) => GSTIN_REGEX.test(val), {
    message: 'Invalid GSTIN format',
  });

/**
 * Validates FSSAI license number (exactly 14 digits).
 */
export const fssaiSchema = z
  .string()
  .trim()
  .regex(/^\d{14}$/, 'FSSAI license number must be exactly 14 digits');

/**
 * Validates Indian 6-digit postal PIN code (first digit 1-9).
 */
export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, 'Invalid Indian PIN code');

/**
 * Validates an IANA timezone identifier via Intl.DateTimeFormat.
 */
export const ianaTimezoneSchema = z
  .string()
  .trim()
  .refine(
    (tz) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid IANA timezone' },
  );

/**
 * Validates branch code:
 * - Upper-cased, trimmed
 * - 2-10 characters of A-Z, 0-9, and hyphens
 */
export const branchCodeSchema = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine(
    (val) => /^[A-Z0-9-]{2,10}$/.test(val),
    'Branch code must be 2-10 characters consisting of uppercase letters, digits, or hyphens',
  );
