# 06 — Security & Privacy Audit Report

## 1. Security Architecture & Threat Model
Financial data is among the most sensitive personal information a user possesses. Banklytics is engineered with defense-in-depth principles:
- **Zero Cloud API Policy**: No financial payloads, descriptions, amounts, or prompt texts ever leave the local machine.
- **Tenant Isolation**: Every database read, update, and delete query is parameterized with the authenticated user ID (`req.user._id`).
- **Encrypted & Hashed Secrets**: Passwords are saved exclusively as bcrypt hashes (salt rounds: 10).

---

## 2. Vulnerability Assessment & Mitigation Matrix

### 2.1 Insecure Direct Object References (IDOR)
- **Vulnerability**: An attacker changes a URL parameter (e.g. `DELETE /statements/12345` or `PATCH /transactions/98765`) to tamper with another user's financial ledger.
- **Mitigation**: All database operations query `{ _id: targetId, userId: req.user._id }`. If the record belongs to another user, `findOne` returns null and the API returns `404 Not Found`.
- **Test Evidence**: Automated tests `SEC-03` and `SEC-04` verify that User B cannot read, modify, or delete records belonging to User A.

### 2.2 CSV Formula Injection (Spreadsheet Execution)
- **Vulnerability**: A transaction with description `=cmd|' /C calc'!A0` or `@SUM(...)` could execute arbitrary code when the user opens the exported CSV in Microsoft Excel or LibreOffice Calc.
- **Mitigation**: The `exportTransactionsCSV` controller runs `sanitizeCSVCell()` on every string. If the value begins with `=`, `+`, `-`, `@`, `\t`, or `\r`, it is prepended with a single quote `'` to force spreadsheet engines to treat it as a literal string.
- **Test Evidence**: Automated test `SEC-05` confirms formula neutralization across exported cells.

### 2.3 Authentication Bypass & Token Security
- **Vulnerability**: Unauthenticated users or expired tokens accessing protected statements and analytics.
- **Mitigation**: The `authenticate` middleware strictly verifies JWT signatures. If absent or invalid, it returns `401 UNAUTHORIZED`.
- **Test Evidence**: Automated tests `SEC-01` and `SEC-02` confirm 100% rejection of unauthorized requests.

### 2.4 File Upload & Path Traversal
- **Vulnerability**: Malicious files with double extensions or directory traversal characters (e.g. `../../etc/passwd`).
- **Mitigation**: Multer disk storage stores uploads in an isolated temporary directory with randomly generated hexadecimal filenames. Only PDF, CSV, and XLSX MIME types and extensions are accepted.

### 2.5 Data Purge & Right to Be Forgotten
- **Requirement**: Users must be able to delete individual statements or their entire account, including all derived transactions.
- **Implementation**: `DELETE /api/v1/auth/account` triggers a complete cascade:
  1. `Transaction.deleteMany({ userId })`
  2. `Statement.deleteMany({ userId })`
  3. `User.deleteOne({ _id: userId })`
  4. Session cookie cleared.
- **Test Evidence**: Automated test `SEC-07` confirms zero residual data across all collections.

---

## 3. Security Audit Verdict
The security posture of Banklytics meets high standard production requirements for local-first financial applications. No high or critical vulnerabilities were detected.
