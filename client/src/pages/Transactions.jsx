import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { transactionService } from '../services/transactionService.js';
import { formatINR, formatDate, getCategoryBadge } from '../utils/formatters.js';

const STANDARD_CATEGORIES = [
  'All Categories',
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

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [category, setCategory] = useState('');
  const [classification, setClassification] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Editing Modal State
  const [editingTxn, setEditingTxn] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    category: '',
    classification: 'OTHER',
  });

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions({
        page,
        limit: 25,
        q: search || undefined,
        direction: direction || undefined,
        category: category && category !== 'All Categories' ? category : undefined,
        classification: classification || undefined,
        sort,
        from: from || undefined,
        to: to || undefined,
      });

      setTransactions(data.transactions || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, [direction, category, classification, sort, from, to]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await transactionService.deleteTransaction(id);
      loadTransactions(pagination.page);
    } catch (err) {
      alert('Failed to delete transaction.');
    }
  };

  const handleOpenEdit = (t) => {
    setEditingTxn(t);
    setEditForm({
      description: t.description,
      category: t.category,
      classification: t.classification,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTxn) return;

    try {
      await transactionService.updateTransaction(editingTxn._id, editForm);
      setEditingTxn(null);
      loadTransactions(pagination.page);
    } catch (err) {
      alert('Failed to update transaction.');
    }
  };

  const handleExportCSV = () => {
    const url = transactionService.getExportUrl({
      direction: direction || undefined,
      category: category && category !== 'All Categories' ? category : undefined,
      from: from || undefined,
      to: to || undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, update categories, and export audit-ready canonical transactions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition self-start"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, reference, merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </form>

          {/* Direction */}
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Directions (Credit & Debit)</option>
            <option value="CREDIT">Credits Only (+)</option>
            <option value="DEBIT">Debits Only (-)</option>
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
          >
            {STANDARD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date Ranges and Sort */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span>To:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="date_desc">Date (Newest first)</option>
              <option value="date_asc">Date (Oldest first)</option>
              <option value="amount_desc">Amount (Highest first)</option>
              <option value="amount_asc">Amount (Lowest first)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Account / Statement</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No transactions match the current filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                      {formatDate(t.transactionDate)}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{t.description}</div>
                      {t.reference && (
                        <div className="text-[10px] text-slate-400 truncate">Ref: {t.reference}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {t.statementId?.accountLabel || t.statementId?.bankName || 'Statement'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadge(
                          t.category
                        )}`}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[11px] font-semibold text-slate-500">
                      {t.classification}
                    </td>
                    <td
                      className={`py-3 px-4 text-right whitespace-nowrap font-bold ${
                        t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {t.direction === 'CREDIT' ? '+' : '-'} {formatINR(t.amountPaise)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Transaction"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition mr-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        title="Delete Transaction"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {transactions.length} of {pagination.total} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadTransactions(pagination.page - 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadTransactions(pagination.page + 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Transaction Record</h3>
              <button
                onClick={() => setEditingTxn(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {STANDARD_CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Classification</label>
                <select
                  value={editForm.classification}
                  onChange={(e) => setEditForm({ ...editForm, classification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="EXPENSE">EXPENSE</option>
                  <option value="INCOME">INCOME</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="REFUND">REFUND</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
