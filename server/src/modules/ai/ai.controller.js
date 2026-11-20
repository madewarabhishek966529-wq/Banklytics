import { chatWithFinancialAnalyst, checkOllamaStatus } from '../../services/aiService.js';
import { analyzeFinancialHealth } from '../../services/financialIntelligence.js';
import { Transaction } from '../../models/Transaction.js';

export async function getAIStatus(req, res, next) {
  try {
    const status = await checkOllamaStatus();
    return res.json({
      success: true,
      status,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleAIChat(req, res, next) {
  try {
    const { message, model } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: {
          code: 'MESSAGE_REQUIRED',
          message: 'Please provide a message or question for the AI analyst',
        },
      });
    }

    const transactions = await Transaction.find({ userId: req.user._id });

    const result = await chatWithFinancialAnalyst({
      message: message.trim(),
      transactions,
      model,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFinancialInsights(req, res, next) {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });
    const intelligence = analyzeFinancialHealth({ transactions });

    return res.json({
      success: true,
      intelligence,
    });
  } catch (error) {
    next(error);
  }
}
