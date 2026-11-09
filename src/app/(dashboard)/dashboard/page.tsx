'use client';

import { Building2, GitBranch, RefreshCw, Store, UserCheck } from 'lucide-react';
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
      <div className="space-y-6 max-w-5xl mx-auto">
        <Card className="border-slate-200">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
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

  const { user, restaurant, tenant, branches = [] } = data.data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Greeting & Role Badge */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2">
                <UserCheck className="h-3.5 w-3.5" />
                {user.role}
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome, {user.name} ({user.role})
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 mt-1">
                Organization: <span className="font-medium text-slate-800">{tenant.name}</span>
              </CardDescription>
            </div>

            {restaurant && (
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2">
                <Store className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Restaurant
                  </p>
                  <p className="text-sm font-bold text-slate-900">{restaurant.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Accessible Branches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">Accessible Branches</h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'} available
          </span>
        </div>

        {branches.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white text-center p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No branches accessible</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You are currently not assigned to any branches in this restaurant. Ask your
              administrator to assign you.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className="border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                      {branch.name}
                    </CardTitle>
                    {branch.isMain && (
                      <span className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                        Main
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs text-slate-500 font-mono pt-1">
                    Code: <span className="font-semibold text-slate-700">{branch.code}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 text-xs text-slate-600 space-y-1 border-t border-slate-100 mt-2 py-3 bg-slate-50/50 rounded-b-xl">
                  <p className="truncate">
                    {branch.address.city}, {branch.address.state} ({branch.address.pincode})
                  </p>
                  <div className="flex items-center justify-between text-slate-500 pt-1">
                    <span>Status: {branch.status}</span>
                    <span>{branch.currency}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
