# 04 — REST API Specification

Base path: `/api/v1`. All protected endpoints require authentication. Return consistent JSON errors.

## Authentication
- `POST /auth/register` — `{ name, email, password }`
- `POST /auth/login` — `{ email, password }`
- `POST /auth/logout`
- `GET /auth/me`

## Statements
- `POST /statements/preview` — multipart field `file`; parses but does not permanently import transactions.
- `POST /statements/confirm` — accepts a preview/import token and user-confirmed corrections; persists the import.
- `GET /statements` — paginated statements for current user.
- `GET /statements/:id` — statement metadata and reconciliation summary.
- `DELETE /statements/:id` — delete statement and its transactions.
- `GET /statements/:id/transactions` — paginated transactions for that statement.

## Transactions
- `GET /transactions` — query parameters: `from`, `to`, `direction`, `category`, `classification`, `q`, `page`, `limit`, `sort`.
- `PATCH /transactions/:id` — edit permitted fields; ownership required.
- `DELETE /transactions/:id` — delete one transaction.

## Analytics
- `GET /analytics/summary?from=&to=`
- `GET /analytics/monthly?from=&to=`
- `GET /analytics/categories?from=&to=&direction=DEBIT`
- `GET /analytics/top-transactions?from=&to=&direction=DEBIT&limit=10`

## Example summary response
```json
{
  "currency": "INR",
  "range": { "from": "2026-01-01", "to": "2026-01-31" },
  "creditsPaise": 2500000,
  "debitsPaise": 850000,
  "netCashFlowPaise": 1650000,
  "transactionCount": 42,
  "reconciliation": {
    "status": "MATCHED",
    "expectedClosingBalancePaise": 1234500,
    "observedClosingBalancePaise": 1234500
  }
}
```

## Error format
```json
{
  "error": {
    "code": "INVALID_STATEMENT",
    "message": "The file could not be parsed.",
    "details": []
  }
}
```

## API rules
- Validate all input on the server.
- Apply pagination limits (for example, default 25, maximum 100).
- Use allowlists for sortable fields and editable properties.
- Do not expose local file paths, stack traces, raw parser internals, or full account identifiers.
- Use request IDs for diagnostics without logging financial payloads.
