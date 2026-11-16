import type { UserRole } from '@/shared/lib/navigation';
import type { StaffRole, StaffStatus } from './staff.types';

/**
 * Returns true if the given role can manage staff (list / create).
 * Only OWNER and ADMIN may manage staff; all other roles are forbidden.
 */
export function canManageStaff(role: UserRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Returns the list of staff roles the actor is allowed to create:
 * - OWNER can create ADMIN, MANAGER, WAITER, CASHIER, CHEF (cannot create OWNER).
 * - ADMIN can create MANAGER, WAITER, CASHIER, CHEF (cannot create OWNER or ADMIN).
 * - Other roles cannot create staff (empty array).
 */
export function creatableRoles(actorRole: UserRole): StaffRole[] {
  if (actorRole === 'OWNER') {
    return ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF'];
  }
  if (actorRole === 'ADMIN') {
    return ['MANAGER', 'WAITER', 'CASHIER', 'CHEF'];
  }
  return [];
}

export interface StaffActorTarget {
  actorRole: UserRole;
  actorId: string;
  targetRole: StaffRole;
  targetId: string;
  targetStatus?: StaffStatus;
}

/**
 * Returns true when the actor may edit a target staff member's
 * role / branchIds / name / phone.
 *
 * Rules mirrored from server user.roles.ts:
 * - Only OWNER and ADMIN may edit.
 * - Nobody may edit an OWNER account (CANNOT_MODIFY_OWNER).
 * - ADMIN may not edit another ADMIN (only OWNER can).
 * - Nobody may change their own role/branchIds (self-edit of name/phone
 *   goes through the /me profile route, not this action).
 */
export function canEditStaff({
  actorRole,
  actorId,
  targetRole,
  targetId,
}: StaffActorTarget): boolean {
  if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') return false;
  if (targetRole === 'OWNER') return false;
  if (actorId === targetId) return false; // cannot modify self via staff route
  if (targetRole === 'ADMIN' && actorRole !== 'OWNER') return false;
  return true;
}

/**
 * Returns true when the actor may deactivate / reactivate a target.
 *
 * Rules mirrored from server:
 * - Only OWNER and ADMIN may change status.
 * - Nobody may deactivate an OWNER.
 * - Nobody may change their own status (self-deactivation → 409 on server).
 * - ADMIN may not change an ADMIN's status (only OWNER can).
 */
export function canDeactivateStaff({
  actorRole,
  actorId,
  targetRole,
  targetId,
}: StaffActorTarget): boolean {
  if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') return false;
  if (targetRole === 'OWNER') return false;
  if (actorId === targetId) return false;
  if (targetRole === 'ADMIN' && actorRole !== 'OWNER') return false;
  return true;
}

/**
 * Returns true when the actor may reset a target's password.
 *
 * Rules mirrored from server:
 * - Only OWNER and ADMIN may reset passwords.
 * - Nobody may reset an OWNER's password (CANNOT_MODIFY_OWNER).
 * - Nobody may reset their own password via staff route (use change-password).
 * - ADMIN may not reset another ADMIN's password (only OWNER can).
 */
export function canResetStaffPassword({
  actorRole,
  actorId,
  targetRole,
  targetId,
}: StaffActorTarget): boolean {
  if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') return false;
  if (targetRole === 'OWNER') return false;
  if (actorId === targetId) return false;
  if (targetRole === 'ADMIN' && actorRole !== 'OWNER') return false;
  return true;
}
