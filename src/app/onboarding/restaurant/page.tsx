import type { Metadata } from 'next';
import { RestaurantForm } from '@/modules/restaurant';

export const metadata: Metadata = {
  title: 'Create Restaurant - POSAI',
  description: 'Onboarding step 1: set up your restaurant profile',
};

export default function OnboardingRestaurantPage() {
  return <RestaurantForm />;
}
