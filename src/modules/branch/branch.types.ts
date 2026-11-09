import type { paths } from '@/shared/types/api';

export type CreateBranchApiBody = NonNullable<
  paths['/api/v1/branches']['post']['requestBody']
>['content']['application/json'];

export type CreateBranchResponse =
  paths['/api/v1/branches']['post']['responses'][201]['content']['application/json'];

export type Branch =
  paths['/api/v1/branches']['post']['responses'][201]['content']['application/json']['data']['branch'];
