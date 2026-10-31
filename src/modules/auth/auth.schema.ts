import { z } from 'zod';
import { passwordSchema, indianPhoneSchema, emptyToUndefined } from '@/shared/lib/validators';

export const signupSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, 'businessName must be between 2 and 100 characters')
      .max(100, 'businessName must be between 2 and 100 characters'),
    name: z
      .string()
      .trim()
      .min(2, 'name must be between 2 and 100 characters')
      .max(100, 'name must be between 2 and 100 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: passwordSchema,
    phone: emptyToUndefined(indianPhoneSchema),
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;
export type SignupOutput = z.output<typeof signupSchema>;

/**
 * Login schema:
 * Password only requires min(1) / non-empty so temporary and existing passwords work.
 */
export const loginSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginOutput = z.output<typeof loginSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordOutput = z.output<typeof forgotPasswordSchema>;

export const resendVerificationSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
  })
  .strict();

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ResendVerificationOutput = z.output<typeof resendVerificationSchema>;

/**
 * Reset password schema (UI form):
 * UI includes confirmPassword, which is validated and stripped from the API output.
 */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ResetPasswordOutput = z.output<typeof resetPasswordSchema>;

/**
 * Reset password API schema:
 * Matches POST /api/v1/auth/reset-password request body.
 */
export const resetPasswordApiSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
  })
  .strict();

export type ResetPasswordApiInput = z.infer<typeof resetPasswordApiSchema>;
export type ResetPasswordApiOutput = z.output<typeof resetPasswordApiSchema>;

/**
 * Change password schema:
 * Requires currentPassword (non-empty), newPassword (rules), and confirmPassword (matches newPassword).
 * newPassword must differ from currentPassword. confirmPassword is stripped from output.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordOutput = z.output<typeof changePasswordSchema>;
