import React, { useState } from 'react';
import {
  Database,
  Copy,
  Download,
  Check,
  FileCode,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { MIGRATION_FILES, MigrationFile, getSupabaseConfig, testSupabaseConnection } from '../../services/supabaseClient';

// Embedded SQL content for instant in-browser viewing, copy-pasting, and downloading
import masterSql from '../../migration/05_complete_migration_single_file.sql?raw';
import schemaSql from '../../migration/01_schema.sql?raw';
import triggersSql from '../../migration/02_triggers_and_functions.sql?raw';
import rlsSql from '../../migration/03_rls_security_rules.sql?raw';
import seedSql from '../../migration/04_seed_data.sql?raw';

export const MigrationViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('05_complete_migration_single_file.sql');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ testing: boolean; message?: string; connected?: boolean } | null>(null);

  const supabaseConfig = getSupabaseConfig();

  const handleTestConnection = async () => {
    setTestResult({ testing: true });
    const result = await testSupabaseConnection();
    setTestResult({
      testing: false,
      message: result.message,
      connected: result.connected,
    });
  };

  const getSqlContent = (filename: string): string => {
    switch (filename) {
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
        return masterSql;
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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Supabase SQL Migrations & Database Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            All SQL migration codes are saved in the project repository at{' '}
            <code className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px]">
              /src/migration/
            </code>
            . You can review, copy, or download the migration files below to set up Supabase as your primary backend database.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Migration Files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File List */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            Migration Source Files ({MIGRATION_FILES.length})
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
                      className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supabase Client Status & Test Trigger */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase Client Status</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  supabaseConfig.isConfigured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {supabaseConfig.isConfigured ? 'Connected' : 'Local Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Initialized from <code className="font-mono text-emerald-700">src/lib/supabase.ts</code>
            </p>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testResult?.testing}
              className="w-full mt-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{testResult?.testing ? 'Testing connection...' : 'Test Supabase Client Connection'}</span>
            </button>

            {testResult && !testResult.testing && (
              <div
                className={`p-2 rounded text-[10px] font-medium border ${
                  testResult.connected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Quick Migration Instructions Box */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2.5 mt-3">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Terminal className="w-4 h-4" />
              <span>3-Step Supabase Migration</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
              <li>Open your project at <strong>supabase.com</strong></li>
              <li>Navigate to <strong>SQL Editor</strong> on the sidebar</li>
              <li>Select the Master script, click <strong>"Copy SQL Code"</strong>, paste into Supabase and click <strong>RUN</strong></li>
            </ol>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              All 15 tables, indexes, RLS policies, and Ibadan seed records will be created automatically.
            </p>
          </div>
        </div>

        {/* Right Column: Code Viewer with Copy & Download */}
        <div className="lg:col-span-8 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md flex flex-col h-[700px] overflow-hidden">
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
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Code'}</span>
              </button>

              <button
                onClick={() => handleDownload(selectedFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Download .sql file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File</span>
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-emerald-300/90 selection:bg-emerald-900 selection:text-white">
            <pre className="whitespace-pre">{currentContent}</pre>
          </div>

          {/* Code Viewer Footer */}
          <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>PostgreSQL 15+ / Supabase Compatible</span>
            <span className="font-mono">{currentContent.split('\n').length} lines</span>
          </div>
        </div>
      </div>
    </div>
  );
};
