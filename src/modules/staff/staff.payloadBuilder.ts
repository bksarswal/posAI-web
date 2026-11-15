import type { CreateStaffApiBody, StaffRole } from './staff.types';

export interface StaffCreateFieldValues {
  name?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  branchIds?: string[];
}

/**
 * Builds the POST /users payload from form values.
 * - Explicit return type: CreateStaffApiBody.
 * - Never sends empty strings.
 * - Trims name and email (lowercases email).
 * - For role === 'ADMIN', branchIds is set to [] (backend requirement).
 * - For other roles, branchIds contains selected IDs.
 * - Never sends tenantId or status.
 */
export function buildCreateStaffPayload(values: StaffCreateFieldValues): CreateStaffApiBody {
  const name = (values.name ?? '').trim();
  const email = (values.email ?? '').trim().toLowerCase();
  const phone = (values.phone ?? '').trim();
  const role: StaffRole = values.role ?? 'WAITER';

  const branchIds = role === 'ADMIN' ? [] : (values.branchIds ?? []).filter(Boolean);

  const payload: CreateStaffApiBody = {
    name,
    email,
    role,
    ...(phone ? { phone } : {}),
    branchIds,
  };

  return payload;
}
