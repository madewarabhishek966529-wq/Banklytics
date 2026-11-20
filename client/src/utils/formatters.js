/**
 * Formatting utilities for Banklytics Frontend
 */

/**
 * Formats integer paise into Indian Rupee display string (en-IN)
 */
export function formatINR(paise, includeSymbol = true) {
  if (typeof paise !== 'number' || isNaN(paise)) {
    paise = 0;
  }
  const isNegative = paise < 0;
  const absRupees = Math.abs(paise) / 100;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absRupees);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats ISO date or Date object to DD MMM YYYY (e.g., "15 Nov 2026")
 */
export function formatDate(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Tailwind badge styling for categories
 */
export function getCategoryBadge(category) {
  switch (category) {
    case 'Salary & Income':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Food & Dining':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Transport':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Shopping':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Bills & Utilities':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Rent & Housing':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Healthcare':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Entertainment':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Cash Withdrawal':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'Refund':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Transfer':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Bank Charges':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
