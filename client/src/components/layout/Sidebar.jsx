import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ArrowLeftRight, UploadCloud, ShieldCheck } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Statements', path: '/statements', icon: FileText },
  { label: 'Upload Statement', path: '/upload', icon: UploadCloud },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 px-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local Financial Privacy</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Raw statements are processed privately. Calculations are strictly deterministic integer paise.
        </p>
      </div>
    </aside>
  );
}
