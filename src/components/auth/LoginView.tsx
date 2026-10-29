/**
 * Authentication & Login Screen
 * Offnot Energy Business Management System
 * Location: Ibadan, Oyo State, Nigeria
 */

import React, { useState } from 'react';
import {
  Sun,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../services/storage';
import { BRAND_LOGO_URL } from '../../constants/branding';

export const LoginView: React.FC = () => {
  const { login, users } = useApp();
  const [identifier, setIdentifier] = useState('francisgabriel932@gmail.com');
  const [password, setPassword] = useState('SuperAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(identifier, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
      }
    }, 350);
  };

  const handleQuickSelect = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Solar Grids */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-500 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-2xl shadow-emerald-950/60 mb-3 flex items-center justify-center border-2 border-emerald-500/40">
            <img
              src={BRAND_LOGO_URL}
              alt="Offnot Energy"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            OFFNOT ENERGY
          </h1>
          <p className="mt-1 text-sm font-medium text-emerald-400/90 tracking-wide uppercase">
            Clean Energy, Stronger Tomorrow
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ibadan Operations & Multi-Branch Hub</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Sign In to Workspace</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access inventory, multi-branch POS, financial ledger & installations
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
              <span className="font-bold text-rose-400">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@offnotenergy.ng or admin"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-950/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-950/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 mr-2"
                />
                Keep me logged in
              </label>
              <span className="text-emerald-400 text-xs font-medium cursor-pointer hover:underline">
                Zero Ledger Mode
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Click Role Login
              </span>
              <span className="text-[11px] text-slate-500">Pick any role to test</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {(users.length > 0 ? users.slice(0, 8) : INITIAL_USERS.slice(0, 8)).map((u) => {
                const isSelected = identifier === u.email || identifier === u.username;
                const isSuperAdmin = u.role === 'super_admin';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u.email, u.temporaryPassword || (isSuperAdmin ? 'SuperAdmin2026!' : 'Admin2026!'))}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500/80 text-white shadow-xs'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate block capitalize">
                        {u.role === 'super_admin' ? 'Superadmin' : u.role.replace('_', ' ')}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block font-medium">
                      {u.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70 text-[11px] text-slate-400 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Superadmin (Francis Gabriel):</span>
                </div>
                <div className="font-mono text-emerald-200 select-all text-[11px] pl-5">
                  francisgabriel932@gmail.com / SuperAdmin2026!
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Deputy Admin (Ayomide Bakare):</span>
                </div>
                <div className="font-mono text-slate-300 select-all text-[11px] pl-5">
                  admin@offnotenergy.ng / Admin2026!
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-1">
                Admin operates when Superadmin is away. Superadmin can provision accounts, delete staff, and reset passwords.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Offnot Energy Business Management System</span>
          <span>•</span>
          <span>Version 3.0 Clean Zero Ledger</span>
        </div>
      </div>
    </div>
  );
};
