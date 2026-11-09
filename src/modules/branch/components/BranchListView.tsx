'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, Pencil, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCurrentUser } from '@/modules/user/user.hooks';
import { useBranches } from '../branch.hooks';
import type { Branch } from '../branch.types';
import { canManageBranches } from '../branch.permissions';
import type { UserRole } from '@/shared/lib/navigation';

function BranchStatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  );
}

function BranchRow({ branch, canManage }: { branch: Branch; canManage: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 truncate">{branch.name}</span>
          {branch.isMain && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Main
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span className="font-mono">{branch.code}</span>
          <span>·</span>
          <span>{branch.address.city}</span>
          {branch.phone && (
            <>
              <span>·</span>
              <span>{branch.phone}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <BranchStatusBadge status={branch.status} />
        {canManage && (
          <Link href={`/branches/${branch.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit {branch.name}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function BranchListView() {
  const { data: branchesData, isLoading, error, refetch } = useBranches();
  const { data: meData } = useCurrentUser();
  const [isRetrying, setIsRetrying] = useState(false);

  const role = meData?.data?.user?.role as UserRole | undefined;
  const canManage = role ? canManageBranches(role) : false;

  const branches = branchesData?.data?.branches ?? [];

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Branches</h1>
          <p className="text-sm text-slate-500 mt-1">
            {canManage ? 'Manage your restaurant branches' : 'Your accessible branches'}
          </p>
        </div>
        {canManage && (
          <Link href="/branches/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Branch
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-medium text-red-900">Failed to load branches</AlertTitle>
          <AlertDescription className="flex items-center gap-3 text-sm text-red-800">
            <span>Something went wrong. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-auto"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1">Retry</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-slate-500" />
            {isLoading
              ? 'Loading...'
              : `${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-16 ml-4" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && branches.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <GitBranch className="mx-auto h-10 w-10 text-slate-300" />
              <div>
                <p className="text-sm font-medium text-slate-700">No branches yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  {canManage
                    ? 'Create your first branch to get started.'
                    : 'You have no branches assigned.'}
                </p>
              </div>
              {canManage && (
                <Link href="/branches/new">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Branch
                  </Button>
                </Link>
              )}
            </div>
          )}

          {!isLoading && branches.length > 0 && (
            <div>
              {branches.map((branch) => (
                <BranchRow key={branch.id} branch={branch} canManage={canManage} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
