# 09 — Testing Plan

## 1. Unit tests
### Money and calculations
- Credits/debits sum correctly.
- Paise arithmetic avoids floating-point drift.
- Empty transaction list returns zero totals.
- Refunds/transfers follow documented classification rules.
- Monthly grouping handles month/year boundaries.
- Reconciliation returns matched/mismatch correctly.

### Normalization
- Indian comma grouping: `1,23,456.78`.
- Leading/trailing spaces.
- Missing optional balance/reference.
- Debit and credit columns.
- Signed amount formats.
- Invalid dates and malformed amounts.
- Zero and negative values.

## 2. Parser fixtures
Maintain sanitized fixtures for each supported CSV/PDF layout. Never commit real customer statements or personally identifying financial data.

For each fixture, assert:
- Expected number of rows.
- Expected dates and directions.
- Expected amount values in paise.
- Expected opening/closing balances.
- Expected warnings and rejected rows.
- Reconciliation result.

## 3. Integration tests
- Upload invalid file is rejected.
- Upload valid file returns preview.
- User confirms preview and import is persisted.
- Duplicate upload is detected.
- User A cannot view, edit, export, or delete User B's statement/transactions.
- Deleting statement deletes related transactions.
- Analytics filters are applied correctly.
- Pagination and maximum page size work.

## 4. Security tests
- Oversized upload.
- Fake PDF/CSV extension.
- Malformed or password-protected PDF.
- CSV formula injection in exported values.
- NoSQL injection attempts.
- Missing/expired authentication.
- IDOR attempts using another user's IDs.
- Rate-limit behavior.

## 5. Manual acceptance checklist
- [ ] CSV preview is understandable.
- [ ] Unsupported PDF layout produces a clear warning.
- [ ] User can correct wrong rows before import.
- [ ] Credits and debits reconcile where statement data permits.
- [ ] Charts match transaction table filters.
- [ ] Mobile layout is usable.
- [ ] Delete workflow explains what will be deleted.
- [ ] No sensitive data appears in logs or error messages.
