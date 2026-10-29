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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types';
import { BranchOverview } from './BranchOverview';

export const BranchManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'directory'>('overview');
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    saveBranch,
    products,
    sales,
    expenses,
    staffAccounts,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

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

  // Access Control: Branches hub accessible strictly by Superadmin, CEO, Inventory Manager, and authorized Admin
  const canAccessBranches =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'ceo' ||
    currentUser.role === 'inventory_officer' ||
    currentUser.role === 'admin';

  if (!canAccessBranches) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Branch Operations Restricted</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            The Multi-Branch Facilities Hub is accessible exclusively by the Super Administrator, CEO / Managing Director, and Inventory Manager.
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
      isHeadquarters: false,
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
        text: editingBranch ? 'Branch details updated successfully.' : 'New branch established successfully.',
      });
      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to save branch.' });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Multi-Branch Operations & Monitoring
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {branches.length} Branches Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor inventory, sales, expenses, and staff performance across all Offnot Energy Ibadan locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveBranchId('all')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              activeBranchId === 'all'
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Consolidated (All Branches)</span>
          </button>

          {(currentUser.role === 'super_admin' || currentUser.role === 'ceo') && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Branch</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Sub-Tab Navigation: Overview (D3) vs Facilities Directory */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setViewMode('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            viewMode === 'overview'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>D3 Comparative Analytics & Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            viewMode === 'directory'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Branch Facilities Directory ({branches.length})</span>
        </button>
      </div>

      {viewMode === 'overview' ? (
        <BranchOverview />
      ) : (
        <>
          {/* Multi-Branch Consolidated Executive Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Operational Branches</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {branches.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Headquarters: Tipper Garage, Ibadan
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Units in Stock</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalStockAll.toLocaleString()} Units
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Clean Zero Ledger Initialized</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Consolidated Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            ₦{totalSalesAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {branches.length} branches
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Consolidated Expenses</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            ₦{totalExpensesAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
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
              className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isCurrentlyActive
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="p-5">
                {/* Branch Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {branch.name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-semibold tracking-wide">
                      {branch.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {branch.isHeadquarters && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        HQ
                      </span>
                    )}
                    {isCurrentlyActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address || `${branch.city}, ${branch.state}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{branch.phone}</span>
                  </div>
                  {branch.managerName && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Manager: <strong className="text-slate-800">{branch.managerName}</strong></span>
                    </div>
                  )}
                </div>

                {/* Micro Stats Matrix */}
                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Stock Qty</span>
                    <span className="block text-sm font-bold font-mono text-slate-800 mt-0.5">
                      {metrics.totalStockQty}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Sales</span>
                    <span className="block text-sm font-bold font-mono text-emerald-700 mt-0.5">
                      ₦{metrics.totalSalesAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Staff</span>
                    <span className="block text-sm font-bold font-mono text-slate-800 mt-0.5">
                      {metrics.staffCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBranchId(branch.id)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isCurrentlyActive
                      ? 'bg-emerald-600 text-white cursor-default shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isCurrentlyActive ? 'Viewing This Branch' : 'Select Branch'}</span>
                </button>

                {(currentUser.role === 'super_admin' || currentUser.role === 'ceo') && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(branch)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium"
                    title="Edit Branch Information"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}

      {/* Branch Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBranch ? 'Edit Branch Details' : 'Establish New Branch'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure branch location, inventory tracking, and operational manager.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Showroom - Tipper Garage, Ibadan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BR-IBD-01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ibadan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Inside Tipper Garage, Dalute Road, Ibadan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="07047053453"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="e.g. Bolanle Oladipo"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isHeadquarters}
                    onChange={(e) => setFormData({ ...formData, isHeadquarters: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Designate as Main Company Headquarters (HQ)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
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
