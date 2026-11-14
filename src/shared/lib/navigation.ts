import type { UserRole } from '@/shared/types/api';

export type { UserRole };

export interface NavItemConfig {
  key: string;
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  ready: boolean;
}

export const ALL_ROLES: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF'];

export const NAV_CONFIG: NavItemConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ALL_ROLES,
    ready: true,
  },
  {
    key: 'branches',
    label: 'Branches',
    href: '/branches',
    icon: 'GitBranch',
    roles: ALL_ROLES,
    ready: true,
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    href: '/restaurant',
    icon: 'Store',
    roles: ['OWNER', 'ADMIN'],
    ready: true,
  },
  {
    key: 'staff',
    label: 'Staff',
    href: '/staff',
    icon: 'Users',
    roles: ['OWNER', 'ADMIN'],
    ready: true,
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: 'User',
    roles: ALL_ROLES,
    ready: true,
  },
];

export interface GetNavItemsOptions {
  includeNotReady?: boolean;
}

/**
 * Pure function to return navigation items for a given user role.
 * By default, returns only items where ready === true AND the role is permitted.
 * Pass { includeNotReady: true } to include items not yet marked ready (for testing or future enabling).
 */
export function getNavItems(role: UserRole, opts?: GetNavItemsOptions): NavItemConfig[] {
  const includeNotReady = opts?.includeNotReady ?? false;

  return NAV_CONFIG.filter((item) => {
    const isAllowedForRole = item.roles.includes(role);
    if (!isAllowedForRole) return false;

    if (!includeNotReady && !item.ready) {
      return false;
    }

    return true;
  });
}
