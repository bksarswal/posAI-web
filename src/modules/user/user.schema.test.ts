import { describe, it, expect, expectTypeOf } from 'vitest';
import type { z } from 'zod';
import { createStaffSchema, updateStaffSchema, updateProfileSchema } from './user.schema';

describe('User & Staff Schemas (src/modules/user/user.schema.ts)', () => {
  it('createStaffSchema rejects OWNER role at both compile-time and runtime', () => {
    // Compile-time check: 'OWNER' is not in the allowed role union
    expectTypeOf<'OWNER'>().not.toMatchTypeOf<z.input<typeof createStaffSchema>['role']>();

    // Runtime check: parsing object with OWNER throws validation error
    expect(() =>
      createStaffSchema.parse({
        name: 'Super Owner',
        email: 'owner@posai.com',
        role: 'OWNER' as unknown as 'ADMIN',
        branchIds: ['507f1f77bcf86cd799439011'],
      }),
    ).toThrow();
  });

  it('createStaffSchema enforces ADMIN accounts have empty branchIds', () => {
    // Valid ADMIN
    const admin = createStaffSchema.parse({
      name: 'Admin User',
      email: 'admin@posai.com',
      role: 'ADMIN',
      branchIds: [],
    });
    expect(admin.role).toBe('ADMIN');
    expect(admin.branchIds).toEqual([]);

    // Invalid ADMIN with branches
    expect(() =>
      createStaffSchema.parse({
        name: 'Admin User',
        email: 'admin@posai.com',
        role: 'ADMIN',
        branchIds: ['507f1f77bcf86cd799439011'],
      }),
    ).toThrow('ADMIN accounts must not be assigned to branches');
  });

  it('createStaffSchema enforces non-ADMIN staff have at least one branchId', () => {
    // Valid WAITER
    const waiter = createStaffSchema.parse({
      name: 'Waiter User',
      email: 'waiter@posai.com',
      role: 'WAITER',
      branchIds: ['507f1f77bcf86cd799439011'],
    });
    expect(waiter.branchIds).toHaveLength(1);

    // Invalid WAITER with empty branches
    expect(() =>
      createStaffSchema.parse({
        name: 'Waiter User',
        email: 'waiter@posai.com',
        role: 'WAITER',
        branchIds: [],
      }),
    ).toThrow('Staff must be assigned to at least one branch');
  });

  it('updateStaffSchema rejects empty payload and enforces branch rules when updated', () => {
    expect(() => updateStaffSchema.parse({})).toThrow(
      'Update payload must contain at least one field',
    );

    // Updating ADMIN with branches -> fails
    expect(() =>
      updateStaffSchema.parse({
        role: 'ADMIN',
        branchIds: ['507f1f77bcf86cd799439011'],
      }),
    ).toThrow('ADMIN accounts must not be assigned to branches');

    // Updating MANAGER with empty branches -> fails
    expect(() =>
      updateStaffSchema.parse({
        role: 'MANAGER',
        branchIds: [],
      }),
    ).toThrow('Staff must be assigned to at least one branch');
  });

  it('updateProfileSchema accepts name and phone, rejecting empty payload {}', () => {
    expect(() => updateProfileSchema.parse({})).toThrow(
      'Update payload must contain at least one field',
    );

    const parsed = updateProfileSchema.parse({
      name: 'Updated Name',
      phone: '9876543210',
    });
    expect(parsed.name).toBe('Updated Name');
    expect(parsed.phone).toBe('+919876543210');
  });
});
