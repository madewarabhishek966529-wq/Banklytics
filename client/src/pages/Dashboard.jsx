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
  Sparkles,
  Download,
  AlertTriangle,
  Lightbulb,
  Building2,
  ShieldCheck,
  HeartPulse,
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
  const [merchants, setMerchants] = useState([]);
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
      const [sumRes, monthRes, catRes, merchantRes, txnRes] = await Promise.all([
        analyticsService.getSummary(from, to),
        analyticsService.getMonthly(from, to),
        analyticsService.getCategories('DEBIT', from, to),
        analyticsService.getMerchants(from, to),
        transactionService.getTransactions({ limit: 6, sort: 'date_desc' }),
      ]);

      setSummary(sumRes);

      const formattedMonthly = (monthRes.months || []).map((m) => ({
        month: m.month,
        Credits: m.creditsPaise / 100,
        Debits: m.debitsPaise / 100,
      }));
      setMonthlyData(formattedMonthly);

      const formattedCats = (catRes.categories || []).map((c) => ({
        name: c.category,
        value: c.totalPaise / 100,
        percentage: c.percentage,
      }));
      setCategoryData(formattedCats);

      setMerchants(merchantRes.merchants || []);
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
      {/* Top Header & Report Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Personal Financial Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic financial analysis, merchant recognition, anomaly detection & local AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Assistant Button */}
          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ask AI Analyst</span>
          </Link>

          {/* Download PDF Report */}
          <a
            href={analyticsService.getPDFReportUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF Report</span>
          </a>

          {/* Download Excel Report */}
          <a
            href={analyticsService.getExcelReportUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Flagged Anomalies Banner if any */}
      {summary?.anomalies && summary.anomalies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold text-amber-950 text-sm">
              Flagged Unusual Transactions ({summary.anomalies.length})
            </p>
            <p className="text-amber-800">
              Our automated audit flagged high-value expenses or potential duplicate charges for your review:
            </p>
            <div className="space-y-1 pt-1">
              {summary.anomalies.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>
                    <strong>{a.transaction?.description}</strong>: {formatINR(a.transaction?.amountPaise)} — {a.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Income"
          amount={formatINR(summary?.creditsPaise || 0)}
          subtitle="Salary & inflows"
          icon={TrendingUp}
          color="emerald"
        />
        <SummaryCard
          title="Total Outflows"
          amount={formatINR(summary?.debitsPaise || 0)}
          subtitle="All debit entries"
          icon={TrendingDown}
          color="rose"
        />
        <SummaryCard
          title="Real Spending"
          amount={formatINR(summary?.actualConsumptionSpendPaise || 0)}
          subtitle="Excludes P2P transfers"
          icon={Receipt}
          color="indigo"
        />
        <SummaryCard
          title="Transfers (P2P/Self)"
          amount={formatINR(summary?.totalTransfersPaise || 0)}
          subtitle="Person-to-person & internal"
          icon={ArrowRightLeft}
          color="amber"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Financial Health</p>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900">{summary?.healthScore || 50} / 100</h3>
            <p className="text-xs text-slate-500 mt-1">Savings Rate: {summary?.savingsRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cash Flow Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Cash Flow Trend</h2>
              <p className="text-xs text-slate-500">Inflow vs outflow comparison</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Values in ₹ (Rupees)
            </span>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <span>No monthly data available yet. Upload a statement to begin.</span>
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
                    formatter={(value) => [
                      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value),
                      '',
                    ]}
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

      {/* Intelligence Row: Top Merchants & Potential Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Top Recipient Merchants</span>
              </h2>
              <p className="text-xs text-slate-500">Merchants receiving the largest share of payments</p>
            </div>
          </div>

          {merchants.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No merchant data available yet.</p>
          ) : (
            <div className="space-y-3">
              {merchants.slice(0, 5).map((m, idx) => (
                <div key={m.merchant} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{idx + 1}. {m.merchant}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">{m.count} payments • {m.category}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatINR(m.totalPaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Potential Savings Opportunities Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Potential Savings Opportunities</span>
              </h2>
              <p className="text-xs text-slate-500">Actionable analyst recommendations</p>
            </div>
          </div>

          {!summary?.savingsOpportunities || summary.savingsOpportunities.length === 0 ? (
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
              <p className="font-semibold text-emerald-950">Discretionary Spending in Control</p>
              <p className="mt-1">
                Your spending in food delivery, e-commerce, and entertainment is well-balanced. Keep up your current savings trajectory!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.savingsOpportunities.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{s.category}</span>
                    <span className="text-emerald-700">Save ~{formatINR(s.potentialMonthlySavingsPaise)} / mo</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{s.recommendation}</p>
                </div>
              ))}
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
            <p className="mt-1">Upload a PDF, CSV, or Excel statement to see transactions and analytics.</p>
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
