import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Warehouse,
  Percent,
  Receipt,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  UserCheck,
  Lock,
  Users,
  ChevronRight,
  Sliders,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Database,
  Smartphone,
  Palette,
  Sparkles,
  UploadCloud,
  Copy,
  Check,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanySettings, UserRole, PermissionKey } from '../../types';
import { getRoleLabel } from '../../utils/formatters';
import { ConfirmDialog } from '../common/CommonUI';
import { MigrationViewer } from '../migration/MigrationViewer';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';

type SettingsSubTab = 'matrix' | 'staff_roles' | 'profile' | 'branding' | 'pwa' | 'policies' | 'backup' | 'supabase';

interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Financial' | 'Inventory' | 'Sales' | 'Projects' | 'Administration';
  description: string;
}

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'view_financials',
    label: 'View Financial Dashboards & Margins',
    category: 'Financial',
    description: 'Access revenue metrics, gross profit, cost of goods sold, and executive financial reports.',
  },
  {
    key: 'override_pricing',
    label: 'Override Minimum Price & Custom Discounts',
    category: 'Sales',
    description: 'Authorize sales below minimum floor margins or give extra customer discounts.',
  },
  {
    key: 'record_sales',
    label: 'Record POS Sales & Print Receipts',
    category: 'Sales',
    description: 'Process retail and wholesale checkouts, issue official invoices, and handle customer sales.',
  },
  {
    key: 'adjust_inventory',
    label: 'Manual Stock Adjustments & Counts',
    category: 'Inventory',
    description: 'Perform stock write-offs, physical count reconciliations, and manual warehouse adjustments.',
  },
  {
    key: 'approve_purchases',
    label: 'Approve Supplier Purchase Orders',
    category: 'Inventory',
    description: 'Authorize purchase orders, sign off on inventory restocking, and record supplier invoices.',
  },
  {
    key: 'manage_projects',
    label: 'Manage Solar Installation Projects',
    category: 'Projects',
    description: 'Create solar installations, issue bill of materials, update milestones, and track commissioning.',
  },
  {
    key: 'manage_expenses',
    label: 'Record & Approve Operating Expenses',
    category: 'Financial',
    description: 'Submit, categorize, and approve branch operating expenses and petty cash disbursements.',
  },
  {
    key: 'manage_branches',
    label: 'Manage Multi-Branch Facilities',
    category: 'Administration',
    description: 'Create branch offices, configure Ibadan depots, and assign branch locations.',
  },
  {
    key: 'manage_users',
    label: 'Provision Staff Accounts & Passwords',
    category: 'Administration',
    description: 'Create staff user accounts, issue temporary credentials, and suspend employee access.',
  },
  {
    key: 'manage_settings',
    label: 'Configure Global Company Settings',
    category: 'Administration',
    description: 'Modify company branding, VAT tax settings, margins, and manage role permissions.',
  },
  {
    key: 'view_audit_logs',
    label: 'Inspect Security Audit Trails',
    category: 'Administration',
    description: 'Inspect full immutable activity trails, staff actions, and stock transaction logs.',
  },
  {
    key: 'access_all_branches',
    label: 'Access & Switch Across All Branches',
    category: 'Administration',
    description: 'Permits user to monitor, filter, and record transactions across all company branches and depots.',
  },
];

const CONFIGURABLE_ROLES: { role: UserRole; label: string; short: string }[] = [
  { role: 'admin', label: 'System Administrator (Admin)', short: 'Admin' },
  { role: 'ceo', label: 'CEO / Managing Director', short: 'CEO' },
  { role: 'manager', label: 'Operations Manager', short: 'Manager' },
  { role: 'inventory_officer', label: 'Inventory Officer', short: 'Inventory' },
  { role: 'sales_rep', label: 'Sales Representative', short: 'Sales' },
  { role: 'accountant', label: 'Accountant', short: 'Accountant' },
  { role: 'technical_staff', label: 'Solar Installation Engineer', short: 'Engineer' },
];

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    staffAccounts,
    assignStaffRole,
    rolePermissions,
    updateRolePermission,
    resetDatabase,
    resetToZeroLedger,
    refreshData,
    setActiveTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('matrix');
  const [formSettings, setFormSettings] = useState<CompanySettings>(settings);
  const [newWarehouse, setNewWarehouse] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showZeroLedgerConfirm, setShowZeroLedgerConfirm] = useState(false);
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  // Logo Upload & Dynamic PWA Manifest Customization State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);
          const scale = Math.min(size / img.width, size / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          const resized = canvas.toDataURL('image/png');
          setLogoPreview(resized);
          setFormSettings(prev => ({ ...prev, pwaLogoUrl: resized }));
        } else {
          setLogoPreview(result);
          setFormSettings(prev => ({ ...prev, pwaLogoUrl: result }));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoAndSave = async () => {
    setIsUploadingLogo(true);
    try {
      let finalLogoUrl = formSettings.pwaLogoUrl || logoPreview || '/pwa-512x512.png';
      const client = getSupabaseClient();

      if (client && isSupabaseConfigured() && logoFile) {
        try {
          const fileExt = logoFile.name.split('.').pop() || 'png';
          const fileName = `company_logo_${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadErr } = await client.storage
            .from('company-assets')
            .upload(fileName, logoFile, { upsert: true });

          if (!uploadErr && uploadData?.path) {
            const { data: publicUrlData } = client.storage
              .from('company-assets')
              .getPublicUrl(uploadData.path);
            if (publicUrlData?.publicUrl) {
              finalLogoUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.info('Supabase storage bucket note (fallback to base64 data url):', storageErr);
        }
      }

      const updated = {
        ...formSettings,
        pwaLogoUrl: finalLogoUrl,
      };

      setFormSettings(updated);
      updateSettings(updated);
      showTemporaryStatus('Company logo updated and synchronized to Supabase and PWA icons!');
    } catch (err: any) {
      alert(`Failed to save logo: ${err.message || String(err)}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const sqlQuery = `UPDATE company_settings 
SET 
  pwa_logo_url = '${(formSettings.pwaLogoUrl || '/pwa-512x512.png').replace(/'/g, "''")}',
  pwa_app_title = '${(formSettings.pwaAppTitle || 'Offnot Energy Management System').replace(/'/g, "''")}',
  pwa_short_name = '${(formSettings.pwaShortName || 'OffnotEnergy').replace(/'/g, "''")}',
  pwa_theme_color = '${(formSettings.pwaThemeColor || '#064e3b').replace(/'/g, "''")}',
  updated_at = NOW()
WHERE id = 'cfg_offnot_main';`;

  const copySqlQuery = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Access Control: Super Administrator (and Admin with full system access granted by Superadmin)
  const canAccessSettings =
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'admin' && currentUser.hasFullSystemAccess);

  if (!canAccessSettings) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Access Restricted to Super Administrator</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Company Settings, Role Permission Matrices, and Global System Policies can only be viewed and configured by the system Super Administrator.
          </p>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 inline-block font-mono">
          Your current active role: <span className="font-bold text-slate-900">{getRoleLabel(currentUser.role)}</span>
        </div>
        <div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs"
          >
            <span>Return to Main Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addWarehouse = () => {
    if (!newWarehouse.trim()) return;
    if (formSettings.warehouses.includes(newWarehouse.trim())) {
      alert('Warehouse already exists.');
      return;
    }
    const updated = [...formSettings.warehouses, newWarehouse.trim()];
    setFormSettings(prev => ({ ...prev, warehouses: updated }));
    setNewWarehouse('');
  };

  const removeWarehouse = (w: string) => {
    if (formSettings.warehouses.length <= 1) {
      alert('You must maintain at least one stock warehouse.');
      return;
    }
    const updated = formSettings.warehouses.filter(item => item !== w);
    setFormSettings(prev => ({ ...prev, warehouses: updated }));
  };

  // Full Database Export
  const handleExportBackup = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('offnot_')) {
        try {
          backup[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          backup[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `offnot_energy_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Restore Database from JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        Object.keys(data).forEach(key => {
          if (key.startsWith('offnot_')) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        });
        refreshData();
        showTemporaryStatus('Database restored successfully from backup file!');
      } catch (err: any) {
        setRestoreError(`Failed to restore: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTogglePermission = (role: UserRole, permission: PermissionKey) => {
    const currentStatus = !!rolePermissions[role]?.[permission];
    updateRolePermission(role, permission, !currentStatus);
    showTemporaryStatus(
      `Permission "${permission}" ${!currentStatus ? 'GRANTED to' : 'REVOKED from'} ${getRoleLabel(role)}.`
    );
  };

  const handleRoleAssignmentChange = (staffId: string, staffName: string, newRole: UserRole) => {
    const res = assignStaffRole(staffId, newRole);
    if (res.success) {
      showTemporaryStatus(`Role for "${staffName}" successfully reassigned to ${getRoleLabel(newRole)}.`);
    } else {
      alert(res.error || 'Failed to update staff role.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 mb-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Super Administrator Exclusive Console</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Company Settings & RBAC Governance</h2>
          <p className="text-xs md:text-sm text-emerald-100/80 mt-1 max-w-2xl">
            Assign staff roles, customize permission matrices across all 7 roles, configure Ibadan depot warehouses, and oversee financial policies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowZeroLedgerConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-xl transition-all"
            title="Clean ledger: keep products with zero balances"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clean Zero Ledger</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Company profile and warehouse configuration updated successfully.</span>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'matrix'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Role & Permission Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('staff_roles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'staff_roles'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Staff Role Assignments</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'profile'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Profile & Warehouses</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'branding'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4 text-emerald-600" />
          <span>Company Logo &amp; PWA Icons</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold">
            Upload
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pwa')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'pwa'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>PWA Mobile App &amp; Pop-up</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'policies'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Financial Policies & Margins</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'backup'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Data Backup & Zero Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeSubTab === 'supabase'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Supabase Live DB &amp; SQL</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-200/80 text-emerald-900 font-bold">
            Project OEMS
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: ROLE & PERMISSION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>Interactive Role-Based Access Control (RBAC) Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any checkbox to grant or revoke specific operational permissions per staff role. Super Administrator is locked to full access for system integrity.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-semibold text-[11px] border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  Superadmin: Full Access Locked
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4 min-w-[260px]">System Operation / Permission</th>
                    <th className="py-3 px-2 text-center bg-emerald-50/70 border-x border-emerald-200 text-emerald-900 min-w-[90px]">
                      <div className="font-bold">Super Admin</div>
                      <div className="text-[10px] text-emerald-700 font-normal">System Head</div>
                    </th>
                    {CONFIGURABLE_ROLES.map(r => (
                      <th key={r.role} className="py-3 px-2 text-center min-w-[90px] border-r border-slate-200 last:border-r-0">
                        <div className="font-bold text-slate-800">{r.short}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[85px] mx-auto">{r.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSION_DEFINITIONS.map(perm => {
                    return (
                      <tr key={perm.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{perm.label}</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                              {perm.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{perm.description}</p>
                        </td>

                        {/* Super Admin: Permanently Checked & Locked */}
                        <td className="py-3 px-2 text-center bg-emerald-50/40 border-x border-emerald-200">
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold" title="Super Administrator retains full administrative authority">
                            <Lock className="w-3.5 h-3.5 text-emerald-800" />
                          </div>
                        </td>

                        {/* Configurable Roles */}
                        {CONFIGURABLE_ROLES.map(r => {
                          const isEnabled = !!rolePermissions[r.role]?.[perm.key];
                          return (
                            <td key={r.role} className="py-3 px-2 text-center border-r border-slate-100 last:border-r-0">
                              <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handleTogglePermission(r.role, perm.key)}
                                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 border-slate-300 cursor-pointer accent-emerald-800"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <span>Permission changes take effect immediately across all sessions and active role switches.</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STAFF ROLE ASSIGNMENTS */}
      {activeSubTab === 'staff_roles' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-800" />
                  <span>Staff Role Assignments & Branch Allocation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  As Super Administrator, you can reassign any employee to a different operational role at any time.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('staff')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Open Full Staff Provisioning</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Username / Email</th>
                    <th className="py-3 px-3">Assigned Branch</th>
                    <th className="py-3 px-3">Current Role</th>
                    <th className="py-3 px-4 min-w-[200px]">Reassign Role</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffAccounts.map(staff => {
                    const isSelf = staff.id === currentUser.id || staff.role === 'super_admin';
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {staff.name[0]}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{staff.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{staff.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono text-slate-800 font-semibold block">{staff.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{staff.email}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700 block">{staff.branchName || 'Ibadan Headquarters'}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {getRoleLabel(staff.role)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isSelf ? (
                            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Super Administrator (Locked)</span>
                            </span>
                          ) : (
                            <select
                              value={staff.role}
                              onChange={e => handleRoleAssignmentChange(staff.id, staff.name, e.target.value as UserRole)}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
                            >
                              <option value="ceo">CEO / Managing Director</option>
                              <option value="manager">Operations Manager</option>
                              <option value="inventory_officer">Inventory Officer</option>
                              <option value="sales_rep">Sales Representative</option>
                              <option value="accountant">Accountant</option>
                              <option value="technical_staff">Solar Installation Engineer</option>
                            </select>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              staff.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {staff.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPANY PROFILE & WAREHOUSES */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>Company Information & Official Branding</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appears on official receipts, quotation headers, commercial invoices, and project sign-offs.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Registered Name *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.companyName}
                    onChange={e => setFormSettings({ ...formSettings, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Slogan *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.slogan}
                    onChange={e => setFormSettings({ ...formSettings, slogan: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-emerald-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Head Office Location (Ibadan) *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.location}
                    onChange={e => setFormSettings({ ...formSettings, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Phone Contact *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.phone}
                    onChange={e => setFormSettings({ ...formSettings, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formSettings.email}
                    onChange={e => setFormSettings({ ...formSettings, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs"
                >
                  Save Company Profile
                </button>
              </div>
            </form>
          </div>

          {/* Warehouse Locations Management */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-emerald-800" />
                  <span>Depot & Warehouse Locations (Ibadan)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Physical storage facilities for inventory receiving, POS dispensing, and solar project issuance.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {formSettings.warehouses.map(w => (
                <div key={w} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="font-semibold text-slate-800">{w}</span>
                  <button
                    type="button"
                    onClick={() => removeWarehouse(w)}
                    className="text-slate-400 hover:text-rose-600 text-xs font-semibold transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="e.g. Ring Road Annex Store, Ibadan"
                value={newWarehouse}
                onChange={e => setNewWarehouse(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <button
                type="button"
                onClick={addWarehouse}
                className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
              >
                + Add Depot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: COMPANY LOGO & PWA BRANDING */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
                  <span>Company Logo &amp; Dynamic PWA Manifest Customizer</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload your official company logo. Stored in your Supabase cloud database, and dynamically updates the PWA manifest, mobile home screen icons, favicons, header branding, and POS receipts across all devices.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Superadmin Authority</span>
                </span>
              </div>
            </div>

            {/* Logo File Upload & Drag-and-Drop Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="p-6 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Upload Company Logo Image
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Supports PNG, JPG, WebP, or SVG. Automatically optimized &amp; resized to 512x512 square PWA standard.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Choose Logo File from Device</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {logoFile && (
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Selected file: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>

                {/* Direct Image URL input alternative */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Or Enter Hosted Logo URL
                  </label>
                  <input
                    type="text"
                    value={formSettings.pwaLogoUrl || ''}
                    onChange={e => {
                      setFormSettings({ ...formSettings, pwaLogoUrl: e.target.value });
                      setLogoPreview(e.target.value);
                    }}
                    placeholder="https://... or /pwa-512x512.png"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSettings({ ...formSettings, pwaLogoUrl: '/pwa-512x512.png' });
                        setLogoPreview('/pwa-512x512.png');
                      }}
                      className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                    >
                      Official Sun Solar Emblem (512x512)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSettings({ ...formSettings, pwaLogoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-27_at_12.35.58_PM_cf69d348.jpeg' });
                        setLogoPreview('/assets/aistudio/WhatsApp_Image_2026-10-27_at_12.35.58_PM_cf69d348.jpeg');
                      }}
                      className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                    >
                      WhatsApp Brand Photo
                    </button>
                  </div>
                </div>

                {/* Save & Apply Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyLogoAndSave}
                    disabled={isUploadingLogo}
                    className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isUploadingLogo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving to Supabase &amp; Updating PWA Icons...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Logo &amp; Dynamically Update PWA Icons System-Wide</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Preview Cards Column */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <Eye className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Live Multi-Device Previews</span>
                </div>

                {/* 1. Header Branding Preview */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    1. Application Header Bar (Top Navigation)
                  </span>
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center gap-3 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-900 p-0.5 border border-emerald-600/70 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={formSettings.pwaLogoUrl || logoPreview || '/pwa-512x512.png'}
                        alt="Logo Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/pwa-512x512.png';
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block text-white truncate">
                        {formSettings.companyName || 'Offnot Energy'}
                      </span>
                      <span className="text-[10px] text-emerald-400 block truncate">
                        {formSettings.slogan || 'Clean Energy, Stronger Tomorrow'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Android App Icon Preview */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    2. Android Home Screen / App Drawer Icon
                  </span>
                  <div className="p-3 bg-slate-900/90 rounded-xl flex items-center gap-3 border border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-950 p-2 border-2 border-emerald-600 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={formSettings.pwaLogoUrl || logoPreview || '/pwa-512x512.png'}
                        alt="Android Icon Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/pwa-512x512.png';
                        }}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {formSettings.pwaShortName || 'OffnotEnergy'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Standalone Android App (APK standard)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. iOS Home Screen Preview */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    3. iPhone / iPad Home Screen Icon
                  </span>
                  <div className="p-3 bg-slate-900/90 rounded-xl flex items-center gap-3 border border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-900 p-2 border border-emerald-500 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={formSettings.pwaLogoUrl || logoPreview || '/pwa-512x512.png'}
                        alt="iOS Icon Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/pwa-512x512.png';
                        }}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {formSettings.pwaShortName || 'OffnotEnergy'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Apple Touch Standalone Icon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SQL Snippet Card for MySQL / Supabase */}
            <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Direct SQL Statement to Persist Logo in Database
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copySqlQuery}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                {sqlQuery}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: PWA MOBILE APP & ENTRANCE POP-UP CUSTOMIZATION */}
      {activeSubTab === 'pwa' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-800" />
                  <span>Progressive Web App (PWA) Mobile Customizer &amp; Pop-up Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Customize the app name, logo, theme colors, and configure the automatic entrance pop-up so anyone who visits the website is prompted to download the app directly onto their phone.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Standalone APK / IPA Mode</span>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* App Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    PWA Full Application Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSettings.pwaAppTitle || 'Offnot Energy Management System'}
                    onChange={e => setFormSettings({ ...formSettings, pwaAppTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. Offnot Energy Management System"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Displayed on the splash screen, app header, and install dialogue.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Homescreen Short Name (Max 12 chars) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={formSettings.pwaShortName || 'OffnotEnergy'}
                    onChange={e => setFormSettings({ ...formSettings, pwaShortName: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. OffnotEnergy"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Appears directly below the app icon on Android &amp; iOS home screens.
                  </p>
                </div>
              </div>

              {/* App Logo Customization */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">Custom PWA Application Icon / Logo</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-900 p-2 flex items-center justify-center border-2 border-emerald-600 shadow-md shrink-0 overflow-hidden">
                    <img
                      src={formSettings.pwaLogoUrl || '/pwa-512x512.png'}
                      alt="App Icon Preview"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/pwa-512x512.png';
                      }}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      PWA Logo Image URL or Relative Asset Path
                    </label>
                    <input
                      type="text"
                      value={formSettings.pwaLogoUrl || '/pwa-512x512.png'}
                      onChange={e => setFormSettings({ ...formSettings, pwaLogoUrl: e.target.value })}
                      placeholder="e.g. /pwa-512x512.png or https://your-domain.com/logo.png"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">Quick defaults:</span>
                      <button
                        type="button"
                        onClick={() => setFormSettings({ ...formSettings, pwaLogoUrl: '/pwa-512x512.png' })}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                      >
                        Official Solar Sun Logo (512x512)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormSettings({ ...formSettings, pwaLogoUrl: '/pwa-192x192.png' })}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                      >
                        Compact Icon (192x192)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormSettings({ ...formSettings, pwaLogoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-27_at_12.35.58_PM_cf69d348.jpeg' })}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                      >
                        Original WhatsApp Brand Emblem
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme & Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Theme Color (Mobile Status Bar &amp; Top Frame)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formSettings.pwaThemeColor || '#064e3b'}
                      onChange={e => setFormSettings({ ...formSettings, pwaThemeColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={formSettings.pwaThemeColor || '#064e3b'}
                      onChange={e => setFormSettings({ ...formSettings, pwaThemeColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Splash Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formSettings.pwaBackgroundColor || '#0f172a'}
                      onChange={e => setFormSettings({ ...formSettings, pwaBackgroundColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={formSettings.pwaBackgroundColor || '#0f172a'}
                      onChange={e => setFormSettings({ ...formSettings, pwaBackgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Entrance Pop-up Configuration */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Automatic Website Entrance Pop-up</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Automatically shows an interactive download &amp; install modal whenever someone enters the website.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.enablePwaPrompt !== false}
                      onChange={e => setFormSettings({ ...formSettings, enablePwaPrompt: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pop-up Delay Timer (seconds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formSettings.pwaPromptDelaySeconds || 2}
                      onChange={e => setFormSettings({ ...formSettings, pwaPromptDelaySeconds: Number(e.target.value) || 2 })}
                      className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Time to wait after the page loads before presenting the download pop-up.
                    </p>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                      ✓ Shows on mobile phones, tablets, and computers.<br />
                      ✓ Gives 1-click download on Android + guided steps on iOS Safari.
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save &amp; Sync PWA Settings to Cloud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FINANCIAL POLICIES & MARGINS */}
      {activeSubTab === 'policies' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-800" />
                <span>Financial Policies, Taxation & Margin Floors</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enforced across POS sales, commercial estimates, and profit tracking.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency</label>
                <input
                  type="text"
                  disabled
                  value="Nigerian Naira (₦ / NGN)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Nigerian VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formSettings.defaultVatRate}
                  onChange={e => setFormSettings({ ...formSettings, defaultVatRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Floor Margin (%)</label>
                <input
                  type="number"
                  value={formSettings.minGrossMarginPercent}
                  onChange={e => setFormSettings({ ...formSettings, minGrossMarginPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt & Invoice Footer Notice</label>
              <textarea
                rows={3}
                value={formSettings.receiptFooterMessage}
                onChange={e => setFormSettings({ ...formSettings, receiptFooterMessage: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs"
              >
                Update Financial Policies
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 5: BACKUP & ZERO LEDGER */}
      {activeSubTab === 'backup' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Enterprise Data Backup, Restore & Accounting Zero Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download snapshot backups, restore state from JSON, or reset transactional records to a clean ₦0.00 zero ledger.
              </p>
            </div>
          </div>

          {restoreError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
              {restoreError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Full System Backup</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Exports all products, customers, suppliers, staff, branches, and transaction logs to a secure JSON file.
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON Backup</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-800" />
                <span>Restore from Backup</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload a previously exported backup file to restore database state.
              </p>
              <label className="w-full py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Select JSON File</span>
                <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
              </label>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
              <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-700" />
                <span>Clean Zero Ledger</span>
              </div>
              <p className="text-[11px] text-amber-900/80">
                Resets all sales, purchase orders, expenses, and projects to ₦0.00 while preserving solar product catalogs and branches.
              </p>
              <button
                onClick={() => setShowZeroLedgerConfirm(true)}
                className="w-full py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Zero Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: SUPABASE LIVE DB & SQL MIGRATIONS */}
      {activeSubTab === 'supabase' && (
        <div className="space-y-4">
          <MigrationViewer />
        </div>
      )}

      {/* Confirm Zero Ledger Dialog */}
      <ConfirmDialog
        isOpen={showZeroLedgerConfirm}
        title="Reset to Clean Zero Accounting Ledger?"
        message="This will reset all sales, purchase orders, customer balances, expenses, and stock movements to exactly ₦0.00. Solar catalog products, categories, branch profiles, and staff accounts will be preserved with 0 stock balances for pristine accounting."
        confirmLabel="Confirm Clean Zero Ledger"
        isDestructive={false}
        onConfirm={() => {
          resetToZeroLedger();
          setShowZeroLedgerConfirm(false);
          showTemporaryStatus('All accounting figures successfully reset to clean zero ledger (₦0.00).');
        }}
        onCancel={() => setShowZeroLedgerConfirm(false)}
      />

      {/* Confirm Demo Reset Dialog */}
      <ConfirmDialog
        isOpen={showResetDemoConfirm}
        title="Reset Demo Data?"
        message="This will reset all data to the initial Offnot Energy demo state."
        confirmLabel="Reset"
        isDestructive={true}
        onConfirm={() => {
          resetDatabase();
          setShowResetDemoConfirm(false);
          showTemporaryStatus('Database reset.');
        }}
        onCancel={() => setShowResetDemoConfirm(false)}
      />
    </div>
  );
};
