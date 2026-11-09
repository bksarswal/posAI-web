import type { paths } from '@/shared/types/api';

export type CreateBranchApiBody = NonNullable<
  paths['/api/v1/branches']['post']['requestBody']
>['content']['application/json'];

export type CreateBranchResponse =
  paths['/api/v1/branches']['post']['responses'][201]['content']['application/json'];

export type Branch =
  paths['/api/v1/branches']['post']['responses'][201]['content']['application/json']['data']['branch'];

export type ListBranchesResponse =
  paths['/api/v1/branches']['get']['responses'][200]['content']['application/json'];

export type GetBranchResponse =
  paths['/api/v1/branches/{id}']['get']['responses'][200]['content']['application/json'];

export type UpdateBranchApiBody = NonNullable<
  paths['/api/v1/branches/{id}']['patch']['requestBody']
>['content']['application/json'];

export type UpdateBranchResponse =
  paths['/api/v1/branches/{id}']['patch']['responses'][200]['content']['application/json'];
