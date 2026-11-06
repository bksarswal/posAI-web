'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/AuthProvider';
import { useCurrentUser } from '@/modules/user/user.hooks';
import { getSafeRedirectPath } from '@/shared/lib/safeRedirect';

export interface AuthUserLike {
  mustChangePassword?: boolean;
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
 * Handles silent auth initialization, unauthenticated redirects, and forced password changes.
 */
export function AppAuthGuard({ children, fallback = null }: AppAuthGuardProps) {
  const { isInitialized, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { data: meData, isLoading: isMeLoading } = useCurrentUser();
  const me = meData?.data?.user;

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      const redirectUrl = getAuthRedirect(null, pathname);
      if (redirectUrl) {
        router.push(redirectUrl);
      }
      return;
    }

    if (!isMeLoading && me) {
      const redirectUrl = getAuthRedirect(me, pathname);
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  }, [isInitialized, isAuthenticated, isMeLoading, me, router, pathname]);

  if (!isInitialized || !isAuthenticated || isMeLoading || !me) {
    return <>{fallback}</>;
  }

  const redirectUrl = getAuthRedirect(me, pathname);
  if (redirectUrl) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
