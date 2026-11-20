import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileSpreadsheet, FileText, CheckCircle, BarChart3, Lock, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl text-brand-600">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              B
            </span>
            <span>Banklytics</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              Dashboard
            </Link>
            <Link
              to="/upload"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Instant Analyze</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>No Database Required • 100% Private Local Analysis • Instant CSV & PDF</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Turn Raw Bank Statements Into Instant Financial Intelligence
        </h1>

        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Drop your bank statement PDF or CSV. Automatically extract, classify, and mathematically reconcile transactions using exact paise arithmetic. No external database or banking credentials required.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/upload"
            className="px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-md transition flex items-center gap-2"
          >
            <span>Analyze Statement Now</span>
            <span>→</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-base transition shadow-xs"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-brand-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Instant CSV & PDF Ingestion</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Auto-detects statement headers, Indian comma notation (₹1,23,456.78), running balances, and wrapped transaction narrations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Mathematical Reconciliation</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Calculates opening balance + credits - debits against observed closing balance. Alerts on any discrepancy immediately.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Zero Config & Total Privacy</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              No MongoDB or external cloud DB required. Runs completely offline on local storage with deterministic calculations.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        © 2026 Banklytics. Built for privacy-first personal financial management.
      </footer>
    </div>
  );
}
