import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { LoginForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Sign In | POSAI',
  description: 'Sign in to your POSAI restaurant management account',
};

export default function LoginPage() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Enter your email and password to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-48 animate-pulse bg-slate-100 rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
