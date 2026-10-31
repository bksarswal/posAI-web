import { ERROR_CODES, type ErrorCode } from './errorCodes';

/**
 * Mapping of backend error codes to their specific form field names.
 * When an error code matches a form field, it is displayed inline on that field.
 * All other error codes are designated for Toasts or Banners.
 */
export const CODE_TO_FORM_FIELD: Partial<Record<ErrorCode, string>> = {
  [ERROR_CODES.EMAIL_ALREADY_REGISTERED]: 'email',
  [ERROR_CODES.BRANCH_CODE_EXISTS]: 'code',
  [ERROR_CODES.INVALID_CURRENT_PASSWORD]: 'currentPassword',
  [ERROR_CODES.INVALID_BRANCH]: 'branchIds',
  [ERROR_CODES.ADMIN_BRANCH_ASSIGNMENT_FORBIDDEN]: 'branchIds',
  [ERROR_CODES.BRANCH_REQUIRED]: 'branchIds',
  [ERROR_CODES.ROLE_REQUIRED]: 'role',
  [ERROR_CODES.CANNOT_ASSIGN_OWNER]: 'role',
};

/**
 * Checks whether an error code should be mapped to a specific form field.
 */
export function isFieldErrorCode(code?: string): code is ErrorCode {
  if (!code) return false;
  return code in CODE_TO_FORM_FIELD;
}

/**
 * Returns the form field name mapped to an error code, if any.
 */
export function getFormFieldForErrorCode(code?: string): string | undefined {
  if (!code || !isFieldErrorCode(code)) return undefined;
  return CODE_TO_FORM_FIELD[code];
}

/**
 * Comprehensive user-facing messages for every backend and client error code.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Session & Authentication
  [ERROR_CODES.UNAUTHORIZED]: 'You are not logged in. Please log in to continue.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Refreshing session...',
  [ERROR_CODES.TOKEN_REVOKED]: 'Your password was recently changed. Please log in again.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.PASSWORD_CHANGE_REQUIRED]: 'You must change your password before proceeding.',

  // Auth Operations
  [ERROR_CODES.EMAIL_ALREADY_REGISTERED]:
    'This email is already registered. Please sign in or use another email.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ERROR_CODES.EMAIL_NOT_VERIFIED]:
    'Your email is not verified. Please check your inbox or resend the verification link.',
  [ERROR_CODES.ACCOUNT_DISABLED]:
    'Your account is deactivated. Please contact your restaurant administrator.',
  [ERROR_CODES.TENANT_SUSPENDED]:
    'Your organization account is suspended. Please contact POSAI support.',
  [ERROR_CODES.INVALID_CURRENT_PASSWORD]: 'The current password you entered is incorrect.',
  [ERROR_CODES.INVALID_OR_EXPIRED_TOKEN]:
    'The verification or reset link is invalid or has expired.',

  // Refresh Token Rotation
  [ERROR_CODES.INVALID_REFRESH_TOKEN]: 'Your session could not be refreshed. Please log in again.',
  [ERROR_CODES.REFRESH_TOKEN_ROTATED]: 'Session token was refreshed concurrently. Retrying...',
  [ERROR_CODES.REFRESH_TOKEN_REUSED]:
    'Your session ended for security reasons. Please log in again.',

  // Rate Limiting
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a few moments before trying again.',

  // Restaurant Setup & Management
  [ERROR_CODES.RESTAURANT_ALREADY_EXISTS]: 'A restaurant profile already exists for this tenant.',
  [ERROR_CODES.RESTAURANT_NOT_FOUND]: 'Restaurant profile not found.',
  [ERROR_CODES.RESTAURANT_REQUIRED]: 'A restaurant profile must be created before adding branches.',

  // Branch Setup & Management
  [ERROR_CODES.BRANCH_CODE_EXISTS]:
    'A branch with this code already exists. Please choose a unique code.',
  [ERROR_CODES.BRANCH_CREATION_CONFLICT]: 'Concurrent branch creation conflict. Please try again.',
  [ERROR_CODES.BRANCH_NOT_FOUND]: 'Branch not found.',
  [ERROR_CODES.CANNOT_DEACTIVATE_MAIN_BRANCH]: 'The main branch cannot be deactivated.',
  [ERROR_CODES.INVALID_BRANCH]: 'One or more assigned branches are invalid or inactive.',

  // Staff & User Management
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found.',
  [ERROR_CODES.TENANT_NOT_FOUND]: 'Tenant organization not found.',
  [ERROR_CODES.ROLE_REQUIRED]: 'A role must be assigned to the staff member.',
  [ERROR_CODES.CANNOT_ASSIGN_OWNER]:
    'Cannot create or assign the OWNER role through staff management.',
  [ERROR_CODES.ADMIN_BRANCH_ASSIGNMENT_FORBIDDEN]:
    'Admin accounts cannot be assigned to individual branches.',
  [ERROR_CODES.BRANCH_REQUIRED]: 'Staff members must be assigned to at least one branch.',
  [ERROR_CODES.CANNOT_MODIFY_OWNER]: 'The Owner account cannot be modified or deactivated.',
  [ERROR_CODES.CANNOT_DEACTIVATE_SELF]: 'You cannot deactivate your own account.',

  // General & System Handlers
  [ERROR_CODES.VALIDATION_ERROR]: 'Please correct the highlighted errors and try again.',
  [ERROR_CODES.INVALID_ID]: 'Invalid resource identifier provided.',
  [ERROR_CODES.DUPLICATE_RESOURCE]: 'A record with this information already exists.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]:
    'Database service is temporarily unavailable. Please retry shortly.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]:
    'An unexpected server error occurred. Please try again later.',
  [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
  [ERROR_CODES.UNSCOPED_TENANT_ACCESS]:
    'A system tenant scoping error occurred. Please contact support.',

  // Client-Side Only Codes
  [ERROR_CODES.NETWORK_ERROR]:
    'Unable to connect to the server. Please check your internet connection.',
  [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
};

/**
 * Returns a user-friendly message for an error code with fallback option.
 */
export function getErrorMessage(code?: string, fallback = 'An unexpected error occurred'): string {
  if (!code) return fallback;
  return (ERROR_MESSAGES as Record<string, string>)[code] || fallback;
}
