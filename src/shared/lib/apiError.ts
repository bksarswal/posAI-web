import { normalizeAxiosError } from './axios';
import { getFormFieldForErrorCode, getErrorMessage } from '../constants/errorMessages';

export interface ParsedApiError {
  status?: number;
  code: string;
  message: string;
  fieldErrors: Record<string, string[]>;
}

export interface AntdFormFieldError {
  name: string[];
  errors: string[];
}

/**
 * Pure parser for API errors:
 * - Extracts HTTP status, machine error code, user-friendly message, and field-level errors.
 * - Extracts validation issues from backend VALIDATION_ERROR responses ({ field: string, message: string }[]).
 * - Maps specific domain error codes (e.g. EMAIL_ALREADY_REGISTERED, BRANCH_CODE_EXISTS) to their respective fields.
 */
export function parseApiError(error: unknown): ParsedApiError {
  const apiError = normalizeAxiosError(error);
  const fieldErrors: Record<string, string[]> = {};

  // 1. Process backend VALIDATION_ERROR details array: [{ field: 'name', message: '...' }]
  if (Array.isArray(apiError.errors)) {
    for (const item of apiError.errors) {
      if (item && typeof item === 'object' && 'field' in item && 'message' in item) {
        const field = String((item as { field: unknown }).field);
        const msg = String((item as { message: unknown }).message);
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(msg);
      }
    }
  }

  // 2. Check for domain error codes that map to specific form inputs
  const mappedField = getFormFieldForErrorCode(apiError.code);
  if (mappedField) {
    const userMessage = getErrorMessage(apiError.code, apiError.message);
    if (!fieldErrors[mappedField]) {
      fieldErrors[mappedField] = [];
    }
    if (!fieldErrors[mappedField].includes(userMessage)) {
      fieldErrors[mappedField].push(userMessage);
    }
  }

  return {
    status: apiError.statusCode,
    code: apiError.code,
    message: getErrorMessage(apiError.code, apiError.message),
    fieldErrors,
  };
}

/**
 * Transforms parsed API errors into Ant Design's form.setFields format:
 * Dot-separated fields (e.g. 'address.pincode') are split into path arrays: ['address', 'pincode'].
 */
export function toFormFieldErrors(error: unknown): AntdFormFieldError[] {
  const { fieldErrors } = parseApiError(error);
  return Object.entries(fieldErrors).map(([fieldPath, errors]) => ({
    name: fieldPath.split('.'),
    errors,
  }));
}
