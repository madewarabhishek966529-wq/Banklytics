import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Receipt,
  UploadCloud,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsService } from '../services/analyticsService.js';
import { transactionService } from '../services/transactionService.js';
import SummaryCard from '../components/common/SummaryCard.jsx';
import { formatINR, formatDate, getCategoryBadge } from '../utils/formatters.js';

const CATEGORY_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
  '#84cc16',
  '#f97316',
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [rangePreset, setRangePreset] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    let from = null;
    let to = null;

    const now = new Date();
    if (rangePreset === '30D') {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      from = d.toISOString().slice(0, 10);
    } else if (rangePreset === '90D') {
      const d = new Date();
      d.setDate(now.getDate() - 90);
      from = d.toISOString().slice(0, 10);
    } else if (rangePreset === 'YEAR') {
      from = `${now.getFullYear()}-01-01`;
    }

    try {
      const [sumRes, monthRes, catRes, txnRes] = await Promise.all([
        analyticsService.getSummary(from, to),
        analyticsService.getMonthly(from, to),
        analyticsService.getCategories('DEBIT', from, to),
        transactionService.getTransactions({ limit: 8, sort: 'date_desc' }),
      ]);

      setSummary(sumRes);

      // Format monthly for Recharts
      const formattedMonthly = (monthRes.months || []).map((m) => ({
        month: m.month,
        Credits: m.creditsPaise / 100,
        Debits: m.debitsPaise / 100,
      }));
      setMonthlyData(formattedMonthly);

      // Format categories for Recharts
      const formattedCats = (catRes.categories || []).map((c) => ({
        name: c.category,
        value: c.totalPaise / 100,
        percentage: c.percentage,
      }));
      setCategoryData(formattedCats);

      setRecentTxns(txnRes.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [rangePreset]);

  return (
    <div className="space-y-8">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated statement totals computed via exact integer paise arithmetic.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs self-start">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {['ALL', '30D', '90D', 'YEAR'].map((preset) => (
            <button
              key={preset}
              onClick={() => setRangePreset(preset)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                rangePreset === preset
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {preset === 'ALL'
                ? 'All Time'
                : preset === '30D'
                ? 'Last 30 Days'
                : preset === '90D'
                ? 'Last 90 Days'
                : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          title="Total Inflow (Credits)"
          amount={formatINR(summary?.creditsPaise || 0)}
          subtitle="Salary, refunds, dividends & deposits"
          icon={TrendingUp}
          color="emerald"
        />
        <SummaryCard
          title="Total Outflow (Debits)"
          amount={formatINR(summary?.debitsPaise || 0)}
          subtitle="Expenses, bills, ATM & withdrawals"
          icon={TrendingDown}
          color="rose"
        />
        <SummaryCard
          title="Net Cash Flow"
          amount={formatINR(summary?.netCashFlowPaise || 0)}
          subtitle="Credits minus debits (Not net savings)"
          icon={ArrowRightLeft}
          color={(summary?.netCashFlowPaise || 0) >= 0 ? 'indigo' : 'amber'}
        />
        <SummaryCard
          title="Transactions Analyzed"
          amount={String(summary?.transactionCount || 0)}
          subtitle="Across imported statements"
          icon={Receipt}
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cash Flow Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Cash Flow</h2>
              <p className="text-xs text-slate-500">Comparing total credits and debits per month</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Values in ₹ (Rupees)
            </span>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <span>No monthly data available yet. Import a statement to view trends.</span>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(value) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Credits" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Debits" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Spending Category Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900">Spending by Category</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown of debited transactions</p>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <span>No debit categories recorded.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [
                        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val),
                        'Amount',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-1">
                {categoryData.slice(0, 5).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                      <span className="truncate text-slate-700 font-medium">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 ml-2">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest parsed and normalized records</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            View all transactions →
          </Link>
        </div>

        {recentTxns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 text-sm">No transactions found</p>
            <p className="mt-1">Upload a CSV or PDF statement to see transactions and analytics.</p>
            <Link
              to="/upload"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-xs shadow-sm hover:bg-brand-700 transition"
            >
              Upload Statement Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Classification</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTxns.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-6 whitespace-nowrap font-medium text-slate-600">
                      {formatDate(t.transactionDate)}
                    </td>
                    <td className="py-3 px-6 font-medium text-slate-900 max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadge(
                          t.category
                        )}`}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {t.classification}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-6 text-right whitespace-nowrap font-bold ${
                        t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {t.direction === 'CREDIT' ? '+' : '-'} {formatINR(t.amountPaise)}
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
