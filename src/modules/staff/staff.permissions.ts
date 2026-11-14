import type { UserRole } from '@/shared/lib/navigation';

/**
 * Returns true if the given role can manage staff.
 * Only OWNER and ADMIN may manage staff; all other roles are forbidden.
 */
export function canManageStaff(role: UserRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
