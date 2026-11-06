import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Forgot Password | POSAI',
  description: 'Reset your POSAI account password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
