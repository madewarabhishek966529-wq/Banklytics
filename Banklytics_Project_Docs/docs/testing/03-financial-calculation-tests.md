# 03 — Financial Calculation Testing & Edge Cases Audit

## 1. Principles of Financial Computing in Banklytics
Financial calculations must never rely on standard IEEE 754 floating-point numbers due to well-known binary representation issues (e.g. `0.1 + 0.2 = 0.30000000000000004`).

Banklytics enforces the following mathematical rules:
1. **Integer Arithmetic**: All currency values in INR are stored and computed in **paise** ($1\text{ Rupee} = 100\text{ Paise}$).
2. **Deterministic Rounding**: Any fractional values are rounded using banker's rounding (`Math.round`) only at external ingestion or display boundaries.
3. **Safe Integer Limits**: JavaScript's `Number.MAX_SAFE_INTEGER` is $9,007,199,254,740,991$ paise ($₹90,071,992,547,409.91$ or ~₹90,000 Crore), providing extensive headroom without requiring BigInt for personal statements.

---

## 2. Core Reconciliation Formulas

$$\text{Total Credits} = \sum_{t \in \text{Credits}} \text{amountPaise}_t$$

$$\text{Total Debits} = \sum_{t \in \text{Debits}} \text{amountPaise}_t$$

$$\text{Net Cash Flow} = \text{Total Credits} - \text{Total Debits}$$

$$\text{Expected Closing Balance} = \text{Opening Balance} + \text{Total Credits} - \text{Total Debits}$$

$$\text{Discrepancy} = \text{Observed Closing Balance} - \text{Expected Closing Balance}$$

Reconciliation Status Criteria:
- `MATCHED`: $\text{Discrepancy} = 0$
- `MISMATCH`: $\text{Discrepancy} \neq 0$
- `NOT_APPLICABLE`: Opening or Closing balance is unstated in the source document.

---

## 3. Mathematical Edge Cases Tested

### 3.1 Zero Transactions
- **Input**: Empty statement $\emptyset$.
- **Expected**: $\text{Credits} = 0$, $\text{Debits} = 0$, $\text{Net Cash Flow} = 0$, $\text{Expected Closing} = \text{Opening Balance}$.
- **Result**: Verified in `CALC-02`. PASS.

### 3.2 Pure Credit Statement
- **Input**: Account receiving only deposits/salaries, no withdrawals.
- **Expected**: $\text{Debits} = 0$, $\text{Net Cash Flow} = \text{Total Credits}$.
- **Result**: Verified in `CALC-03`. PASS.

### 3.3 Pure Debit Statement
- **Input**: Credit card or expenditure statement with withdrawals only.
- **Expected**: $\text{Credits} = 0$, $\text{Net Cash Flow} = -\text{Total Debits}$.
- **Result**: Verified in `CALC-04`. PASS.

### 3.4 Refunds vs Income Disaggregation
- **Issue**: Treating merchant refunds as salary/income creates false revenue spikes.
- **Rule**: Transactions with classification `REFUND` are isolated from primary income metrics.
- **Result**: Verified in `CALC-06`. PASS.

### 3.5 Reversals and Failed Transactions
- **Scenario**: Failed ATM withdrawal or rejected POS swipe followed by an immediate reversal of identical amount.
- **Rule**: Both records are retained to maintain ledger parity with bank statement lines, resulting in zero net debit change.
- **Result**: Verified in `CALC-06`. PASS.

### 3.6 Multi-transaction Identity Preservation
- **Scenario**: Multiple ₹500 transactions at Chai Point on the same day.
- **Rule**: De-duplication must not collapse distinct purchases. Transaction index and unique timestamps ensure independent summation.
- **Result**: Verified in `CALC-07`. PASS.

### 3.7 Indian Number Formats
- Formats parsed:
  - `1,23,456.78` $\rightarrow 12345678$ paise
  - `₹ 50,000.00` $\rightarrow 5000000$ paise
  - `Rs. 1,00,00,000.00` $\rightarrow 1000000000$ paise
- **Result**: Verified in `CALC-10` & `PARSE-05`. PASS.

### 3.8 Financial Year (FY) Boundary Tests
- Indian Financial Year runs from April 1 through March 31.
- Transactions at `2026-03-31T23:59:59.999Z` bucket into FY 2025-2026.
- Transactions at `2026-04-01T00:00:00.000Z` bucket into FY 2026-2027.
- **Result**: Verified in `CALC-09`. PASS.

### 3.9 Large Scale Value Precision (₹100 Crore)
- Test: Ingestion and summation of values up to $₹1,000,000,000$ ($10^{11}$ paise).
- Verification: Exact subtraction and addition with 0 paise drift.
- **Result**: Verified in `CALC-05`. PASS.
