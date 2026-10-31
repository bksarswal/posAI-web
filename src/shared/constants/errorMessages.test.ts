import { describe, it, expect } from 'vitest';
import { ERROR_CODES } from './errorCodes';
import {
  ERROR_MESSAGES,
  CODE_TO_FORM_FIELD,
  isFieldErrorCode,
  getFormFieldForErrorCode,
  getErrorMessage,
} from './errorMessages';

describe('errorMessages (src/shared/constants/errorMessages.ts)', () => {
  it('exhaustiveness: every code in ERROR_CODES has a non-empty user-facing message', () => {
    for (const [key, code] of Object.entries(ERROR_CODES)) {
      const msg = ERROR_MESSAGES[code];
      expect(msg, `Missing user-facing message for code ${key} (${code})`).toBeDefined();
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('correctly maps specific error codes to their dedicated form field inputs', () => {
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.EMAIL_ALREADY_REGISTERED]).toBe('email');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.BRANCH_CODE_EXISTS]).toBe('code');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.INVALID_CURRENT_PASSWORD]).toBe('currentPassword');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.INVALID_BRANCH]).toBe('branchIds');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.ADMIN_BRANCH_ASSIGNMENT_FORBIDDEN]).toBe('branchIds');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.BRANCH_REQUIRED]).toBe('branchIds');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.ROLE_REQUIRED]).toBe('role');
    expect(CODE_TO_FORM_FIELD[ERROR_CODES.CANNOT_ASSIGN_OWNER]).toBe('role');
  });

  it('isFieldErrorCode and getFormFieldForErrorCode identify field-level error codes', () => {
    expect(isFieldErrorCode(ERROR_CODES.EMAIL_ALREADY_REGISTERED)).toBe(true);
    expect(getFormFieldForErrorCode(ERROR_CODES.EMAIL_ALREADY_REGISTERED)).toBe('email');

    expect(isFieldErrorCode(ERROR_CODES.BRANCH_CODE_EXISTS)).toBe(true);
    expect(getFormFieldForErrorCode(ERROR_CODES.BRANCH_CODE_EXISTS)).toBe('code');

    // Toast/Banner error codes return false / undefined
    expect(isFieldErrorCode(ERROR_CODES.ACCOUNT_DISABLED)).toBe(false);
    expect(getFormFieldForErrorCode(ERROR_CODES.ACCOUNT_DISABLED)).toBeUndefined();
    expect(isFieldErrorCode(ERROR_CODES.RATE_LIMITED)).toBe(false);
    expect(getFormFieldForErrorCode(ERROR_CODES.RATE_LIMITED)).toBeUndefined();
  });

  it('getErrorMessage returns the corresponding error message or fallback', () => {
    expect(getErrorMessage(ERROR_CODES.EMAIL_ALREADY_REGISTERED)).toBe(
      'This email is already registered. Please sign in or use another email.',
    );
    expect(getErrorMessage('UNKNOWN_CODE', 'Custom Fallback')).toBe('Custom Fallback');
    expect(getErrorMessage(undefined, 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
