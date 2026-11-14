'use client';

import { useMemo, useState } from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useCurrentUser } from '@/modules/user/user.hooks';
import { useStaff } from '../staff.hooks';
import type { StaffItem } from '../staff.types';

// The API's default limit is 20, max is 100.
// For MVP, we request the max (100) in a single fetch. If the tenant somehow
// has >100 staff the UI shows a "Showing X of Y" note rather than silently
// hiding records. Full paginated controls can be added in a future task.
const STAFF_PAGE_LIMIT = 100;

export function StaffListView() {
  const { data: staffData, isLoading, error, refetch } = useStaff({ limit: STAFF_PAGE_LIMIT });
  const { data: meData } = useCurrentUser();
  const [isRetrying, setIsRetrying] = useState(false);

  const items = staffData?.data?.items ?? [];
  const total = staffData?.data?.total ?? 0;

  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    const branches = meData?.data?.branches ?? [];
    for (const b of branches) {
      if (b.id && b.name) {
        map.set(b.id, b.name);
      }
    }
    return map;
  }, [meData?.data?.branches]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  };

  const columns: TableProps<StaffItem>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-semibold text-slate-900">{name}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <span className="text-slate-600">{email}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: StaffItem['role']) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {role}
        </span>
      ),
    },
    {
      title: 'Branches',
      key: 'branches',
      render: (_: unknown, record: StaffItem) => {
        const names = (record.branchIds ?? [])
          .map((id) => branchMap.get(id))
          .filter((name): name is string => Boolean(name));

        if (names.length === 0) {
          return null;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StaffItem['status']) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Must Change Password',
      dataIndex: 'mustChangePassword',
      key: 'mustChangePassword',
      render: (mustChange: boolean) =>
        mustChange ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Yes
          </span>
        ) : (
          <span className="text-xs text-slate-500">No</span>
        ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your restaurant staff and permissions
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-medium text-red-900">Failed to load staff</AlertTitle>
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
            <Users className="h-4 w-4 text-slate-500" />
            {isLoading
              ? 'Loading staff...'
              : total > items.length
                ? `Showing ${items.length} of ${total} staff members`
                : `${items.length} staff member${items.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {total > items.length && !isLoading && (
            <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Your tenant has {total} staff members but only the first {items.length} are shown. Use
              filters to find specific staff.
            </p>
          )}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
              <span>Loading staff...</span>
            </div>
          ) : (
            <Table<StaffItem>
              rowKey="id"
              columns={columns}
              dataSource={items}
              pagination={false}
              locale={{
                emptyText: (
                  <div className="py-8 text-center space-y-2">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No staff yet</p>
                  </div>
                ),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
