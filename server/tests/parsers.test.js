import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { parseCSV } from '../src/parsers/csv/csvParser.js';
import { parseExcel } from '../src/parsers/excel/excelParser.js';
import { parseRupeesToPaise } from '../src/utils/money.js';

describe('Document Parsers Accuracy Suite (CSV, Excel, PDF)', () => {
  it('PARSE-01: CSV Parser handles valid Indian CSV with header aliases', () => {
    const csvData = `Txn Date,Particulars,Chq No,Withdrawal Amount,Deposit Amount,Net Balance
01/11/2026,OPENING BALANCE,,0.00,0.00,25000.00
02/11/2026,SALARY CREDIT NOV,NEFT101,,75000.00,100000.00
03/11/2026,SWIGGY BANGALORE,UPI99,450.50,,99549.50
04/11/2026,CLOSING BALANCE,,0.00,0.00,99549.50
`;

    const parsed = parseCSV(csvData);
    expect(parsed.transactions.length).toBe(2);
    expect(parsed.transactions[0].description).toBe('SALARY CREDIT NOV');
    expect(parsed.transactions[0].direction).toBe('CREDIT');
    expect(parsed.transactions[0].amountPaise).toBe(7500000);
    expect(parsed.transactions[1].amountPaise).toBe(45050);
    expect(parsed.transactions[1].direction).toBe('DEBIT');
    expect(parsed.openingBalancePaise).toBe(2500000);
    expect(parsed.closingBalancePaise).toBe(9954950);
  });

  it('PARSE-02: CSV Parser strips UTF-8 BOM cleanly', () => {
    const bomCSV = '\uFEFFDate,Narration,Withdrawal,Deposit,Balance\n01/11/2026,GROCERIES,1200.00,,5000.00\n';
    const parsed = parseCSV(bomCSV);
    expect(parsed.transactions.length).toBe(1);
    expect(parsed.transactions[0].description).toBe('GROCERIES');
    expect(parsed.transactions[0].amountPaise).toBe(120000);
  });

  it('PARSE-03: CSV Parser throws error on completely empty file', () => {
    expect(() => parseCSV('')).toThrow(/empty/i);
    expect(() => parseCSV('   \n\n  ')).toThrow(/empty/i);
  });

  it('PARSE-04: CSV Parser reports error when missing required columns (date or narration)', () => {
    const invalidCSV = `RandomCol1,RandomCol2,RandomCol3\n123,Foo,Bar\n456,Baz,Qux\n`;
    expect(() => parseCSV(invalidCSV)).toThrow(/required columns/i);
  });

  it('PARSE-05: Indian number formatting parser handles various amount formats', () => {
    expect(parseRupeesToPaise('1,23,456.78')).toBe(12345678);
    expect(parseRupeesToPaise('₹ 5,000.00')).toBe(500000);
    expect(parseRupeesToPaise('Rs. 10,500.50')).toBe(1050050);
    expect(parseRupeesToPaise(' 250 ')).toBe(25000);
    expect(parseRupeesToPaise(null)).toBe(0);
    expect(parseRupeesToPaise(undefined)).toBe(0);
  });

  it('PARSE-06: Excel Parser (.xlsx) parses tabular rows and maps aliases', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Statement');

    sheet.addRow(['Date', 'Description', 'Withdrawal', 'Deposit', 'Balance']);
    sheet.addRow(['2026-11-01', 'OPENING BALANCE', '', '', '50000']);
    sheet.addRow(['2026-11-02', 'COMPANY SALARY', '', '80000', '130000']);
    sheet.addRow(['2026-11-03', 'AMAZON INDIA', '2500.50', '', '127499.50']);
    sheet.addRow(['2026-11-04', 'CLOSING BALANCE', '', '', '127499.50']);

    const buffer = await workbook.xlsx.writeBuffer();
    const parsed = await parseExcel(Buffer.from(buffer));

    expect(parsed.transactions.length).toBe(2);
    expect(parsed.transactions[0].description).toBe('COMPANY SALARY');
    expect(parsed.transactions[0].amountPaise).toBe(8000000);
    expect(parsed.transactions[0].direction).toBe('CREDIT');
    expect(parsed.transactions[1].description).toBe('AMAZON INDIA');
    expect(parsed.transactions[1].amountPaise).toBe(250050);
    expect(parsed.transactions[1].direction).toBe('DEBIT');
    expect(parsed.openingBalancePaise).toBe(5000000);
    expect(parsed.closingBalancePaise).toBe(12749950);
  });
});
