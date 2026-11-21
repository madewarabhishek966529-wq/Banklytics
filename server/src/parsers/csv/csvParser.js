import { parse } from 'csv-parse/sync';
import { normalizeTransaction } from '../../services/normalizeTransaction.js';
import { parseRupeesToPaise } from '../../utils/money.js';

/**
 * Common column name mappings for bank statement CSVs
 */
const COLUMN_ALIASES = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'trans date', 'booking date', 'value dt'],
  description: ['narration', 'description', 'particulars', 'remarks', 'details', 'transaction remarks', 'transaction details', 'desc', 'transaction description'],
  debit: ['debit', 'withdrawal', 'dr', 'withdrawals', 'debit amount', 'withdrawal amount', 'dr amount', 'withdrawal amt', 'debit amt', 'dr.'],
  credit: ['credit', 'deposit', 'cr', 'deposits', 'credit amount', 'deposit amount', 'cr amount', 'deposit amt', 'credit amt', 'cr.'],
  amount: ['amount', 'txn amount', 'transaction amount', 'net amount', 'amt', 'total amount'],
  type: ['type', 'cr/dr', 'txn type', 'transaction type', 'dr_cr', 'entry type'],
  balance: ['balance', 'closing balance', 'running balance', 'bal', 'net balance', 'closing bal', 'available balance'],
  reference: ['ref', 'reference', 'chq / ref no', 'chq/ref no', 'utr', 'cheque no', 'transaction id', 'ref no', 'chq no', 'cheque / ref no'],
};

function matchColumn(headerName) {
  if (!headerName) return null;
  const clean = String(headerName).toLowerCase().trim().replace(/[^a-z0-9/ ]/g, '').replace(/\s+/g, ' ');
  const cleanNoSpace = clean.replace(/\s+/g, '');
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (
      aliases.some((alias) => {
        const cleanAlias = alias.replace(/[^a-z0-9/ ]/g, '').replace(/\s+/g, ' ');
        const aliasNoSpace = cleanAlias.replace(/\s+/g, '');
        return clean === cleanAlias || clean.includes(cleanAlias) || cleanNoSpace === aliasNoSpace || cleanNoSpace.includes(aliasNoSpace);
      })
    ) {
      return canonical;
    }
  }
  return null;
}

/**
 * Parses raw CSV content (Buffer or String) and returns normalized transactions + metadata
 */
export function parseCSV(csvContent, customMapping = null) {
  const content = typeof csvContent === 'string' ? csvContent : csvContent.toString('utf-8');

  // Strip BOM if present
  const sanitized = content.replace(/^\uFEFF/, '');

  let rawRecords;
  try {
    rawRecords = parse(sanitized, {
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      delimiter: [',', ';', '\t', '|'],
    });
  } catch (err) {
    try {
      rawRecords = parse(sanitized, {
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      });
    } catch (fallbackErr) {
      throw new Error(`Failed to parse CSV syntax: ${err.message}`);
    }
  }

  if (!rawRecords || rawRecords.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Find header row (usually first non-empty row containing recognizable header keywords)
  let headerIndex = -1;
  let detectedMapping = {};

  for (let i = 0; i < Math.min(rawRecords.length, 60); i++) {
    const row = rawRecords[i];
    let matchCount = 0;
    const tempMapping = {};

    row.forEach((col, colIdx) => {
      const canonical = matchColumn(String(col));
      if (canonical && tempMapping[canonical] === undefined) {
        tempMapping[canonical] = colIdx;
        matchCount++;
      }
    });

    // If at least date and (description or amount/debit/credit) are matched
    if (matchCount >= 2 && tempMapping.date !== undefined && (tempMapping.description !== undefined || tempMapping.amount !== undefined || tempMapping.debit !== undefined || tempMapping.credit !== undefined)) {
      headerIndex = i;
      detectedMapping = tempMapping;
      break;
    }
  }

  // If no automatic header matched, check if first row can be used as raw headers
  if (headerIndex === -1 && rawRecords.length > 1) {
    headerIndex = 0;
    rawRecords[0].forEach((col, colIdx) => {
      const canonical = matchColumn(String(col));
      if (canonical) detectedMapping[canonical] = colIdx;
    });
  }

  // Use custom mapping override if provided by user
  const effectiveMapping = customMapping || detectedMapping;

  // Validate that critical column mapping exists (at minimum date)
  if (effectiveMapping.date === undefined || (effectiveMapping.description === undefined && effectiveMapping.debit === undefined && effectiveMapping.amount === undefined)) {
    throw new Error('CSV file is missing required columns: date and description/amount are required.');
  }

  const headerRow = headerIndex >= 0 ? rawRecords[headerIndex] : [];

  const candidateTransactions = [];
  const rejectedRows = [];
  const warnings = [];

  let openingBalancePaise = null;
  let closingBalancePaise = null;

  const dataRows = rawRecords.slice(headerIndex + 1);

  dataRows.forEach((row, idx) => {
    const rowNum = headerIndex + 1 + idx + 1; // 1-based index

    // Skip empty or short rows
    if (row.length === 0 || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    const dateVal = effectiveMapping.date !== undefined ? row[effectiveMapping.date] : null;
    const descVal = effectiveMapping.description !== undefined ? row[effectiveMapping.description] : '';
    const debitVal = effectiveMapping.debit !== undefined ? row[effectiveMapping.debit] : null;
    const creditVal = effectiveMapping.credit !== undefined ? row[effectiveMapping.credit] : null;
    const amountVal = effectiveMapping.amount !== undefined ? row[effectiveMapping.amount] : null;
    const typeVal = effectiveMapping.type !== undefined ? row[effectiveMapping.type] : null;
    const balanceVal = effectiveMapping.balance !== undefined ? row[effectiveMapping.balance] : null;
    const refVal = effectiveMapping.reference !== undefined ? row[effectiveMapping.reference] : '';

    let direction = null;
    if (typeVal) {
      const t = String(typeVal).trim().toUpperCase();
      if (t.includes('CR') || t.includes('CREDIT')) direction = 'CREDIT';
      if (t.includes('DR') || t.includes('DEBIT')) direction = 'DEBIT';
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

    if (rowWarnings && rowWarnings.length > 0) {
      warnings.push(`Row ${rowNum}: ${rowWarnings.join(', ')}`);
    }

    if (isValid) {
      candidateTransactions.push(transaction);

      // Track running balance to estimate opening and closing balances
      if (transaction.balancePaise !== null) {
        if (openingBalancePaise === null) {
          // Opening balance can be inferred from first transaction: balance - (credit) + (debit)
          openingBalancePaise =
            transaction.direction === 'CREDIT'
              ? transaction.balancePaise - transaction.amountPaise
              : transaction.balancePaise + transaction.amountPaise;
        }
        closingBalancePaise = transaction.balancePaise;
      }
    } else {
      // Check if it was a summary / header line rather than transaction
      const fullRowText = row.join(' ').toLowerCase();
      if (fullRowText.includes('opening balance') || fullRowText.includes('brought forward')) {
        openingBalancePaise = parseRupeesToPaise(balanceVal || amountVal || fullRowText);
      } else if (fullRowText.includes('closing balance') || fullRowText.includes('carried forward')) {
        closingBalancePaise = parseRupeesToPaise(balanceVal || amountVal || fullRowText);
      } else {
        rejectedRows.push({
          rowNumber: rowNum,
          raw: row,
          reasons: errors,
        });
      }
    }
  });

  return {
    headers: headerRow,
    detectedMapping,
    openingBalancePaise,
    closingBalancePaise,
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
