import { aggregateMerchants } from './merchantRecognition.js';
import { aggregateTransfers } from './transferDetection.js';

/**
 * Financial Intelligence Engine for Banklytics
 * Performs in-depth automated personal financial analysis.
 */

export function analyzeFinancialHealth({ transactions = [], openingBalancePaise = null, closingBalancePaise = null }) {
  if (!transactions || transactions.length === 0) {
    return {
      summary: {
        totalIncomePaise: 0,
        totalExpensesPaise: 0,
        actualConsumptionSpendPaise: 0,
        totalTransfersPaise: 0,
        netCashFlowPaise: 0,
        savingsRate: 0,
        healthScore: 50,
      },
      categoryAnalysis: {},
      topMerchants: [],
      monthlyTrends: [],
      highestSpendingMonth: null,
      anomalies: [],
      savingsOpportunities: [],
    };
  }

  let totalIncomePaise = 0;
  let totalExpensesPaise = 0;
  let actualConsumptionSpendPaise = 0;
  let totalTransfersPaise = 0;

  const categoryMap = new Map();
  const monthlyMap = new Map();
  const debitAmounts = [];

  for (const t of transactions) {
    const amt = t.amountPaise;
    const cat = t.category || 'Other / Needs Review';
    const date = new Date(t.transactionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Monthly init
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        incomePaise: 0,
        expensesPaise: 0,
        netPaise: 0,
        count: 0,
      });
    }
    const monthObj = monthlyMap.get(monthKey);
    monthObj.count++;

    if (t.direction === 'CREDIT') {
      if (t.classification !== 'TRANSFER') {
        totalIncomePaise += amt;
      }
      monthObj.incomePaise += amt;
    } else {
      totalExpensesPaise += amt;
      monthObj.expensesPaise += amt;
      debitAmounts.push(amt);

      if (t.classification === 'TRANSFER') {
        totalTransfersPaise += amt;
      } else {
        actualConsumptionSpendPaise += amt;
      }

      // Category breakdown for debits
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { category: cat, totalPaise: 0, count: 0 });
      }
      const catObj = categoryMap.get(cat);
      catObj.totalPaise += amt;
      catObj.count++;
    }

    monthObj.netPaise = monthObj.incomePaise - monthObj.expensesPaise;
  }

  // Calculate highest spending month
  const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  let highestSpendingMonth = null;
  let maxExpense = -1;
  for (const m of monthlyTrends) {
    if (m.expensesPaise > maxExpense) {
      maxExpense = m.expensesPaise;
      highestSpendingMonth = m;
    }
  }

  // Category array with percentages
  const categoryBreakdown = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      percentage: totalExpensesPaise > 0 ? Number(((c.totalPaise / totalExpensesPaise) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalPaise - a.totalPaise);

  // Top Merchants
  const topMerchants = aggregateMerchants(transactions);

  // Transfers Analysis
  const transferAnalysis = aggregateTransfers(transactions);

  // Anomaly / Unusual Transaction Detection
  const anomalies = [];
  if (debitAmounts.length >= 3) {
    const avgDebit = debitAmounts.reduce((a, b) => a + b, 0) / debitAmounts.length;
    const sortedDebits = [...debitAmounts].sort((a, b) => a - b);
    const medianDebit = sortedDebits[Math.floor(sortedDebits.length / 2)];
    const threshold = Math.max(avgDebit * 1.7, medianDebit * 2.2, 500000); // 1.7x average or 2.2x median or >= ₹5,000

    // Find unusually large transactions
    for (const t of transactions) {
      if (t.direction === 'DEBIT' && t.amountPaise >= threshold) {
        anomalies.push({
          type: 'HIGH_VALUE_DEBIT',
          transaction: t,
          reason: `Large expense of ₹${(t.amountPaise / 100).toFixed(2)}, which is over 3x your average expense.`,
        });
      }
    }

    // Check duplicate charges (same amount and similar description on same or consecutive day)
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const t1 = transactions[i];
        const t2 = transactions[j];
        if (
          t1.direction === 'DEBIT' &&
          t2.direction === 'DEBIT' &&
          t1.amountPaise === t2.amountPaise &&
          t1.description.slice(0, 15).toLowerCase() === t2.description.slice(0, 15).toLowerCase()
        ) {
          const timeDiff = Math.abs(new Date(t1.transactionDate) - new Date(t2.transactionDate));
          if (timeDiff <= 24 * 60 * 60 * 1000) {
            anomalies.push({
              type: 'POSSIBLE_DUPLICATE_CHARGE',
              transaction: t2,
              reason: `Identical charge of ₹${(t2.amountPaise / 100).toFixed(2)} detected within 24 hours of ${t1.description}.`,
            });
          }
        }
      }
    }
  }

  // Potential Savings Calculator
  const savingsOpportunities = [];
  const foodSpend = categoryMap.get('Food & Dining')?.totalPaise || 0;
  const shoppingSpend = categoryMap.get('Shopping')?.totalPaise || 0;
  const entertainmentSpend = categoryMap.get('Entertainment')?.totalPaise || 0;
  const bankCharges = categoryMap.get('Bank Charges')?.totalPaise || 0;

  if (foodSpend > 500000) {
    // If food & dining > ₹5,000
    const potential = Math.round(foodSpend * 0.25);
    savingsOpportunities.push({
      category: 'Food & Dining',
      currentSpendPaise: foodSpend,
      potentialMonthlySavingsPaise: potential,
      recommendation: `Reducing restaurant orders and food delivery by 25% could save ~₹${(potential / 100).toFixed(0)} monthly.`,
    });
  }

  if (shoppingSpend > 500000) {
    const potential = Math.round(shoppingSpend * 0.2);
    savingsOpportunities.push({
      category: 'Shopping',
      currentSpendPaise: shoppingSpend,
      potentialMonthlySavingsPaise: potential,
      recommendation: `Curating non-essential discretionary e-commerce shopping could save ~₹${(potential / 100).toFixed(0)} monthly.`,
    });
  }

  if (entertainmentSpend > 150000) {
    const potential = Math.round(entertainmentSpend * 0.3);
    savingsOpportunities.push({
      category: 'Entertainment & Subscriptions',
      currentSpendPaise: entertainmentSpend,
      potentialMonthlySavingsPaise: potential,
      recommendation: `Auditing streaming subscriptions and gaming charges could save ~₹${(potential / 100).toFixed(0)} monthly.`,
    });
  }

  if (bankCharges > 0) {
    savingsOpportunities.push({
      category: 'Bank Charges & Penalties',
      currentSpendPaise: bankCharges,
      potentialMonthlySavingsPaise: bankCharges,
      recommendation: `Review SMS fees, minimum balance penalties, and ATM fees with your bank to save ₹${(bankCharges / 100).toFixed(0)}.`,
    });
  }

  // Savings rate
  const savingsRate =
    totalIncomePaise > 0
      ? Math.max(0, Number((((totalIncomePaise - actualConsumptionSpendPaise) / totalIncomePaise) * 100).toFixed(1)))
      : 0;

  // Financial Health Score (0 - 100)
  let healthScore = 50;
  if (savingsRate >= 30) healthScore += 30;
  else if (savingsRate >= 15) healthScore += 15;
  else if (savingsRate < 5) healthScore -= 15;

  if (anomalies.length === 0) healthScore += 10;
  else healthScore -= Math.min(15, anomalies.length * 5);

  if (totalIncomePaise > totalExpensesPaise) healthScore += 10;
  else healthScore -= 15;

  healthScore = Math.max(10, Math.min(98, healthScore));

  return {
    summary: {
      totalIncomePaise,
      totalExpensesPaise,
      actualConsumptionSpendPaise,
      totalTransfersPaise,
      netCashFlowPaise: totalIncomePaise - totalExpensesPaise,
      savingsRate,
      healthScore,
      totalTransactions: transactions.length,
    },
    categoryBreakdown,
    topMerchants: topMerchants.slice(0, 10),
    transferAnalysis,
    monthlyTrends,
    highestSpendingMonth,
    anomalies: anomalies.slice(0, 10),
    savingsOpportunities,
  };
}
