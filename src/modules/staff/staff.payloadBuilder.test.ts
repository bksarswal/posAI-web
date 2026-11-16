import { describe, it, expect } from 'vitest';
import {
  buildCreateStaffPayload,
  buildUpdateStaffPayload,
  type StaffEditFieldValues,
} from './staff.payloadBuilder';

describe('buildCreateStaffPayload (src/modules/staff/staff.payloadBuilder.ts)', () => {
  it('trims name and email, and lowercases email', () => {
    const payload = buildCreateStaffPayload({
      name: '  Jane Doe  ',
      email: '  Jane.Doe@EXAMPLE.COM ',
      role: 'WAITER',
      branchIds: ['b1'],
    });

    expect(payload.name).toBe('Jane Doe');
    expect(payload.email).toBe('jane.doe@example.com');
  });

  it('omits phone when empty or whitespace (never sends empty strings)', () => {
    const payload = buildCreateStaffPayload({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '   ',
      role: 'WAITER',
      branchIds: ['b1'],
    });

    expect(payload.phone).toBeUndefined();
    expect('phone' in payload).toBe(false);
  });

  it('includes trimmed phone when provided', () => {
    const payload = buildCreateStaffPayload({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '  +919876543210  ',
      role: 'WAITER',
      branchIds: ['b1'],
    });

    expect(payload.phone).toBe('+919876543210');
  });

  it('enforces branchIds: [] when role is ADMIN', () => {
    const payload = buildCreateStaffPayload({
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      branchIds: ['b1', 'b2'],
    });

    expect(payload.role).toBe('ADMIN');
    expect(payload.branchIds).toEqual([]);
  });

  it('preserves branchIds when role is non-ADMIN', () => {
    const payload = buildCreateStaffPayload({
      name: 'Waiter User',
      email: 'waiter@example.com',
      role: 'WAITER',
      branchIds: ['b1', 'b2'],
    });

    expect(payload.role).toBe('WAITER');
    expect(payload.branchIds).toEqual(['b1', 'b2']);
  });

  it('never sends tenantId or status or extra properties', () => {
    const rawValues = {
      name: 'Chef User',
      email: 'chef@example.com',
      role: 'CHEF' as const,
      branchIds: ['b1'],
      tenantId: 'some-tenant-id',
      status: 'ACTIVE' as const,
    };

    const payload = buildCreateStaffPayload(rawValues);

    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('status');
    expect(Object.keys(payload).sort()).toEqual(['branchIds', 'email', 'name', 'role'].sort());
  });
});

describe('buildUpdateStaffPayload (src/modules/staff/staff.payloadBuilder.ts)', () => {
  const original: StaffEditFieldValues = {
    name: 'John Doe',
    phone: '+919876543210',
    role: 'WAITER',
    branchIds: ['b1'],
    status: 'ACTIVE',
  };

  it('returns empty object when nothing changed', () => {
    const payload = buildUpdateStaffPayload(original, { ...original });
    expect(payload).toEqual({});
  });

  it('sends only the changed name field', () => {
    const payload = buildUpdateStaffPayload(original, { ...original, name: 'Jane Smith' });
    expect(payload).toEqual({ name: 'Jane Smith' });
  });

  it('does not send name when new value is empty string', () => {
    const payload = buildUpdateStaffPayload(original, { ...original, name: '  ' });
    expect('name' in payload).toBe(false);
  });

  it('sends changed branchIds', () => {
    const payload = buildUpdateStaffPayload(original, { ...original, branchIds: ['b1', 'b2'] });
    expect(payload.branchIds).toEqual(['b1', 'b2']);
  });

  it('sends changed status', () => {
    const payload = buildUpdateStaffPayload(original, { ...original, status: 'INACTIVE' });
    expect(payload.status).toBe('INACTIVE');
  });

  it('forces branchIds to [] when role changes to ADMIN', () => {
    const payload = buildUpdateStaffPayload(original, {
      ...original,
      role: 'ADMIN',
      branchIds: ['b1'],
    });
    expect(payload.role).toBe('ADMIN');
    expect(payload.branchIds).toEqual([]);
  });

  it('includes branchIds when role changes from ADMIN to non-ADMIN', () => {
    const adminOriginal: StaffEditFieldValues = {
      ...original,
      role: 'ADMIN',
      branchIds: [],
    };
    const payload = buildUpdateStaffPayload(adminOriginal, {
      ...adminOriginal,
      role: 'MANAGER',
      branchIds: ['b1'],
    });
    expect(payload.role).toBe('MANAGER');
    expect(payload.branchIds).toEqual(['b1']);
  });

  it('does not send email or tenantId (they are not in StaffEditFieldValues type)', () => {
    const payload = buildUpdateStaffPayload(original, { ...original, name: 'Changed' });
    expect('email' in payload).toBe(false);
    expect('tenantId' in payload).toBe(false);
  });

  it('sends only name when only name changes (no spurious keys)', () => {
    const payload = buildUpdateStaffPayload(
      { name: 'Old', role: 'CHEF', branchIds: ['b1'] },
      { name: 'New', role: 'CHEF', branchIds: ['b1'] },
    );
    expect(payload).toEqual({ name: 'New' });
  });
});
