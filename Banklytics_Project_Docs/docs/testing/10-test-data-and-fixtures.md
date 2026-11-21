# 10 — Test Data, Fixtures & Synthetic Corpus Guide

## 1. Principles of Financial Test Data
To ensure total user privacy and compliance with data protection laws:
1. **Zero Real Customer Data**: Never commit, store, or test against real, identifiable customer statements or bank accounts.
2. **Deterministic Synthetics**: All fixtures and test datasets are deterministically generated with synthetic names, account numbers, and transaction IDs.
3. **Double-Entry Balance Verification**: Every statement fixture must declare explicit Opening Balance, Closing Balance, and ledger rows that mathematically balance to 0 discrepancy.

---

## 2. Standard Fixtures in the Repository

### 2.1 `sample_statement.csv`
- **Location**: `server/fixtures/sample_statement.csv`
- **Bank Format**: HDFC Bank / Generic Indian Bank Standard CSV
- **Headers**: `Date,Narration,Chq / Ref No,Withdrawal,Deposit,Balance`
- **Opening Balance**: ₹1,00,000.00 (`10000000` paise)
- **Closing Balance**: ₹1,60,211.00 (`16021100` paise)
- **Transaction Breakdown**:
  - `01/11/2026`: OPENING BALANCE (`₹1,00,000.00`)
  - `02/11/2026`: ACH SALARY CREDIT (`₹85,000.00` Credit)
  - `03/11/2026`: UPI/SWIGGY/987123 (`₹650.00` Debit)
  - `04/11/2026`: UBER INDIA TRIP (`₹340.00` Debit)
  - `05/11/2026`: AMAZON RETAIL INDIA (`₹2,500.00` Debit)
  - `06/11/2026`: BESCOM ELECTRICITY BILL (`₹5,000.00` Debit)
  - `07/11/2026`: APOLLO PHARMACY BANGALORE (`₹1,850.00` Debit)
  - `08/11/2026`: AMAZON REFUND FOR ORDER (`₹1,200.00` Credit)
  - `09/11/2026`: HOUSE RENT NOV (`₹15,000.00` Debit)
  - `10/11/2026`: NETFLIX SUBSCRIPTION (`₹649.00` Debit)
  - `11/11/2026`: CLOSING BALANCE (`₹1,60,211.00`)
- **Mathematical Reconciliation**:
  - Total Credits: ₹85,000 + ₹1,200 = ₹86,200 (`8620000` paise)
  - Total Debits: 650 + 340 + 2,500 + 5,000 + 1,850 + 15,000 + 649 = ₹25,989 (`2598900` paise)
  - Net Cash Flow: ₹86,200 - ₹25,989 = +₹60,211 (`6021100` paise)
  - Closing Balance: ₹1,00,000 + ₹60,211 = ₹1,60,211 (`16021100` paise)
  - **Discrepancy: ₹0.00 (Status: MATCHED)**

---

## 3. Synthetic Benchmark Generator
For high-volume stress testing (100 to 50,000 transactions), the performance test suite utilizes `generateBenchmarkTransactions(count)`:
- Algorithmic distribution: 10% credits (salary, deposits), 90% debits (merchants, bills).
- Incremental timestamps: 1-minute steps starting from `2026-01-01`.
- Integer paise values: `(i % 500 + 1) * 1000` paise (₹10 to ₹500 range).
- Output: Exact integer summation benchmarked against double-entry reconciliation formulas.

---

## 4. Test Data Sanitation Checklist
When contributing new statement fixtures:
- [x] Replace all real names with fictional identities (e.g. Aditi Rao, Rajesh Kumar).
- [x] Mask account numbers to `XXXX-XXXX-1234`.
- [x] Replace phone numbers and UPI VPAs with non-routable handles (`merchant@bank`).
- [x] Verify mathematical reconciliation: $\text{Opening} + \sum \text{Credits} - \sum \text{Debits} = \text{Closing}$.
