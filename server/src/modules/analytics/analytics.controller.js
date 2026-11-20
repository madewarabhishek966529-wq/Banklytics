import { Transaction } from '../../models/Transaction.js';
import { sumPaise } from '../../utils/money.js';

function buildDateQuery(userId, from, to) {
  const query = { userId };
  if (from || to) {
    query.transactionDate = {};
    if (from) query.transactionDate.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.transactionDate.$lte = toDate;
    }
  }
  return query;
}

/**
 * GET /api/v1/analytics/summary
 */
export async function getSummary(req, res, next) {
  try {
    const { from, to } = req.query;
    const query = buildDateQuery(req.user._id, from, to);

    const transactions = await Transaction.find(query).select('amountPaise direction classification');

    const creditsList = [];
    const debitsList = [];
    let incomePaise = 0;
    let expensePaise = 0;
    let transferPaise = 0;
    let refundPaise = 0;

    for (const t of transactions) {
      const amt = t.amountPaise;
      if (t.direction === 'CREDIT') {
        creditsList.push(amt);
      } else {
        debitsList.push(amt);
      }

      if (t.classification === 'INCOME') incomePaise += amt;
      else if (t.classification === 'EXPENSE') expensePaise += amt;
      else if (t.classification === 'TRANSFER') transferPaise += amt;
      else if (t.classification === 'REFUND') refundPaise += amt;
    }

    const creditsPaise = sumPaise(creditsList);
    const debitsPaise = sumPaise(debitsList);
    const netCashFlowPaise = creditsPaise - debitsPaise;

    return res.json({
      success: true,
      currency: 'INR',
      range: { from: from || null, to: to || null },
      creditsPaise,
      debitsPaise,
      netCashFlowPaise,
      transactionCount: transactions.length,
      classificationBreakdown: {
        incomePaise,
        expensePaise,
        transferPaise,
        refundPaise,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analytics/monthly
 */
export async function getMonthlyTrends(req, res, next) {
  try {
    const { from, to } = req.query;
    const query = buildDateQuery(req.user._id, from, to);

    const transactions = await Transaction.find(query)
      .sort({ transactionDate: 1 })
      .select('transactionDate amountPaise direction');

    const monthlyMap = new Map();

    for (const t of transactions) {
      const date = new Date(t.transactionDate);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(yearMonth)) {
        monthlyMap.set(yearMonth, {
          month: yearMonth,
          creditsPaise: 0,
          debitsPaise: 0,
          netCashFlowPaise: 0,
          count: 0,
        });
      }

      const item = monthlyMap.get(yearMonth);
      item.count++;
      if (t.direction === 'CREDIT') {
        item.creditsPaise += t.amountPaise;
      } else {
        item.debitsPaise += t.amountPaise;
      }
      item.netCashFlowPaise = item.creditsPaise - item.debitsPaise;
    }

    const months = Array.from(monthlyMap.values());

    return res.json({
      success: true,
      months,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analytics/categories
 */
export async function getCategoryBreakdown(req, res, next) {
  try {
    const { from, to, direction = 'DEBIT' } = req.query;
    const query = buildDateQuery(req.user._id, from, to);
    query.direction = direction.toUpperCase();

    const transactions = await Transaction.find(query).select('category amountPaise');

    const catMap = new Map();
    let totalPaise = 0;

    for (const t of transactions) {
      const cat = t.category || 'Other / Needs Review';
      totalPaise += t.amountPaise;

      if (!catMap.has(cat)) {
        catMap.set(cat, { category: cat, totalPaise: 0, count: 0 });
      }

      const item = catMap.get(cat);
      item.totalPaise += t.amountPaise;
      item.count++;
    }

    const categories = Array.from(catMap.values())
      .map((c) => ({
        ...c,
        percentage: totalPaise > 0 ? Number(((c.totalPaise / totalPaise) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalPaise - a.totalPaise);

    return res.json({
      success: true,
      direction: query.direction,
      totalPaise,
      categories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analytics/top-transactions
 */
export async function getTopTransactions(req, res, next) {
  try {
    const { from, to, direction = 'DEBIT' } = req.query;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const query = buildDateQuery(req.user._id, from, to);
    query.direction = direction.toUpperCase();

    const transactions = await Transaction.find(query)
      .sort({ amountPaise: -1 })
      .limit(limit)
      .populate('statementId', 'bankName accountLabel');

    return res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    next(error);
  }
}
