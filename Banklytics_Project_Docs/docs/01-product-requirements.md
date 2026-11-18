# 01 — Product Requirements Document

## 1. Product summary
**Working name:** Banklytics  
**Product:** Web app for importing bank statements and turning transaction records into understandable personal-finance analytics.  
**Primary users:** People who want to review their spending without manually adding every transaction.

## 2. Problem
Bank statements contain useful financial data, but users often have to manually total credits, debits, and categories. Banklytics should automate extraction and calculations while making errors visible and correctable.

## 3. Goals
- Import PDF and CSV bank statements.
- Extract date, description, debit, credit, and running balance where available.
- Normalize records into one transaction format.
- Calculate totals consistently and reconcile them against statement balances.
- Display searchable transactions and useful analytics.
- Allow users to correct uncertain parsed records.
- Protect financial information with strong access controls.

## 4. Non-goals for MVP
- Connecting directly to bank accounts or using banking credentials.
- Initiating payments or moving money.
- Tax, investment, credit, or lending advice.
- Guaranteed support for every bank's PDF layout.
- AI-generated financial calculations.
- Shared/public financial profiles.

## 5. Core user journey
1. User creates an account and signs in.
2. User selects a PDF or CSV statement.
3. App validates file type and size.
4. Parser extracts candidate transactions.
5. Normalizer maps bank-specific columns/rows to the canonical transaction model.
6. User reviews a preview, fixes uncertain rows, and confirms import.
7. Backend saves the statement and transactions.
8. Dashboard displays totals, trends, categories, and transaction search.
9. User can delete a statement and all associated transactions.

## 6. MVP features
### Authentication
- Register, login, logout, and authenticated routes.
- Passwords stored only as secure password hashes.
- Users can access only their own data.

### Statement import
- PDF and CSV upload.
- File size and MIME/type validation.
- Import status: uploaded, parsing, needs-review, completed, failed.
- Preview extracted transactions before final save.
- Duplicate import detection using file hash and transaction fingerprints.

### Transaction management
- List, search, filter, sort, and paginate transactions.
- Edit description, date, amount, type, and category.
- Mark internal transfers and refunds.
- Delete an individual transaction or an entire statement.

### Analytics
- Total credits and debits.
- Net cash flow (credits minus debits; label it accurately).
- Monthly income/expense trend.
- Category totals.
- Largest debits and credits.
- Balance trend when running balances are present.
- Date-range filters.

### Reports
- Export filtered transactions as CSV.
- Optional printable report after MVP.

## 7. User stories and acceptance criteria
- As a user, I can upload a CSV so that valid rows appear in a preview.
  - Invalid rows are reported with row numbers and reasons.
  - The original file is not silently accepted if parsing fails.
- As a user, I can upload a PDF.
  - Text-based PDFs are parsed for supported layouts.
  - Scanned/image-only PDFs are detected and reported; OCR is a later/controlled fallback.
- As a user, I can see total credits and debits.
  - Totals are calculated from normalized transaction records, not from AI output.
  - Reconciliation status is shown when opening/closing balances exist.
- As a user, I can correct parsed data before saving.
  - Corrections are persisted and included in all calculations.
- As a user, I can delete a statement.
  - Its transactions and stored file are deleted according to the retention policy.

## 8. Success measures
- Percentage of imports completed without manual correction.
- Percentage of statements that reconcile.
- Parsing error rate by bank/layout.
- Time from upload to review preview.
- Duplicate-import prevention rate.
- User-reported incorrect transaction rate.

## 9. MVP release definition
The MVP is ready when one CSV format and at least one text-based PDF layout can be imported, reviewed, saved, reconciled, filtered, and deleted securely, with automated tests covering calculation and ownership rules.
