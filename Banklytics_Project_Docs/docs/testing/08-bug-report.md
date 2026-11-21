# 08 — Bug Tracking, Audit Log & Resolutions

## 1. Summary of Discovered & Resolved Issues
During comprehensive testing and quality assurance audits, 7 notable issues across authentication, parsing, arithmetic, and concurrency were identified and resolved.

---

## 2. Bug Registry & Resolution Details

### BUG-01 (P0 — Security): Default User Fallback in Authentication Middleware
- **Severity**: P0 (High / Security)
- **Component**: `server/src/middleware/auth.js`
- **Symptom**: Missing or invalid tokens previously defaulted to `DEFAULT_USER` instead of returning HTTP 401. This caused unauthorized requests to succeed and compromised multi-tenant data isolation.
- **Root Cause**: Temporary developer convenience fallback left in place.
- **Fix**: Replaced fallback with strict `401 UNAUTHORIZED` and `401 INVALID_TOKEN` responses. Added a dedicated `POST /auth/demo` endpoint for 1-click test drive access without compromising security.
- **Verification**: Verified by `SEC-01`, `SEC-02`, and `SEC-03`. Status: **RESOLVED**.

---

### BUG-02 (P1 — Financial Integrity): Paise Parsing Dot Replacement Bug
- **Severity**: P1 (Critical / Financial Calculation)
- **Component**: `server/src/utils/money.js`
- **Symptom**: `parseRupeesToPaise('123.45')` returned `1234500` instead of `12345`.
- **Root Cause**: Regular expression `/[₹Rs.\s]/gi` removed the decimal point character `.` because of the unescaped dot inside character class.
- **Fix**: Updated sanitization regex to `.replace(/Rs\./gi, '').replace(/[₹Rs\s]/gi, '')`.
- **Verification**: Verified by `money.test.js` and `calculationsEdgeCases.test.js`. Status: **RESOLVED**.

---

### BUG-03 (P1 — Architecture): External MongoDB Cloud Download Block on Windows
- **Severity**: P1 (Major / Local-First Policy)
- **Component**: `server/src/server.js` & MongoDB binaries
- **Symptom**: Attempting to launch embedded MongoDB downloaded a 500MB zip from `fastdl.mongodb.org`, which failed with HTTP 403 in offline / sandboxed environments.
- **Root Cause**: Hard dependency on external MongoDB binary violated the Strict Zero API Key and Offline-first policy.
- **Fix**: Architected `server/src/data/store.js`, an atomic, persistent JSON datastore supporting Mongoose query syntax, chaining (`sort`, `skip`, `limit`, `populate`), and instant startup.
- **Verification**: Application boots in 300ms without internet connection or external services. Status: **RESOLVED**.

---

### BUG-04 (P2 — Parsing): Date toISOString on Invalid Date Object Crash
- **Severity**: P2 (Medium / Stability)
- **Component**: `server/src/services/normalizeTransaction.js`
- **Symptom**: Unhandled `RangeError: Invalid time value` when calculating deduplication fingerprints on rows with malformed dates.
- **Root Cause**: Calling `.toISOString()` on an invalid `Date` instance.
- **Fix**: Guarded with `parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : 'nodate'`.
- **Verification**: Verified by `csvParser.test.js`. Status: **RESOLVED**.

---

### BUG-05 (P2 — Infrastructure): Port 5000 / 5173 Collision on Restarts
- **Severity**: P2 (Medium / Developer Experience)
- **Component**: `scripts/dev.js`
- **Symptom**: Restarting development servers resulted in `EADDRINUSE: 5000`.
- **Root Cause**: Orphaned background Node child processes keeping ports bound.
- **Fix**: Added Windows PowerShell and Unix socket killing routines in `scripts/dev.js` to clear ports 5000 and 5173 prior to spawning servers.
- **Verification**: Clean launches on `npm run dev`. Status: **RESOLVED**.

---

### BUG-06 (P2 — Security): CSV Formula Injection Risk on Export
- **Severity**: P2 (Medium / Security)
- **Component**: `server/src/modules/transactions/transactions.controller.js`
- **Symptom**: Exported CSV raw text retained characters (`=`, `+`, `-`, `@`) which could trigger formula execution when opened in Excel.
- **Fix**: Implemented `sanitizeCSVCell()` prepending `'` to neutralize formula triggers.
- **Verification**: Verified by `SEC-05`. Status: **RESOLVED**.

---

### BUG-07 (P3 — Missing Features): Missing Password Change & Account Deletion Endpoints
- **Severity**: P3 (Low / Completeness)
- **Component**: `server/src/modules/auth/`
- **Symptom**: Specification required `POST /auth/change-password` and `DELETE /auth/account`, which were unimplemented.
- **Fix**: Implemented full controllers and routes with cascade deletion across transactions and statements.
- **Verification**: Verified by `SEC-07` and `api.test.js`. Status: **RESOLVED**.
