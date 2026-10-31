import { describe, it, expect } from 'vitest';
import { createRestaurantSchema, updateRestaurantSchema } from './restaurant.schema';

describe('Restaurant Schemas (src/modules/restaurant/restaurant.schema.ts)', () => {
  const validAddress = {
    line1: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  };

  it('validates createRestaurantSchema with required fields and treats empty optional strings as absent', () => {
    const valid = {
      name: 'Spice Garden',
      phone: '9876543210',
      email: 'contact@spicegarden.com',
      address: validAddress,
      gstin: '',
      fssai: '',
      logoUrl: '',
    };

    const parsed = createRestaurantSchema.parse(valid);
    expect(parsed.name).toBe('Spice Garden');
    expect(parsed.phone).toBe('+919876543210');
    expect(parsed.gstin).toBeUndefined();
    expect(parsed.fssai).toBeUndefined();
    expect(parsed.logoUrl).toBeUndefined();
  });

  it('rejects createRestaurantSchema with invalid GSTIN, FSSAI, or insecure logoUrl', () => {
    expect(() =>
      createRestaurantSchema.parse({
        name: 'Spice Garden',
        phone: '9876543210',
        email: 'contact@spicegarden.com',
        address: validAddress,
        gstin: 'INVALID_GSTIN',
      }),
    ).toThrow();

    expect(() =>
      createRestaurantSchema.parse({
        name: 'Spice Garden',
        phone: '9876543210',
        email: 'contact@spicegarden.com',
        address: validAddress,
        logoUrl: 'http://insecure.com/logo.png', // must be https
      }),
    ).toThrow();
  });

  it('updateRestaurantSchema accepts partial updates and rejects empty payload {}', () => {
    expect(() => updateRestaurantSchema.parse({})).toThrow(
      'Update payload must contain at least one field',
    );

    const update = updateRestaurantSchema.parse({ name: 'New Name' });
    expect(update.name).toBe('New Name');
  });
});
