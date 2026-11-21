# 04 — Document Parsing Accuracy & Extraction Testing

## 1. Scope
Banklytics supports automated parsing of bank and UPI statements across CSV, Excel (.xlsx/.xls), and PDF formats. This document audits parsing accuracy, column mapping heuristics, delimiter detection, and OCR fallback mechanisms.

---

## 2. Supported Formats & Adapter Architecture

| Format | Library / Tool | Primary Heuristics | Fallback / Recovery |
| :--- | :--- | :--- | :--- |
| **CSV** | `csv-parse/sync` | Column alias mapping, BOM stripping, delimiter sniffing | User column mapping dialog |
| **Excel (.xlsx)** | `ExcelJS` | Sheet scanning, cell type coercion, header row detection | Rejection of empty sheets |
| **Text PDF** | `pdf-parse` | Coordinate/regex line extraction, bank header signatures | Warning on low confidence |
| **Scanned PDF** | `tesseract.js` | Image extraction, local OCR engine | Manual user review flag |

---

## 3. Bank Statement Layout Adapters

The system provides specialized signature detection for major Indian banking institutions:

1. **HDFC Bank**:
   - Signature: "HDFC BANK", "Narration", "Chq/Ref Number", "Withdrawal Amount", "Deposit Amount".
   - Balance markers: "Opening Balance", "Closing Balance".
2. **State Bank of India (SBI)**:
   - Signature: "STATE BANK OF INDIA", "Txn Date", "Description", "Ref No./Cheque No.", "Debit", "Credit".
3. **ICICI Bank**:
   - Signature: "ICICI BANK", "Transaction Remarks", "Withdrawal (Dr)", "Deposit (Cr)", "Balance".
4. **Axis Bank**:
   - Signature: "AXIS BANK", "Tran Date", "Particulars", "Debit", "Credit", "Net Balance".
5. **Kotak Mahindra Bank**:
   - Signature: "KOTAK MAHINDRA", "Transaction Description", "Dr / Cr", "Amount", "Balance".

---

## 4. Column Alias Normalization Engine

The parser uses canonical alias dictionaries to map arbitrary column headers:

```javascript
const COLUMN_ALIASES = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date'],
  description: ['narration', 'description', 'particulars', 'remarks', 'details'],
  debit: ['debit', 'withdrawal', 'dr', 'withdrawals', 'dr amount'],
  credit: ['credit', 'deposit', 'cr', 'deposits', 'cr amount'],
  amount: ['amount', 'txn amount', 'transaction amount', 'net amount'],
  type: ['type', 'cr/dr', 'txn type'],
  balance: ['balance', 'closing balance', 'running balance', 'bal'],
  reference: ['ref', 'reference', 'chq / ref no', 'utr', 'cheque no']
};
```

---

## 5. Parser Test Scenarios & Results

| Test ID | Test Scenario | Input Conditions | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P-CSV-01** | Standard HDFC CSV | Comma-delimited, header row, 2 txns, opening/closing balance | Extracted 2 transactions, balance matched | **PASS** |
| **P-CSV-02** | UTF-8 BOM Handling | Byte Order Mark `\uFEFF` prepended to CSV | Stripped BOM, parsed cleanly | **PASS** |
| **P-CSV-03** | Empty CSV File | 0 bytes or whitespace-only CSV | Throws `CSV file is empty` exception | **PASS** |
| **P-CSV-04** | Missing Required Headers | File with arbitrary headers (`Col1`, `Col2`) | Rejects with descriptive error message | **PASS** |
| **P-CSV-05** | Signed Amount Column | Single amount column with negative numbers or CR/DR | Correctly identifies Debit/Credit direction | **PASS** |
| **P-XLS-01** | Multi-column Excel | `.xlsx` sheet with formatted numbers and dates | Extracted 2 rows, computed opening/closing | **PASS** |
| **P-PDF-01** | Text-based Statement | Digital bank statement with regex tabular lines | Parsed narration, date, amount, bank name | **PASS** |
| **P-PDF-02** | Scanned / Empty PDF | PDF with text length < 50 characters | Flagged `isScanned: true`, warning returned | **PASS** |
| **P-OCR-01** | Local OCR Ingestion | Scanned image buffer dispatched to Tesseract | OCR extracted text blocks without cloud calls | **PASS** |

---

## 6. Parsing Confidence & User Review Workflow
If parsing confidence for any line falls below 85% (e.g. uncertain date format or missing description), the statement status is flagged as `NEEDS_REVIEW`. The interactive preview stepper requires user confirmation before database persistence.
