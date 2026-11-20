import React from 'react';

export default function SummaryCard({ title, amount, subtitle, icon: Icon, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition hover:shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{amount}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
