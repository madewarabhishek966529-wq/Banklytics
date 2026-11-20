import { normalizeTransaction } from '../../services/normalizeTransaction.js';
import { parseRupeesToPaise } from '../../utils/money.js';

/**
 * Extracts text from a PDF buffer and identifies statement lines.
 */
export async function parsePDF(pdfBuffer) {
  let pdfParse;
  try {
    const mod = await import('pdf-parse');
    pdfParse = mod.default || mod;
  } catch (err) {
    throw new Error('PDF parsing library is unavailable.');
  }

  let data;
  try {
    data = await pdfParse(pdfBuffer);
  } catch (err) {
    throw new Error(`Failed to read PDF document: ${err.message}`);
  }

  const rawText = data.text || '';

  // Check if PDF is scanned or image-only
  if (rawText.trim().length < 50) {
    return {
      isScanned: true,
      warnings: [
        'The uploaded PDF appears to be a scanned image or empty. Banklytics text parser cannot extract text directly. Please upload a machine-generated PDF or CSV.',
      ],
      transactions: [],
      rejectedRows: [],
      metadata: {
        totalPages: data.numpages || 1,
        acceptedCount: 0,
        rejectedCount: 0,
      },
    };
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let openingBalancePaise = null;
  let closingBalancePaise = null;
  let bankName = 'Standard Bank';
  const warnings = [];
  const candidateTransactions = [];
  const rejectedRows = [];

  // Detect bank from header text
  const headerSlice = rawText.slice(0, 1000).toLowerCase();
  if (headerSlice.includes('hdfc')) bankName = 'HDFC Bank';
  else if (headerSlice.includes('state bank') || headerSlice.includes('sbi')) bankName = 'State Bank of India';
  else if (headerSlice.includes('icici')) bankName = 'ICICI Bank';
  else if (headerSlice.includes('axis')) bankName = 'Axis Bank';
  else if (headerSlice.includes('kotak')) bankName = 'Kotak Mahindra Bank';

  // Find Opening / Closing balance markers
  for (const line of lines) {
    const l = line.toLowerCase();
    if (openingBalancePaise === null && (l.includes('opening balance') || l.includes('brought forward') || l.includes('b/f'))) {
      const match = line.match(/(?:[₹Rs.\s:]+)?([0-9,]+\.\d{2})/);
      if (match) openingBalancePaise = parseRupeesToPaise(match[1]);
    }
    if (l.includes('closing balance') || l.includes('carried forward') || l.includes('c/f') || l.includes('total balance')) {
      const match = line.match(/(?:[₹Rs.\s:]+)?([0-9,]+\.\d{2})/);
      if (match) closingBalancePaise = parseRupeesToPaise(match[1]);
    }
  }

  // Regex for transactions starting with DD/MM/YYYY or DD-MM-YYYY
  // Format example: 12/01/2026 UPI/Zomato/12345 540.00 0.00 45,210.50
  // Or: 15/01/2026 SALARY CREDIT CR 50000.00 95210.50
  const dateRegex = /^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/;
  const amountPattern = /([0-9,]+\.\d{2})/g;

  let rowCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      rowCounter++;
      const dateStr = dateMatch[1];
      const remainder = line.slice(dateMatch[0].length).trim();

      // Find all currency/amount candidates in the row
      const amountsFound = remainder.match(amountPattern) || [];

      if (amountsFound.length >= 1) {
        // Last amount is typically balance if >= 2 amounts exist
        let debit = null;
        let credit = null;
        let balance = null;
        let direction = null;

        const isCredit =
          /\b(CR|CREDIT|DEPOSIT)\b/i.test(remainder) ||
          /\b(BY TRANSFER|SALARY|INTEREST|REFUND)\b/i.test(remainder);
        const isDebit =
          /\b(DR|DEBIT|WITHDRAWAL)\b/i.test(remainder) ||
          /\b(TO TRANSFER|ATM|POS|UPI|CHG)\b/i.test(remainder);

        if (amountsFound.length >= 3) {
          // Typically: Debit, Credit, Balance
          debit = amountsFound[0];
          credit = amountsFound[1];
          balance = amountsFound[2];
        } else if (amountsFound.length === 2) {
          // Amount and Balance
          const amt = amountsFound[0];
          balance = amountsFound[1];
          if (isCredit) {
            credit = amt;
            direction = 'CREDIT';
          } else {
            debit = amt;
            direction = 'DEBIT';
          }
        } else {
          // 1 amount
          const amt = amountsFound[0];
          if (isCredit) {
            credit = amt;
            direction = 'CREDIT';
          } else {
            debit = amt;
            direction = 'DEBIT';
          }
        }

        // Clean narration: strip amounts from remainder
        let narration = remainder;
        for (const a of amountsFound) {
          narration = narration.replace(a, '');
        }
        narration = narration
          .replace(/\b(CR|DR|CREDIT|DEBIT)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Check if next line is continuation/wrapped narration
        if (i + 1 < lines.length && !lines[i + 1].match(dateRegex) && lines[i + 1].length > 3) {
          const nextL = lines[i + 1];
          if (!nextL.match(amountPattern)) {
            narration += ' ' + nextL;
            i++; // skip next line since it was consumed
          }
        }

        const { isValid, errors, transaction } = normalizeTransaction({
          date: dateStr,
          description: narration || 'Bank Transaction',
          debit,
          credit,
          direction,
          balance,
          sourceRow: rowCounter,
          sourcePage: 1,
        });

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
            rowNumber: rowCounter,
            raw: [line],
            reasons: errors,
          });
        }
      }
    }
  }

  if (candidateTransactions.length === 0) {
    warnings.push(
      'Could not extract structured transaction rows from the PDF. Check if layout is supported or upload a CSV.'
    );
  }

  return {
    isScanned: false,
    bankName,
    warnings,
    transactions: candidateTransactions,
    rejectedRows,
    metadata: {
      totalPages: data.numpages || 1,
      totalLines: lines.length,
      acceptedCount: candidateTransactions.length,
      rejectedCount: rejectedRows.length,
      openingBalancePaise,
      closingBalancePaise,
    },
  };
}
