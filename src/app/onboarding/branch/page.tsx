import type { Metadata } from 'next';
import { BranchForm } from '@/modules/branch';

export const metadata: Metadata = {
  title: 'Create Branch - POSAI',
  description: 'Onboarding step 2: set up your first restaurant branch',
};

export default function OnboardingBranchPage() {
  return <BranchForm />;
}
