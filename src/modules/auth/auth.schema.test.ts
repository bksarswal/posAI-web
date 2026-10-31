import { describe, it, expect } from 'vitest';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema';

describe('Auth Schemas (src/modules/auth/auth.schema.ts)', () => {
  describe('loginSchema', () => {
    it('accepts short or single-character passwords so temporary and existing passwords work', () => {
      expect(loginSchema.parse({ email: 'user@posai.com', password: 'a' })).toEqual({
        email: 'user@posai.com',
        password: 'a',
      });
      expect(loginSchema.parse({ email: 'user@posai.com', password: 'temp' })).toEqual({
        email: 'user@posai.com',
        password: 'temp',
      });
    });

    it('rejects empty password on login', () => {
      expect(() => loginSchema.parse({ email: 'user@posai.com', password: '' })).toThrow();
    });
  });

  describe('signupSchema', () => {
    it('validates businessName, name, email, password, and optional phone with empty string treated as absent', () => {
      const valid = {
        businessName: 'My Bistro',
        name: 'John Doe',
        email: 'john@posai.com',
        password: 'Password123!',
        phone: '',
      };
      const parsed = signupSchema.parse(valid);
      expect(parsed.businessName).toBe('My Bistro');
      expect(parsed.email).toBe('john@posai.com');
      expect(parsed.phone).toBeUndefined(); // "" -> undefined
    });

    it('rejects businessName < 2 or > 100 characters', () => {
      expect(() =>
        signupSchema.parse({
          businessName: 'A',
          name: 'John Doe',
          email: 'john@posai.com',
          password: 'Password123!',
        }),
      ).toThrow();
    });
  });

  describe('resetPasswordSchema', () => {
    it('rejects confirmPassword mismatch', () => {
      expect(() =>
        resetPasswordSchema.parse({
          newPassword: 'Password123!',
          confirmPassword: 'MismatchPassword!',
        }),
      ).toThrow('Passwords do not match');
    });

    it('validates confirmPassword and strips it from output payload', () => {
      const parsed = resetPasswordSchema.parse({
        newPassword: 'Password123!',
        confirmPassword: 'Password123!',
      });
      expect(parsed).toEqual({ newPassword: 'Password123!' });
      expect(parsed).not.toHaveProperty('confirmPassword');
    });
  });

  describe('changePasswordSchema', () => {
    it('rejects when newPassword equals currentPassword', () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: 'Password123!',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      ).toThrow('New password must be different from current password');
    });

    it('rejects when confirmPassword does not match newPassword', () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword!',
        }),
      ).toThrow('Passwords do not match');
    });

    it('validates and strips confirmPassword from API payload', () => {
      const parsed = changePasswordSchema.parse({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });
      expect(parsed).toEqual({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });
      expect(parsed).not.toHaveProperty('confirmPassword');
    });
  });

  describe('forgotPasswordSchema & resendVerificationSchema', () => {
    it('validates and lowercases email', () => {
      expect(forgotPasswordSchema.parse({ email: ' USER@POSAI.COM ' })).toEqual({
        email: 'user@posai.com',
      });
      expect(resendVerificationSchema.parse({ email: ' USER@POSAI.COM ' })).toEqual({
        email: 'user@posai.com',
      });
    });
  });
});
