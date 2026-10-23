import { describe, expect, it } from 'vitest';
import { formatPaise, paiseToRupees, rupeesToPaise } from './money';

describe('money utilities', () => {
  describe('formatPaise', () => {
    it('formats Indian rupee style with commas and two decimals', () => {
      expect(formatPaise(123456)).toBe('₹1,234.56');
      expect(formatPaise(0)).toBe('₹0.00');
    });

    it('formats lakh-sized and crore-sized values in Indian numbering system', () => {
      expect(formatPaise(12345678)).toBe('₹1,23,456.78');
      expect(formatPaise(1000000000)).toBe('₹1,00,00,000.00');
    });

    it('formats negative paise values correctly', () => {
      expect(formatPaise(-123456)).toBe('-₹1,234.56');
    });

    it('rejects non-integer, NaN, and Infinity values with TypeError', () => {
      expect(() => formatPaise(12.34)).toThrow(TypeError);
      expect(() => formatPaise(NaN)).toThrow(TypeError);
      expect(() => formatPaise(Infinity)).toThrow(TypeError);
      expect(() => formatPaise(-Infinity)).toThrow(TypeError);
    });
  });

  describe('paiseToRupees', () => {
    it('converts integer paise to decimal rupees', () => {
      expect(() => paiseToRupees(1999)).not.toThrow();
      expect(paiseToRupees(1999)).toBe(19.99);
      expect(paiseToRupees(123456)).toBe(1234.56);
      expect(paiseToRupees(0)).toBe(0);
      expect(paiseToRupees(-1999)).toBe(-19.99);
    });

    it('rejects non-integer, NaN, and Infinity paise values with TypeError', () => {
      expect(() => paiseToRupees(19.99)).toThrow(TypeError);
      expect(() => paiseToRupees(NaN)).toThrow(TypeError);
      expect(() => paiseToRupees(Infinity)).toThrow(TypeError);
      expect(() => paiseToRupees(-Infinity)).toThrow(TypeError);
    });
  });

  describe('rupeesToPaise', () => {
    it('accurately converts rupees to paise without floating-point inaccuracies', () => {
      expect(rupeesToPaise(19.99)).toBe(1999);
      expect(rupeesToPaise('19.99')).toBe(1999);
      expect(rupeesToPaise(0.1)).toBe(10);
      expect(rupeesToPaise('0.1')).toBe(10);
      expect(rupeesToPaise(0.2)).toBe(20);
      expect(rupeesToPaise('0.2')).toBe(20);
      expect(rupeesToPaise(0)).toBe(0);
      expect(rupeesToPaise('0')).toBe(0);
      expect(rupeesToPaise(2)).toBe(200);
      expect(rupeesToPaise(1.9)).toBe(190);
      expect(rupeesToPaise(1.99)).toBe(199);
    });

    it('converts "1.50" and "1.5" to 150 paise', () => {
      expect(rupeesToPaise('1.50')).toBe(150);
      expect(rupeesToPaise('1.5')).toBe(150);
      expect(rupeesToPaise(1.5)).toBe(150);
    });

    it('trims leading and trailing whitespace from string inputs', () => {
      expect(rupeesToPaise('  19.99 ')).toBe(1999);
      expect(rupeesToPaise('   1.5   ')).toBe(150);
    });

    it('handles large rupee values safely within safe integer range', () => {
      expect(rupeesToPaise(123456.78)).toBe(12345678);
      expect(rupeesToPaise('123456.78')).toBe(12345678);
    });

    it('rejects values with more than 2 decimal places instead of truncating', () => {
      expect(() => rupeesToPaise(1.005)).toThrow(TypeError);
      expect(() => rupeesToPaise('1.005')).toThrow(TypeError);
      expect(() => rupeesToPaise(1.999)).toThrow(TypeError);
      expect(() => rupeesToPaise('1.999')).toThrow(TypeError);
      expect(() => rupeesToPaise(0.1234)).toThrow(TypeError);
    });

    it('rejects exponent notation with TypeError', () => {
      expect(() => rupeesToPaise(1e-7)).toThrow(TypeError);
      expect(() => rupeesToPaise('1e-7')).toThrow(TypeError);
      expect(() => rupeesToPaise(1e21)).toThrow(TypeError);
      expect(() => rupeesToPaise('1e21')).toThrow(TypeError);
    });

    it('rejects huge values where paise exceeds safe integer range', () => {
      expect(() => rupeesToPaise(Number.MAX_SAFE_INTEGER)).toThrow(TypeError);
      expect(() => rupeesToPaise(9007199254740992)).toThrow(TypeError);
      expect(() => rupeesToPaise('9007199254740992')).toThrow(TypeError);
    });

    it('handles negative rupee values as currently implemented in money.ts', () => {
      expect(rupeesToPaise(-19.99)).toBe(-1999);
      expect(rupeesToPaise('-19.99')).toBe(-1999);
      expect(rupeesToPaise(-0.1)).toBe(-10);
      expect(rupeesToPaise('-1.50')).toBe(-150);
    });

    it('rejects empty, invalid, NaN, and non-numeric values with TypeError', () => {
      expect(() => rupeesToPaise('')).toThrow(TypeError);
      expect(() => rupeesToPaise('   ')).toThrow(TypeError);
      expect(() => rupeesToPaise(NaN)).toThrow(TypeError);
      expect(() => rupeesToPaise(Infinity)).toThrow(TypeError);
      expect(() => rupeesToPaise(-Infinity)).toThrow(TypeError);
      expect(() => rupeesToPaise('abc')).toThrow(TypeError);
    });
  });
});
