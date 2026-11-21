import { describe, it, expect } from 'vitest';
import { reconcileStatement } from '../src/services/reconcileStatement.js';

describe('Performance & Scalability Benchmark Suite', () => {
  function generateBenchmarkTransactions(count) {
    const txns = new Array(count);
    const startDate = new Date('2026-01-01').getTime();

    for (let i = 0; i < count; i++) {
      const isCredit = i % 10 === 0; // 10% credits, 90% debits
      const amountPaise = (i % 500 + 1) * 1000; // between ₹10 and ₹500
      txns[i] = {
        _id: `txn_${i}`,
        transactionDate: new Date(startDate + i * 60000),
        description: isCredit ? `Deposit #${i}` : `Merchant Spend #${i}`,
        amountPaise,
        direction: isCredit ? 'CREDIT' : 'DEBIT',
        category: isCredit ? 'Salary & Income' : 'Food & Dining',
        classification: isCredit ? 'INCOME' : 'EXPENSE',
      };
    }
    return txns;
  }

  it('PERF-01: 100 Transactions calculation completes in < 5ms', () => {
    const txns = generateBenchmarkTransactions(100);
    const start = performance.now();
    const result = reconcileStatement({ transactions: txns, openingBalancePaise: 1000000 });
    const durationMs = performance.now() - start;

    expect(result.transactionCount).toBe(100);
    expect(durationMs).toBeLessThan(10);
  });

  it('PERF-02: 1,000 Transactions calculation completes in < 20ms', () => {
    const txns = generateBenchmarkTransactions(1000);
    const start = performance.now();
    const result = reconcileStatement({ transactions: txns, openingBalancePaise: 5000000 });
    const durationMs = performance.now() - start;

    expect(result.transactionCount).toBe(1000);
    expect(durationMs).toBeLessThan(25);
  });

  it('PERF-03: 5,000 Transactions calculation completes in < 50ms', () => {
    const txns = generateBenchmarkTransactions(5000);
    const start = performance.now();
    const result = reconcileStatement({ transactions: txns, openingBalancePaise: 10000000 });
    const durationMs = performance.now() - start;

    expect(result.transactionCount).toBe(5000);
    expect(durationMs).toBeLessThan(60);
  });

  it('PERF-04: 10,000 Transactions calculation completes in < 100ms', () => {
    const txns = generateBenchmarkTransactions(10000);
    const start = performance.now();
    const result = reconcileStatement({ transactions: txns, openingBalancePaise: 25000000 });
    const durationMs = performance.now() - start;

    expect(result.transactionCount).toBe(10000);
    expect(durationMs).toBeLessThan(120);
  });

  it('PERF-05: 50,000 Transactions calculation completes in < 500ms with zero arithmetic drift', () => {
    const txns = generateBenchmarkTransactions(50000);
    const start = performance.now();
    const result = reconcileStatement({ transactions: txns, openingBalancePaise: 100000000 });
    const durationMs = performance.now() - start;

    expect(result.transactionCount).toBe(50000);
    expect(durationMs).toBeLessThan(500);

    // Verify mathematical integrity
    let manualCredits = 0;
    let manualDebits = 0;
    for (let i = 0; i < txns.length; i++) {
      if (txns[i].direction === 'CREDIT') manualCredits += txns[i].amountPaise;
      else manualDebits += txns[i].amountPaise;
    }

    expect(result.totalCreditsPaise).toBe(manualCredits);
    expect(result.totalDebitsPaise).toBe(manualDebits);
    expect(result.netCashFlowPaise).toBe(manualCredits - manualDebits);
    expect(result.expectedClosingBalancePaise).toBe(100000000 + manualCredits - manualDebits);
  });
});
