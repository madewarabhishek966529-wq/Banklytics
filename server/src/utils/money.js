/**
 * Money Utility for Banklytics
 * Enforces integer paise arithmetic (100 paise = ₹1.00) to eliminate floating-point drift.
 */

/**
 * Parses any string or number representation of an Indian Rupee amount into integer paise.
 * Handles:
 *  - "1,23,456.78" -> 12345678 paise
 *  - "₹ 500.50"    -> 50050 paise
 *  - "100"         -> 10000 paise
 *  - "(250.00)"    -> 25000 paise (treats absolute amount, sign handled separately)
 *  - "-150.25"     -> 15025 paise (positive magnitude)
 */
export function parseRupeesToPaise(input) {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') {
    if (isNaN(input)) return 0;
    return Math.round(Math.abs(input) * 100);
  }

  const str = String(input).trim();
  if (!str) return 0;

  // Remove currency words/symbols like Rs. or ₹, commas, quotes, and whitespace
  const sanitized = str
    .replace(/Rs\./gi, '')
    .replace(/INR/gi, '')
    .replace(/[₹Rs\s]/gi, '')
    .replace(/,/g, '')
    .replace(/[()]/g, '');

  const val = parseFloat(sanitized);
  if (isNaN(val)) return 0;

  return Math.round(Math.abs(val) * 100);
}

/**
 * Converts integer paise to a float Rupee number for presentation.
 */
export function paiseToRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Formats paise into INR string according to Indian numbering system (en-IN).
 * e.g., 12345678 -> "₹1,23,456.78"
 */
export function formatINR(paise, includeSymbol = true) {
  if (typeof paise !== 'number' || isNaN(paise)) {
    paise = 0;
  }
  const isNegative = paise < 0;
  const absRupees = Math.abs(paise) / 100;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absRupees);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Safe sum of an array of paise numbers, asserting safe integer bounds.
 */
export function sumPaise(numbers) {
  let total = 0;
  for (const n of numbers) {
    const val = Number(n) || 0;
    total += Math.round(val);
  }
  if (!Number.isSafeInteger(total)) {
    throw new RangeError('Total exceeds safe integer limit for financial calculations');
  }
  return total;
}
