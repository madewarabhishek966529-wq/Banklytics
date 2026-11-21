# 01 — Testing Strategy & Quality Assurance Framework

## 1. Executive Summary
Banklytics is a privacy-first, local-first financial intelligence platform. Because it processes sensitive banking and UPI data without cloud APIs, data integrity, mathematical correctness, and strict tenant isolation are non-negotiable requirements.

This document defines the overarching Quality Assurance (QA) Strategy, testing levels, coverage goals, test environments, and automated CI/CD gating criteria.

---

## 2. Testing Objectives & Quality Goals
1. **Mathematical Accuracy**: Zero floating-point drift across all transactions, totals, and balances through integer paise arithmetic.
2. **Reconciliation Integrity**: Strict enforcement of the universal reconciliation equation:
   $$\text{Closing Balance} = \text{Opening Balance} + \sum \text{Credits} - \sum \text{Debits}$$
3. **Parser Reliability**: Robust ingestion of bank statements across PDF, CSV, and Excel formats without data loss or silent row dropping.
4. **Zero-Knowledge Privacy & Security**: Complete user data isolation (prevention of Insecure Direct Object References - IDOR), formula injection neutralization, and zero external network leaks (Zero API Key policy).
5. **High Performance**: Sub-second analytics execution over datasets ranging from 100 to 50,000+ transactions.

---

## 3. Testing Pyramid & Test Types

```
               ▲
              / \
             /   \      E2E & UI Acceptance (Playwright / Cypress)
            /-----\
           /       \     Integration & API Tests (Supertest + Express)
          /---------\
         /           \    Security & Parser Fixture Tests (Vitest)
        /-------------\
       /               \   Unit & Arithmetic Logic Tests (Vitest)
      /-----------------\
```

### 3.1 Unit Testing
- Focus: Individual pure functions, arithmetic helpers, parsers, and categorizers.
- Coverage Target: > 95% on `src/utils/money.js`, `src/services/reconcileStatement.js`, and `src/services/categorizeTransaction.js`.

### 3.2 Integration & API Testing
- Focus: Express router modules, middleware pipeline (`auth`, `upload`, error handling), and controller workflows.
- Verification: Status codes (200, 201, 400, 401, 404, 409, 500), schema validations via Zod, and database mutations.

### 3.3 Security & Penetration Testing
- Focus: Authentication bypass, JWT tampering, IDOR ownership validation, CSV formula injection (`=`, `+`, `-`, `@`), file upload validation, and XSS sanitization.

### 3.4 Parser Verification & Edge Cases
- Focus: Text PDF parser, scanned PDF OCR detection, CSV dialects (delimiters, UTF-8 BOM, Indian number grouping), and Excel (.xlsx) parsing.

### 3.5 Performance & Scalability Benchmarking
- Focus: Processing latency and memory consumption across 100, 1,000, 5,000, 10,000, and 50,000 transaction tiers.

---

## 4. Test Execution Matrix

| Test Suite | Runner | Command | Test Count | Target Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Complete Suite** | Vitest | `npm test` | 64 | < 5.0s |
| **Unit Tests** | Vitest | `npm run test:unit` | 19 | < 1.0s |
| **Integration Suite** | Vitest | `npm run test:integration` | 13 | < 1.5s |
| **Calculations & Math** | Vitest | `npm run test:calculations` | 20 | < 1.0s |
| **Parsers & Fixtures** | Vitest | `npm run test:parsers` | 10 | < 1.5s |
| **Security & Privacy** | Vitest | `npm run test:security` | 7 | < 1.0s |
| **Performance Benchmarks** | Vitest | `npm run test:performance` | 5 | < 1.0s |

---

## 5. Verification & Acceptance Criteria
- Every pull request and release candidate must pass 100% of automated tests.
- Zero arithmetic discrepancies allowed between raw records and computed summaries.
- No unhandled exceptions or stack traces exposed in API responses.
