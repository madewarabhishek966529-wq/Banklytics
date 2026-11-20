import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCSV } from '../src/parsers/csv/csvParser.js';
import { reconcileStatement } from '../src/services/reconcileStatement.js';

describe('Sanitized Bank Statement Fixture Test', () => {
  it('parses sample_statement.csv, assigns categories, and reconciles perfectly', () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/sample_statement.csv');
    const content = fs.readFileSync(fixturePath, 'utf-8');

    const result = parseCSV(content);

    // 9 actual transactions (opening and closing balances detected separately)
    expect(result.transactions.length).toBe(9);
    expect(result.rejectedRows.length).toBe(0);

    const reconciliation = reconcileStatement({
      transactions: result.transactions,
      openingBalancePaise: result.metadata.openingBalancePaise,
      closingBalancePaise: result.metadata.closingBalancePaise,
    });

    expect(reconciliation.status).toBe('MATCHED');
    expect(reconciliation.isBalanced).toBe(true);
    expect(reconciliation.differencePaise).toBe(0);

    // Credits: ₹85,000 + ₹1,200 = ₹86,200 (8620000 paise)
    expect(reconciliation.totalCreditsPaise).toBe(8620000);

    // Debits: 650 + 340 + 2500 + 5000 + 1850 + 15000 + 649 = 25989 (2598900 paise)
    expect(reconciliation.totalDebitsPaise).toBe(2598900);

    // Net Cash Flow: 86,200 - 25,989 = 60,211 (6021100 paise)
    expect(reconciliation.netCashFlowPaise).toBe(6021100);

    // Closing Balance: 100,000 + 60,211 = 160,211 (16021100 paise)
    expect(reconciliation.observedClosingBalancePaise).toBe(16021100);
    expect(reconciliation.expectedClosingBalancePaise).toBe(16021100);
  });
});
