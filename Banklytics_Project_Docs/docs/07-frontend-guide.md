# 07 — Frontend Guide

## 1. Main pages
- Landing page: explain supported formats and privacy.
- Register/Login.
- Dashboard: totals, trends, categories, recent transactions.
- Upload statement: drag-and-drop, format/size guidance, upload progress.
- Import review: parsed rows, warnings, corrections, confirm import.
- Transactions: search, filter, sort, pagination, edit.
- Statement details: file metadata, date range, reconciliation, transactions.
- Settings: account and data deletion controls.

## 2. Dashboard layout
Top summary cards:
- Total credits
- Total debits
- Net cash flow
- Number of transactions

Charts:
- Monthly credits vs debits (bar/line)
- Spending by category (donut)
- Daily spending (line)
- Balance history (only if balance data exists)

Tables:
- Recent transactions
- Largest debits
- Imports needing review

## 3. UX requirements
- Use INR formatting (`en-IN`) and display two decimal places where appropriate.
- Label totals clearly; avoid calling net cash flow "savings".
- Provide empty, loading, success, and error states.
- Make charts accessible with labels/tooltips and a tabular alternative.
- Keep transaction descriptions readable on mobile.
- Never show full account numbers.
- Explain when a metric is unavailable because the statement lacks required data.

## 4. Suggested components
```text
AppLayout
Sidebar / MobileNavigation
SummaryCard
StatementDropzone
UploadProgress
ImportPreviewTable
ReconciliationBanner
TransactionTable
TransactionFilters
MonthlyCashflowChart
CategoryBreakdownChart
DateRangePicker
ConfirmDeleteDialog
```

## 5. Money formatting
Convert paise to rupees only for display:
```js
const formatINR = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(paise / 100);
```
This formatting function is for display; calculations should remain in integer paise.
