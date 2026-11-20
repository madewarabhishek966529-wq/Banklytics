import { createWorker } from 'tesseract.js';
import { normalizeTransaction } from '../../services/normalizeTransaction.js';
import { parseRupeesToPaise } from '../../utils/money.js';

/**
 * Local OCR Parser using Tesseract.js
 * Scans image buffers (PNG, JPEG, TIFF) or scanned PDF pages to extract financial text.
 */
export async function parseWithOCR(imageBuffer) {
  let worker = null;
  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(imageBuffer);
    const text = ret.data.text || '';

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const candidateTransactions = [];
    const dateRegex = /^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/;
    const amountPattern = /([0-9,]+\.\d{2})/g;

    let rowNum = 0;
    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        rowNum++;
        const dateStr = dateMatch[1];
        const remainder = line.slice(dateMatch[0].length).trim();
        const amounts = remainder.match(amountPattern) || [];

        if (amounts.length >= 1) {
          const isCredit = /\b(CR|CREDIT|DEPOSIT|BY)\b/i.test(remainder);
          const amt = amounts[0];
          const direction = isCredit ? 'CREDIT' : 'DEBIT';

          let narration = remainder;
          for (const a of amounts) narration = narration.replace(a, '');
          narration = narration.replace(/\b(CR|DR|CREDIT|DEBIT)\b/gi, '').trim();

          const { isValid, transaction } = normalizeTransaction({
            date: dateStr,
            description: narration || 'Scanned Transaction',
            amount: amt,
            direction,
            sourceRow: rowNum,
            sourcePage: 1,
          });

          if (isValid) {
            candidateTransactions.push(transaction);
          }
        }
      }
    }

    return {
      text,
      transactions: candidateTransactions,
      metadata: {
        ocrConfidence: ret.data.confidence,
        linesCount: lines.length,
        extractedCount: candidateTransactions.length,
      },
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
