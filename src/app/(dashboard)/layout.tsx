'use client';

import type { ReactNode } from 'react';
import { AppAuthGuard } from '@/modules/auth/guards/AppAuthGuard';
import { DashboardShell } from './_components/DashboardShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AppAuthGuard>
  );
}
