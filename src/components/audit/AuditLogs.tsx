import React, { useState, useMemo } from 'react';
import { History, Search, Download, ShieldCheck, Filter, User, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatLagosDateTime, exportToCSV, getRoleLabel } from '../../utils/formatters';

export const AuditLogs: React.FC = () => {
  const { auditLogs, globalSearchQuery } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        log.userName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (log.recordId && log.recordId.toLowerCase().includes(effectiveSearch.toLowerCase()));

      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [auditLogs, effectiveSearch, moduleFilter]);

  const handleExportLogs = () => {
    const rows = auditLogs.map(l => ({
      Timestamp: l.timestamp,
      User: l.userName,
      Role: l.userRole,
      Action: l.action,
      Module: l.module,
      RecordID: l.recordId || '',
      Details: l.details,
    }));
    exportToCSV(`offnot_audit_logs_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <span>Immutable Business Security Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped audit log of all financial transactions, stock adjustments, role changes, and approvals.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user name, affected record ID, reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Filter by Module:</span>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Modules</option>
            <option value="inventory">Inventory & Adjustments</option>
            <option value="sales">Sales & POS</option>
            <option value="purchasing">Purchasing & Vendor Receipts</option>
            <option value="projects">Installation Projects</option>
            <option value="expenses">Expenses & Disbursements</option>
            <option value="settings">System Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                <th className="py-3 px-4">Timestamp (Lagos)</th>
                <th className="py-3 px-3">Authorized User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Affected Record</th>
                <th className="py-3 px-4">Audit Details & Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No audit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatLagosDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {getRoleLabel(log.userRole)}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap capitalize text-slate-700 font-medium">
                      {log.module}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-emerald-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 text-[11px] whitespace-nowrap">
                      {log.recordId || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      <p className="leading-relaxed">{log.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
