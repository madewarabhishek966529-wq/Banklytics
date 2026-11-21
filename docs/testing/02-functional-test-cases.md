# 02 — Functional Test Cases & Verification Matrix

## 1. Overview
This specification details all functional test cases covering User Authentication, Statement Ingestion, Transaction Management, Dashboard Analytics, and Local AI Assistance.

---

## 2. Authentication & Authorization Test Cases

| Test ID | Feature | Test Scenario | Input Data | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Registration | New user registration | Valid name, unique email, password ≥ 6 chars | HTTP 201 Created, JWT token returned, user profile created | **PASS** |
| **AUTH-02** | Registration | Duplicate email registration | Already registered email | HTTP 409 Conflict, code `EMAIL_ALREADY_EXISTS` | **PASS** |
| **AUTH-03** | Registration | Weak password validation | Password < 6 chars | HTTP 400 Bad Request, Zod validation error | **PASS** |
| **AUTH-04** | Login | Valid login credentials | Correct email and password | HTTP 200 OK, JWT token issued, HttpOnly cookie set | **PASS** |
| **AUTH-05** | Login | Invalid password | Valid email, wrong password | HTTP 401 Unauthorized, code `INVALID_CREDENTIALS` | **PASS** |
| **AUTH-06** | Login | Non-existent user email | Unknown email address | HTTP 401 Unauthorized, code `INVALID_CREDENTIALS` | **PASS** |
| **AUTH-07** | Demo Access | 1-Click Demo Login | `POST /auth/demo` | HTTP 200 OK, demo user session token issued | **PASS** |
| **AUTH-08** | Change Password | Valid password update | Correct current password, new valid password | HTTP 200 OK, password hash updated in store | **PASS** |
| **AUTH-09** | Change Password | Invalid current password | Incorrect current password | HTTP 400 Bad Request, code `INVALID_CREDENTIALS` | **PASS** |
| **AUTH-10** | Account Purge | Permanent account deletion | Authenticated delete request | HTTP 200 OK, user profile + all statements + txns deleted | **PASS** |
| **AUTH-11** | Auth Guard | Access without token | Missing `Authorization` header and cookie | HTTP 401 Unauthorized, code `UNAUTHORIZED` | **PASS** |

---

## 3. Statement Upload & Processing Test Cases

| Test ID | Feature | Test Scenario | Input Data | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **STMT-01** | CSV Preview | Preview standard HDFC/SBI CSV | CSV with Date, Narration, Withdrawal, Deposit | HTTP 200 OK, extracted preview list, reconciliation | **PASS** |
| **STMT-02** | Excel Preview | Preview `.xlsx` bank statement | Multi-row Excel spreadsheet | HTTP 200 OK, sheet rows extracted, balances inferred | **PASS** |
| **STMT-03** | Text PDF | Preview text-based PDF statement | Digital PDF statement with tabular rows | HTTP 200 OK, lines parsed, bank identified | **PASS** |
| **STMT-04** | Scanned PDF | Detection of scanned/empty PDF | Image-only PDF (< 50 chars text) | Scanned flag detected, OCR recommendation displayed | **PASS** |
| **STMT-05** | Confirm Import | Confirming previewed statement | Valid statement metadata and transactions | HTTP 201 Created, statement & txns saved | **PASS** |
| **STMT-06** | Deduplication | Re-uploading identical statement | Same file hash or transaction fingerprints | Deduplication warning / duplicate rejected | **PASS** |
| **STMT-07** | Delete Statement | Deleting statement with cascade | Statement ID of authenticated user | HTTP 200 OK, statement and related txns deleted | **PASS** |

---

## 4. Transaction Management Test Cases

| Test ID | Feature | Test Scenario | Input Data | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TXN-01** | Manual Create | Adding manual transaction | Date, Description, Direction, AmountPaise | HTTP 201 Created, transaction created with confidence 1.0 | **PASS** |
| **TXN-02** | Edit Transaction | Editing category and description | Valid transaction ID, updated fields | HTTP 200 OK, fields updated, `isReviewed: true` | **PASS** |
| **TXN-03** | Delete Transaction | Deleting single transaction | Valid transaction ID | HTTP 200 OK, transaction removed from database | **PASS** |
| **TXN-04** | Search & Filter | Filter by category and date range | `from=2026-11-01&to=2026-11-30&category=Food` | HTTP 200 OK, matching records returned | **PASS** |
| **TXN-05** | Sorting | Sort by amount descending | `sort=amount_desc` | HTTP 200 OK, transactions sorted highest amount first | **PASS** |
| **TXN-06** | Pagination | Paginated retrieval | `page=2&limit=25` | HTTP 200 OK, page 2 items, total count, page count | **PASS** |
| **TXN-07** | CSV Export | Export transactions to CSV | `GET /transactions/export` | HTTP 200 OK, `text/csv`, sanitized against injection | **PASS** |

---

## 5. Analytics & Financial Intelligence Test Cases

| Test ID | Feature | Test Scenario | Input Data | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ANL-01** | Summary Totals | Calculating credits, debits, net flow | Statement with credits & debits | Correct integer paise sums, currency: INR | **PASS** |
| **ANL-02** | Monthly Trends | Aggregating monthly cash flow | Multiple months of transactions | Monthly breakdown objects with credit/debit totals | **PASS** |
| **ANL-03** | Category Distribution | Aggregating debit spend by category | Categorized transactions | Grouped category totals and spend percentages | **PASS** |
| **ANL-04** | Top Transactions | Fetching largest expenses | `direction=DEBIT&limit=5` | Top 5 highest debit transactions | **PASS** |
| **ANL-05** | Merchant Breakdown | Identifying merchant spend | UPI / POS descriptions (Swiggy, Amazon) | Aggregated spend and transaction counts per merchant | **PASS** |
| **ANL-06** | Transfer Isolation | Isolating P2P transfers | UPI VPAs, NEFT, IMPS | Excluded from pure consumption expenditure | **PASS** |
| **ANL-07** | Anomaly Detection | Flagging sudden large spends | Debit > 1.7x average & > ₹5,000 | Flagged as anomaly with reasons | **PASS** |
| **ANL-08** | PDF Report | Generating downloadable PDF report | Authenticated user analytics | HTTP 200 OK, `application/pdf` generated via PDFKit | **PASS** |
| **ANL-09** | Excel Report | Generating downloadable Excel report | Authenticated user analytics | HTTP 200 OK, `application/vnd...` via ExcelJS | **PASS** |
