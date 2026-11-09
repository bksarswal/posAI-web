import { describe, it, expect } from 'vitest';
import { getNavItems, type UserRole, NAV_CONFIG } from './navigation';

describe('Navigation (src/shared/lib/navigation.ts)', () => {
  const allRoles: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF'];

  it('getNavItems matrix: OWNER, ADMIN, MANAGER, WAITER, CASHIER, CHEF with includeNotReady true AND false', () => {
    // When includeNotReady: false (default behavior)
    for (const role of allRoles) {
      const items = getNavItems(role, { includeNotReady: false });
      // Dashboard and Profile are ready: true
      expect(items.map((i) => i.key)).toEqual(['dashboard', 'profile']);
    }

    // When includeNotReady: true (full matrix)
    const ownerItems = getNavItems('OWNER', { includeNotReady: true }).map((i) => i.key);
    expect(ownerItems).toEqual(['dashboard', 'branches', 'restaurant', 'staff', 'profile']);

    const adminItems = getNavItems('ADMIN', { includeNotReady: true }).map((i) => i.key);
    expect(adminItems).toEqual(['dashboard', 'branches', 'restaurant', 'staff', 'profile']);

    const nonAdminRoles: UserRole[] = ['MANAGER', 'WAITER', 'CASHIER', 'CHEF'];
    for (const role of nonAdminRoles) {
      const items = getNavItems(role, { includeNotReady: true }).map((i) => i.key);
      // Staff and Restaurant must only be for OWNER/ADMIN; Branches/Profile/Dashboard for everyone
      expect(items).toEqual(['dashboard', 'branches', 'profile']);
      expect(items).not.toContain('restaurant');
      expect(items).not.toContain('staff');
    }
  });

  it('default call never returns a not-ready item', () => {
    for (const role of allRoles) {
      const defaultItems = getNavItems(role);
      for (const item of defaultItems) {
        expect(item.ready).toBe(true);
      }
    }
  });

  it('navigation: every role sees Profile by default', () => {
    for (const role of allRoles) {
      const defaultItems = getNavItems(role);
      const keys = defaultItems.map((i) => i.key);
      expect(keys).toContain('profile');
      expect(keys).toEqual(['dashboard', 'profile']);
    }
  });

  it('NAV_CONFIG integrity', () => {
    expect(NAV_CONFIG.find((i) => i.key === 'dashboard')?.roles).toHaveLength(6);
    expect(NAV_CONFIG.find((i) => i.key === 'restaurant')?.roles).toEqual(['OWNER', 'ADMIN']);
    expect(NAV_CONFIG.find((i) => i.key === 'staff')?.roles).toEqual(['OWNER', 'ADMIN']);
  });
});
