# 05 — REST API Specification & Endpoint Verification

## 1. API Architecture
- **Base URL**: `/api/v1`
- **Content-Type**: `application/json; charset=utf-8` (or `multipart/form-data` for statement uploads)
- **Security Protocols**: JWT Bearer token header or secure HttpOnly cookie.
- **Error Standard**:
  ```json
  {
    "error": {
      "code": "ERROR_CODE_ENUM",
      "message": "Human-readable description of error.",
      "details": []
    }
  }
  ```

---

## 2. API Endpoint Verification Summary

| Method | Endpoint | Description | Auth Required | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | No | 201, 400, 409 |
| `POST` | `/auth/login` | Sign in with email and password | No | 200, 400, 401 |
| `POST` | `/auth/logout` | Clear session cookie | No | 200 |
| `POST` | `/auth/demo` | 1-Click instant demo session | No | 200 |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes | 200, 401 |
| `POST` | `/auth/change-password` | Update account password | Yes | 200, 400, 401 |
| `DELETE` | `/auth/account` | Permanently delete user & data | Yes | 200, 401 |
| `POST` | `/statements/preview` | Upload and preview statement | Yes | 200, 400, 401 |
| `POST` | `/statements/confirm` | Confirm and commit statement | Yes | 201, 400, 401 |
| `GET` | `/statements` | List statements (paginated) | Yes | 200, 401 |
| `GET` | `/statements/:id` | Get statement details | Yes | 200, 401, 404 |
| `DELETE` | `/statements/:id` | Cascade delete statement & txns | Yes | 200, 401, 404 |
| `GET` | `/statements/:id/transactions` | List txns for specific statement | Yes | 200, 401, 404 |
| `POST` | `/transactions` | Create manual transaction | Yes | 201, 400, 401 |
| `GET` | `/transactions` | Query, filter, paginate txns | Yes | 200, 401 |
| `PATCH` | `/transactions/:id` | Update transaction details | Yes | 200, 400, 401, 404 |
| `DELETE` | `/transactions/:id` | Delete individual transaction | Yes | 200, 401, 404 |
| `GET` | `/transactions/export` | Download sanitized CSV | Yes | 200, 401 |
| `GET` | `/analytics/summary` | Cash flow totals & reconciliation | Yes | 200, 401 |
| `GET` | `/analytics/monthly` | Monthly spend & income trend | Yes | 200, 401 |
| `GET` | `/analytics/categories` | Spending breakdown by category | Yes | 200, 401 |
| `GET` | `/analytics/top-transactions` | Largest debit/credit items | Yes | 200, 401 |
| `GET` | `/analytics/merchants` | Identified merchants & UPI handles | Yes | 200, 401 |
| `GET` | `/analytics/transfers` | Isolated P2P / self transfers | Yes | 200, 401 |
| `GET` | `/analytics/report/pdf` | Generate printable PDF report | Yes | 200, 401 |
| `GET` | `/analytics/report/excel` | Generate formatted Excel workbook | Yes | 200, 401 |
| `GET` | `/ai/status` | Check local Ollama status | Yes | 200, 401 |
| `POST` | `/ai/chat` | Chat with local financial analyst | Yes | 200, 400, 401 |
| `GET` | `/ai/insights` | Fetch automated financial tips | Yes | 200, 401 |

---

## 3. Request Validation & Status Codes Audited

### 3.1 Input Validation (Zod)
All endpoints enforce runtime schema parsing via Zod. Invalid payloads return status 400 with field-level diagnostic pointers:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      { "path": ["email"], "message": "Please enter a valid email address" },
      { "path": ["password"], "message": "Password must be at least 6 characters" }
    ]
  }
}
```

### 3.2 Pagination Constraints
Pagination parameters (`page` and `limit`) are strictly clamped:
- Default page: `1`
- Default limit: `25`
- Max limit: `100` (prevents memory exhaustion or denial of service via `?limit=1000000`)
