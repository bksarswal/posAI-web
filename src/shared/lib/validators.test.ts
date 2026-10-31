import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  indianPhoneSchema,
  gstinSchema,
  fssaiSchema,
  pincodeSchema,
  ianaTimezoneSchema,
  branchCodeSchema,
  emptyToUndefined,
} from './validators';

describe('validators (src/shared/lib/validators.ts)', () => {
  describe('passwordSchema (min 8 chars, max 72 bytes via TextEncoder)', () => {
    it('rejects passwords shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('1234567')).toThrow(
        'Password must be at least 8 characters',
      );
      expect(() => passwordSchema.parse('')).toThrow();
    });

    it('accepts passwords with exactly 8 characters or more within 72 bytes', () => {
      expect(passwordSchema.parse('12345678')).toBe('12345678');
      expect(passwordSchema.parse('a'.repeat(72))).toBe('a'.repeat(72));
    });

    it('rejects ASCII passwords exceeding 72 bytes (73 chars)', () => {
      expect(() => passwordSchema.parse('a'.repeat(73))).toThrow('Password cannot exceed 72 bytes');
    });

    it('correctly calculates UTF-8 bytes for multi-byte characters (Devanagari)', () => {
      // 'अ' is 3 bytes in UTF-8
      const devanagariChar = 'अ';
      expect(new TextEncoder().encode(devanagariChar).length).toBe(3);

      // 24 Devanagari characters = 72 bytes (valid)
      const validMultiByte = devanagariChar.repeat(24);
      expect(new TextEncoder().encode(validMultiByte).length).toBe(72);
      expect(passwordSchema.parse(validMultiByte)).toBe(validMultiByte);

      // 25 Devanagari characters = 75 bytes (invalid, must be rejected)
      const invalidMultiByte = devanagariChar.repeat(25);
      expect(new TextEncoder().encode(invalidMultiByte).length).toBe(75);
      expect(() => passwordSchema.parse(invalidMultiByte)).toThrow(
        'Password cannot exceed 72 bytes',
      );
    });
  });

  describe('indianPhoneSchema (backend parity)', () => {
    it('accepts 10 digits starting with 6-9 and stores as +91XXXXXXXXXX', () => {
      expect(indianPhoneSchema.parse('9876543210')).toBe('+919876543210');
      expect(indianPhoneSchema.parse('6123456789')).toBe('+916123456789');
      expect(indianPhoneSchema.parse('7000000000')).toBe('+917000000000');
      expect(indianPhoneSchema.parse('8999999999')).toBe('+918999999999');
    });

    it('accepts +91 prefix and formats with spaces or dashes', () => {
      expect(indianPhoneSchema.parse('+919876543210')).toBe('+919876543210');
      expect(indianPhoneSchema.parse('+91 98765 43210')).toBe('+919876543210');
      expect(indianPhoneSchema.parse('+91-9876543210')).toBe('+919876543210');
    });

    it('rejects numbers starting with 0-5', () => {
      expect(() => indianPhoneSchema.parse('5999999999')).toThrow();
      expect(() => indianPhoneSchema.parse('0999999999')).toThrow();
      expect(() => indianPhoneSchema.parse('+915999999999')).toThrow();
    });

    it('rejects numbers with wrong length', () => {
      expect(() => indianPhoneSchema.parse('987654321')).toThrow();
      expect(() => indianPhoneSchema.parse('98765432100')).toThrow();
      expect(() => indianPhoneSchema.parse('+19876543210')).toThrow();
    });
  });

  describe('gstinSchema (backend parity)', () => {
    it('trims, uppercases, and accepts valid GSTIN formats', () => {
      const validGstin = '29ABCDE1234F1Z5';
      expect(gstinSchema.parse(validGstin)).toBe('29ABCDE1234F1Z5');
      expect(gstinSchema.parse('  29abcde1234f1z5  ')).toBe('29ABCDE1234F1Z5');
    });

    it('rejects invalid GSTIN formats', () => {
      expect(() => gstinSchema.parse('29ABCDE1234F1')).toThrow();
      expect(() => gstinSchema.parse('29ABCDE1234F15Z')).toThrow();
      expect(() => gstinSchema.parse('ABCDE1234F1Z529')).toThrow();
    });
  });

  describe('fssaiSchema (backend parity)', () => {
    it('accepts exactly 14 digits', () => {
      expect(fssaiSchema.parse('12345678901234')).toBe('12345678901234');
      expect(fssaiSchema.parse(' 12345678901234 ')).toBe('12345678901234');
    });

    it('rejects numbers with less or more than 14 digits or non-digits', () => {
      expect(() => fssaiSchema.parse('1234567890123')).toThrow(); // 13 digits
      expect(() => fssaiSchema.parse('123456789012345')).toThrow(); // 15 digits
      expect(() => fssaiSchema.parse('1234567890123A')).toThrow(); // non-digit
    });
  });

  describe('pincodeSchema (backend parity)', () => {
    it('accepts 6-digit PIN codes starting with 1-9', () => {
      expect(pincodeSchema.parse('560001')).toBe('560001');
      expect(pincodeSchema.parse('110001')).toBe('110001');
      expect(pincodeSchema.parse(' 700001 ')).toBe('700001');
    });

    it('rejects PIN codes starting with 0 or having wrong length', () => {
      expect(() => pincodeSchema.parse('056001')).toThrow();
      expect(() => pincodeSchema.parse('56000')).toThrow();
      expect(() => pincodeSchema.parse('5600001')).toThrow();
      expect(() => pincodeSchema.parse('56000A')).toThrow();
    });
  });

  describe('ianaTimezoneSchema (backend parity)', () => {
    it('accepts valid IANA timezones', () => {
      expect(ianaTimezoneSchema.parse('Asia/Kolkata')).toBe('Asia/Kolkata');
      expect(ianaTimezoneSchema.parse('UTC')).toBe('UTC');
      expect(ianaTimezoneSchema.parse('America/New_York')).toBe('America/New_York');
    });

    it('rejects invalid or unrecognized timezone strings', () => {
      expect(() => ianaTimezoneSchema.parse('Invalid/Timezone')).toThrow();
      expect(() => ianaTimezoneSchema.parse('Asia/Mars')).toThrow();
      expect(() => ianaTimezoneSchema.parse('NotATimezone')).toThrow();
    });
  });

  describe('branchCodeSchema', () => {
    it('converts lowercase to uppercase and accepts 2-10 characters of A-Z, 0-9, and hyphen', () => {
      expect(branchCodeSchema.parse('blr-01')).toBe('BLR-01');
      expect(branchCodeSchema.parse('MAIN')).toBe('MAIN');
      expect(branchCodeSchema.parse('12')).toBe('12');
      expect(branchCodeSchema.parse('A-B-C-1-2')).toBe('A-B-C-1-2');
    });

    it('rejects branch codes shorter than 2 or longer than 10 characters or with invalid characters', () => {
      expect(() => branchCodeSchema.parse('A')).toThrow(); // 1 char
      expect(() => branchCodeSchema.parse('ABCDEFGHIJK')).toThrow(); // 11 chars
      expect(() => branchCodeSchema.parse('BLR_01')).toThrow(); // underscore not allowed
      expect(() => branchCodeSchema.parse('BLR@01')).toThrow(); // special char not allowed
    });
  });

  describe('emptyToUndefined helper', () => {
    const schema = emptyToUndefined(gstinSchema);

    it('treats empty string, whitespace-only, null and undefined as absent (undefined)', () => {
      expect(schema.parse('')).toBeUndefined();
      expect(schema.parse('   ')).toBeUndefined();
      expect(schema.parse(null)).toBeUndefined();
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it('validates and preserves non-empty inputs', () => {
      expect(schema.parse('29ABCDE1234F1Z5')).toBe('29ABCDE1234F1Z5');
      expect(() => schema.parse('INVALID')).toThrow();
    });

    it('treats "" as absent for EVERY optional field across schemas (gstin, fssai, phone, line2, logoUrl, branch phone)', () => {
      const optionalGstin = emptyToUndefined(gstinSchema);
      const optionalFssai = emptyToUndefined(fssaiSchema);
      const optionalPhone = emptyToUndefined(indianPhoneSchema);
      const optionalLine2 = emptyToUndefined(
        pincodeSchema.or(indianPhoneSchema).or(branchCodeSchema),
      ); // general text
      const optionalLogoUrl = emptyToUndefined(
        ianaTimezoneSchema, // testing emptyToUndefined behavior
      );

      expect(optionalGstin.parse('')).toBeUndefined();
      expect(optionalFssai.parse('')).toBeUndefined();
      expect(optionalPhone.parse('')).toBeUndefined();
      expect(optionalLine2.parse('')).toBeUndefined();
      expect(optionalLogoUrl.parse('')).toBeUndefined();
    });
  });
});
