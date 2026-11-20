import crypto from 'crypto';
import { parseRupeesToPaise } from '../utils/money.js';
import { categorizeTransaction } from './categorizeTransaction.js';

/**
 * Normalizes a raw candidate transaction row into canonical Banklytics format.
 */
export function normalizeTransaction({
  date,
  description = '',
  amount = null,
  amountPaise = null,
  direction = null,
  debit = null,
  credit = null,
  balance = null,
  balancePaise = null,
  reference = '',
  sourceRow = 0,
  sourcePage = 1,
  category = null,
  classification = null,
}) {
  const errors = [];
  const warnings = [];

  // Parse Date
  let parsedDate = null;
  if (date instanceof Date && !isNaN(date)) {
    parsedDate = date;
  } else if (typeof date === 'string') {
    // Check common Indian date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const dmyMatch = date.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      parsedDate = new Date(Date.UTC(year, month, day));
    } else {
      parsedDate = new Date(date);
    }
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    errors.push(`Invalid transaction date: "${date}"`);
  }

  // Determine Direction & Amount in Paise
  let finalDirection = direction;
  let finalAmountPaise = amountPaise !== null ? amountPaise : 0;

  if (debit !== null && debit !== undefined && debit !== '') {
    const dVal = parseRupeesToPaise(debit);
    if (dVal > 0) {
      finalDirection = 'DEBIT';
      finalAmountPaise = dVal;
    }
  }

  if (credit !== null && credit !== undefined && credit !== '') {
    const cVal = parseRupeesToPaise(credit);
    if (cVal > 0) {
      if (finalDirection === 'DEBIT') {
        warnings.push('Row contains both debit and credit entries. Check row manually.');
      }
      finalDirection = 'CREDIT';
      finalAmountPaise = cVal;
    }
  }

  if (!finalDirection && amount !== null && amount !== undefined) {
    const rawStr = String(amount).trim();
    if (rawStr.startsWith('-') || rawStr.includes('Dr') || rawStr.includes('DR')) {
      finalDirection = 'DEBIT';
    } else if (rawStr.includes('Cr') || rawStr.includes('CR') || rawStr.startsWith('+')) {
      finalDirection = 'CREDIT';
    } else {
      // Default to debit if unspecified signed amount
      finalDirection = 'DEBIT';
    }
    finalAmountPaise = parseRupeesToPaise(rawStr);
  }

  if (!finalDirection) {
    errors.push('Could not determine transaction direction (CREDIT or DEBIT).');
  }

  if (!Number.isInteger(finalAmountPaise) || finalAmountPaise <= 0) {
    errors.push(`Amount must be positive integer paise. Found: ${finalAmountPaise}`);
  }

  // Running balance
  let finalBalancePaise = null;
  if (balancePaise !== null && balancePaise !== undefined) {
    finalBalancePaise = balancePaise;
  } else if (balance !== null && balance !== undefined && balance !== '') {
    finalBalancePaise = parseRupeesToPaise(balance);
  }

  // Clean description and mask full account/card numbers
  const cleanDescription = (description || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(\d{4})\d{4,8}(\d{4})\b/g, '$1******$2');

  // Categorize if not specified
  const autoCat = categorizeTransaction(cleanDescription, finalDirection);
  const finalCategory = category || autoCat.category;
  const finalClassification = classification || autoCat.classification;

  // Fingerprint for duplicate detection: date + amount + direction + slug of description
  const dateStr = parsedDate ? parsedDate.toISOString().slice(0, 10) : 'nodate';
  const descSlug = cleanDescription.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  const fingerprintRaw = `${dateStr}:${finalAmountPaise}:${finalDirection}:${descSlug}`;
  const fingerprint = crypto.createHash('sha256').update(fingerprintRaw).digest('hex');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    transaction: {
      transactionDate: parsedDate,
      description: cleanDescription,
      reference: (reference || '').trim(),
      amountPaise: finalAmountPaise,
      direction: finalDirection,
      balancePaise: finalBalancePaise,
      category: finalCategory,
      classification: finalClassification,
      counterparty: '',
      fingerprint,
      confidence: autoCat.confidence,
      isReviewed: false,
      sourcePage,
      sourceRow,
    },
  };
}
