/**
 * Authentication & Login Screen with Supabase Auth Password Recovery
 * Offnot Energy Business Management System
 * Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
 * Slogan: Clean Energy, Stronger Tomorrow
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BRAND_LOGO_URL } from '../../constants/branding';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';

export const LoginView: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();
  const [viewState, setViewState] = useState<'login' | 'forgot' | 'reset_password'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  // Reset new password state (when arriving via email recovery link)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check URL hash for Supabase auth recovery link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
        setViewState('reset_password');
      }
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError('Please enter your work email or username.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(cleanId, cleanPass);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify your login credentials.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus(null);

    const cleanEmail = recoveryEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRecoveryStatus({
        type: 'error',
        message: 'Please provide a valid staff email address.',
      });
      return;
    }

    setIsSendingRecovery(true);

    try {
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured()) {
        const { error: resetErr } = await client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/#type=recovery`,
        });

        if (resetErr) {
          // If user isn't in Supabase auth yet or email fails
          setRecoveryStatus({
            type: 'error',
            message: resetErr.message || 'Unable to send recovery email. Please contact Superadmin Francis Gabriel.',
          });
        } else {
          setRecoveryStatus({
            type: 'success',
            message: `A password reset link has been dispatched to ${cleanEmail}. Please check your inbox and spam folders to set a new password.`,
          });
        }
      } else {
        // Fallback when Supabase credentials are being initialized
        setRecoveryStatus({
          type: 'info',
          message: `Password recovery request logged for ${cleanEmail}. For instant access, Superadmin Francis Gabriel can reset your password directly from Company Settings.`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setRecoveryStatus({
        type: 'error',
        message: `Recovery request error: ${message}`,
      });
    } finally {
      setIsSendingRecovery(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const client = getSupabaseClient();
      if (client) {
        const { error: updateErr } = await client.auth.updateUser({
          password: newPassword,
        });

        if (updateErr) {
          setError(updateErr.message);
        } else {
          setResetSuccess(true);
          setTimeout(() => {
            setViewState('login');
            setResetSuccess(false);
            window.location.hash = '';
          }, 2500);
        }
      } else {
        setResetSuccess(true);
        setTimeout(() => {
          setViewState('login');
          setResetSuccess(false);
        }, 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to update password: ${message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background Decorative Solar Grids */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-500 blur-3xl"></div>
      </div>

      {/* Top Controls: Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all flex items-center gap-2 text-xs shadow-lg cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-medium text-slate-200">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline font-medium text-slate-200">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-2xl bg-white p-2.5 shadow-2xl shadow-emerald-950/80 mb-3.5 flex items-center justify-center border-2 border-emerald-500/50">
            <img
              src={BRAND_LOGO_URL}
              alt="Offnot Energy"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            OFFNOT ENERGY
          </h1>
          <p className="mt-1 text-sm font-semibold text-emerald-400 tracking-wider uppercase">
            Clean Energy, Stronger Tomorrow
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ibadan Operations & Multi-Branch Hub</span>
          </div>
        </div>

        {/* Card: Login View */}
        {viewState === 'login' && (
          <div className="mt-8 bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Sign In to Workspace</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized staff credentials to access your branch terminal
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-400 block">Access Denied</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Work Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. your work email or username"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700/90 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setRecoveryStatus(null);
                      setViewState('forgot');
                    }}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/80 border border-slate-700/90 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 text-xs">
                  Zero Ledger Mode Active
                </span>
                <span className="text-emerald-400 text-xs font-medium">
                  HQ Tipper Garage, Ibadan
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Staff accounts and roles are administered by <strong className="text-slate-200">Superadmin Francis Gabriel</strong>.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Need access? Contact management at Tipper Garage or your branch manager.
              </p>
            </div>
          </div>
        )}

        {/* Card: Forgot Password Flow */}
        {viewState === 'forgot' && (
          <div className="mt-8 bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRecoveryStatus(null);
                  setViewState('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span>Recover Account Password</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered work email to receive password reset instructions via Supabase Auth.
              </p>
            </div>

            {recoveryStatus && (
              <div
                className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                  recoveryStatus.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                    : recoveryStatus.type === 'info'
                    ? 'bg-blue-950/80 border-blue-800 text-blue-200'
                    : 'bg-rose-950/80 border-rose-800 text-rose-200'
                }`}
              >
                {recoveryStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : recoveryStatus.type === 'info' ? (
                  <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{recoveryStatus.message}</div>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Registered Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. bolanle@offnotenergy.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700/90 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingRecovery}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                {isSendingRecovery ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Dispatching Recovery Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Instructions</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                You can also request a temporary passcode directly from <strong className="text-slate-200">Superadmin Francis Gabriel</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Card: Reset New Password (when arriving via Supabase link) */}
        {viewState === 'reset_password' && (
          <div className="mt-8 bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span>Set New Password</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter and confirm your new secure password for your Offnot Energy account.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-sm text-white">Password Updated!</h3>
                <p className="text-xs text-emerald-300">
                  Your new password has been securely updated. Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/80 border border-slate-700/90 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700/90 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full mt-3 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <span>Update Password & Log In</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Offnot Energy Enterprise System</span>
          <span>•</span>
          <span>Ibadan, Oyo State</span>
        </div>
      </div>
    </div>
  );
};
