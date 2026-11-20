import { describe, it, expect } from 'vitest';
import { identifyMerchant, aggregateMerchants } from '../src/services/merchantRecognition.js';
import { detectTransfer, aggregateTransfers } from '../src/services/transferDetection.js';
import { analyzeFinancialHealth } from '../src/services/financialIntelligence.js';
import { chatWithFinancialAnalyst } from '../src/services/aiService.js';

describe('Merchant Recognition & Transfer Detection Engine', () => {
  it('correctly recognizes top Indian merchants from raw descriptions', () => {
    const m1 = identifyMerchant('UPI/SWIGGY BANGALORE/PAY9912');
    expect(m1.merchantName).toBe('Swiggy');
    expect(m1.suggestedCategory).toBe('Food & Dining');

    const m2 = identifyMerchant('POS 4123 AMAZON PAY INDIA RETAIL');
    expect(m2.merchantName).toBe('Amazon');

    const m3 = identifyMerchant('UPI/UBER INDIA SYS/0129');
    expect(m3.merchantName).toBe('Uber');

    const m4 = identifyMerchant('NETFLIX ENTERTAINMENT SERVICES MUMBAI');
    expect(m4.merchantName).toBe('Netflix');
  });

  it('detects peer-to-peer transfers and internal movements', () => {
    const t1 = detectTransfer('NEFT TO SISTER SELF TRANSFER A/C 4567');
    expect(t1.isTransfer).toBe(true);

    const t2 = detectTransfer('UPI/P2P/rohan@okhdfcbank/GIFT');
    expect(t2.isTransfer).toBe(true);
    expect(t2.vpa).toBe('rohan@okhdfcbank');

    const t3 = detectTransfer('POS SWIGGY FOOD ORDER');
    expect(t3.isTransfer).toBe(false);
  });

  it('computes financial intelligence, anomalies, and savings opportunities', () => {
    const transactions = [
      {
        transactionDate: new Date('2026-11-01'),
        description: 'ACH SALARY CREDIT ACME CORP',
        amountPaise: 8000000, // ₹80,000
        direction: 'CREDIT',
        classification: 'INCOME',
        category: 'Salary & Income',
      },
      {
        transactionDate: new Date('2026-11-03'),
        description: 'UPI/SWIGGY BANGALORE/ORDER',
        amountPaise: 750000, // ₹7,500 food spend
        direction: 'DEBIT',
        classification: 'EXPENSE',
        category: 'Food & Dining',
      },
      {
        transactionDate: new Date('2026-11-05'),
        description: 'AMAZON PAY ELECTRONICS',
        amountPaise: 2500000, // ₹25,000 (anomaly threshold)
        direction: 'DEBIT',
        classification: 'EXPENSE',
        category: 'Shopping',
      },
      {
        transactionDate: new Date('2026-11-10'),
        description: 'NEFT TO BROTHER',
        amountPaise: 1000000, // ₹10,000 transfer
        direction: 'DEBIT',
        classification: 'TRANSFER',
        category: 'Transfer',
      },
    ];

    const intelligence = analyzeFinancialHealth({ transactions });

    // Summary checks
    expect(intelligence.summary.totalIncomePaise).toBe(8000000);
    expect(intelligence.summary.totalExpensesPaise).toBe(4250000); // 7.5k + 25k + 10k
    expect(intelligence.summary.actualConsumptionSpendPaise).toBe(3250000); // excludes 10k transfer
    expect(intelligence.summary.totalTransfersPaise).toBe(1000000);
    expect(intelligence.summary.savingsRate).toBeGreaterThan(0);

    // Anomalies check
    expect(intelligence.anomalies.length).toBeGreaterThan(0);
    expect(intelligence.anomalies[0].type).toBe('HIGH_VALUE_DEBIT');

    // Savings opportunities check (Food spend > 5k)
    expect(intelligence.savingsOpportunities.length).toBeGreaterThan(0);
    expect(intelligence.savingsOpportunities[0].category).toBe('Food & Dining');
  });

  it('AI assistant provides coherent financial analyst responses via local heuristic engine', async () => {
    const transactions = [
      {
        transactionDate: new Date('2026-11-01'),
        description: 'ACH SALARY CREDIT',
        amountPaise: 6000000,
        direction: 'CREDIT',
        classification: 'INCOME',
        category: 'Salary & Income',
      },
      {
        transactionDate: new Date('2026-11-02'),
        description: 'SWIGGY FOOD DELIVERY',
        amountPaise: 600000,
        direction: 'DEBIT',
        classification: 'EXPENSE',
        category: 'Food & Dining',
      },
    ];

    const result = await chatWithFinancialAnalyst({
      message: 'How much did I spend on food?',
      transactions,
    });

    expect(result.reply).toBeDefined();
    expect(result.reply).toContain('Food & Dining');
    expect(result.reply).toContain('6,000.00');
  });
});
