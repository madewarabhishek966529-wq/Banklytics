/**
 * Categorization Engine for Banklytics
 * Uses transparent, deterministic rule-based matching.
 */

const CATEGORY_RULES = [
  {
    category: 'Salary & Income',
    classification: 'INCOME',
    keywords: ['salary', 'payroll', 'stipend', 'dividend', 'interest credit', 'bonus', 'direct dep', 'wages'],
    direction: 'CREDIT',
  },
  {
    category: 'Refund',
    classification: 'REFUND',
    keywords: ['refund', 'cashback', 'cash back', 'reversal', 'chargeback', 'rev:'],
    direction: 'CREDIT',
  },
  {
    category: 'Food & Dining',
    classification: 'EXPENSE',
    keywords: [
      'swiggy',
      'zomato',
      'mcdonalds',
      'starbucks',
      'kfc',
      'dominos',
      'pizza',
      'burger',
      'cafe',
      'restaurant',
      'bakery',
      'dining',
      'food',
      'eatclub',
      'blinkit',
      'zepto',
      'instamart',
      'groceries',
    ],
    direction: 'DEBIT',
  },
  {
    category: 'Transport',
    classification: 'EXPENSE',
    keywords: [
      'uber',
      'ola',
      'rapido',
      'metro',
      'irctc',
      'railway',
      'petrol',
      'fuel',
      'fastag',
      'shell',
      'indian oil',
      'bharat pet',
      'hpcl',
      'indigo',
      'air india',
      'flight',
      'toll',
    ],
    direction: 'DEBIT',
  },
  {
    category: 'Shopping',
    classification: 'EXPENSE',
    keywords: [
      'amazon',
      'flipkart',
      'myntra',
      'ajio',
      'meesho',
      'nykaa',
      'decathlon',
      'zara',
      'h&m',
      'tatacliq',
      'croma',
      'reliance',
      'lifestyle',
      'shoppers stop',
      'retail',
    ],
    direction: 'DEBIT',
  },
  {
    category: 'Bills & Utilities',
    classification: 'EXPENSE',
    keywords: [
      'electricity',
      'bescom',
      'tneb',
      'mseb',
      'billdesk',
      'airtel',
      'jio',
      'vodafone',
      'broadband',
      'wifi',
      'cylinder',
      'indane',
      'gas',
      'water bill',
      'recharge',
      'utility',
    ],
    direction: 'DEBIT',
  },
  {
    category: 'Rent & Housing',
    classification: 'EXPENSE',
    keywords: ['rent', 'maintenance', 'housing', 'society', 'nobroker', 'apartment', 'flat fee'],
    direction: 'DEBIT',
  },
  {
    category: 'Healthcare',
    classification: 'EXPENSE',
    keywords: [
      'pharmacy',
      'apollo',
      '1mg',
      'hospital',
      'clinic',
      'medicine',
      'medplus',
      'doctor',
      'diagnostic',
      'dental',
      'health',
      'pharma',
    ],
    direction: 'DEBIT',
  },
  {
    category: 'Entertainment',
    classification: 'EXPENSE',
    keywords: [
      'netflix',
      'spotify',
      'hotstar',
      'prime video',
      'pvr',
      'inox',
      'cinema',
      'movie',
      'bookmyshow',
      'playstation',
      'steam',
      'youtube',
      'gaming',
    ],
    direction: 'DEBIT',
  },
  {
    category: 'Education',
    classification: 'EXPENSE',
    keywords: ['coursera', 'udemy', 'tuition', 'school', 'college', 'university', 'fee', 'exam', 'books'],
    direction: 'DEBIT',
  },
  {
    category: 'Cash Withdrawal',
    classification: 'EXPENSE',
    keywords: ['atm', 'cash wdl', 'cash withdrawal', 'nfs atm', 'matm'],
    direction: 'DEBIT',
  },
  {
    category: 'Bank Charges',
    classification: 'EXPENSE',
    keywords: ['charge', 'fee', 'penalty', 'annual fee', 'sms charge', 'interest debit', 'gst on fee', 'min bal'],
    direction: 'DEBIT',
  },
  {
    category: 'Transfer',
    classification: 'TRANSFER',
    keywords: ['transfer to', 'trf to', 'neft to', 'imps to', 'rtgs to', 'internal transfer', 'self transfer', 'to a/c'],
  },
];

export function categorizeTransaction(description, direction) {
  const text = (description || '').toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.direction && rule.direction !== direction) {
      continue;
    }

    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        return {
          category: rule.category,
          classification: rule.classification,
          confidence: 0.85,
        };
      }
    }
  }

  // Fallbacks
  if (direction === 'CREDIT') {
    return {
      category: 'Other / Needs Review',
      classification: 'INCOME',
      confidence: 0.5,
    };
  }

  return {
    category: 'Other / Needs Review',
    classification: 'EXPENSE',
    confidence: 0.5,
  };
}
