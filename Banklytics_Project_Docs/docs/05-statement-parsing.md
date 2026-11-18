# 05 — Statement Parsing Guide

## 1. Reality of bank statements
There is no universal PDF layout. Banks may use different headings, date formats, debit/credit columns, narration wrapping, page headers, and balance conventions. A parser must not assume every PDF is identical.

## 2. Recommended order
1. CSV with known headers.
2. Text-based PDF for one supported bank/layout.
3. Additional bank-specific PDF adapters.
4. Scanned PDF OCR only after the core parser is reliable.

## 3. Canonical transaction shape
```js
{
  date: "2026-01-15",
  description: "UPI/merchant/reference",
  debitPaise: 12500,       // optional
  creditPaise: 0,          // optional
  balancePaise: 875000,    // optional
  reference: null,
  sourceRow: 12,
  sourcePage: 1
}
```
Exactly one of debit or credit should normally be positive for a standard row. Handle exceptional bank formats explicitly.

## 4. CSV parser requirements
- Detect or ask the user to select delimiter and column mapping.
- Support quoted commas, escaped quotes, and UTF-8/BOM.
- Preview detected headers.
- Map date, narration, debit, credit, amount, type, and balance.
- Handle separate debit/credit columns and signed amount columns.
- Reject or flag ambiguous rows; never silently drop them.
- Return row-level errors.

## 5. PDF parser requirements
- Extract text with page boundaries retained.
- Identify table headers and transaction row patterns.
- Join narration lines only when the layout adapter can do so safely.
- Ignore repeated page headers/footers.
- Parse Indian number formats such as `1,23,456.78`.
- Detect opening/closing balance labels.
- Keep source page and source text location for troubleshooting.
- Flag low-confidence or incomplete rows for user review.

## 6. OCR
Scanned PDFs may contain only images. Detect this condition. OCR should be optional because OCR can confuse digits, decimal points, and transaction directions. Require review and reconciliation before import.

## 7. Normalization rules
- Parse dates using explicit known formats; avoid ambiguous locale guesses.
- Convert amounts to integer paise.
- Normalize whitespace but preserve original description.
- Convert debit/credit columns to a single direction and positive amount.
- Store the original description separately from any cleaned description.
- Do not infer missing transaction amounts.
- Do not classify a transaction as income/expense based only on a keyword if the result is uncertain.

## 8. Import preview
Show:
- File name and detected bank/layout (if known).
- Total parsed rows.
- Rows accepted, rows needing review, and rows rejected.
- First 20–50 transaction rows.
- Calculated totals and reconciliation status.
- Warnings, including unsupported layout or missing balance data.

## 9. Adapter interface
Each bank/layout adapter should expose a predictable interface:
```js
export function canParse(extractedTextOrHeaders) {
  // return a confidence score or boolean
}

export function parse(input) {
  // return { transactions, metadata, warnings, errors }
}
```
Keep fixtures for every supported layout and version. Never claim support for a bank until real sample statements (with sensitive data removed) pass tests.
