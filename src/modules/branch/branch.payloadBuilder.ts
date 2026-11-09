import { indianPhoneSchema } from '@/shared/lib/validators';
import type { UpdateBranchApiBody } from './branch.types';

export interface BranchEditFieldValues {
  name?: string;
  phone?: string;
  timezone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

/** Same shape as UpdateBranchApiBody — used for the type-drift assertion */
export interface BranchUpdatePayload {
  name?: string;
  phone?: string;
  timezone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

/**
 * Builds the PATCH /branches/{id} payload from current form values vs. original values.
 * - Only includes changed fields.
 * - If any address field changed, the complete address object is sent.
 * - Never sends empty strings.
 * - `code` and `isMain` are never included.
 */
export function buildUpdateBranchPayload(
  currentValues: BranchEditFieldValues,
  originalValues: BranchEditFieldValues,
): BranchUpdatePayload {
  const payload: BranchUpdatePayload = {};

  const currentName = (currentValues.name ?? '').trim();
  const currentPhone = (currentValues.phone ?? '').trim();
  const currentTimezone = (currentValues.timezone ?? '').trim();
  const currentStatus = currentValues.status;

  const origName = (originalValues.name ?? '').trim();
  const origPhone = (originalValues.phone ?? '').trim();
  const origTimezone = (originalValues.timezone ?? '').trim();
  const origStatus = originalValues.status;

  const currentAddress = {
    line1: (currentValues.address?.line1 ?? '').trim(),
    line2: (currentValues.address?.line2 ?? '').trim(),
    city: (currentValues.address?.city ?? '').trim(),
    state: (currentValues.address?.state ?? '').trim(),
    pincode: (currentValues.address?.pincode ?? '').trim(),
  };

  const origAddress = {
    line1: (originalValues.address?.line1 ?? '').trim(),
    line2: (originalValues.address?.line2 ?? '').trim(),
    city: (originalValues.address?.city ?? '').trim(),
    state: (originalValues.address?.state ?? '').trim(),
    pincode: (originalValues.address?.pincode ?? '').trim(),
  };

  const nameChanged = currentName !== origName;
  const phoneChanged = currentPhone !== origPhone;
  const timezoneChanged = currentTimezone !== origTimezone;
  const statusChanged = currentStatus !== origStatus;

  const anyAddressChanged =
    currentAddress.line1 !== origAddress.line1 ||
    currentAddress.line2 !== origAddress.line2 ||
    currentAddress.city !== origAddress.city ||
    currentAddress.state !== origAddress.state ||
    currentAddress.pincode !== origAddress.pincode;

  if (nameChanged && currentName) {
    payload.name = currentName;
  }

  if (phoneChanged && currentPhone) {
    const parsed = indianPhoneSchema.safeParse(currentPhone);
    payload.phone = parsed.success ? parsed.data : currentPhone;
  }

  if (timezoneChanged && currentTimezone) {
    payload.timezone = currentTimezone;
  }

  if (statusChanged && currentStatus) {
    payload.status = currentStatus;
  }

  if (anyAddressChanged) {
    payload.address = {
      line1: currentAddress.line1,
      ...(currentAddress.line2 ? { line2: currentAddress.line2 } : {}),
      city: currentAddress.city,
      state: currentAddress.state,
      pincode: currentAddress.pincode,
    };
  }

  return payload;
}

// Compile-time assertion: BranchUpdatePayload must be assignable to UpdateBranchApiBody
// This is checked in typeDriftGuard.test.ts
export type _AssertBranchUpdatePayload = BranchUpdatePayload extends UpdateBranchApiBody
  ? true
  : never;
