import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/parsers/csv/csvParser.js';

describe('CSV Parser Service', () => {
  it('parses standard statement with separate debit and credit columns', () => {
    const csvData = `Date,Narration,Chq/Ref No,Withdrawal,Deposit,Balance
01/11/2026,OPENING BALANCE,,0.00,0.00,50000.00
02/11/2026,ACH SALARY CREDIT,SAL101,,75000.00,125000.00
05/11/2026,UPI/SWIGGY/12345,SWG99,450.50,,124549.50
10/11/2026,ATM CASH WDL HDFC,ATM01,5000.00,,119549.50
`;

    const result = parseCSV(csvData);

    expect(result.transactions.length).toBe(3);
    expect(result.transactions[0].direction).toBe('CREDIT');
    expect(result.transactions[0].amountPaise).toBe(7500000); // ₹75,000
    expect(result.transactions[0].category).toBe('Salary & Income');

    expect(result.transactions[1].direction).toBe('DEBIT');
    expect(result.transactions[1].amountPaise).toBe(45050); // ₹450.50
    expect(result.transactions[1].category).toBe('Food & Dining');

    expect(result.transactions[2].direction).toBe('DEBIT');
    expect(result.transactions[2].amountPaise).toBe(500000); // ₹5,000
    expect(result.transactions[2].category).toBe('Cash Withdrawal');

    expect(result.rejectedRows.length).toBe(0);
  });

  it('handles signed amount format and quotes gracefully', () => {
    const csvData = `"Txn Date","Description","Amount","Balance"
"2026-11-01","Monthly Rent","-20000.00","80000.00"
"2026-11-02","Client Payment","+15000.00","95000.00"
`;

    const result = parseCSV(csvData);
    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0].direction).toBe('DEBIT');
    expect(result.transactions[0].amountPaise).toBe(2000000);
    expect(result.transactions[1].direction).toBe('CREDIT');
    expect(result.transactions[1].amountPaise).toBe(1500000);
  });

  it('rejects malformed rows without crashing', () => {
    const csvData = `Date,Description,Debit,Credit,Balance
invalid-date,Some payment,100,,500
01/11/2026,Valid payment,200,,300
`;
    const result = parseCSV(csvData);
    expect(result.transactions.length).toBe(1);
    expect(result.rejectedRows.length).toBe(1);
    expect(result.rejectedRows[0].rowNumber).toBe(2);
  });
});
