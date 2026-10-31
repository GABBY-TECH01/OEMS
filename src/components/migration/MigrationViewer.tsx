import React, { useState } from 'react';
import {
  Database,
  Copy,
  Download,
  Check,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Layers,
  ArrowRight,
  Upload,
  Smartphone,
  Laptop,
  Globe,
  CloudDownload,
  Info,
} from 'lucide-react';
import { MIGRATION_FILES, MigrationFile } from '../../services/supabaseClient';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseConfigSource,
  isSupabaseConfigured,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  syncLocalToSupabase,
} from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

import patchSql from '../../migration/06_incremental_handshake_patch.sql?raw';
import masterSql from '../../migration/05_complete_migration_single_file.sql?raw';
import schemaSql from '../../migration/01_schema.sql?raw';
import triggersSql from '../../migration/02_triggers_and_functions.sql?raw';
import rlsSql from '../../migration/03_rls_security_rules.sql?raw';
import seedSql from '../../migration/04_seed_data.sql?raw';

export const MigrationViewer: React.FC = () => {
  const { branches, users, categories, suppliers, products, customers, settings, isSupabaseConnected, syncWithSupabase, supabaseSyncTime, supabaseLoading } = useApp();

  const [selectedFile, setSelectedFile] = useState<string>('06_incremental_handshake_patch.sql');
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState<string>(getSupabaseUrl());
  const [inputAnonKey, setInputAnonKey] = useState<string>(getSupabaseAnonKey());
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());

  // Connection & Sync test states
  const [testResult, setTestResult] = useState<{
    testing: boolean;
    message?: string;
    connected?: boolean;
    tablesFound?: string[];
    missingTables?: string[];
  } | null>(null);

  const [syncStatus, setSyncStatus] = useState<{
    syncing: boolean;
    success?: boolean;
    message?: string;
  } | null>(null);

  const [pullStatus, setPullStatus] = useState<{
    pulling: boolean;
    success?: boolean;
    message?: string;
  } | null>(null);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const configSource = getSupabaseConfigSource();

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim().startsWith('http')) {
      setSaveMessage('Error: Supabase Project URL must start with https://');
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }
    if (!inputAnonKey.trim()) {
      setSaveMessage('Error: Please enter your Supabase anon public key.');
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }

    const res = saveSupabaseCredentials(inputUrl, inputAnonKey);
    if (res.success) {
      setIsConfigured(true);
      setSaveMessage('Supabase credentials saved successfully! Now test your connection.');
      setTimeout(() => setSaveMessage(null), 4000);
      handleTestConnection();
    } else {
      setSaveMessage(res.error || 'Failed to save credentials.');
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleClearCredentials = () => {
    clearSupabaseCredentials();
    setInputUrl('');
    setInputAnonKey('');
    setIsConfigured(false);
    setTestResult(null);
    setSaveMessage('Cleared Supabase credentials.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setTestResult({ testing: true });
    const result = await testSupabaseConnection();
    setTestResult({
      testing: false,
      message: result.message,
      connected: result.connected,
      tablesFound: result.tablesFound,
      missingTables: result.missingTables,
    });
  };

  const handleSyncToSupabase = async () => {
    setSyncStatus({ syncing: true });
    const res = await syncLocalToSupabase({
      branches,
      users,
      categories,
      suppliers,
      products,
      customers,
      settings,
    });
    setSyncStatus({
      syncing: false,
      success: res.success,
      message: res.message,
    });
    setTimeout(() => {
      handleTestConnection();
    }, 1000);
  };

  const handlePullCloudData = async () => {
    setPullStatus({ pulling: true });
    try {
      const ok = await syncWithSupabase();
      if (ok) {
        setPullStatus({
          pulling: false,
          success: true,
          message: 'All 16 tables pulled from Supabase! Your system state is now 100% in sync with your cloud database.',
        });
      } else {
        setPullStatus({
          pulling: false,
          success: false,
          message: 'Could not pull data from Supabase. Please verify your Supabase URL, anon key, and ensure RLS allows read access.',
        });
      }
    } catch (err: unknown) {
      setPullStatus({
        pulling: false,
        success: false,
        message: `Error pulling from Supabase: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
    setTimeout(() => {
      setPullStatus(null);
    }, 6000);
  };

  const handleCopyEnvVars = () => {
    const url = inputUrl || getSupabaseUrl();
    const key = inputAnonKey || getSupabaseAnonKey();
    const envString = `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${key}`;
    navigator.clipboard.writeText(envString);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  const getSqlContent = (filename: string): string => {
    switch (filename) {
      case '06_incremental_handshake_patch.sql':
        return patchSql;
      case '05_complete_migration_single_file.sql':
        return masterSql;
      case '01_schema.sql':
        return schemaSql;
      case '02_triggers_and_functions.sql':
        return triggersSql;
      case '03_rls_security_rules.sql':
        return rlsSql;
      case '04_seed_data.sql':
        return seedSql;
      default:
        return patchSql;
    }
  };

  const currentContent = getSqlContent(selectedFile);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (filename: string) => {
    const content = getSqlContent(filename);
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename === '05_complete_migration_single_file.sql' ? 'offnot_energy_supabase_master_migration.sql' : filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ALL_EXPECTED_TABLES = [
    { name: 'branches', desc: 'Multi-branch stores (HQ, Dalute, Iwo)' },
    { name: 'user_profiles', desc: 'Francis Gabriel Superadmin & staff RBAC' },
    { name: 'categories', desc: '15 solar product classifications' },
    { name: 'suppliers', desc: 'Felicity, Jinko, Itel, Coleman Cables' },
    { name: 'products', desc: 'Solar inventory (clean zero ledger)' },
    { name: 'stock_movements', desc: 'Immutable stock receipts & deductions' },
    { name: 'customers', desc: 'CRM and solar installer database' },
    { name: 'purchase_orders', desc: 'Vendor procurement orders' },
    { name: 'sales', desc: 'POS invoices & transactions' },
    { name: 'payments', desc: 'Customer and supplier payments' },
    { name: 'quotations', desc: 'Commercial solar system proposals' },
    { name: 'installation_projects', desc: 'Solar engineering installations' },
    { name: 'expenses', desc: 'Operating expenses (OPEX)' },
    { name: 'audit_logs', desc: 'Security audit trail & login records' },
    { name: 'app_notifications', desc: 'In-app alert dispatch records' },
    { name: 'company_settings', desc: 'Offnot Energy corporate profile' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 mb-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud Database & SQL Migration Console</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Supabase PostgreSQL Master Database Hub
          </h2>
          <p className="text-xs md:text-sm text-emerald-100/80 mt-1 max-w-3xl leading-relaxed">
            Run the all-in-one SQL migration script in your Supabase project (<strong>OEMS</strong>) to instantly provision all 16 relational database tables, triggers, and zero-ledger records. Then connect your credentials below to make Supabase your only primary database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Full Script!' : 'Copy Master SQL'}</span>
          </button>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all"
          >
            <span>Open Supabase</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Visual Step-by-Step Guide Matching User's Screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              How to Populate Your Supabase Project (Project OEMS)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Takes ~30 seconds
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">Open SQL Editor</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              In your Supabase project (<strong>OEMS</strong>), look at the left dark sidebar and click the <strong>SQL Editor</strong> icon (the <code className="font-mono font-bold text-emerald-800">&gt;_</code> symbol, 3rd icon down, directly under Table Editor).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">Create New Query</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Click the <strong>&quot;+ New query&quot;</strong> button at the top of the SQL Editor to open a blank SQL query window.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">Paste &amp; Click Run</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Click <strong>&quot;Copy Master SQL&quot;</strong> button above, paste the complete script into Supabase, and click the green <strong>RUN</strong> button (or press <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+Enter</kbd>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-900">View All 16 Tables</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Return to <strong>Table Editor</strong> (the 2nd icon on the sidebar). All 16 tables, branches, staff, products, and categories will now be present and ready!
            </p>
          </div>
        </div>
      </div>

      {/* Vercel & Multi-Device Live Handshake Card */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl border border-emerald-800/40 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Multi-Device Cloud Handshake (Vercel &harr; Supabase &harr; Android &amp; Laptop)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Universal Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Why your Android phone showed different data from your laptop: Saving credentials in the browser input only stores them in that single browser&apos;s local storage. To connect <strong>all phones, laptops, and tablets permanently</strong>, add the two variables below to your Vercel Project Settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyEnvVars}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEnv ? 'Copied Env Vars!' : 'Copy Vercel Env Vars'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-200">Open Vercel Settings</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">vercel.com</a> ➔ Your Project ➔ <strong>Settings</strong> ➔ <strong>Environment Variables</strong>.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-200">Add the 2 Variables</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste <code className="text-emerald-300 font-mono">VITE_SUPABASE_URL</code> and <code className="text-emerald-300 font-mono">VITE_SUPABASE_ANON_KEY</code>. Check Production, Preview, &amp; Dev.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold text-slate-200">Redeploy Latest Commit</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Go to Deployments ➔ Click <code className="font-mono text-slate-300">...</code> on your latest commit ➔ <strong>Redeploy</strong>. Every device now reads live Supabase!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Live Credentials Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-800" />
              <span>Connect Supabase to Offnot Energy System</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your Project URL and Anon Public Key from your Supabase Dashboard (under <strong>Project Settings ➔ API</strong>) to make Supabase your live system database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{isConfigured ? 'Supabase Configured' : 'Needs Configuration'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {configSource === 'vercel_env' ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vercel Env Active (All Devices)</span>
                </>
              ) : configSource === 'local_storage' ? (
                <>
                  <Laptop className="w-3.5 h-3.5 text-amber-600" />
                  <span>Browser Storage (This Device)</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span>Default Config File</span>
                </>
              )}
            </span>
          </div>
        </div>

        {saveMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Project URL *
              </label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                placeholder="https://xyzabcdefghijklm.supabase.co"
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Found in Supabase under Project Settings ➔ API ➔ Project URL
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Anon Public API Key *
              </label>
              <input
                type="text"
                required
                value={inputAnonKey}
                onChange={e => setInputAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Found under Project Settings ➔ API ➔ Project API Keys (anon public)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Connect Supabase</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult?.testing}
                className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testResult?.testing ? 'animate-spin' : ''}`} />
                <span>{testResult?.testing ? 'Testing Tables...' : 'Test Connection & Check Tables'}</span>
              </button>

              {isConfigured && (
                <>
                  <button
                    type="button"
                    onClick={handlePullCloudData}
                    disabled={pullStatus?.pulling || supabaseLoading}
                    className="px-4 py-2 text-xs font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Download and refresh all 16 tables live from Supabase into your UI"
                  >
                    <CloudDownload className={`w-3.5 h-3.5 text-sky-700 ${pullStatus?.pulling || supabaseLoading ? 'animate-bounce' : ''}`} />
                    <span>{pullStatus?.pulling || supabaseLoading ? 'Pulling from Supabase...' : 'Pull Live Cloud Data'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={syncStatus?.syncing}
                    className="px-4 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Upload all local inventory products and branch structures to Supabase"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{syncStatus?.syncing ? 'Syncing to Supabase...' : 'Sync Local Data to Supabase'}</span>
                  </button>
                </>
              )}
            </div>

            {isConfigured && (
              <button
                type="button"
                onClick={handleClearCredentials}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Disconnect Supabase
              </button>
            )}
          </div>
        </form>

        {pullStatus && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              pullStatus.success
                ? 'bg-sky-50 border-sky-200 text-sky-950'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {pullStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{pullStatus.message}</span>
          </div>
        )}

        {syncStatus && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              syncStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {syncStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* Real-time Table Verification Grid */}
        {testResult && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Supabase Database Table Status Check</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Found {testResult.tablesFound?.length || 0} / {ALL_EXPECTED_TABLES.length} tables
              </span>
            </div>

            <p className="text-xs text-slate-600">{testResult.message}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {ALL_EXPECTED_TABLES.map(t => {
                const isFound = testResult.tablesFound?.includes(t.name);
                return (
                  <div
                    key={t.name}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isFound
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px]">{t.name}</span>
                      {isFound ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {isFound ? 'Created & Live' : 'Not yet created'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Migration Source Files Grid & SQL Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File List */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            Migration SQL Files in Repository ({MIGRATION_FILES.length})
          </h3>

          <div className="space-y-1.5">
            {MIGRATION_FILES.map(file => {
              const isSelected = selectedFile === file.filename;
              return (
                <div
                  key={file.filename}
                  onClick={() => setSelectedFile(file.filename)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/40 ring-1 ring-emerald-700 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{file.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">.sql</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {file.description}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-emerald-800 font-medium">/src/migration/{file.filename}</span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDownload(file.filename);
                      }}
                      className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer with Copy & Download */}
        <div className="lg:col-span-8 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md flex flex-col h-[650px] overflow-hidden">
          {/* Code Viewer Header */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                /src/migration/{selectedFile}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(selectedFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Download .sql file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save .sql File</span>
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-emerald-300/90 selection:bg-emerald-900 selection:text-white">
            <pre className="whitespace-pre">{currentContent}</pre>
          </div>

          {/* Code Viewer Footer */}
          <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Supabase / PostgreSQL 15+ Single Script</span>
            <span className="font-mono">{currentContent.split('\n').length} lines</span>
          </div>
        </div>
      </div>
    </div>
  );
};
