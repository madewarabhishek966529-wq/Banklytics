import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Hash, Calendar, Building2 } from 'lucide-react';
import { statementService } from '../services/statementService.js';
import ReconciliationBanner from '../components/common/ReconciliationBanner.jsx';
import { formatINR, formatDate, getCategoryBadge } from '../utils/formatters.js';

export default function StatementDetails() {
  const { id } = useParams();
  const [statement, setStatement] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statementRes, txnRes] = await Promise.all([
          statementService.getStatementById(id),
          statementService.getStatementTransactions(id, 1, 100),
        ]);

        setStatement(statementRes.statement);
        setReconciliation(statementRes.reconciliation);
        setTransactions(txnRes.transactions || []);
      } catch (err) {
        console.error('Failed to load statement details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return <div className="py-16 text-center text-slate-400 text-xs">Loading statement details...</div>;
  }

  if (!statement) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Statement not found</p>
        <Link to="/statements" className="text-xs text-brand-600 font-semibold hover:underline">
          ← Back to Statements
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/statements" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Statements
        </Link>
        <span>/</span>
        <span className="text-slate-800">{statement.originalFileName}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {statement.originalFileName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {statement.bankName} • {statement.accountLabel} • Imported {formatDate(statement.createdAt)}
          </p>
        </div>

        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider self-start ${
            statement.status === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {statement.status}
        </span>
      </div>

      {/* Reconciliation Banner */}
      <ReconciliationBanner reconciliation={reconciliation} />

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Opening Balance</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            {statement.openingBalancePaise !== null ? formatINR(statement.openingBalancePaise) : 'N/A'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Credits</span>
          <div className="text-base font-bold text-emerald-600 mt-1">
            +{formatINR(reconciliation?.totalCreditsPaise || 0)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Debits</span>
          <div className="text-base font-bold text-rose-600 mt-1">
            -{formatINR(reconciliation?.totalDebitsPaise || 0)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Closing Balance</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            {statement.closingBalancePaise !== null ? formatINR(statement.closingBalancePaise) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Statement Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Statement Transactions ({transactions.length})
          </h2>
          <span className="text-xs text-slate-500">Ordered chronologically</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-600">
                    {formatDate(t.transactionDate)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 max-w-sm truncate">
                    {t.description}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadge(
                        t.category
                      )}`}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-500 font-semibold text-[11px]">
                    {t.classification}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${
                      t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {t.direction === 'CREDIT' ? '+' : '-'} {formatINR(t.amountPaise)}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-500">
                    {t.balancePaise !== null ? formatINR(t.balancePaise) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
