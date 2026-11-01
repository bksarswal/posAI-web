'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isInitialized, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Client-side route guard: redirect unauthenticated users to /login with returnUrl
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  // While session is initializing, render nothing to avoid a flash of protected content
  if (!isInitialized) {
    return null;
  }

  // After initialization, if unauthenticated the effect above fires the redirect;
  // render null in the meantime to avoid flashing protected content.
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
              P
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">POSAI</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
