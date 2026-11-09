'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/modules/user/user.hooks';
import type { UserRole } from '@/shared/lib/navigation';

export interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RequireRole: Client-side UX guard for role-protected pages and sections.
 *
 * NOTE: This is a UX guard ONLY to keep users in their expected UI flow.
 * It is never relied upon for security; backend API endpoints enforce real authorization (RBAC).
 */
export function RequireRole({
  allowedRoles,
  children,
  fallback = null,
  redirectTo = '/dashboard',
}: RequireRoleProps) {
  const router = useRouter();
  const { data: meData, isLoading } = useCurrentUser();
  const role = meData?.data?.user?.role as UserRole | undefined;

  const isAllowed = role ? allowedRoles.includes(role) : false;

  useEffect(() => {
    if (!isLoading && role && !isAllowed) {
      router.push(redirectTo);
    }
  }, [isLoading, role, isAllowed, redirectTo, router]);

  if (isLoading || !role || !isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
