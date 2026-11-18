# 02 — System Architecture

## 1. Stack
- Frontend: React, Vite, React Router, Tailwind CSS, Recharts
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Authentication: JWT in secure, HttpOnly cookies (or another deliberately selected secure session strategy)
- Upload handling: Multer with strict limits
- CSV parsing: `csv-parse` or equivalent
- PDF extraction: `pdfjs-dist` or equivalent
- OCR: optional later phase, e.g. Tesseract.js
- Validation: Zod or Joi
- Tests: Vitest/Jest, Supertest, and parser fixtures

Pin compatible package versions after checking current package documentation.

## 2. High-level components
```text
Browser (React)
   |
   | HTTPS / JSON / multipart upload
   v
Express API
   |-- Authentication & authorization
   |-- Upload validation
   |-- Import job orchestration
   |-- CSV parser
   |-- PDF text extractor
   |-- Bank-layout adapters
   |-- Transaction normalizer
   |-- Reconciliation & calculation service
   |
   +------ MongoDB
   |
   +------ Private temporary file storage
```

## 3. Processing pipeline
1. Authenticate request.
2. Verify user ownership and upload limits.
3. Validate extension, MIME type, file signature, and file size.
4. Calculate SHA-256 file hash.
5. Store temporarily outside the public web root.
6. Extract raw rows/text.
7. Select a known bank/layout adapter or request manual column mapping.
8. Normalize candidate transactions.
9. Validate date, amount, debit/credit direction, and balance fields.
10. Run duplicate detection and reconciliation checks.
11. Return preview with warnings.
12. On user confirmation, persist statement and transactions in a database transaction where supported.
13. Delete temporary source file unless the user explicitly opts into secure retention.
14. Recompute dashboard data from persisted normalized transactions.

## 4. Suggested backend modules
```text
server/src/
  config/
  middleware/
    auth.js
    errorHandler.js
    upload.js
  modules/
    auth/
    statements/
    transactions/
    analytics/
  parsers/
    csv/
    pdf/
    adapters/
      genericCsv.adapter.js
      bankA.adapter.js
  services/
    normalizeTransaction.js
    reconcileStatement.js
    calculateAnalytics.js
    detectDuplicates.js
  models/
  utils/
  app.js
  server.js
```

## 5. Suggested frontend structure
```text
client/src/
  app/
  components/
    charts/
    layout/
    transactions/
    upload/
  pages/
    Login.jsx
    Register.jsx
    Dashboard.jsx
    UploadStatement.jsx
    ImportReview.jsx
    Transactions.jsx
    StatementDetails.jsx
    Settings.jsx
  services/
  hooks/
  utils/
```

## 6. Design principles
- Keep parsing separate from financial calculations.
- Keep bank-specific logic in adapters, not scattered across routes.
- Treat extracted data as untrusted until validated and reviewed.
- Use integer minor units (paise) or a decimal library for money; avoid floating-point arithmetic for financial totals.
- Recalculate totals from canonical transactions; do not trust client-supplied totals.
- Make import operations idempotent where possible.
- Use background jobs if PDF/OCR processing becomes slow; do not add a queue until needed.
