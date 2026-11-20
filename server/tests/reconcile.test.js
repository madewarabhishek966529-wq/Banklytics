import { describe, it, expect } from 'vitest';
import { reconcileStatement } from '../src/services/reconcileStatement.js';

describe('Statement Reconciliation Engine', () => {
  it('correctly calculates total credits, debits, and net cash flow', () => {
    const transactions = [
      { amountPaise: 2500000, direction: 'CREDIT' }, // ₹25,000 salary
      { amountPaise: 50000, direction: 'DEBIT' },    // ₹500 UPI
      { amountPaise: 200000, direction: 'DEBIT' },   // ₹2,000 ATM
      { amountPaise: 30000, direction: 'CREDIT' },   // ₹300 Refund
      { amountPaise: 150000, direction: 'DEBIT' },   // ₹1,500 Shopping
    ];

    const result = reconcileStatement({ transactions });

    expect(result.totalCreditsPaise).toBe(2530000); // ₹25,300
    expect(result.totalDebitsPaise).toBe(400000);   // ₹4,000
    expect(result.netCashFlowPaise).toBe(2130000);  // ₹21,300
    expect(result.transactionCount).toBe(5);
  });

  it('reports MATCHED when opening + credits - debits equals closing balance', () => {
    const transactions = [
      { amountPaise: 500000, direction: 'CREDIT' }, // +5000
      { amountPaise: 200000, direction: 'DEBIT' },  // -2000
    ];

    const openingBalancePaise = 1000000; // 10,000
    const closingBalancePaise = 1300000; // 10,000 + 5,000 - 2,000 = 13,000

    const result = reconcileStatement({
      transactions,
      openingBalancePaise,
      closingBalancePaise,
    });

    expect(result.status).toBe('MATCHED');
    expect(result.isBalanced).toBe(true);
    expect(result.differencePaise).toBe(0);
    expect(result.expectedClosingBalancePaise).toBe(1300000);
  });

  it('reports MISMATCH with accurate difference when balances do not reconcile', () => {
    const transactions = [
      { amountPaise: 500000, direction: 'CREDIT' }, // +5000
      { amountPaise: 200000, direction: 'DEBIT' },  // -2000
    ];

    const openingBalancePaise = 1000000; // 10,000
    const closingBalancePaise = 1200000; // Missing 1,000

    const result = reconcileStatement({
      transactions,
      openingBalancePaise,
      closingBalancePaise,
    });

    expect(result.status).toBe('MISMATCH');
    expect(result.isBalanced).toBe(false);
    expect(result.differencePaise).toBe(-100000); // ₹1,000 deficit
  });

  it('handles empty transaction lists safely', () => {
    const result = reconcileStatement({ transactions: [] });
    expect(result.totalCreditsPaise).toBe(0);
    expect(result.totalDebitsPaise).toBe(0);
    expect(result.netCashFlowPaise).toBe(0);
    expect(result.transactionCount).toBe(0);
  });
});
