'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useCurrentUser } from '@/modules/user/user.hooks';
import { useLogout } from '@/modules/auth/auth.hooks';

export function OnboardingPendingCard() {
  const router = useRouter();
  const { data: meData, isLoading, isFetching, refetch } = useCurrentUser();
  const logoutMutation = useLogout();

  const meContext = meData?.data;
  const user = meContext?.user;
  const restaurant = meContext?.restaurant;
  const branches = useMemo(() => meContext?.branches ?? [], [meContext?.branches]);

  // Auto-redirect when onboarding is no longer needed:
  // If user has restaurant AND has at least 1 branch, onboarding is done -> /dashboard
  useEffect(() => {
    if (isLoading || !user) return;

    if (restaurant !== null && branches.length > 0) {
      router.push('/dashboard');
    }
  }, [isLoading, user, restaurant, branches, router]);

  // Determine user message
  const isNoRestaurant = restaurant === null;
  const message = isNoRestaurant
    ? 'Your owner is still setting up the restaurant. Please check back shortly.'
    : 'No branch is assigned to you yet, ask your owner to assign you to a branch.';

  return (
    <Card className="border-slate-200 shadow-sm max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Clock className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Setup in Progress
        </CardTitle>
        <CardDescription className="text-base text-slate-600 pt-1">{message}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-11 w-full text-base font-medium shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Checking...' : 'Check again'}
        </Button>

        <div className="text-center pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
