import { sumPaise } from '../utils/money.js';

/**
 * Reconciles transactions against statement opening and closing balances or declared totals.
 *
 * Formula:
 * Expected Closing Balance = Opening Balance + Total Credits - Total Debits
 * Difference = Observed Closing Balance - Expected Closing Balance
 */
export function reconcileStatement({
  transactions = [],
  openingBalancePaise = null,
  closingBalancePaise = null,
  declaredTotalCreditsPaise = null,
  declaredTotalDebitsPaise = null,
}) {
  const creditsList = [];
  const debitsList = [];

  for (const tx of transactions) {
    const amount = Number(tx.amountPaise) || 0;
    if (tx.direction === 'CREDIT') {
      creditsList.push(amount);
    } else if (tx.direction === 'DEBIT') {
      debitsList.push(amount);
    }
  }

  const totalCreditsPaise = sumPaise(creditsList);
  const totalDebitsPaise = sumPaise(debitsList);
  const netCashFlowPaise = totalCreditsPaise - totalDebitsPaise;
  const transactionCount = transactions.length;

  const notes = [];
  let status = 'NOT_APPLICABLE';
  let expectedClosingBalancePaise = null;
  let differencePaise = 0;
  let isBalanced = true;

  if (openingBalancePaise !== null && openingBalancePaise !== undefined) {
    expectedClosingBalancePaise = openingBalancePaise + totalCreditsPaise - totalDebitsPaise;
  }

  if (
    expectedClosingBalancePaise !== null &&
    closingBalancePaise !== null &&
    closingBalancePaise !== undefined
  ) {
    differencePaise = closingBalancePaise - expectedClosingBalancePaise;

    if (differencePaise === 0) {
      status = 'MATCHED';
      notes.push('Closing balance matches calculated sum of credits and debits perfectly.');
    } else {
      status = 'MISMATCH';
      isBalanced = false;
      const diffFormatted = (Math.abs(differencePaise) / 100).toFixed(2);
      notes.push(
        `Balance mismatch of ₹${diffFormatted}. Observed: ₹${(closingBalancePaise / 100).toFixed(2)}, Expected: ₹${(expectedClosingBalancePaise / 100).toFixed(2)}.`
      );
    }
  } else {
    notes.push('Statement did not provide both opening and closing balances; calculated totals only.');
  }

  // Check declared totals if provided
  if (declaredTotalCreditsPaise !== null && declaredTotalCreditsPaise !== undefined) {
    if (declaredTotalCreditsPaise !== totalCreditsPaise) {
      notes.push(
        `Declared credits (₹${(declaredTotalCreditsPaise / 100).toFixed(2)}) differed from row sum (₹${(totalCreditsPaise / 100).toFixed(2)}).`
      );
      if (status === 'MATCHED') status = 'WARNING';
    }
  }

  if (declaredTotalDebitsPaise !== null && declaredTotalDebitsPaise !== undefined) {
    if (declaredTotalDebitsPaise !== totalDebitsPaise) {
      notes.push(
        `Declared debits (₹${(declaredTotalDebitsPaise / 100).toFixed(2)}) differed from row sum (₹${(totalDebitsPaise / 100).toFixed(2)}).`
      );
      if (status === 'MATCHED') status = 'WARNING';
    }
  }

  return {
    status,
    totalCreditsPaise,
    totalDebitsPaise,
    netCashFlowPaise,
    transactionCount,
    openingBalancePaise,
    observedClosingBalancePaise: closingBalancePaise,
    expectedClosingBalancePaise,
    differencePaise,
    isBalanced,
    notes,
  };
}
