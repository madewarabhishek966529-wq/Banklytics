import { Transaction } from '../../models/Transaction.js';
import { sumPaise } from '../../utils/money.js';
import { analyzeFinancialHealth } from '../../services/financialIntelligence.js';
import { aggregateMerchants } from '../../services/merchantRecognition.js';
import { aggregateTransfers } from '../../services/transferDetection.js';
import { generatePDFReport, generateExcelReport } from '../../services/reportGenerator.js';

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
    const transactions = await Transaction.find(query).select('amountPaise direction classification category');

    const intelligence = analyzeFinancialHealth({ transactions });

    return res.json({
      success: true,
      currency: 'INR',
      range: { from: from || null, to: to || null },
      creditsPaise: intelligence.summary.totalIncomePaise,
      debitsPaise: intelligence.summary.totalExpensesPaise,
      actualConsumptionSpendPaise: intelligence.summary.actualConsumptionSpendPaise,
      totalTransfersPaise: intelligence.summary.totalTransfersPaise,
      netCashFlowPaise: intelligence.summary.netCashFlowPaise,
      savingsRate: intelligence.summary.savingsRate,
      healthScore: intelligence.summary.healthScore,
      transactionCount: transactions.length,
      anomalies: intelligence.anomalies,
      savingsOpportunities: intelligence.savingsOpportunities,
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
    const transactions = await Transaction.find(query);

    const intelligence = analyzeFinancialHealth({ transactions });

    const formattedMonths = intelligence.monthlyTrends.map((m) => ({
      month: m.month,
      creditsPaise: m.incomePaise,
      debitsPaise: m.expensesPaise,
      netCashFlowPaise: m.netPaise,
      count: m.count,
    }));

    return res.json({
      success: true,
      months: formattedMonths,
      highestSpendingMonth: intelligence.highestSpendingMonth,
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
    const transactions = await Transaction.find(query);

    const intelligence = analyzeFinancialHealth({ transactions });

    return res.json({
      success: true,
      direction,
      totalPaise: intelligence.summary.totalExpensesPaise,
      categories: intelligence.categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analytics/merchants
 */
export async function getTopMerchants(req, res, next) {
  try {
    const { from, to } = req.query;
    const query = buildDateQuery(req.user._id, from, to);
    const transactions = await Transaction.find(query);

    const merchants = aggregateMerchants(transactions);

    return res.json({
      success: true,
      merchants,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analytics/transfers
 */
export async function getTransferAnalysis(req, res, next) {
  try {
    const { from, to } = req.query;
    const query = buildDateQuery(req.user._id, from, to);
    const transactions = await Transaction.find(query);

    const transfers = aggregateTransfers(transactions);

    return res.json({
      success: true,
      ...transfers,
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

/**
 * GET /api/v1/analytics/report/pdf
 */
export async function downloadPDFReport(req, res, next) {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });
    const pdfBuffer = await generatePDFReport({ transactions, user: req.user });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Banklytics_Financial_Report.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/analytics/report/excel
 */
export async function downloadExcelReport(req, res, next) {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });
    const excelBuffer = await generateExcelReport({ transactions });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="Banklytics_Financial_Report.xlsx"');
    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
}
