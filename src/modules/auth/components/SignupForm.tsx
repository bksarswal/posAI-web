'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Form, Input } from 'antd';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { parseApiError, toFormFieldErrors } from '@/shared/lib/apiError';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { useSignup } from '../auth.hooks';
import { signupSchema } from '../auth.schema';
import type { SignupInput } from '../auth.types';

export function SignupForm() {
  const [form] = Form.useForm<SignupInput>();

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSuccessAwaitingVerification, setIsSuccessAwaitingVerification] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signupMutation = useSignup();

  const handleSubmit = async (values: SignupInput) => {
    setErrorMessage(null);

    try {
      const response = await signupMutation.mutateAsync(values);
      const user = response.data.user;

      if (user.emailVerified) {
        // AUTO_VERIFY_EMAIL=true in dev: signup issues no token, so we never navigate to /dashboard.
        // Show a confirmation with a link to log in instead.
        setIsVerifiedSuccess(true);
      } else {
        // Verification email sent
        setSubmittedEmail(user.email);
        setIsSuccessAwaitingVerification(true);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      const formErrors = toFormFieldErrors(err);

      if (formErrors.length > 0) {
        form.setFields(formErrors as unknown as Parameters<typeof form.setFields>[0]);
      }
      setErrorMessage(parsed.message || 'Signup failed. Please check the form and try again.');
    }
  };

  // Auto-verified success (no token issued — show login prompt)
  if (isVerifiedSuccess) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Account created
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            Your account is ready. You can log in now.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Link
            href="/login"
            className={buttonVariants({
              className: 'h-11 w-full text-base font-medium',
            })}
          >
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  // If signup succeeded and email verification is needed, show confirmation screen
  if (isSuccessAwaitingVerification && submittedEmail) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Mail className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Check your email
          </CardTitle>
          <CardDescription className="text-base text-slate-600 pt-1">
            We&apos;ve sent a verification link to{' '}
            <span className="font-semibold text-slate-800">{submittedEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-slate-600">
            Click the link in your email to activate your account. If you don&apos;t see it within a
            few minutes, check your spam or junk folder.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/resend-verification?email=${encodeURIComponent(submittedEmail)}`}
              className={buttonVariants({
                variant: 'outline',
                className: 'h-11 w-full text-base font-medium',
              })}
            >
              Resend verification email
            </Link>

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

  return (
    <div className="w-full space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-medium text-red-900">Unable to create account</AlertTitle>
          <AlertDescription className="text-sm text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="space-y-4"
      >
        <Form.Item
          name="businessName"
          label={
            <span className="text-sm font-medium text-slate-700">Business or Restaurant Name</span>
          }
          rules={[
            { required: true, message: 'Please enter your business or restaurant name' },
            createZodAntdRule(signupSchema.shape.businessName),
          ]}
          className="mb-4"
        >
          <Input
            placeholder="Spice Garden"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Form.Item
          name="name"
          label={<span className="text-sm font-medium text-slate-700">Your Full Name</span>}
          rules={[
            { required: true, message: 'Please enter your name' },
            createZodAntdRule(signupSchema.shape.name),
          ]}
          className="mb-4"
        >
          <Input
            placeholder="Priya Sharma"
            autoComplete="name"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className="text-sm font-medium text-slate-700">Work Email</span>}
          rules={[
            { required: true, message: 'Please enter your work email' },
            createZodAntdRule(signupSchema.shape.email),
          ]}
          className="mb-4"
        >
          <Input
            type="email"
            placeholder="priya@spicegarden.com"
            autoComplete="email"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <span className="text-xs text-slate-500">Min. 8 characters</span>
            </div>
          }
          rules={[
            { required: true, message: 'Please enter a password' },
            createZodAntdRule(signupSchema.shape.password),
          ]}
          className="mb-4"
        >
          <Input.Password
            placeholder="••••••••"
            autoComplete="new-password"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label={
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-700">Phone Number</span>
              <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </div>
          }
          rules={[createZodAntdRule(signupSchema.shape.phone)]}
          className="mb-6"
        >
          <Input
            placeholder="+91 98765 43210"
            autoComplete="tel"
            className="h-11 rounded-lg border-slate-300 text-base"
          />
        </Form.Item>

        <Button
          type="submit"
          disabled={signupMutation.isPending}
          className="h-11 w-full text-base font-medium shadow-sm transition-all"
        >
          {signupMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </Form>

      <div className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
