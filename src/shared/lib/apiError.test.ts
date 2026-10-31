import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { parseApiError, toFormFieldErrors } from './apiError';
import { ApiError } from './axios';
import { ERROR_CODES } from '../constants/errorCodes';

describe('apiError (src/shared/lib/apiError.ts)', () => {
  it('parses realistic backend VALIDATION_ERROR responses with field errors', () => {
    const backendErrorResponse = new AxiosError(
      'Validation failed',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
        data: {
          success: false,
          message: 'Validation failed',
          code: ERROR_CODES.VALIDATION_ERROR,
          errors: [
            { field: 'name', message: 'Restaurant name must be between 2 and 100 characters' },
            { field: 'address.pincode', message: 'Invalid Indian PIN code' },
          ],
        },
      },
    );

    const parsed = parseApiError(backendErrorResponse);
    expect(parsed.status).toBe(400);
    expect(parsed.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(parsed.fieldErrors).toEqual({
      name: ['Restaurant name must be between 2 and 100 characters'],
      'address.pincode': ['Invalid Indian PIN code'],
    });

    const formFields = toFormFieldErrors(backendErrorResponse);
    expect(formFields).toEqual([
      {
        name: ['name'],
        errors: ['Restaurant name must be between 2 and 100 characters'],
      },
      {
        name: ['address', 'pincode'],
        errors: ['Invalid Indian PIN code'],
      },
    ]);
  });

  it('maps domain error codes to dedicated form fields (e.g. EMAIL_ALREADY_REGISTERED -> email)', () => {
    const error = new ApiError(
      'Email is already registered',
      ERROR_CODES.EMAIL_ALREADY_REGISTERED,
      409,
    );

    const parsed = parseApiError(error);
    expect(parsed.code).toBe(ERROR_CODES.EMAIL_ALREADY_REGISTERED);
    expect(parsed.fieldErrors['email']).toEqual([
      'This email is already registered. Please sign in or use another email.',
    ]);

    const formFields = toFormFieldErrors(error);
    expect(formFields).toEqual([
      {
        name: ['email'],
        errors: ['This email is already registered. Please sign in or use another email.'],
      },
    ]);
  });

  it('maps BRANCH_CODE_EXISTS, INVALID_CURRENT_PASSWORD, and INVALID_BRANCH to form fields', () => {
    const codeError = new ApiError('Branch exists', ERROR_CODES.BRANCH_CODE_EXISTS, 409);
    expect(toFormFieldErrors(codeError)).toEqual([
      {
        name: ['code'],
        errors: ['A branch with this code already exists. Please choose a unique code.'],
      },
    ]);

    const passError = new ApiError('Wrong pass', ERROR_CODES.INVALID_CURRENT_PASSWORD, 400);
    expect(toFormFieldErrors(passError)).toEqual([
      {
        name: ['currentPassword'],
        errors: ['The current password you entered is incorrect.'],
      },
    ]);

    const branchError = new ApiError('Bad branches', ERROR_CODES.INVALID_BRANCH, 400);
    expect(toFormFieldErrors(branchError)).toEqual([
      {
        name: ['branchIds'],
        errors: ['One or more assigned branches are invalid or inactive.'],
      },
    ]);
  });

  it('returns empty form field errors for toast-level codes (ACCOUNT_DISABLED, RATE_LIMITED)', () => {
    const disabledError = new ApiError('Disabled', ERROR_CODES.ACCOUNT_DISABLED, 403);
    const parsed = parseApiError(disabledError);
    expect(parsed.fieldErrors).toEqual({});
    expect(toFormFieldErrors(disabledError)).toEqual([]);
    expect(parsed.message).toBe(
      'Your account is deactivated. Please contact your restaurant administrator.',
    );

    const rateError = new ApiError('Rate limit', ERROR_CODES.RATE_LIMITED, 429);
    expect(toFormFieldErrors(rateError)).toEqual([]);
    expect(parseApiError(rateError).message).toBe(
      'Too many requests. Please wait a few moments before trying again.',
    );
  });

  it('parses network and timeout errors gracefully', () => {
    const networkError = new ApiError('Network error', ERROR_CODES.NETWORK_ERROR);
    const parsedNetwork = parseApiError(networkError);
    expect(parsedNetwork.code).toBe(ERROR_CODES.NETWORK_ERROR);
    expect(parsedNetwork.message).toBe(
      'Unable to connect to the server. Please check your internet connection.',
    );

    const timeoutError = new ApiError('Timeout', ERROR_CODES.TIMEOUT, 408);
    const parsedTimeout = parseApiError(timeoutError);
    expect(parsedTimeout.code).toBe(ERROR_CODES.TIMEOUT);
    expect(parsedTimeout.status).toBe(408);
  });
});
