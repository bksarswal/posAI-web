'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Form, Input } from 'antd';
import { ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { createZodAntdRule } from '@/shared/lib/zodAntdRule';
import { RESEND_COOLDOWN_SECONDS } from '../auth.constants';
import { useResendVerification } from '../auth.hooks';
import { resendVerificationSchema } from '../auth.schema';
import type { z } from 'zod';

type ResendInput = z.infer<typeof resendVerificationSchema>;

export function ResendVerificationForm() {
  const [form] = Form.useForm<ResendInput>();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resendMutation = useResendVerification();

  useEffect(() => {
    if (emailParam) {
      form.setFieldsValue({ email: emailParam });
    }
  }, [emailParam, form]);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (values: ResendInput) => {
    try {
      await resendMutation.mutateAsync(values.email);
      setSuccessMessage(
        `If an account exists for ${values.email}, we sent a verification link. Please check your inbox and spam folder.`,
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Backend returns generic message or rate limits; still show generic message to prevent account enumeration
      setSuccessMessage(`If an account exists for ${values.email}, we sent a verification link.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Send className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Resend verification email
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">
          Enter your email address and we will send you a new link to verify your account.
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
              createZodAntdRule(resendVerificationSchema.shape.email),
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
            disabled={resendMutation.isPending || cooldown > 0}
            className="h-11 w-full text-base font-medium shadow-sm transition-all"
          >
            {resendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending verification link...
              </>
            ) : cooldown > 0 ? (
              `Resend available in ${cooldown}s`
            ) : (
              'Resend verification link'
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
