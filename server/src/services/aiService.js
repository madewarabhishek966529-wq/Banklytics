import http from 'http';
import { analyzeFinancialHealth } from './financialIntelligence.js';
import { formatINR } from '../utils/money.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

/**
 * Checks whether the local Ollama instance is running.
 */
export async function checkOllamaStatus() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/tags',
        method: 'GET',
        timeout: 2000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              isAvailable: true,
              models: parsed.models?.map((m) => m.name) || [],
              activeModel: DEFAULT_MODEL,
            });
          } catch (e) {
            resolve({ isAvailable: true, models: [], activeModel: DEFAULT_MODEL });
          }
        });
      }
    );

    req.on('error', () => {
      resolve({ isAvailable: false, models: [], activeModel: DEFAULT_MODEL });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ isAvailable: false, models: [], activeModel: DEFAULT_MODEL });
    });
    req.end();
  });
}

/**
 * Queries local Ollama AI model.
 */
async function queryOllama(prompt, systemPrompt, model = DEFAULT_MODEL) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: false,
    });

    const req = http.request(
      {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 30000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.response);
          } catch (e) {
            reject(new Error(`Invalid response from Ollama: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Generates structured context prompt based on user's actual transactions.
 */
function buildFinancialContext(intelligence) {
  const { summary, categoryBreakdown, topMerchants, savingsOpportunities, anomalies } = intelligence;

  const topCatsText = categoryBreakdown
    .slice(0, 6)
    .map((c) => `- ${c.category}: ${formatINR(c.totalPaise)} (${c.percentage}%)`)
    .join('\n');

  const topMerchantsText = topMerchants
    .slice(0, 6)
    .map((m) => `- ${m.merchant}: ${formatINR(m.totalPaise)} (${m.count} txns)`)
    .join('\n');

  const savingsText = savingsOpportunities
    .map((s) => `- ${s.category}: Potential saving ~${formatINR(s.potentialMonthlySavingsPaise)} (${s.recommendation})`)
    .join('\n');

  const anomalyText = anomalies
    .slice(0, 4)
    .map((a) => `- [${a.type}] ${a.transaction.description}: ${formatINR(a.transaction.amountPaise)} (${a.reason})`)
    .join('\n');

  return `
USER FINANCIAL PROFILE (All values in Indian Rupees INR):
- Total Income: ${formatINR(summary.totalIncomePaise)}
- Total Debits/Outflows: ${formatINR(summary.totalExpensesPaise)}
- Real Consumption Spending (excluding transfers): ${formatINR(summary.actualConsumptionSpendPaise)}
- Total P2P/Internal Transfers: ${formatINR(summary.totalTransfersPaise)}
- Net Cash Flow: ${formatINR(summary.netCashFlowPaise)}
- Savings Rate: ${summary.savingsRate}%
- Financial Health Score: ${summary.healthScore} / 100

TOP SPENDING CATEGORIES:
${topCatsText || 'None recorded'}

TOP RECIPIENT MERCHANTS:
${topMerchantsText || 'None recorded'}

POTENTIAL SAVINGS OPPORTUNITIES:
${savingsText || 'No high discretionary expenses detected.'}

FLAGGED UNUSUAL TRANSACTIONS / ANOMALIES:
${anomalyText || 'No unusual anomalies detected.'}
`.trim();
}

/**
 * Deterministic expert rule-based response when Ollama is offline.
 */
function generateHeuristicResponse(userMessage, intelligence) {
  const msg = userMessage.toLowerCase();
  const { summary, categoryBreakdown, topMerchants, savingsOpportunities, anomalies } = intelligence;

  if (msg.includes('food') || msg.includes('dining') || msg.includes('swiggy') || msg.includes('zomato')) {
    const food = categoryBreakdown.find((c) => c.category === 'Food & Dining');
    if (food) {
      return `You spent a total of **${formatINR(food.totalPaise)}** on **Food & Dining**, which accounts for **${food.percentage}%** of your total expenses across ${food.count} transactions. Major food deliveries were through merchants like ${topMerchants.filter((m) => m.category === 'Food & Dining').map((m) => m.merchant).slice(0, 3).join(', ') || 'Swiggy & Zomato'}.`;
    }
    return 'You have not recorded significant Food & Dining expenses in this period.';
  }

  if (msg.includes('shopping') || msg.includes('amazon') || msg.includes('flipkart')) {
    const shopping = categoryBreakdown.find((c) => c.category === 'Shopping');
    if (shopping) {
      return `Your total shopping expense is **${formatINR(shopping.totalPaise)}** (**${shopping.percentage}%** of total expenses across ${shopping.count} orders).`;
    }
    return 'You have minimal or zero e-commerce shopping expenses in the analyzed statement.';
  }

  if (msg.includes('save') || msg.includes('saving') || msg.includes('cut spend')) {
    if (savingsOpportunities.length > 0) {
      const tips = savingsOpportunities.map((s) => `• **${s.category}**: ${s.recommendation}`).join('\n');
      return `Here are your top potential savings opportunities:\n\n${tips}\n\nYour current overall savings rate is **${summary.savingsRate}%**. Implementing these adjustments could raise your savings rate significantly.`;
    }
    return `Your current financial habits are well-balanced with a savings rate of **${summary.savingsRate}%** and a financial health score of **${summary.healthScore}/100**. Keep maintaining an emergency reserve!`;
  }

  if (msg.includes('merchant') || msg.includes('who') || msg.includes('where')) {
    if (topMerchants.length > 0) {
      const list = topMerchants.slice(0, 5).map((m, i) => `${i + 1}. **${m.merchant}**: ${formatINR(m.totalPaise)} (${m.count} payments)`).join('\n');
      return `The merchants receiving the highest payments from your accounts are:\n\n${list}`;
    }
  }

  if (msg.includes('unusual') || msg.includes('anomaly') || msg.includes('suspicious') || msg.includes('high')) {
    if (anomalies.length > 0) {
      const list = anomalies.slice(0, 5).map((a) => `• **${a.transaction.description}**: ${formatINR(a.transaction.amountPaise)} (${a.reason})`).join('\n');
      return `We flagged **${anomalies.length}** unusual or high-value transactions:\n\n${list}`;
    }
    return 'No unusual spikes or duplicate transactions were detected in your statement.';
  }

  // General executive summary
  return `### Financial Analyst Executive Summary

• **Real Consumption Spending:** ${formatINR(summary.actualConsumptionSpendPaise)} (excluding ${formatINR(summary.totalTransfersPaise)} in transfers)
• **Net Cash Flow:** ${formatINR(summary.netCashFlowPaise)}
• **Savings Rate:** ${summary.savingsRate}% | **Health Score:** ${summary.healthScore}/100
• **Primary Outflow Category:** ${categoryBreakdown[0] ? `${categoryBreakdown[0].category} (${categoryBreakdown[0].percentage}%)` : 'Balanced'}
• **Highest Spend Month:** ${intelligence.highestSpendingMonth ? `${intelligence.highestSpendingMonth.month} (${formatINR(intelligence.highestSpendingMonth.expensesPaise)})` : 'Current Month'}

You can ask me specific questions like:
- *"How much did I spend on food and dining?"*
- *"Where can I potentially save money?"*
- *"Which merchants receive the most money from me?"*
- *"Are there any unusual or duplicate transactions?"*`;
}

/**
 * Main AI Chat handler.
 */
export async function chatWithFinancialAnalyst({ message, transactions = [], model = DEFAULT_MODEL }) {
  const intelligence = analyzeFinancialHealth({ transactions });
  const ollamaStatus = await checkOllamaStatus();

  const systemPrompt = `You are "Banklytics AI", an elite personal financial intelligence analyst.
You provide deep, actionable, mathematically precise insights into bank statements.
Always use Indian Rupee format (₹) and exact numbers from the user profile.
Never invent figures. Be professional, direct, and constructive.`;

  const contextText = buildFinancialContext(intelligence);
  const fullPrompt = `Here is the user's financial profile:\n${contextText}\n\nUser Question: "${message}"\n\nPlease answer the user's question clearly, highlighting specific numbers and recommendations:`;

  if (ollamaStatus.isAvailable) {
    try {
      const aiResponse = await queryOllama(fullPrompt, systemPrompt, model);
      return {
        reply: aiResponse,
        source: 'LOCAL_OLLAMA_AI',
        model,
        ollamaStatus,
      };
    } catch (err) {
      console.warn('[AI Service] Ollama query failed, using built-in analyst heuristics:', err.message);
    }
  }

  // Graceful fallback to deterministic analyst engine
  const heuristicReply = generateHeuristicResponse(message, intelligence);
  return {
    reply: heuristicReply,
    source: 'LOCAL_DETERMINISTIC_ANALYST',
    model: 'Heuristic Financial Engine',
    ollamaStatus,
  };
}
