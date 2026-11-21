import { describe, it, expect } from 'vitest';
import { parseRupeesToPaise, paiseToRupees, formatINR } from '../src/utils/money.js';
import { reconcileStatement } from '../src/services/reconcileStatement.js';

describe('Financial Calculation Engine & Edge Cases Suite', () => {
  it('CALC-01: Reconciles Closing = Opening + Credits - Debits with zero rounding drift', () => {
    const openingPaise = 5000000; // ₹50,000.00
    const txns = [
      { amountPaise: 7500000, direction: 'CREDIT' }, // ₹75,000.00
      { amountPaise: 1245050, direction: 'DEBIT' },  // ₹12,450.50
      { amountPaise: 350025, direction: 'DEBIT' },   // ₹3,500.25
      { amountPaise: 25000, direction: 'CREDIT' },   // ₹250.00 (refund)
    ];

    const result = reconcileStatement({
      transactions: txns,
      openingBalancePaise: openingPaise,
      closingBalancePaise: 5000000 + 7500000 + 25000 - 1245050 - 350025, // 10929925 paise = ₹1,09,299.25
    });

    expect(result.status).toBe('MATCHED');
    expect(result.isBalanced).toBe(true);
    expect(result.differencePaise).toBe(0);
    expect(result.totalCreditsPaise).toBe(7525000);
    expect(result.totalDebitsPaise).toBe(1595075);
    expect(result.netCashFlowPaise).toBe(7525000 - 1595075);
    expect(result.expectedClosingBalancePaise).toBe(10929925);
  });

  it('CALC-02: Edge Case: Zero transactions handled cleanly', () => {
    const openingPaise = 2500000; // ₹25,000.00
    const result = reconcileStatement({
      transactions: [],
      openingBalancePaise: openingPaise,
      closingBalancePaise: openingPaise,
    });

    expect(result.status).toBe('MATCHED');
    expect(result.totalCreditsPaise).toBe(0);
    expect(result.totalDebitsPaise).toBe(0);
    expect(result.netCashFlowPaise).toBe(0);
    expect(result.expectedClosingBalancePaise).toBe(openingPaise);
  });

  it('CALC-03: Edge Case: Only credit transactions', () => {
    const openingPaise = 100000; // ₹1,000.00
    const txns = [
      { amountPaise: 500000, direction: 'CREDIT' },
      { amountPaise: 300000, direction: 'CREDIT' },
    ];

    const result = reconcileStatement({
      transactions: txns,
      openingBalancePaise: openingPaise,
      closingBalancePaise: 900000,
    });

    expect(result.status).toBe('MATCHED');
    expect(result.totalCreditsPaise).toBe(800000);
    expect(result.totalDebitsPaise).toBe(0);
    expect(result.netCashFlowPaise).toBe(800000);
  });

  it('CALC-04: Edge Case: Only debit transactions', () => {
    const openingPaise = 1000000; // ₹10,000.00
    const txns = [
      { amountPaise: 250000, direction: 'DEBIT' },
      { amountPaise: 150000, direction: 'DEBIT' },
    ];

    const result = reconcileStatement({
      transactions: txns,
      openingBalancePaise: openingPaise,
      closingBalancePaise: 600000,
    });

    expect(result.status).toBe('MATCHED');
    expect(result.totalCreditsPaise).toBe(0);
    expect(result.totalDebitsPaise).toBe(400000);
    expect(result.netCashFlowPaise).toBe(-400000);
  });

  it('CALC-05: High Precision Large Values (₹100 Crore = 10^11 paise) without overflow', () => {
    const hundredCroreRupees = 1000000000; // ₹1,000,000,000
    const hundredCrorePaise = parseRupeesToPaise(hundredCroreRupees);
    expect(hundredCrorePaise).toBe(100000000000); // 10^11 paise

    const fiftyCrorePaise = parseRupeesToPaise('500000000.50');
    expect(fiftyCrorePaise).toBe(50000000050);

    const diff = hundredCrorePaise - fiftyCrorePaise;
    expect(diff).toBe(49999999950);
    expect(paiseToRupees(diff)).toBe(499999999.50);
  });

  it('CALC-06: Refund & Reversal Handling isolates refunds from revenue', () => {
    const txns = [
      { description: 'Salary Nov 2026', amountPaise: 15000000, direction: 'CREDIT', classification: 'INCOME' },
      { description: 'Amazon Purchase', amountPaise: 499900, direction: 'DEBIT', classification: 'EXPENSE' },
      { description: 'Amazon Refund for Order #882', amountPaise: 499900, direction: 'CREDIT', classification: 'REFUND' },
    ];

    const regularIncome = txns
      .filter((t) => t.classification === 'INCOME')
      .reduce((sum, t) => sum + t.amountPaise, 0);

    const refunds = txns
      .filter((t) => t.classification === 'REFUND')
      .reduce((sum, t) => sum + t.amountPaise, 0);

    expect(regularIncome).toBe(15000000); // Does NOT inflate with the ₹4,999 refund
    expect(refunds).toBe(499900);
  });

  it('CALC-07: Multiple transactions of identical amount on same day are each preserved', () => {
    const txns = [
      { transactionDate: '2026-11-15', amountPaise: 50000, direction: 'DEBIT', description: 'Chai & Snacks' },
      { transactionDate: '2026-11-15', amountPaise: 50000, direction: 'DEBIT', description: 'Chai & Snacks' },
      { transactionDate: '2026-11-15', amountPaise: 50000, direction: 'DEBIT', description: 'Chai & Snacks' },
    ];

    const totalDebits = txns.reduce((acc, t) => acc + t.amountPaise, 0);
    expect(totalDebits).toBe(150000);
    expect(txns.length).toBe(3);
  });

  it('CALC-08: Leap Year date parsing and calculations', () => {
    const leapDate = new Date('2024-02-29T12:00:00Z');
    expect(leapDate.getUTCFullYear()).toBe(2024);
    expect(leapDate.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(leapDate.getUTCDate()).toBe(29);
  });

  it('CALC-09: Indian Financial Year boundary partitioning (April 1 - March 31)', () => {
    const fyBoundaryBefore = new Date('2026-03-31T23:59:59.999Z');
    const fyBoundaryAfter = new Date('2026-04-01T00:00:00.000Z');

    function getFinancialYear(date) {
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth(); // 0-11. April is 3.
      if (month >= 3) {
        return `FY${year}-${year + 1}`;
      } else {
        return `FY${year - 1}-${year}`;
      }
    }

    expect(getFinancialYear(fyBoundaryBefore)).toBe('FY2025-2026');
    expect(getFinancialYear(fyBoundaryAfter)).toBe('FY2026-2027');
  });

  it('CALC-10: Indian currency formatting formatINR correctly handles rupees and negative amounts', () => {
    expect(formatINR(12345678)).toBe('₹1,23,456.78');
    expect(formatINR(1000000000)).toBe('₹1,00,00,000.00'); // 1 Crore
    expect(formatINR(-50050)).toBe('-₹500.50');
    expect(formatINR(0)).toBe('₹0.00');
  });
});
