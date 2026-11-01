import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { SignupForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Create an Account | POSAI',
  description: 'Register your restaurant business on POSAI',
};

export default function SignupPage() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Create an account
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Start managing your restaurant with POSAI today
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
