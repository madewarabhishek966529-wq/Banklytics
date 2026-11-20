import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, ExternalLink, UploadCloud, AlertCircle } from 'lucide-react';
import { statementService } from '../services/statementService.js';
import { formatINR, formatDate } from '../utils/formatters.js';

export default function Statements() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await statementService.getStatements();
      setStatements(data.statements || []);
    } catch (err) {
      console.error('Failed to load statements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatements();
  }, []);

  const handleDeleteStatement = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"?\n\nThis will permanently delete the statement and all associated transactions derived from it.`
      )
    ) {
      return;
    }

    try {
      await statementService.deleteStatement(id);
      loadStatements();
    } catch (err) {
      alert('Failed to delete statement.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statements History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit and manage your uploaded bank statement files and reconciliations.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition self-start"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Statement</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading statements...</div>
        ) : statements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 text-sm">No statements imported yet</p>
            <p className="mt-1">Upload your first CSV or PDF statement to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Statement / File</th>
                  <th className="py-3 px-4">Bank & Account</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Credits (₹)</th>
                  <th className="py-3 px-4 text-right">Debits (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {statements.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-xs">{s.originalFileName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                        {s.fileType} • Imported {formatDate(s.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{s.bankName}</div>
                      <div className="text-[11px] text-slate-400">{s.accountLabel}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {s.periodStart ? `${formatDate(s.periodStart)} – ${formatDate(s.periodEnd)}` : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          s.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-emerald-600">
                      {s.declaredTotalCreditsPaise !== null
                        ? `+${formatINR(s.declaredTotalCreditsPaise)}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-900">
                      {s.declaredTotalDebitsPaise !== null
                        ? `-${formatINR(s.declaredTotalDebitsPaise)}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Link
                        to={`/statements/${s._id}`}
                        title="View Reconciliation & Transactions"
                        className="p-1.5 inline-block text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition mr-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteStatement(s._id, s.originalFileName)}
                        title="Delete Statement (Cascades to all transactions)"
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
        )}
      </div>
    </div>
  );
}
