import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Save,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { statementService } from '../services/statementService.js';
import ReconciliationBanner from '../components/common/ReconciliationBanner.jsx';
import { formatINR, formatDate } from '../utils/formatters.js';

const STANDARD_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Rent & Housing',
  'Salary & Income',
  'Refund',
  'Transfer',
  'Healthcare',
  'Entertainment',
  'Education',
  'Cash Withdrawal',
  'Bank Charges',
  'Other / Needs Review',
];

export default function ImportReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const previewData = location.state?.preview;

  if (!previewData) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">No statement preview loaded</h2>
        <p className="text-xs text-slate-500">Please upload a statement to generate an import preview.</p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Upload
        </Link>
      </div>
    );
  }

  const [accountLabel, setAccountLabel] = useState('Primary Checking Account');
  const [bankName, setBankName] = useState(previewData.bankName || 'Standard Bank');
  const [transactions, setTransactions] = useState(previewData.transactions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateTransaction = (index, field, value) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
  };

  const handleRemoveTransaction = (index) => {
    const updated = transactions.filter((_, i) => i !== index);
    setTransactions(updated);
  };

  const handleConfirmImport = async () => {
    setSaving(true);
    setError('');

    try {
      await statementService.confirmStatement({
        originalFileName: previewData.originalFileName,
        fileHash: previewData.fileHash,
        fileType: previewData.fileType,
        bankName,
        accountLabel,
        openingBalancePaise: previewData.metadata?.openingBalancePaise,
        closingBalancePaise: previewData.metadata?.closingBalancePaise,
        periodStart: previewData.periodStart,
        periodEnd: previewData.periodEnd,
        transactions,
        warnings: previewData.warnings,
      });

      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save confirmed statement.';
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/upload" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
            </Link>
            <span>/</span>
            <span>Import Review</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Review Statement & Transactions
          </h1>
          <p className="text-xs text-slate-500">
            Source file: <span className="font-semibold text-slate-700">{previewData.originalFileName}</span> ({previewData.fileType})
          </p>
        </div>

        <button
          onClick={handleConfirmImport}
          disabled={saving || transactions.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
        >
          {saving ? (
            'Persisting Records...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Confirm & Save Import ({transactions.length})</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Reconciliation Status Banner */}
      <ReconciliationBanner reconciliation={previewData.reconciliation} />

      {/* Statement Meta Settings */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Account Label</label>
          <input
            type="text"
            value={accountLabel}
            onChange={(e) => setAccountLabel(e.target.value)}
            placeholder="e.g. Salary A/c - XX5412"
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Period Detected</label>
          <p className="text-xs text-slate-800 font-medium py-1.5">
            {formatDate(previewData.periodStart)} – {formatDate(previewData.periodEnd)}
          </p>
        </div>
      </div>

      {/* Warnings & Notices */}
      {previewData.warnings && previewData.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Warnings & Notices
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            {previewData.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Transactions Review Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Extracted Transactions ({transactions.length})
          </h2>
          <span className="text-xs text-slate-500">Edit any category or description before saving</span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Direction</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.map((t, index) => (
                <tr
                  key={index}
                  className={`hover:bg-slate-50/80 transition ${
                    t.isPossibleDuplicate ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-600">
                    {formatDate(t.transactionDate)}
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      value={t.description}
                      onChange={(e) => handleUpdateTransaction(index, 'description', e.target.value)}
                      className="w-full max-w-sm px-2 py-1 text-xs rounded border border-transparent hover:border-slate-300 focus:border-brand-500 focus:bg-white bg-transparent"
                    />
                    {t.isPossibleDuplicate && (
                      <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                        ⚠️ Fingerprint matched previous import
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <select
                      value={t.direction}
                      onChange={(e) => handleUpdateTransaction(index, 'direction', e.target.value)}
                      className="px-2 py-1 text-xs rounded border border-slate-200 bg-white font-semibold"
                    >
                      <option value="CREDIT">CREDIT (+)</option>
                      <option value="DEBIT">DEBIT (-)</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-4">
                    <select
                      value={t.category}
                      onChange={(e) => handleUpdateTransaction(index, 'category', e.target.value)}
                      className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                    >
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${
                      t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {t.direction === 'CREDIT' ? '+' : '-'} {formatINR(t.amountPaise)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => handleRemoveTransaction(index)}
                      title="Discard Row"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected Rows Section if any */}
      {previewData.rejectedRows && previewData.rejectedRows.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
            Rejected or Ambiguous Rows ({previewData.rejectedRows.length})
          </h3>
          <p className="text-xs text-rose-800">
            These rows could not be parsed into valid transactions and were omitted from import.
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {previewData.rejectedRows.map((r, i) => (
              <div key={i} className="text-xs p-2 bg-white rounded border border-rose-200 text-rose-900">
                <span className="font-bold">Row {r.rowNumber}:</span> {r.raw?.join(' | ')}
                <div className="text-[11px] text-rose-600 mt-0.5">
                  Reason: {r.reasons?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
