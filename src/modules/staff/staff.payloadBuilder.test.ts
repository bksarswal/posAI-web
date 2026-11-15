import { describe, it, expect } from 'vitest';
import { buildCreateStaffPayload } from './staff.payloadBuilder';

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
