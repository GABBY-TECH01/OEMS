/**
 * Multi-Branch Management & Cross-Branch Progress Tracker
 * Offnot Energy Business Management System
 * Location: Ibadan, Oyo State, Nigeria
 */

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Plus,
  ExternalLink,
  CheckCircle,
  Package,
  TrendingUp,
  Receipt,
  Users,
  Shield,
  Layers,
  Sparkles,
  X,
  BarChart3,
  Trash2,
  Crown,
  AlertTriangle,
  Edit2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types';
import { BranchOverview } from './BranchOverview';

export const BranchManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'directory'>('directory');
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    saveBranch,
    deleteBranch,
    setBranchAsHeadquarters,
    products,
    sales,
    expenses,
    staffAccounts,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: 'Ibadan',
    state: 'Oyo State',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    isHeadquarters: false,
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Access Control: Branches hub accessible strictly by Superadmin (Francis Gabriel) or designated Admin with full system access
  const isSuperadmin =
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'admin' && currentUser.hasFullSystemAccess);

  if (!isSuperadmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Branch Management Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            The Multi-Branch Facilities Hub and branch control is restricted exclusively to Superadmin Francis Gabriel and authorized system administrators.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: `BR-IBD-0${branches.length + 1}`,
      city: 'Ibadan',
      state: 'Oyo State',
      address: '',
      phone: '07047053453',
      email: '',
      managerName: '',
      isHeadquarters: branches.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      city: branch.city,
      state: branch.state,
      address: branch.address,
      phone: branch.phone,
      email: branch.email || '',
      managerName: branch.managerName || '',
      isHeadquarters: branch.isHeadquarters,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = saveBranch({
      id: editingBranch?.id,
      ...formData,
    });

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: editingBranch ? `Branch "${formData.name}" updated successfully.` : `New branch "${formData.name}" created successfully.`,
      });
      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to save branch.' });
    }
  };

  const handleSetHq = (branch: Branch) => {
    const res = setBranchAsHeadquarters(branch.id);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `"${branch.name}" is now the designated Headquarters (HQ) for Offnot Energy.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update Headquarters.' });
    }
  };

  const handleConfirmDelete = () => {
    if (!branchToDelete) return;
    const branchName = branchToDelete.name;
    const res = deleteBranch(branchToDelete.id);
    setBranchToDelete(null);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Branch "${branchName}" has been successfully deleted from the system and Supabase.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to delete branch.',
      });
    }
  };

  // Branch Specific Metrics Calculation
  const getBranchMetrics = (branchId: string) => {
    const branchProducts = products.filter(p => p.branchId === branchId);
    const branchSales = sales.filter(s => s.branchId === branchId);
    const branchExpenses = expenses.filter(e => e.branchId === branchId);
    const branchStaff = staffAccounts.filter(s => s.branchId === branchId);

    const totalStockQty = branchProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0);
    const totalSalesAmount = branchSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalExpensesAmount = branchExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      productCount: branchProducts.length,
      totalStockQty,
      salesCount: branchSales.length,
      totalSalesAmount,
      expenseCount: branchExpenses.length,
      totalExpensesAmount,
      staffCount: branchStaff.length,
    };
  };

  // Consolidated System-Wide Totals
  const totalStockAll = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
  const totalSalesAll = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalExpensesAll = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Multi-Branch Operations & Hub Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {branches.length} Branches Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Superadmin Hub: Configure branches, designate the corporate Headquarters (HQ), and manage Ibadan facilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveBranchId('all')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              activeBranchId === 'all'
                ? 'bg-slate-900 dark:bg-emerald-600 border-slate-900 dark:border-emerald-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Consolidated (All Branches)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Sub-Tab Navigation: Facilities Directory vs Overview (D3) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setViewMode('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            viewMode === 'directory'
              ? 'bg-emerald-900 dark:bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Branch Facilities Directory ({branches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            viewMode === 'overview'
              ? 'bg-emerald-900 dark:bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>D3 Comparative Analytics & Overview</span>
        </button>
      </div>

      {viewMode === 'overview' ? (
        <BranchOverview />
      ) : (
        <>
          {/* Multi-Branch Consolidated Executive Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Operational Branches</span>
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                {branches.length}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {branches.find(b => b.isHeadquarters)?.name || 'HQ Branch Set'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Consolidated Stock Units</span>
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                {totalStockAll.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Solar panels, inverters & batteries
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Total Recorded Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
                ₦{totalSalesAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Completed retail & project invoices
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Consolidated Expenses</span>
                <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-2">
                ₦{totalExpensesAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Recorded business expenditures
              </p>
            </div>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {branches.map((branch) => {
              const metrics = getBranchMetrics(branch.id);
              const isCurrentlyActive = activeBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                    isCurrentlyActive
                      ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-600/20 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="p-5">
                    {/* Branch Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {branch.name}
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-semibold tracking-wide">
                          {branch.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {branch.isHeadquarters ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Headquarters (HQ)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetHq(branch)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                            title="Click to make this branch the corporate Headquarters"
                          >
                            <Crown className="w-2.5 h-2.5" />
                            Set as HQ
                          </button>
                        )}
                        {isCurrentlyActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Active Filter
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location & Contact */}
                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-700 dark:text-slate-300">{branch.address || `${branch.city}, ${branch.state}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="font-mono text-slate-700 dark:text-slate-300">{branch.phone}</span>
                      </div>
                      {branch.managerName && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{branch.managerName}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Micro Stats Matrix */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Stock Qty</span>
                        <span className="block text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                          {metrics.totalStockQty}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Sales</span>
                        <span className="block text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                          ₦{metrics.totalSalesAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Staff</span>
                        <span className="block text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                          {metrics.staffCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveBranchId(branch.id)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        isCurrentlyActive
                          ? 'bg-emerald-600 text-white cursor-default shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isCurrentlyActive ? 'Active Store' : 'Switch Store'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(branch)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1"
                      title="Edit Branch Information"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBranchToDelete(branch)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Branch In-App Confirmation Modal */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Branch Facility?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white font-semibold">"{branchToDelete.name}"</strong> ({branchToDelete.code})?
              </p>
              {branchToDelete.isHeadquarters && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-lg">
                  Notice: This is currently marked as Headquarters. Deleting it will automatically reassign HQ status to another active branch.
                </p>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This action will remove the branch facility from the system and Supabase.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Branch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingBranch ? 'Edit Branch Details' : 'Establish New Branch'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure branch location, inventory tracking, and operational manager.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Showroom - Tipper Garage, Ibadan"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BR-IBD-01"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ibadan"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Inside Tipper Garage, Dalute Road, Ibadan"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="07047053453"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="e.g. Bolanle Oladipo"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isHeadquarters}
                    onChange={(e) => setFormData({ ...formData, isHeadquarters: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Designate as Main Corporate Headquarters (HQ) Shop</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm"
                >
                  {editingBranch ? 'Update Branch' : 'Establish Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
