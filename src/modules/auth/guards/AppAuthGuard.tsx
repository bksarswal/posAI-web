'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/AuthProvider';
import { useCurrentUser } from '@/modules/user/user.hooks';
import type { CurrentUserResponse } from '@/modules/user/user.types';
import { getSafeRedirectPath } from '@/shared/lib/safeRedirect';

export interface AuthUserLike {
  mustChangePassword?: boolean;
}

export type OnboardingContextLike = CurrentUserResponse['data'];

/**
 * Pure decision function for onboarding redirect:
 * - OWNER, no restaurant: /onboarding/restaurant
 * - OWNER or ADMIN, restaurant exists, 0 branches: /onboarding/branch
 * - ADMIN, no restaurant: /onboarding/pending
 * - MANAGER/WAITER/CASHIER/CHEF, no restaurant OR 0 branches: /onboarding/pending
 * - everything else: null
 *
 * Loop safe: if already on the target path, returns null.
 */
export function getOnboardingRedirect(
  me: OnboardingContextLike | null | undefined,
  pathname: string,
): string | null {
  if (!me || !me.user) return null;

  const role = me.user.role;
  const hasRestaurant = me.restaurant !== null;
  const branchCount = Array.isArray(me.branches) ? me.branches.length : 0;

  let target: string | null = null;

  if (role === 'OWNER') {
    if (!hasRestaurant) {
      target = '/onboarding/restaurant';
    } else if (branchCount === 0) {
      target = '/onboarding/branch';
    }
  } else if (role === 'ADMIN') {
    if (!hasRestaurant) {
      target = '/onboarding/pending';
    } else if (branchCount === 0) {
      target = '/onboarding/branch';
    }
  } else {
    // MANAGER, WAITER, CASHIER, CHEF (or any other non-admin staff)
    if (!hasRestaurant || branchCount === 0) {
      target = '/onboarding/pending';
    }
  }

  if (!target) return null;

  if (pathname === target) {
    return null;
  }

  return target;
}

/**
 * Pure decision function for routing signed-in vs unauthenticated users:
 * - no session -> /login?returnUrl=<safe path>
 * - me.mustChangePassword -> /change-password (unless already there -> null)
 * - otherwise render children -> null (no redirect)
 */
export function getAuthRedirect(
  me: AuthUserLike | null | undefined,
  pathname: string,
): string | null {
  if (!me) {
    const safePath = getSafeRedirectPath(pathname, '/dashboard');
    return `/login?returnUrl=${encodeURIComponent(safePath)}`;
  }

  if (me.mustChangePassword) {
    if (pathname === '/change-password') {
      return null;
    }
    return '/change-password';
  }

  return null;
}

export interface AppAuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AppAuthGuard protects application routes by determining where a user belongs.
 * Order of checks:
 * 1. no session -> login
 * 2. mustChangePassword -> /change-password
 * 3. onboarding -> restaurant step / branch step / pending
 * 4. render children
 */
export function AppAuthGuard({ children, fallback = null }: AppAuthGuardProps) {
  const { isInitialized, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { data: meData, isLoading: isMeLoading } = useCurrentUser();
  const meContext = meData?.data;
  const me = meContext?.user;

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      const redirectUrl = getAuthRedirect(null, pathname);
      if (redirectUrl) {
        router.push(redirectUrl);
      }
      return;
    }

    if (!isMeLoading && meContext && me) {
      const authRedirect = getAuthRedirect(me, pathname);
      if (authRedirect) {
        router.push(authRedirect);
        return;
      }

      const onboardingRedirect = getOnboardingRedirect(meContext, pathname);
      if (onboardingRedirect) {
        router.push(onboardingRedirect);
      }
    }
  }, [isInitialized, isAuthenticated, isMeLoading, meContext, me, router, pathname]);

  if (!isInitialized || !isAuthenticated || isMeLoading || !meContext || !me) {
    return <>{fallback}</>;
  }

  const authRedirect = getAuthRedirect(me, pathname);
  if (authRedirect) {
    return <>{fallback}</>;
  }

  const onboardingRedirect = getOnboardingRedirect(meContext, pathname);
  if (onboardingRedirect) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
