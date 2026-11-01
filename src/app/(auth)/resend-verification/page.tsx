import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResendVerificationForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Resend Verification | POSAI',
  description: 'Request a new email verification link for your POSAI account',
};

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 rounded-lg" />}>
      <ResendVerificationForm />
    </Suspense>
  );
}
