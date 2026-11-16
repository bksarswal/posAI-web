import type { CreateStaffApiBody, StaffRole, StaffStatus, UpdateStaffApiBody } from './staff.types';

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

export interface StaffEditFieldValues {
  name?: string;
  phone?: string;
  role?: StaffRole;
  branchIds?: string[];
  status?: StaffStatus;
}

/**
 * Builds the PATCH /users/{id} payload by diffing current vs. original values.
 * - Sends ONLY the fields that have changed.
 * - Never sends empty strings (omits them from the payload).
 * - Never sends email or tenantId.
 * - For role === 'ADMIN' (resulting role), branchIds is forced to [] if branchIds is included.
 * - Explicit return type: UpdateStaffApiBody.
 */
export function buildUpdateStaffPayload(
  original: StaffEditFieldValues,
  current: StaffEditFieldValues,
): UpdateStaffApiBody {
  const payload: UpdateStaffApiBody = {};

  const currentName = (current.name ?? '').trim();
  const origName = (original.name ?? '').trim();
  if (currentName !== origName && currentName) {
    payload.name = currentName;
  }

  const currentPhone = (current.phone ?? '').trim();
  const origPhone = (original.phone ?? '').trim();
  if (currentPhone !== origPhone) {
    if (currentPhone) {
      payload.phone = currentPhone;
    }
    // Clearing phone is signalled by omitting it; server retains the old value.
    // If explicit phone clearing is needed, send '' — but the API accepts optional.
  }

  const currentRole = current.role;
  const origRole = original.role;
  if (currentRole !== undefined && currentRole !== origRole) {
    payload.role = currentRole;
  }

  // Always send branchIds if the resulting role is changing to/from ADMIN
  // or if branchIds themselves changed.
  const resultingRole = payload.role ?? origRole;
  const currentBranches = current.branchIds ?? original.branchIds ?? [];
  const origBranches = original.branchIds ?? [];

  const branchesChanged =
    JSON.stringify([...currentBranches].sort()) !== JSON.stringify([...origBranches].sort());
  const roleChangedToAdmin = payload.role === 'ADMIN';
  const roleChangedFromAdmin =
    origRole === 'ADMIN' && payload.role !== undefined && payload.role !== 'ADMIN';

  if (branchesChanged || roleChangedToAdmin || roleChangedFromAdmin) {
    payload.branchIds = resultingRole === 'ADMIN' ? [] : currentBranches;
  }

  const currentStatus = current.status;
  const origStatus = original.status;
  if (currentStatus !== undefined && currentStatus !== origStatus) {
    payload.status = currentStatus;
  }

  return payload;
}
