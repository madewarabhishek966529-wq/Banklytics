import crypto from 'crypto';
import path from 'path';
import { Statement } from '../../models/Statement.js';
import { Transaction } from '../../models/Transaction.js';
import { parseCSV } from '../../parsers/csv/csvParser.js';
import { parsePDF } from '../../parsers/pdf/pdfParser.js';
import { parseExcel } from '../../parsers/excel/excelParser.js';
import { parseWithOCR } from '../../parsers/ocr/ocrParser.js';
import { reconcileStatement } from '../../services/reconcileStatement.js';
import { normalizeTransaction } from '../../services/normalizeTransaction.js';

/**
 * POST /api/v1/statements/preview
 * Analyzes uploaded statement (PDF, CSV, Excel, Image OCR) and returns preview.
 */
export async function previewStatement(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'FILE_REQUIRED',
          message: 'Please provide a bank statement file (PDF, CSV, or Excel)',
        },
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(originalname).toLowerCase();

    // Check if user has already imported this file
    const existingStatement = await Statement.findOne({
      userId: req.user._id,
      fileHash,
    });

    const isDuplicate = !!existingStatement;
    let parsedResult;
    let fileType = 'CSV';

    if (ext === '.xlsx' || ext === '.xls') {
      fileType = 'EXCEL';
      parsedResult = await parseExcel(buffer);
    } else if (ext === '.pdf' || mimetype.includes('pdf')) {
      fileType = 'PDF';
      parsedResult = await parsePDF(buffer);
      // Fallback to OCR if PDF is an image-based scanned file
      if (parsedResult.isScanned && buffer.length > 0) {
        try {
          const ocrRes = await parseWithOCR(buffer);
          if (ocrRes.transactions?.length > 0) {
            parsedResult.transactions = ocrRes.transactions;
            parsedResult.isScanned = false;
            parsedResult.warnings.push('Processed with local Tesseract OCR engine.');
          }
        } catch (ocrErr) {
          // keep original scanned warning
        }
      }
    } else if (['.png', '.jpg', '.jpeg', '.tiff'].includes(ext)) {
      fileType = 'IMAGE_OCR';
      const ocrRes = await parseWithOCR(buffer);
      parsedResult = {
        transactions: ocrRes.transactions,
        rejectedRows: [],
        warnings: ['Scanned image parsed via local Tesseract OCR. Review transactions carefully.'],
        metadata: ocrRes.metadata,
        bankName: 'Scanned Statement',
      };
    } else {
      fileType = 'CSV';
      parsedResult = parseCSV(buffer);
    }

    const { transactions, rejectedRows = [], warnings = [], metadata = {}, bankName } = parsedResult;

    if (isDuplicate) {
      const importedDate = existingStatement.createdAt
        ? new Date(existingStatement.createdAt).toLocaleDateString()
        : 'previously';
      warnings.unshift(
        `Notice: A statement with this identical file hash was already imported on ${importedDate}. Duplicate transactions may be flagged.`
      );
    }

    // Check existing transactions for fingerprint collision
    if (transactions.length > 0) {
      const fingerprints = transactions.map((t) => t.fingerprint);
      const existingTxns = await Transaction.find({
        userId: req.user._id,
        fingerprint: { $in: fingerprints },
      }).select('fingerprint');

      const existingFingerprints = new Set(existingTxns.map((t) => t.fingerprint));
      for (const t of transactions) {
        if (existingFingerprints.has(t.fingerprint)) {
          t.isPossibleDuplicate = true;
        }
      }
    }

    // Calculate period start and end
    let periodStart = null;
    let periodEnd = null;
    if (transactions.length > 0) {
      const dates = transactions
        .map((t) => new Date(t.transactionDate))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => a - b);
      if (dates.length > 0) {
        periodStart = dates[0];
        periodEnd = dates[dates.length - 1];
      }
    }

    // Run reconciliation check
    const reconciliation = reconcileStatement({
      transactions,
      openingBalancePaise: metadata.openingBalancePaise,
      closingBalancePaise: metadata.closingBalancePaise,
    });

    return res.json({
      success: true,
      preview: {
        originalFileName: originalname,
        fileHash,
        fileType,
        bankName: bankName || 'Standard Bank',
        isDuplicate,
        periodStart,
        periodEnd,
        reconciliation,
        warnings,
        metadata,
        rejectedRows,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/statements/confirm
 * Persists user-confirmed statement and transactions.
 */
export async function confirmStatement(req, res, next) {
  try {
    const {
      originalFileName,
      fileHash,
      fileType,
      bankName,
      accountLabel,
      openingBalancePaise,
      closingBalancePaise,
      periodStart,
      periodEnd,
      transactions = [],
      warnings = [],
    } = req.body;

    if (!originalFileName || !fileHash || !fileType) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required statement attributes',
        },
      });
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_TRANSACTIONS',
          message: 'Cannot import a statement with zero valid transactions',
        },
      });
    }

    const reconciliation = reconcileStatement({
      transactions,
      openingBalancePaise,
      closingBalancePaise,
    });

    const statement = await Statement.create({
      userId: req.user._id,
      originalFileName,
      fileHash,
      fileType,
      bankName: bankName || 'Standard Bank',
      accountLabel: accountLabel || 'Primary Account',
      currency: 'INR',
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      openingBalancePaise,
      closingBalancePaise,
      declaredTotalCreditsPaise: reconciliation.totalCreditsPaise,
      declaredTotalDebitsPaise: reconciliation.totalDebitsPaise,
      status: reconciliation.isBalanced ? 'COMPLETED' : 'NEEDS_REVIEW',
      warnings: warnings.concat(reconciliation.notes),
    });

    const recordsToInsert = transactions.map((t, idx) => {
      const norm = normalizeTransaction({
        date: t.transactionDate,
        description: t.description,
        amountPaise: t.amountPaise,
        direction: t.direction,
        balancePaise: t.balancePaise,
        reference: t.reference,
        category: t.category,
        classification: t.classification,
        sourceRow: t.sourceRow || idx + 1,
        sourcePage: t.sourcePage || 1,
      });

      return {
        ...norm.transaction,
        userId: req.user._id,
        statementId: statement._id,
        isReviewed: true,
      };
    });

    await Transaction.insertMany(recordsToInsert);

    return res.status(201).json({
      success: true,
      statement,
      importedCount: recordsToInsert.length,
      reconciliation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/statements
 */
export async function getStatements(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    const [statements, total] = await Promise.all([
      Statement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Statement.countDocuments(query),
    ]);

    return res.json({
      success: true,
      statements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/statements/:id
 */
export async function getStatementById(req, res, next) {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!statement) {
      return res.status(404).json({
        error: {
          code: 'STATEMENT_NOT_FOUND',
          message: 'Statement not found or access denied',
        },
      });
    }

    const txns = await Transaction.find({
      statementId: statement._id,
      userId: req.user._id,
    });

    const reconciliation = reconcileStatement({
      transactions: txns,
      openingBalancePaise: statement.openingBalancePaise,
      closingBalancePaise: statement.closingBalancePaise,
    });

    return res.json({
      success: true,
      statement,
      reconciliation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/statements/:id
 */
export async function deleteStatement(req, res, next) {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!statement) {
      return res.status(404).json({
        error: {
          code: 'STATEMENT_NOT_FOUND',
          message: 'Statement not found or access denied',
        },
      });
    }

    const deleteResult = await Transaction.deleteMany({
      statementId: statement._id,
      userId: req.user._id,
    });

    await Statement.deleteOne({ _id: statement._id });

    return res.json({
      success: true,
      message: 'Statement and all associated transactions have been permanently deleted',
      deletedTransactionsCount: deleteResult.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/statements/:id/transactions
 */
export async function getStatementTransactions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const query = {
      statementId: req.params.id,
      userId: req.user._id,
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ transactionDate: 1, sourceRow: 1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);

    return res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}
