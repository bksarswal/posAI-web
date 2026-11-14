import { describe, it, expect } from 'vitest';
import { canManageStaff } from './staff.permissions';
import type { UserRole } from '@/shared/lib/navigation';

describe('canManageStaff (src/modules/staff/staff.permissions.ts)', () => {
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
