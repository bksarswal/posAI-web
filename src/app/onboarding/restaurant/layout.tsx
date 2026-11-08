import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppAuthGuard } from '@/modules/auth/guards/AppAuthGuard';

export default function OnboardingRestaurantLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGuard>
      <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
          <div className="flex justify-center">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white shadow-sm">
                P
              </span>
              <span className="text-2xl font-bold tracking-tight text-slate-900">POSAI</span>
            </Link>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">{children}</div>
      </div>
    </AppAuthGuard>
  );
}
