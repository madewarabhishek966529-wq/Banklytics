# 12 — Glossary and Product Decisions

## Glossary
- **Statement:** A file or record of account activity for a date range.
- **Transaction:** One debit or credit entry.
- **Credit:** Money entering the account.
- **Debit:** Money leaving the account.
- **Running balance:** Account balance after a transaction.
- **Reconciliation:** Comparing calculated balances/totals with statement-provided values.
- **Internal transfer:** Movement between accounts owned by the same person.
- **Refund:** Money returned after a previous expense.
- **Parser adapter:** Bank/layout-specific logic that converts raw statement data into canonical transactions.
- **OCR:** Optical character recognition; converts text in images/scanned pages into machine-readable text.

## Decisions to make explicitly
1. **Supported bank layouts:** Maintain a list of tested layouts. Do not claim all-bank support prematurely.
2. **Retention:** Decide whether original files are deleted immediately after import or retained encrypted for a defined period.
3. **Currency:** MVP assumes INR; design the schema so currency is explicit.
4. **Multiple accounts:** Decide whether users can combine statements from several accounts.
5. **Transfers:** Provide a way to identify internal transfers and avoid counting them as income/expense in consolidated views.
6. **Refunds:** Keep refunds distinct from ordinary income.
7. **AI:** AI may suggest categories or summarize patterns; deterministic code owns all financial arithmetic.
8. **Scanned PDFs:** Detect and explain OCR limitations; never imply OCR extraction is guaranteed.
9. **Exports:** Neutralize spreadsheet formula prefixes (`=`, `+`, `-`, `@`) in exported CSV cells to prevent formula injection.
10. **Privacy:** Do not use real bank statements as development fixtures unless they are securely sanitized and consented for that purpose.
