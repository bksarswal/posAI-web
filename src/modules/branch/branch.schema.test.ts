import { describe, it, expect } from 'vitest';
import { createBranchSchema, updateBranchSchema } from './branch.schema';

describe('Branch Schemas (src/modules/branch/branch.schema.ts)', () => {
  const validAddress = {
    line1: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  };

  it('createBranchSchema uppercases code, defaults timezone to Asia/Kolkata and currency to INR', () => {
    const valid = {
      name: 'Indiranagar Branch',
      code: 'blr-01',
      address: validAddress,
      phone: '',
    };

    const parsed = createBranchSchema.parse(valid);
    expect(parsed.code).toBe('BLR-01');
    expect(parsed.timezone).toBe('Asia/Kolkata');
    expect(parsed.currency).toBe('INR');
    expect(parsed.phone).toBeUndefined();
  });

  it('updateBranchSchema accepts partial updates and rejects empty payload {}', () => {
    expect(() => updateBranchSchema.parse({})).toThrow(
      'Update payload must contain at least one field',
    );

    const parsed = updateBranchSchema.parse({
      status: 'INACTIVE',
    });
    expect(parsed.status).toBe('INACTIVE');
  });

  it('updateBranchSchema strictly forbids uneditable fields (code, isMain, restaurantId)', () => {
    expect(() =>
      updateBranchSchema.parse({
        name: 'New Name',
        code: 'BLR-02', // disallowed in update
      }),
    ).toThrow();
  });
});
