import { describe, it, expect } from 'vitest';
import { canManageBranches } from './branch.permissions';
import type { UserRole } from '@/shared/lib/navigation';

describe('canManageBranches (src/modules/branch/branch.permissions.ts)', () => {
  const cases: [UserRole, boolean][] = [
    ['OWNER', true],
    ['ADMIN', true],
    ['MANAGER', false],
    ['WAITER', false],
    ['CASHIER', false],
    ['CHEF', false],
  ];

  it.each(cases)('canManageBranches(%s) returns %s', (role, expected) => {
    expect(canManageBranches(role)).toBe(expected);
  });
});
