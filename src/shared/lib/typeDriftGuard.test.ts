import { describe, it, expectTypeOf } from 'vitest';
import type { z } from 'zod';
import type { paths } from '@/shared/types/api';
import type {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordApiSchema,
  changePasswordSchema,
} from '@/modules/auth';
import type { createRestaurantSchema, updateRestaurantSchema } from '@/modules/restaurant';
import type { createBranchSchema, updateBranchSchema } from '@/modules/branch';
import type { createStaffSchema, updateStaffSchema, updateProfileSchema } from '@/modules/user';

type JsonBody<T> = T extends { requestBody?: { content: { 'application/json': infer B } } }
  ? B
  : never;

describe('Type Drift Guard: Schema output types match generated OpenAPI request bodies', () => {
  it('Auth schemas match OpenAPI request specifications', () => {
    type SignupApiBody = JsonBody<paths['/api/v1/auth/signup']['post']>;
    type LoginApiBody = JsonBody<paths['/api/v1/auth/login']['post']>;
    type ForgotPasswordApiBody = JsonBody<paths['/api/v1/auth/forgot-password']['post']>;
    type ResendVerificationApiBody = JsonBody<paths['/api/v1/auth/resend-verification']['post']>;
    type ResetPasswordApiBody = JsonBody<paths['/api/v1/auth/reset-password']['post']>;
    type ChangePasswordApiBody = JsonBody<paths['/api/v1/auth/change-password']['post']>;

    expectTypeOf<z.output<typeof signupSchema>>().toMatchTypeOf<SignupApiBody>();
    expectTypeOf<z.output<typeof loginSchema>>().toMatchTypeOf<LoginApiBody>();
    expectTypeOf<z.output<typeof forgotPasswordSchema>>().toMatchTypeOf<ForgotPasswordApiBody>();
    expectTypeOf<
      z.output<typeof resendVerificationSchema>
    >().toMatchTypeOf<ResendVerificationApiBody>();
    expectTypeOf<z.output<typeof resetPasswordApiSchema>>().toMatchTypeOf<ResetPasswordApiBody>();
    expectTypeOf<z.output<typeof changePasswordSchema>>().toMatchTypeOf<ChangePasswordApiBody>();
  });

  it('Restaurant schemas match OpenAPI request specifications', () => {
    type CreateRestaurantApiBody = JsonBody<paths['/api/v1/restaurant']['post']>;
    type UpdateRestaurantApiBody = JsonBody<paths['/api/v1/restaurant']['patch']>;

    expectTypeOf<
      z.output<typeof createRestaurantSchema>
    >().toMatchTypeOf<CreateRestaurantApiBody>();
    expectTypeOf<
      z.output<typeof updateRestaurantSchema>
    >().toMatchTypeOf<UpdateRestaurantApiBody>();
  });

  it('Branch schemas match OpenAPI request specifications', () => {
    type CreateBranchApiBody = JsonBody<paths['/api/v1/branches']['post']>;
    type UpdateBranchApiBody = JsonBody<paths['/api/v1/branches/{id}']['patch']>;

    expectTypeOf<z.output<typeof createBranchSchema>>().toMatchTypeOf<CreateBranchApiBody>();
    expectTypeOf<z.output<typeof updateBranchSchema>>().toMatchTypeOf<UpdateBranchApiBody>();
  });

  it('User and Staff schemas match OpenAPI request specifications', () => {
    type CreateStaffApiBody = JsonBody<paths['/api/v1/users']['post']>;
    type UpdateStaffApiBody = JsonBody<paths['/api/v1/users/{id}']['patch']>;
    type UpdateMeApiBody = JsonBody<paths['/api/v1/users/me']['patch']>;

    expectTypeOf<z.output<typeof createStaffSchema>>().toMatchTypeOf<CreateStaffApiBody>();
    expectTypeOf<z.output<typeof updateStaffSchema>>().toMatchTypeOf<UpdateStaffApiBody>();
    expectTypeOf<z.output<typeof updateProfileSchema>>().toMatchTypeOf<UpdateMeApiBody>();
  });
});
