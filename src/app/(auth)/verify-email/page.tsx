import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyEmailCard } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Verify Email | POSAI',
  description: 'Verify your email address to activate your POSAI account',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 rounded-lg" />}>
      <VerifyEmailCard />
    </Suspense>
  );
}
