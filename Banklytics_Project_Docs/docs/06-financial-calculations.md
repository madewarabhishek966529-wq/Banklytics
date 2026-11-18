# 06 — Financial Calculation Rules

## 1. Core totals
Use normalized transactions and integer paise.

- Total credits = sum of amounts where direction is `CREDIT`.
- Total debits = sum of amounts where direction is `DEBIT`.
- Net cash flow = total credits − total debits.
- Transaction count = count of included transactions.

**Important:** Net cash flow is not necessarily savings, profit, or change in wealth. It can include transfers, loan proceeds, refunds, and cash withdrawals.

## 2. Transfers and refunds
A transfer between two accounts owned by the same person should not be treated as new income or consumption expense in a consolidated view. If both sides of a transfer appear in imported statements, classify and match them to avoid double counting.

Refunds should be represented distinctly. A refund may reduce net spending in category reports, but it should not automatically be treated as salary or other income.

## 3. Balance reconciliation
For a statement with opening and closing balances:
`Expected closing balance = opening balance + credits − debits`
`Difference = observed closing balance − expected closing balance`

If difference is zero, show matched. If not, show mismatch and investigate missing rows, pending items, fees, or parser errors. Do not silently adjust transactions to force a match.

## 4. Monthly grouping
Group by transaction date in the statement/account timezone. Define whether date ranges are inclusive and use the same rule across API and UI.

## 5. Categories
Suggested categories:
- Food & Dining
- Transport
- Shopping
- Bills & Utilities
- Rent & Housing
- Education
- Healthcare
- Entertainment
- Cash Withdrawal
- Bank Charges
- Transfer
- Refund
- Salary & Income
- Other / Needs Review

Start with transparent rule-based suggestions. Let users correct categories. AI categorization can be added later, but must never alter amount, date, or debit/credit direction.

## 6. Example
Transactions:
- Salary credit ₹25,000
- UPI debit ₹500
- ATM debit ₹2,000
- Refund credit ₹300
- Shopping debit ₹1,500

Credits = ₹25,300  
Debits = ₹4,000  
Net cash flow = ₹21,300

This does not necessarily mean the user saved ₹21,300: the data may omit cash spending, other accounts, or transfers.

## 7. Implementation notes
- Use integer paise or a decimal arithmetic library.
- Never use JavaScript floating-point values as the source of truth for money.
- Validate non-negative amounts and safe integer range.
- Define how reversals, chargebacks, and zero-value rows are handled.
- Recompute analytics after transaction edits/deletions.
