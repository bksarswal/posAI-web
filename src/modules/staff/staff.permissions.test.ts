import { describe, it, expect } from 'vitest';
import { canManageStaff, creatableRoles } from './staff.permissions';
import type { UserRole } from '@/shared/lib/navigation';

describe('Staff Permissions (src/modules/staff/staff.permissions.ts)', () => {
  describe('canManageStaff', () => {
    const cases: [UserRole, boolean][] = [
      ['OWNER', true],
      ['ADMIN', true],
      ['MANAGER', false],
      ['WAITER', false],
      ['CASHIER', false],
      ['CHEF', false],
    ];

    it.each(cases)('canManageStaff(%s) returns %s', (role, expected) => {
      expect(canManageStaff(role)).toBe(expected);
    });
  });

  describe('creatableRoles', () => {
    it('OWNER can create ADMIN, MANAGER, WAITER, CASHIER, CHEF (cannot create OWNER)', () => {
      expect(creatableRoles('OWNER')).toEqual(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF']);
    });

    it('ADMIN can create MANAGER, WAITER, CASHIER, CHEF (cannot create OWNER or ADMIN)', () => {
      expect(creatableRoles('ADMIN')).toEqual(['MANAGER', 'WAITER', 'CASHIER', 'CHEF']);
    });

    const otherRoles: UserRole[] = ['MANAGER', 'WAITER', 'CASHIER', 'CHEF'];
    it.each(otherRoles)('%s cannot create any staff roles (returns empty array)', (role) => {
      expect(creatableRoles(role)).toEqual([]);
    });
  });
});
