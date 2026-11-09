import type { paths } from '@/shared/types/api';

export type CreateRestaurantApiBody = NonNullable<
  paths['/api/v1/restaurant']['post']['requestBody']
>['content']['application/json'];

export type CreateRestaurantResponse =
  paths['/api/v1/restaurant']['post']['responses'][201]['content']['application/json'];

export type Restaurant =
  paths['/api/v1/restaurant']['get']['responses'][200]['content']['application/json']['data']['restaurant'];
