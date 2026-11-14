import type { paths } from '@/shared/types/api';

export type ListStaffResponse =
  paths['/api/v1/users']['get']['responses'][200]['content']['application/json'];

export type StaffListQuery = NonNullable<paths['/api/v1/users']['get']['parameters']['query']>;

export type StaffItem = ListStaffResponse['data']['items'][number];
export type StaffRole = StaffItem['role'];
export type StaffStatus = StaffItem['status'];
