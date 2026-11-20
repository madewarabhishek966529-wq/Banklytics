/**
 * Merchant Recognition Engine for Banklytics
 * Normalizes merchant names, brands, and aggregators from raw bank and UPI narrations.
 */

const KNOWN_MERCHANTS = [
  // Food & Dining
  { name: 'Swiggy', category: 'Food & Dining', patterns: [/swiggy/i, /bundl\s*technologies/i] },
  { name: 'Zomato', category: 'Food & Dining', patterns: [/zomato/i] },
  { name: 'Blinkit', category: 'Food & Dining', patterns: [/blinkit/i, /grofers/i] },
  { name: 'Zepto', category: 'Food & Dining', patterns: [/zepto/i, /kirana\s*kart/i] },
  { name: 'Instamart', category: 'Food & Dining', patterns: [/instamart/i] },
  { name: 'McDonald\'s', category: 'Food & Dining', patterns: [/mcdonald/i, /hardcastle/i] },
  { name: 'Domino\'s Pizza', category: 'Food & Dining', patterns: [/domino/i, /jubilant\s*food/i] },
  { name: 'Starbucks', category: 'Food & Dining', patterns: [/starbucks/i, /tata\s*starbucks/i] },
  { name: 'KFC', category: 'Food & Dining', patterns: [/kfc/i, /yum\s*restaurants/i] },
  { name: 'BigBasket', category: 'Food & Dining', patterns: [/bigbasket/i, /supermarket\s*grocery/i] },

  // Shopping & E-Commerce
  { name: 'Amazon', category: 'Shopping', patterns: [/amazon/i, /amzn/i, /amazon\s*pay/i] },
  { name: 'Flipkart', category: 'Shopping', patterns: [/flipkart/i] },
  { name: 'Myntra', category: 'Shopping', patterns: [/myntra/i] },
  { name: 'Ajio', category: 'Shopping', patterns: [/ajio/i, /reliance\s*retail/i] },
  { name: 'Meesho', category: 'Shopping', patterns: [/meesho/i, /fashnear/i] },
  { name: 'Nykaa', category: 'Shopping', patterns: [/nykaa/i, /fsn\s*e-commerce/i] },
  { name: 'Decathlon', category: 'Shopping', patterns: [/decathlon/i] },
  { name: 'Croma', category: 'Shopping', patterns: [/croma/i, /infiniti\s*retail/i] },
  { name: 'Tata CLiQ', category: 'Shopping', patterns: [/tatacliq/i, /tata\s*cliq/i] },

  // Transportation & Travel
  { name: 'Uber', category: 'Transport', patterns: [/uber/i] },
  { name: 'Ola Cabs', category: 'Transport', patterns: [/ola\s*cabs/i, /ani\s*technologies/i, /\bola\b/i] },
  { name: 'Rapido', category: 'Transport', patterns: [/rapido/i, /roppen\s*transport/i] },
  { name: 'IRCTC', category: 'Transport', patterns: [/irctc/i, /indian\s*railway/i] },
  { name: 'MakeMyTrip', category: 'Transport', patterns: [/makemytrip/i, /mmt/i] },
  { name: 'IndiGo Airlines', category: 'Transport', patterns: [/indigo/i, /interglobe/i] },
  { name: 'FASTag', category: 'Transport', patterns: [/fastag/i, /netc/i, /toll/i] },
  { name: 'Fuel Station', category: 'Transport', patterns: [/petrol/i, /fuel/i, /hpcl/i, /bpcl/i, /iocL/i, /shell/i] },

  // Subscriptions & Entertainment
  { name: 'Netflix', category: 'Entertainment', patterns: [/netflix/i] },
  { name: 'Spotify', category: 'Entertainment', patterns: [/spotify/i] },
  { name: 'Disney+ Hotstar', category: 'Entertainment', patterns: [/hotstar/i, /novi\s*digital/i] },
  { name: 'Amazon Prime', category: 'Entertainment', patterns: [/prime\s*video/i, /amazon\s*digital/i] },
  { name: 'BookMyShow', category: 'Entertainment', patterns: [/bookmyshow/i, /bigtree/i] },
  { name: 'YouTube Premium', category: 'Entertainment', patterns: [/youtube/i, /google\s*youtube/i] },
  { name: 'Apple Services', category: 'Entertainment', patterns: [/apple\.com/i, /itunes/i] },

  // Utilities & Telecom
  { name: 'Airtel', category: 'Bills & Utilities', patterns: [/airtel/i, /bharti\s*hexacom/i] },
  { name: 'Jio', category: 'Bills & Utilities', patterns: [/reliance\s*jio/i, /\bjio\b/i] },
  { name: 'Vodafone Idea (Vi)', category: 'Bills & Utilities', patterns: [/vodafone/i, /\bvi\b\s*prepaid/i] },
  { name: 'Electricity Utility', category: 'Bills & Utilities', patterns: [/bescom/i, /tneb/i, /mseb/i, /adani\s*elec/i, /tata\s*power/i] },
  { name: 'Gas Utility', category: 'Bills & Utilities', patterns: [/indane/i, /hp\s*gas/i, /bharat\s*gas/i, /igl/i, /mahanagar\s*gas/i] },

  // Healthcare & Wellness
  { name: 'Apollo Pharmacy', category: 'Healthcare', patterns: [/apollo/i] },
  { name: 'Tata 1mg', category: 'Healthcare', patterns: [/1mg/i, /tata\s*1mg/i] },
  { name: 'PharmEasy', category: 'Healthcare', patterns: [/pharmeasy/i] },
  { name: 'MedPlus', category: 'Healthcare', patterns: [/medplus/i] },

  // Investments & Financial Services
  { name: 'Zerodha', category: 'Transfer', patterns: [/zerodha/i] },
  { name: 'Groww', category: 'Transfer', patterns: [/groww/i, /nextbillion/i] },
  { name: 'CRED', category: 'Bills & Utilities', patterns: [/cred/i, /dreamplug/i] },
];

/**
 * Extracts recognized merchant info from narration.
 */
export function identifyMerchant(description) {
  if (!description) return null;

  for (const item of KNOWN_MERCHANTS) {
    for (const pattern of item.patterns) {
      if (pattern.test(description)) {
        return {
          merchantName: item.name,
          suggestedCategory: item.category,
        };
      }
    }
  }

  // Extract merchant name from common UPI formats: UPI/MERCHANT_NAME/... or UPI-MERCHANT-...
  const upiMatch = description.match(/UPI(?:-|\/)(?:PAYTM|GPAY|PHONEPE|BIL)?(?:\/)?([A-Za-z0-9\s]{3,25})/i);
  if (upiMatch && upiMatch[1]) {
    const raw = upiMatch[1].trim();
    // Exclude generic banking tokens
    if (!/^(CR|DR|REF|TRANSFER|CMS|NEFT|IMPS|REV)$/i.test(raw)) {
      return {
        merchantName: raw,
        suggestedCategory: null,
      };
    }
  }

  return null;
}

/**
 * Aggregates transactions by merchant.
 */
export function aggregateMerchants(transactions = []) {
  const map = new Map();

  for (const t of transactions) {
    if (t.direction !== 'DEBIT') continue;

    const merchantInfo = identifyMerchant(t.description);
    const merchantName = merchantInfo?.merchantName || t.counterparty || 'Uncategorized Merchants';

    if (!map.has(merchantName)) {
      map.set(merchantName, {
        merchant: merchantName,
        totalPaise: 0,
        count: 0,
        category: merchantInfo?.suggestedCategory || t.category || 'Other / Needs Review',
      });
    }

    const item = map.get(merchantName);
    item.totalPaise += t.amountPaise;
    item.count++;
  }

  return Array.from(map.values())
    .filter((m) => m.merchant !== 'Uncategorized Merchants')
    .sort((a, b) => b.totalPaise - a.totalPaise);
}
