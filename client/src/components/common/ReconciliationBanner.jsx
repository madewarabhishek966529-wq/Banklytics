import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { formatINR } from '../../utils/formatters.js';

export default function ReconciliationBanner({ reconciliation }) {
  if (!reconciliation) return null;

  const {
    status,
    openingBalancePaise,
    observedClosingBalancePaise,
    expectedClosingBalancePaise,
    differencePaise,
    notes = [],
  } = reconciliation;

  if (status === 'MATCHED') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-950">Statement Reconciled Perfectly (Matched)</p>
          <p className="text-emerald-800 mt-0.5">
            Opening Balance ({formatINR(openingBalancePaise)}) + Credits - Debits = Closing Balance ({formatINR(observedClosingBalancePaise)}). Zero difference detected.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'MISMATCH') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-rose-950">Balance Mismatch Detected</p>
          <p className="text-rose-800 mt-0.5">
            Expected closing balance: {formatINR(expectedClosingBalancePaise)}, Observed on statement: {formatINR(observedClosingBalancePaise)}. Difference: {formatINR(differencePaise)}.
          </p>
          {notes.length > 0 && (
            <ul className="list-disc list-inside mt-2 text-xs text-rose-700 space-y-0.5">
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (status === 'WARNING') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-amber-950">Statement Notes & Warnings</p>
          <ul className="list-disc list-inside mt-1 text-xs text-amber-800 space-y-0.5">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 flex items-start gap-3">
      <HelpCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-slate-800">Unreconciled / Balances Not Provided</p>
        <p className="text-slate-600 mt-0.5">
          This statement did not declare explicit opening or closing balances. Totals are computed strictly from normalized transaction records.
        </p>
      </div>
    </div>
  );
}
