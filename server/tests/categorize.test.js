import { describe, it, expect } from 'vitest';
import { categorizeTransaction } from '../src/services/categorizeTransaction.js';

describe('Transaction Categorization Rules', () => {
  it('categorizes Swiggy / Zomato as Food & Dining EXPENSE', () => {
    const res1 = categorizeTransaction('UPI/SWIGGY BANGALORE/ORDER123', 'DEBIT');
    expect(res1.category).toBe('Food & Dining');
    expect(res1.classification).toBe('EXPENSE');

    const res2 = categorizeTransaction('POS ZOMATO ONLINE PYMT', 'DEBIT');
    expect(res2.category).toBe('Food & Dining');
    expect(res2.classification).toBe('EXPENSE');
  });

  it('categorizes Uber and Ola as Transport EXPENSE', () => {
    const res = categorizeTransaction('UPI-UBER INDIA SYS-012938', 'DEBIT');
    expect(res.category).toBe('Transport');
    expect(res.classification).toBe('EXPENSE');
  });

  it('categorizes Salary as Salary & Income INCOME', () => {
    const res = categorizeTransaction('ACH SALARY CREDIT ACME CORP NOV', 'CREDIT');
    expect(res.category).toBe('Salary & Income');
    expect(res.classification).toBe('INCOME');
  });

  it('categorizes Refund as Refund REFUND', () => {
    const res = categorizeTransaction('REFUND AMAZON PAY REF123', 'CREDIT');
    expect(res.category).toBe('Refund');
    expect(res.classification).toBe('REFUND');
  });

  it('categorizes internal transfers as Transfer', () => {
    const res = categorizeTransaction('NEFT TO SISTER SELF TRANSFER A/C 4567', 'DEBIT');
    expect(res.category).toBe('Transfer');
    expect(res.classification).toBe('TRANSFER');
  });
});
