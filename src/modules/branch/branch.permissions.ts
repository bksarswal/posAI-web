import type { UserRole } from '@/shared/lib/navigation';

/**
 * Returns true if the given role can manage branches (create/edit).
 * Only OWNER and ADMIN may manage branches; all other roles are read-only.
 */
export function canManageBranches(role: UserRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
