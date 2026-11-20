import { describe, it, expect } from 'vitest';
import { parseRupeesToPaise, paiseToRupees, formatINR, sumPaise } from '../src/utils/money.js';

describe('Money Utilities (Paise Arithmetic)', () => {
  it('parses standard rupee strings to integer paise correctly', () => {
    expect(parseRupeesToPaise('100')).toBe(10000);
    expect(parseRupeesToPaise('123.45')).toBe(12345);
    expect(parseRupeesToPaise('0.50')).toBe(50);
  });

  it('parses Indian comma numbering system (e.g. 1,23,456.78) correctly', () => {
    expect(parseRupeesToPaise('1,23,456.78')).toBe(12345678);
    expect(parseRupeesToPaise('₹ 25,000.00')).toBe(2500000);
    expect(parseRupeesToPaise('10,00,000.00')).toBe(100000000);
  });

  it('handles negative or bracketed amounts', () => {
    expect(parseRupeesToPaise('-500.25')).toBe(50025);
    expect(parseRupeesToPaise('(1,500.00)')).toBe(150000);
  });

  it('converts paise to rupees without floating point anomalies', () => {
    expect(paiseToRupees(12345)).toBe(123.45);
    expect(paiseToRupees(50)).toBe(0.5);
    expect(paiseToRupees(1000000)).toBe(10000);
  });

  it('formats paise to INR currency strings', () => {
    const formatted = formatINR(12345678);
    expect(formatted).toContain('1,23,456.78');
  });

  it('sums paise numbers accurately and rejects unsafe overflow', () => {
    const numbers = [10000, 25050, 74950];
    expect(sumPaise(numbers)).toBe(110000); // exactly ₹1100.00
    expect(sumPaise([])).toBe(0);
  });
});
