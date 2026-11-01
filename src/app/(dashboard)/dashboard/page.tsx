'use client';

import { LogOut, RefreshCw, Store, UserCheck } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { useAuth, useLogout } from '@/modules/auth';
import { useCurrentUser } from '@/modules/user';

export default function DashboardPage() {
  const { isInitialized } = useAuth();
  const { data, isLoading, isError, error, refetch } = useCurrentUser();
  const logoutMutation = useLogout();

  // Loading skeleton while initial session restores or user profile is loading
  if (!isInitialized || isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="border-slate-200">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with retry
  if (isError || !data?.data) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertTitle className="font-semibold">Failed to load user profile</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            {error?.message || 'Unable to retrieve your profile information. Please try again.'}
          </AlertDescription>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-red-300 bg-white text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-red-700 hover:bg-red-100"
            >
              Log out
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const { user, restaurant, tenant } = data.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
              <UserCheck className="h-3.5 w-3.5" />
              {user.role}
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome, {user.name} ({user.role})
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Organization: <span className="font-medium text-slate-800">{tenant.name}</span>
            </CardDescription>
          </div>

          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {restaurant ? restaurant.name : 'No restaurant profile created yet'}
                </h4>
                <p className="text-xs text-slate-500">
                  {restaurant
                    ? `${restaurant.address.city}, ${restaurant.address.state}`
                    : 'Complete onboarding to set up your restaurant and branches.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
