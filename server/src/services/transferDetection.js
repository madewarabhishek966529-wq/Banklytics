/**
 * Transfer Detection Engine for Banklytics
 * Detects internal account transfers, peer-to-peer UPI payments, NEFT, IMPS, and RTGS.
 * Prevents transfer payments from skewing discretionary spending and real consumption totals.
 */

const TRANSFER_PATTERNS = [
  /\b(?:internal|self)\s*transfer\b/i,
  /\btrf\s*(?:to|from)\b/i,
  /\btransfer\s*(?:to|from)\b/i,
  /\bto\s*transfer\b/i,
  /\bby\s*transfer\b/i,
  /\bneft\s*(?:to|from|cr|dr)\b/i,
  /\bimps\s*(?:to|from|p2p|p2a)\b/i,
  /\brtgs\s*(?:to|from)\b/i,
  /\bfund\s*transfer\b/i,
  /\ba\/c\s*transfer\b/i,
  /\bown\s*account\b/i,
];

// Regex to capture UPI VPA: e.g. "rohan@okhdfcbank" or "9876543210@paytm"
const VPA_REGEX = /([a-zA-Z0-9.\-_]{2,50}@[a-zA-Z]{2,20})/;

export function detectTransfer(description, counterparty = '') {
  const text = `${description} ${counterparty}`.trim();

  // Check explicit transfer keywords
  for (const pattern of TRANSFER_PATTERNS) {
    if (pattern.test(text)) {
      const vpaMatch = text.match(VPA_REGEX);
      return {
        isTransfer: true,
        transferType: 'ACCOUNT_TRANSFER',
        vpa: vpaMatch ? vpaMatch[1] : null,
      };
    }
  }

  // Check if it's a person-to-person (P2P) UPI transaction
  if (/UPI\/(?:P2P|TRANSFER)/i.test(text) || (text.includes('UPI') && VPA_REGEX.test(text))) {
    const vpaMatch = text.match(VPA_REGEX);
    // Exclude merchant payment gateways
    if (vpaMatch && !/paytm|razorpay|cashfree|billdesk|swiggy|zomato|amazon/i.test(vpaMatch[1])) {
      return {
        isTransfer: true,
        transferType: 'UPI_P2P',
        vpa: vpaMatch[1],
      };
    }
  }

  return {
    isTransfer: false,
    transferType: null,
    vpa: null,
  };
}

export function aggregateTransfers(transactions = []) {
  const p2pTransfers = [];
  let totalTransferDebitPaise = 0;
  let totalTransferCreditPaise = 0;

  for (const t of transactions) {
    if (t.classification === 'TRANSFER' || detectTransfer(t.description, t.counterparty).isTransfer) {
      if (t.direction === 'DEBIT') {
        totalTransferDebitPaise += t.amountPaise;
      } else {
        totalTransferCreditPaise += t.amountPaise;
      }
      p2pTransfers.push(t);
    }
  }

  return {
    totalTransfersCount: p2pTransfers.length,
    totalTransferDebitPaise,
    totalTransferCreditPaise,
    transfers: p2pTransfers,
  };
}
