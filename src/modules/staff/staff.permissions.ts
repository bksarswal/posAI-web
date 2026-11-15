import type { UserRole } from '@/shared/lib/navigation';
import type { StaffRole } from './staff.types';

/**
 * Returns true if the given role can manage staff.
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
