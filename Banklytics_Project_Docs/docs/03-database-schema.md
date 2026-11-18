# 03 — MongoDB Data Model

Use Mongoose schemas with validation. Example shapes below are conceptual; adapt types and indexes to the chosen implementation.

## User
```js
{
  name: String,
  email: String,          // unique, normalized lowercase
  passwordHash: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Statement
```js
{
  userId: ObjectId,
  originalFileName: String,
  fileHash: String,       // SHA-256; unique per user where appropriate
  fileType: "PDF" | "CSV",
  bankName: String,       // optional / user-confirmed
  accountLabel: String,   // masked label only; do not store full account number
  currency: "INR",
  periodStart: Date,
  periodEnd: Date,
  openingBalancePaise: Number,
  closingBalancePaise: Number,
  declaredTotalCreditsPaise: Number,
  declaredTotalDebitsPaise: Number,
  status: "PARSING" | "NEEDS_REVIEW" | "COMPLETED" | "FAILED",
  parserVersion: String,
  warnings: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Transaction
```js
{
  userId: ObjectId,
  statementId: ObjectId,
  transactionDate: Date,
  description: String,
  reference: String,       // redact or minimize sensitive references
  amountPaise: Number,     // positive integer
  direction: "CREDIT" | "DEBIT",
  balancePaise: Number,    // optional running balance
  category: String,
  classification: "INCOME" | "EXPENSE" | "TRANSFER" | "REFUND" | "OTHER",
  counterparty: String,    // optional; avoid unnecessary personal data
  fingerprint: String,
  confidence: Number,      // parser confidence, not financial certainty
  isReviewed: Boolean,
  sourcePage: Number,
  sourceRow: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Recommended indexes
- User: unique index on normalized email.
- Statement: `{ userId: 1, createdAt: -1 }`.
- Statement duplicate: `{ userId: 1, fileHash: 1 }` unique if policy allows.
- Transaction list: `{ userId: 1, transactionDate: -1 }`.
- Statement transactions: `{ userId: 1, statementId: 1, transactionDate: 1 }`.
- Fingerprint duplicate check: `{ userId: 1, fingerprint: 1 }`.

## Data ownership
Every query for a statement or transaction must include the authenticated `userId`. Never trust a `userId` supplied by the browser. When fetching a statement by ID, query `{ _id: statementId, userId: req.user.id }`.

## Money representation
For INR, store paise as integer values (₹123.45 => 12345). Validate safe integer range. Format to rupees only at the API/UI boundary. If using Decimal128, use decimal-safe operations consistently instead.
