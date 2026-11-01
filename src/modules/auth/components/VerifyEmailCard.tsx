'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { buttonVariants } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { parseApiError } from '@/shared/lib/apiError';
import { useVerifyEmail } from '../auth.hooks';

type VerificationState = 'loading' | 'success' | 'error';

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verifyEmailMutation = useVerifyEmail();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    // Guard against React StrictMode running effect twice in development
    if (hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;

    verifyEmailMutation
      .mutateAsync(token)
      .then(() => {
        setState('success');
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setErrorMessage(parsed.message || 'This verification link is invalid or has expired.');
        setState('error');
      });
  }, [token, verifyEmailMutation]);

  // Derived state: missing token
  if (!token) {
    return (
      <Card className="border-slate-200 shadow-sm text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Missing verification token
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            No verification token was provided in the link. Please check your verification email or
            request a new link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/resend-verification"
            className={buttonVariants({ className: 'h-11 w-full text-base font-medium' })}
          >
            Request new verification link
          </Link>
          <div>
            <Link
              href="/login"
              className={buttonVariants({
                variant: 'ghost',
                className: 'h-11 w-full text-base text-slate-600',
              })}
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'loading') {
    return (
      <Card className="border-slate-200 shadow-sm text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Verifying your email
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            Please wait while we verify your email address...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse bg-blue-600 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'success') {
    return (
      <Card className="border-slate-200 shadow-sm text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Email verified!
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            Your email has been verified successfully. You can now sign in to your POSAI account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/login"
            className={buttonVariants({ className: 'h-11 w-full text-base font-medium' })}
          >
            Continue to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm text-center">
      <CardHeader className="pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Verification failed
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          {errorMessage || 'This link has expired or has already been used.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link
          href="/resend-verification"
          className={buttonVariants({ className: 'h-11 w-full text-base font-medium' })}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Request new verification link
        </Link>
        <div>
          <Link
            href="/login"
            className={buttonVariants({
              variant: 'ghost',
              className: 'h-11 w-full text-base text-slate-600',
            })}
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
