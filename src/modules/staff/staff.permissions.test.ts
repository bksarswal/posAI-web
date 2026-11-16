import { describe, it, expect } from 'vitest';
import {
  canManageStaff,
  creatableRoles,
  canEditStaff,
  canDeactivateStaff,
  canResetStaffPassword,
  type StaffActorTarget,
} from './staff.permissions';
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

  // ─── canEditStaff ──────────────────────────────────────────────────────────

  describe('canEditStaff', () => {
    const base: StaffActorTarget = {
      actorRole: 'OWNER',
      actorId: 'actor-1',
      targetRole: 'WAITER',
      targetId: 'target-1',
    };

    it('OWNER can edit a WAITER', () => {
      expect(canEditStaff({ ...base, actorRole: 'OWNER', targetRole: 'WAITER' })).toBe(true);
    });

    it('OWNER can edit an ADMIN', () => {
      expect(canEditStaff({ ...base, actorRole: 'OWNER', targetRole: 'ADMIN' })).toBe(true);
    });

    it('OWNER cannot edit another OWNER (CANNOT_MODIFY_OWNER)', () => {
      expect(canEditStaff({ ...base, actorRole: 'OWNER', targetRole: 'OWNER' })).toBe(false);
    });

    it('ADMIN can edit a WAITER', () => {
      expect(canEditStaff({ ...base, actorRole: 'ADMIN', targetRole: 'WAITER' })).toBe(true);
    });

    it('ADMIN cannot edit an ADMIN (only OWNER can)', () => {
      expect(canEditStaff({ ...base, actorRole: 'ADMIN', targetRole: 'ADMIN' })).toBe(false);
    });

    it('ADMIN cannot edit an OWNER', () => {
      expect(canEditStaff({ ...base, actorRole: 'ADMIN', targetRole: 'OWNER' })).toBe(false);
    });

    it('MANAGER cannot edit anyone', () => {
      expect(canEditStaff({ ...base, actorRole: 'MANAGER', targetRole: 'WAITER' })).toBe(false);
    });

    it('nobody can edit themselves (actorId === targetId)', () => {
      expect(
        canEditStaff({
          ...base,
          actorRole: 'OWNER',
          actorId: 'same-id',
          targetId: 'same-id',
          targetRole: 'WAITER',
        }),
      ).toBe(false);
    });

    it('ADMIN cannot edit self', () => {
      expect(
        canEditStaff({
          ...base,
          actorRole: 'ADMIN',
          actorId: 'same-id',
          targetId: 'same-id',
          targetRole: 'ADMIN',
        }),
      ).toBe(false);
    });
  });

  // ─── canDeactivateStaff ───────────────────────────────────────────────────

  describe('canDeactivateStaff', () => {
    const base: StaffActorTarget = {
      actorRole: 'OWNER',
      actorId: 'actor-1',
      targetRole: 'WAITER',
      targetId: 'target-1',
    };

    it('OWNER can deactivate a WAITER', () => {
      expect(canDeactivateStaff({ ...base, actorRole: 'OWNER', targetRole: 'WAITER' })).toBe(true);
    });

    it('OWNER can deactivate an ADMIN', () => {
      expect(canDeactivateStaff({ ...base, actorRole: 'OWNER', targetRole: 'ADMIN' })).toBe(true);
    });

    it('OWNER cannot deactivate another OWNER', () => {
      expect(canDeactivateStaff({ ...base, actorRole: 'OWNER', targetRole: 'OWNER' })).toBe(false);
    });

    it('ADMIN can deactivate a WAITER', () => {
      expect(canDeactivateStaff({ ...base, actorRole: 'ADMIN', targetRole: 'WAITER' })).toBe(true);
    });

    it('ADMIN cannot deactivate an ADMIN (only OWNER can)', () => {
      expect(canDeactivateStaff({ ...base, actorRole: 'ADMIN', targetRole: 'ADMIN' })).toBe(false);
    });

    it('nobody can deactivate themselves', () => {
      expect(
        canDeactivateStaff({
          ...base,
          actorRole: 'OWNER',
          actorId: 'same-id',
          targetId: 'same-id',
          targetRole: 'WAITER',
        }),
      ).toBe(false);
    });

    it('MANAGER cannot deactivate anyone', () => {
      expect(canDeactivateStaff({ ...base, actorRole: 'MANAGER', targetRole: 'WAITER' })).toBe(
        false,
      );
    });
  });

  // ─── canResetStaffPassword ────────────────────────────────────────────────

  describe('canResetStaffPassword', () => {
    const base: StaffActorTarget = {
      actorRole: 'OWNER',
      actorId: 'actor-1',
      targetRole: 'WAITER',
      targetId: 'target-1',
    };

    it('OWNER can reset a WAITER password', () => {
      expect(canResetStaffPassword({ ...base, actorRole: 'OWNER', targetRole: 'WAITER' })).toBe(
        true,
      );
    });

    it('OWNER can reset an ADMIN password', () => {
      expect(canResetStaffPassword({ ...base, actorRole: 'OWNER', targetRole: 'ADMIN' })).toBe(
        true,
      );
    });

    it('OWNER cannot reset another OWNER password', () => {
      expect(canResetStaffPassword({ ...base, actorRole: 'OWNER', targetRole: 'OWNER' })).toBe(
        false,
      );
    });

    it('ADMIN can reset a WAITER password', () => {
      expect(canResetStaffPassword({ ...base, actorRole: 'ADMIN', targetRole: 'WAITER' })).toBe(
        true,
      );
    });

    it('ADMIN cannot reset an ADMIN password (only OWNER can)', () => {
      expect(canResetStaffPassword({ ...base, actorRole: 'ADMIN', targetRole: 'ADMIN' })).toBe(
        false,
      );
    });

    it('nobody can reset their own password via staff route', () => {
      expect(
        canResetStaffPassword({
          ...base,
          actorId: 'same-id',
          targetId: 'same-id',
          targetRole: 'WAITER',
        }),
      ).toBe(false);
    });

    it('MANAGER cannot reset anyone password', () => {
      expect(canResetStaffPassword({ ...base, actorRole: 'MANAGER', targetRole: 'WAITER' })).toBe(
        false,
      );
    });
  });
});
