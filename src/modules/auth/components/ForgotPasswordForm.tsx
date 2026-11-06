'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Form, Input } from 'antd';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { parseApiError } from '@/shared/lib/apiError';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { FORGOT_PASSWORD_COOLDOWN_SECONDS } from '../auth.constants';
import { useForgotPassword } from '../auth.hooks';
import { forgotPasswordSchema } from '../auth.schema';
import type { ForgotPasswordInput } from '../auth.types';

export function ForgotPasswordForm() {
  const [form] = Form.useForm<ForgotPasswordInput>();
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const forgotPasswordMutation = useForgotPassword();

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (values: ForgotPasswordInput) => {
    try {
      await forgotPasswordMutation.mutateAsync(values.email);
      setSuccessMessage('If an account exists, a reset link was sent.');
      setCooldown(FORGOT_PASSWORD_COOLDOWN_SECONDS);
    } catch (err) {
      const parsed = parseApiError(err);

      if (parsed.code === ERROR_CODES.RATE_LIMITED) {
        toast.error('Too many requests. Please wait a few moments before trying again.');
        return;
      }

      // On any other backend error, still show the exact same generic success message
      // to avoid leaking account existence (security requirement)
      setSuccessMessage('If an account exists, a reset link was sent.');
      setCooldown(FORGOT_PASSWORD_COOLDOWN_SECONDS);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Forgot password?
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          Enter your email address and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {successMessage && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="font-medium text-emerald-900">Link sent</AlertTitle>
            <AlertDescription className="text-sm text-emerald-800">
              {successMessage}
            </AlertDescription>
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
            name="email"
            label={<span className="text-sm font-medium text-slate-700">Work Email</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              createZodAntdRule(forgotPasswordSchema.shape.email),
            ]}
            className="mb-4"
          >
            <Input
              type="email"
              placeholder="you@restaurant.com"
              autoComplete="email"
              className="h-11 rounded-lg border-slate-300 text-base"
            />
          </Form.Item>

          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending || cooldown > 0}
            className="h-11 w-full text-base font-medium shadow-sm transition-all"
          >
            {forgotPasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : cooldown > 0 ? (
              `Resend available in ${cooldown}s`
            ) : (
              'Send reset link'
            )}
          </Button>
        </Form>

        <div className="text-center">
          <Link
            href="/login"
            className={buttonVariants({
              variant: 'ghost',
              className:
                'text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5',
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
