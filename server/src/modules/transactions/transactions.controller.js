import { z } from 'zod';
import { Transaction } from '../../models/Transaction.js';
import { paiseToRupees } from '../../utils/money.js';

const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  classification: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'REFUND', 'OTHER']).optional(),
  direction: z.enum(['CREDIT', 'DEBIT']).optional(),
  amountPaise: z.number().int().positive().optional(),
  reference: z.string().optional(),
  counterparty: z.string().optional(),
  isReviewed: z.boolean().optional(),
});

/**
 * GET /api/v1/transactions
 * Filterable, searchable, paginated transactions for current user.
 */
export async function getTransactions(req, res, next) {
  try {
    const { from, to, direction, category, classification, q, sort = 'date_desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    if (from || to) {
      query.transactionDate = {};
      if (from) {
        query.transactionDate.$gte = new Date(from);
      }
      if (to) {
        // Set to end of the day if just a date string
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = toDate;
      }
    }

    if (direction) {
      query.direction = direction.toUpperCase();
    }

    if (category) {
      query.category = category;
    }

    if (classification) {
      query.classification = classification.toUpperCase();
    }

    if (q) {
      const escaped = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.$or = [
        { description: { $regex: escaped, $options: 'i' } },
        { reference: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ];
    }

    // Determine sort
    let sortObj = { transactionDate: -1, _id: -1 };
    if (sort === 'date_asc') sortObj = { transactionDate: 1, _id: 1 };
    else if (sort === 'amount_desc') sortObj = { amountPaise: -1, transactionDate: -1 };
    else if (sort === 'amount_asc') sortObj = { amountPaise: 1, transactionDate: -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortObj).skip(skip).limit(limit).populate('statementId', 'bankName accountLabel originalFileName'),
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

/**
 * PATCH /api/v1/transactions/:id
 * Updates allowed fields for a transaction.
 */
export async function updateTransaction(req, res, next) {
  try {
    const validated = updateTransactionSchema.parse(req.body);

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found or access denied',
        },
      });
    }

    Object.assign(transaction, validated, { isReviewed: true });
    await transaction.save();

    return res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/transactions/:id
 * Deletes a single transaction.
 */
export async function deleteTransaction(req, res, next) {
  try {
    const result = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found or access denied',
        },
      });
    }

    return res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/transactions/export
 * Exports transactions to CSV with formula injection prevention.
 */
export async function exportTransactionsCSV(req, res, next) {
  try {
    const { from, to, direction, category } = req.query;
    const query = { userId: req.user._id };

    if (from || to) {
      query.transactionDate = {};
      if (from) query.transactionDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = toDate;
      }
    }
    if (direction) query.direction = direction.toUpperCase();
    if (category) query.category = category;

    const transactions = await Transaction.find(query).sort({ transactionDate: -1 });

    // Neutralize formula injection: prepend single quote if starts with =, +, -, @
    function sanitizeCSVCell(str) {
      if (str === null || str === undefined) return '""';
      let text = String(str).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
      }
      return `"${text}"`;
    }

    const headers = ['Date', 'Description', 'Direction', 'Amount (INR)', 'Category', 'Classification', 'Reference'];
    const rows = [headers.join(',')];

    for (const t of transactions) {
      const dateFormatted = t.transactionDate.toISOString().slice(0, 10);
      const row = [
        sanitizeCSVCell(dateFormatted),
        sanitizeCSVCell(t.description),
        sanitizeCSVCell(t.direction),
        sanitizeCSVCell(paiseToRupees(t.amountPaise).toFixed(2)),
        sanitizeCSVCell(t.category),
        sanitizeCSVCell(t.classification),
        sanitizeCSVCell(t.reference || ''),
      ];
      rows.push(row.join(','));
    }

    const csvOutput = rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="banklytics_transactions.csv"');
    return res.send(csvOutput);
  } catch (error) {
    next(error);
  }
}
