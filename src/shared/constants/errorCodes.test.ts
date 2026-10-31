import { describe, it, expect } from 'vitest';
import {
  ERROR_CODES,
  BACKEND_ERROR_CODES,
  CLIENT_ERROR_CODES,
  SESSION_ERROR_CODES,
  ERROR_MESSAGES,
  getErrorMessage,
} from './errorCodes';

describe('errorCodes', () => {
  it('defines all required session error codes without non-existent INVALID_TOKEN', () => {
    expect(SESSION_ERROR_CODES.REFRESH_AND_RETRY).toBe('TOKEN_EXPIRED');
    expect(SESSION_ERROR_CODES.ROTATED_RETRY_ONCE).toBe('REFRESH_TOKEN_ROTATED');
    expect(SESSION_ERROR_CODES.SECURITY_LOGOUT).toBe('REFRESH_TOKEN_REUSED');
    expect(SESSION_ERROR_CODES.LOGOUT_CODES).toEqual([
      'TOKEN_REVOKED',
      'UNAUTHORIZED',
      'INVALID_REFRESH_TOKEN',
    ]);
    expect('INVALID_TOKEN' in ERROR_CODES).toBe(false);
  });

  it('includes missing backend error codes (SERVICE_UNAVAILABLE, INTERNAL_ERROR, FORBIDDEN, PASSWORD_CHANGE_REQUIRED)', () => {
    expect(ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
    expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
    expect(ERROR_CODES.PASSWORD_CHANGE_REQUIRED).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('separates client-side synthetic codes from backend codes', () => {
    expect(CLIENT_ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(CLIENT_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
    expect(Object.keys(CLIENT_ERROR_CODES)).toEqual(['NETWORK_ERROR', 'TIMEOUT']);
    expect(Object.keys(BACKEND_ERROR_CODES)).not.toContain('NETWORK_ERROR');
    expect(Object.keys(BACKEND_ERROR_CODES)).not.toContain('TIMEOUT');
  });

  it('maps REFRESH_TOKEN_REUSED to the exact security message required', () => {
    expect(ERROR_MESSAGES[ERROR_CODES.REFRESH_TOKEN_REUSED]).toBe(
      'Your session ended for security reasons. Please log in again.',
    );
  });

  it('provides error messages for every defined error code', () => {
    for (const code of Object.values(ERROR_CODES)) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe('string');
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

  it('getErrorMessage returns the corresponding message or fallback', () => {
    expect(getErrorMessage(ERROR_CODES.EMAIL_ALREADY_REGISTERED)).toBe(
      'This email is already registered. Please sign in or use another email.',
    );
    expect(getErrorMessage('NON_EXISTENT_CODE', 'Custom Fallback')).toBe('Custom Fallback');
    expect(getErrorMessage(undefined, 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
