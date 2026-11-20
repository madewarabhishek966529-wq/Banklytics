import ExcelJS from 'exceljs';
import { normalizeTransaction } from '../../services/normalizeTransaction.js';
import { parseRupeesToPaise } from '../../utils/money.js';

const COLUMN_ALIASES = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date'],
  description: ['narration', 'description', 'particulars', 'remarks', 'details'],
  debit: ['debit', 'withdrawal', 'dr', 'withdrawals', 'dr amount'],
  credit: ['credit', 'deposit', 'cr', 'deposits', 'cr amount'],
  amount: ['amount', 'txn amount', 'transaction amount', 'net amount'],
  type: ['type', 'cr/dr', 'txn type'],
  balance: ['balance', 'closing balance', 'running balance', 'bal'],
  reference: ['ref', 'reference', 'chq / ref no', 'utr', 'cheque no'],
};

function matchColumn(headerName) {
  if (!headerName) return null;
  const clean = String(headerName).toLowerCase().trim().replace(/[^a-z0-9/ ]/g, '');
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((alias) => clean === alias || clean.includes(alias))) {
      return canonical;
    }
  }
  return null;
}

export async function parseExcel(excelBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excelBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Excel workbook has no sheets.');
  }

  const rawRows = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    // row.values is 1-indexed in ExcelJS
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rawRows.push(values.map((v) => (v !== null && v !== undefined ? String(v).trim() : '')));
  });

  if (rawRows.length === 0) {
    throw new Error('Excel sheet is empty.');
  }

  // Detect header row
  let headerIndex = -1;
  let detectedMapping = {};

  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const row = rawRows[i];
    let matchCount = 0;
    const tempMapping = {};

    row.forEach((col, colIdx) => {
      const canonical = matchColumn(col);
      if (canonical && tempMapping[canonical] === undefined) {
        tempMapping[canonical] = colIdx;
        matchCount++;
      }
    });

    if (matchCount >= 2 && tempMapping.date !== undefined) {
      headerIndex = i;
      detectedMapping = tempMapping;
      break;
    }
  }

  if (headerIndex === -1 && rawRows.length > 1) {
    headerIndex = 0;
    rawRows[0].forEach((col, colIdx) => {
      const canonical = matchColumn(col);
      if (canonical) detectedMapping[canonical] = colIdx;
    });
  }

  const candidateTransactions = [];
  const rejectedRows = [];
  const warnings = [];
  let openingBalancePaise = null;
  let closingBalancePaise = null;

  const dataRows = rawRows.slice(headerIndex + 1);

  dataRows.forEach((row, idx) => {
    const rowNum = headerIndex + 1 + idx + 1;
    if (row.length === 0 || row.every((c) => !c)) return;

    const dateVal = detectedMapping.date !== undefined ? row[detectedMapping.date] : null;
    const descVal = detectedMapping.description !== undefined ? row[detectedMapping.description] : '';
    const debitVal = detectedMapping.debit !== undefined ? row[detectedMapping.debit] : null;
    const creditVal = detectedMapping.credit !== undefined ? row[detectedMapping.credit] : null;
    const amountVal = detectedMapping.amount !== undefined ? row[detectedMapping.amount] : null;
    const typeVal = detectedMapping.type !== undefined ? row[detectedMapping.type] : null;
    const balanceVal = detectedMapping.balance !== undefined ? row[detectedMapping.balance] : null;
    const refVal = detectedMapping.reference !== undefined ? row[detectedMapping.reference] : '';

    let direction = null;
    if (typeVal) {
      const t = String(typeVal).trim().toUpperCase();
      if (t.includes('CR')) direction = 'CREDIT';
      if (t.includes('DR')) direction = 'DEBIT';
    }

    const { isValid, errors, warnings: rowWarnings, transaction } = normalizeTransaction({
      date: dateVal,
      description: descVal,
      amount: amountVal,
      direction,
      debit: debitVal,
      credit: creditVal,
      balance: balanceVal,
      reference: refVal,
      sourceRow: rowNum,
      sourcePage: 1,
    });

    if (rowWarnings?.length) {
      warnings.push(`Row ${rowNum}: ${rowWarnings.join(', ')}`);
    }

    if (isValid) {
      candidateTransactions.push(transaction);
      if (transaction.balancePaise !== null) {
        if (openingBalancePaise === null) {
          openingBalancePaise =
            transaction.direction === 'CREDIT'
              ? transaction.balancePaise - transaction.amountPaise
              : transaction.balancePaise + transaction.amountPaise;
        }
        closingBalancePaise = transaction.balancePaise;
      }
    } else {
      rejectedRows.push({
        rowNumber: rowNum,
        raw: row,
        reasons: errors,
      });
    }
  });

  return {
    headers: rawRows[headerIndex] || [],
    detectedMapping,
    transactions: candidateTransactions,
    rejectedRows,
    warnings,
    metadata: {
      totalRows: dataRows.length,
      acceptedCount: candidateTransactions.length,
      rejectedCount: rejectedRows.length,
      openingBalancePaise,
      closingBalancePaise,
    },
  };
}
