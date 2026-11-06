import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Reset Password | POSAI',
  description: 'Set a new password for your POSAI account',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 rounded-lg" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
