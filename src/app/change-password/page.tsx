import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/modules/auth/components/ChangePasswordForm';

export const metadata: Metadata = {
  title: 'Change Password | POSAI',
  description: 'Update your account password',
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
