import type { paths } from '@/shared/types/api';

export type ListStaffResponse =
  paths['/api/v1/users']['get']['responses'][200]['content']['application/json'];

export type StaffListQuery = NonNullable<paths['/api/v1/users']['get']['parameters']['query']>;

export type StaffItem = ListStaffResponse['data']['items'][number];
export type StaffRole = StaffItem['role'];
export type StaffStatus = StaffItem['status'];

export type CreateStaffApiBody = NonNullable<
  paths['/api/v1/users']['post']['requestBody']
>['content']['application/json'];

export type CreateStaffResponse =
  paths['/api/v1/users']['post']['responses'][201]['content']['application/json'];

export type UpdateStaffApiBody = NonNullable<
  paths['/api/v1/users/{id}']['patch']['requestBody']
>['content']['application/json'];

export type UpdateStaffResponse =
  paths['/api/v1/users/{id}']['patch']['responses'][200]['content']['application/json'];

export type ResetStaffPasswordResponse =
  paths['/api/v1/users/{id}/reset-password']['post']['responses'][200]['content']['application/json'];
