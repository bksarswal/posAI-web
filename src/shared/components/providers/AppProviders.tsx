'use client';

import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ReactQueryProvider } from './QueryProvider';
import { AntdProvider } from './AntdProvider';
import { AuthProvider } from '@/modules/auth/AuthProvider';
import { Toaster } from '@/shared/ui/sonner';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <AntdRegistry>
        <AntdProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </AntdProvider>
      </AntdRegistry>
    </ReactQueryProvider>
  );
}
