import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogOut, User as UserIcon, UploadCloud, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-brand-600 tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black">
            B
          </div>
          <span>Banklytics</span>
        </Link>
        <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
          MERN Statement Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Statement</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">{user.name}</span>
              <span className="text-[10px] text-slate-400">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
