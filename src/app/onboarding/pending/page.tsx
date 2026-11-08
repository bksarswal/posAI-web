import type { Metadata } from 'next';
import { OnboardingPendingCard } from './OnboardingPendingCard';

export const metadata: Metadata = {
  title: 'Setup in Progress - POSAI',
  description: 'Awaiting restaurant or branch setup completion',
};

export default function OnboardingPendingPage() {
  return <OnboardingPendingCard />;
}
