# Banklytics — Bank Statement Analyzer (MERN)

Banklytics is a personal-finance web application that imports bank statements (PDF and CSV), extracts and normalizes transactions, validates statement totals, and presents income, spending, balance, and category analytics.

## Documentation pack
- `docs/01-product-requirements.md` — product scope, user stories, acceptance criteria
- `docs/02-architecture.md` — system architecture and processing flow
- `docs/03-database-schema.md` — MongoDB collections and indexes
- `docs/04-api-specification.md` — REST API contract
- `docs/05-statement-parsing.md` — PDF/CSV ingestion and normalization
- `docs/06-financial-calculations.md` — calculation rules and examples
- `docs/07-frontend-guide.md` — React pages and UI structure
- `docs/08-security-privacy.md` — security and privacy requirements
- `docs/09-testing-plan.md` — test strategy and sample cases
- `docs/10-development-roadmap.md` — phased implementation plan
- `docs/11-environment-setup.md` — local development setup
- `docs/12-glossary-and-decisions.md` — terminology and important product decisions

## Recommended implementation order
1. Set up the MERN app and authentication.
2. Build CSV import first; it is easier to test than PDF parsing.
3. Build a normalized transaction model and deterministic calculation engine.
4. Add PDF text extraction for supported statement layouts.
5. Add a review-and-correct step before saving imported transactions.
6. Build analytics only after totals reconcile with the statement.

## Important
This is a planning pack, not a guarantee that every bank statement format will parse automatically. PDF layouts vary. Start with a small, explicitly supported set of bank formats and show users a preview when extraction is uncertain. Never treat transfers between a user's own accounts as income or expenses by default.
