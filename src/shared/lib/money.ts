/**
 * Money utilities for POSAI.
 * The backend stores and transfers all currency values as integer paise.
 * Never perform arithmetic with floating-point rupees.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Validates that an amount is a finite integer representing paise.
 */
function assertIntegerPaise(paise: unknown): asserts paise is number {
  if (typeof paise !== 'number' || !Number.isFinite(paise) || !Number.isInteger(paise)) {
    throw new TypeError(
      `Invalid paise amount: Expected a finite integer, received ${String(paise)}`,
    );
  }
}

/**
 * Converts integer paise to a formatted Indian Rupee string (e.g. 123456 -> "₹1,234.56").
 * Rejects non-integer or non-finite numbers.
 */
export function formatPaise(paise: number): string {
  assertIntegerPaise(paise);
  const rupees = paise / 100;
  return inrFormatter.format(rupees);
}

/**
 * Converts integer paise to decimal rupees for display purposes (e.g. 1999 -> 19.99).
 */
export function paiseToRupees(paise: number): number {
  assertIntegerPaise(paise);
  return paise / 100;
}

/**
 * Converts rupees (number or string from form input) to integer paise using safe math.
 * Prevents IEEE-754 floating point inaccuracies (e.g. 19.99 -> 1999, "1.14" -> 114).
 */
export function rupeesToPaise(rupees: number | string): number {
  if (rupees === '' || rupees === null || rupees === undefined) {
    throw new TypeError('Rupees value cannot be empty');
  }

  const strValue = typeof rupees === 'number' ? rupees.toString() : rupees.trim();
  const numValue = Number(strValue);

  if (!Number.isFinite(numValue)) {
    throw new TypeError(`Invalid rupee value: ${String(rupees)}`);
  }

  const isNegative = strValue.startsWith('-');
  const cleanStr = isNegative ? strValue.slice(1) : strValue;

  const [whole = '0', fraction = ''] = cleanStr.split('.');

  // Only up to 2 decimal places are meaningful for paise
  const paddedFraction = (fraction + '00').slice(0, 2);

  const wholePart = parseInt(whole, 10);
  const fractionPart = parseInt(paddedFraction, 10);

  if (Number.isNaN(wholePart) || Number.isNaN(fractionPart)) {
    throw new TypeError(`Invalid rupee value: ${String(rupees)}`);
  }

  const totalPaise = wholePart * 100 + fractionPart;
  return isNegative ? -totalPaise : totalPaise;
}
