import { describe, it, expectTypeOf } from 'vitest';
import type { z } from 'zod';
import type { paths, UserRole } from '@/shared/types/api';
import type {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordApiSchema,
  changePasswordSchema,
} from '@/modules/auth';
import type {
  createRestaurantSchema,
  updateRestaurantSchema,
  UpdateRestaurantApiBody,
  RestaurantSettingsPayload,
  buildUpdateRestaurantPayload,
} from '@/modules/restaurant';
import type { createBranchSchema, updateBranchSchema } from '@/modules/branch';
import type {
  BranchUpdatePayload,
  buildUpdateBranchPayload,
} from '@/modules/branch/branch.payloadBuilder';
import type {
  createStaffSchema,
  updateStaffSchema,
  updateProfileSchema,
  UpdateProfileApiBody,
} from '@/modules/user';
import type { StaffItem, StaffRole } from '@/modules/staff';

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
    type PatchRestaurantApiBody = JsonBody<paths['/api/v1/restaurant']['patch']>;

    expectTypeOf<
      z.output<typeof createRestaurantSchema>
    >().toMatchTypeOf<CreateRestaurantApiBody>();
    expectTypeOf<z.output<typeof updateRestaurantSchema>>().toMatchTypeOf<PatchRestaurantApiBody>();
    expectTypeOf<UpdateRestaurantApiBody>().toMatchTypeOf<PatchRestaurantApiBody>();
    expectTypeOf<RestaurantSettingsPayload>().toMatchTypeOf<UpdateRestaurantApiBody>();
    expectTypeOf<
      ReturnType<typeof buildUpdateRestaurantPayload>
    >().toMatchTypeOf<UpdateRestaurantApiBody>();
  });

  it('Branch schemas match OpenAPI request specifications', () => {
    type CreateBranchApiBody = JsonBody<paths['/api/v1/branches']['post']>;
    type PatchBranchApiBody = JsonBody<paths['/api/v1/branches/{id}']['patch']>;

    expectTypeOf<z.output<typeof createBranchSchema>>().toMatchTypeOf<CreateBranchApiBody>();
    expectTypeOf<z.output<typeof updateBranchSchema>>().toMatchTypeOf<PatchBranchApiBody>();
    expectTypeOf<BranchUpdatePayload>().toMatchTypeOf<PatchBranchApiBody>();
    expectTypeOf<ReturnType<typeof buildUpdateBranchPayload>>().toMatchTypeOf<PatchBranchApiBody>();
  });

  it('User and Staff schemas match OpenAPI request specifications', () => {
    type CreateStaffApiBody = JsonBody<paths['/api/v1/users']['post']>;
    type UpdateStaffApiBody = JsonBody<paths['/api/v1/users/{id}']['patch']>;
    type UpdateMeApiBody = JsonBody<paths['/api/v1/users/me']['patch']>;

    expectTypeOf<z.output<typeof createStaffSchema>>().toMatchTypeOf<CreateStaffApiBody>();
    expectTypeOf<z.output<typeof updateStaffSchema>>().toMatchTypeOf<UpdateStaffApiBody>();
    expectTypeOf<z.output<typeof updateProfileSchema>>().toMatchTypeOf<UpdateMeApiBody>();
    expectTypeOf<UpdateProfileApiBody>().toMatchTypeOf<UpdateMeApiBody>();

    // StaffItem shape guard: build a typed fixture with every field the API
    // defines and assert it satisfies StaffItem. If the backend adds a new
    // required field or changes the role enum, this call-site breaks typecheck.
    const staffFixture: StaffItem = {
      id: 'u1',
      tenantId: 't1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210', // optional field — included to verify it is accepted
      role: 'WAITER',
      branchIds: ['b1'],
      status: 'ACTIVE',
      emailVerified: true,
      mustChangePassword: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expectTypeOf(staffFixture).toMatchTypeOf<StaffItem>();

    // role enum guard: StaffRole must equal UserRole; a backend enum change
    // on either side (e.g. adding 'OWNER' or removing 'CHEF') breaks typecheck.
    expectTypeOf<StaffRole>().toEqualTypeOf<UserRole>();
  });
});
