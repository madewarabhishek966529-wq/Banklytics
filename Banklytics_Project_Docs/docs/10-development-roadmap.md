# 10 — Development Roadmap

## Phase 0: Project foundation
- Create Git repository and client/server workspaces.
- Configure environment variables and linting.
- Connect MongoDB.
- Add centralized error handling.
- Add authentication and protected routes.

**Exit criteria:** user can register, log in, and access only their own protected data.

## Phase 1: CSV import MVP
- Upload validation with Multer.
- CSV header detection and manual column mapping.
- Transaction normalization.
- Import preview and row-level errors.
- Review and confirm workflow.
- Persist statement and transactions.

**Exit criteria:** one documented CSV layout imports correctly and can be reconciled.

## Phase 2: Calculation engine
- Credit/debit totals.
- Monthly summaries.
- Reconciliation checks.
- Category rules and manual correction.
- Duplicate detection.

**Exit criteria:** automated tests cover core financial rules.

## Phase 3: Dashboard
- Summary cards.
- Monthly chart.
- Category chart.
- Transaction list, search, filters, pagination.
- Statement history and deletion.

**Exit criteria:** dashboard metrics match the underlying transaction records.

## Phase 4: PDF support
- Text extraction.
- First bank/layout adapter.
- Multi-page statements.
- Wrapped narration handling.
- Review warnings and parser fixtures.

**Exit criteria:** supported sample PDFs parse and reconcile; unsupported layouts fail safely.

## Phase 5: Hardening
- Upload limits and rate limits.
- Ownership/security tests.
- Data retention and deletion.
- Monitoring and sanitized logs.
- Deployment and backup strategy.

## Phase 6: Enhancements
- More bank adapters.
- OCR for scanned PDFs.
- AI category suggestions with user confirmation.
- Export reports.
- Multi-statement consolidated analytics and internal transfer matching.

## Suggested first 7 tasks
1. Initialize Vite React client and Express server.
2. Add MongoDB connection and User model.
3. Implement register/login and authorization middleware.
4. Build a CSV parser service with a small sample fixture.
5. Implement preview endpoint.
6. Build import review table.
7. Implement paise-based calculations and reconciliation tests.
