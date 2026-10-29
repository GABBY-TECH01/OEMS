/**
 * Superadmin Staff Provisioning & Role Management Portal
 * Offnot Energy Business Management System
 * Location: Ibadan, Oyo State, Nigeria
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  X,
  Copy,
  Check,
  AlertCircle,
  Briefcase,
  Lock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffAccount, UserRole } from '../../types';

export const StaffManagement: React.FC = () => {
  const {
    staffAccounts,
    createStaffAccount,
    updateStaffAccount,
    toggleStaffStatus,
    deleteStaffAccount,
    branches,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dedicated Password Reset Modal State
  const [resetModalStaff, setResetModalStaff] = useState<StaffAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Staff Form State
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    email: string;
    role: UserRole;
    phone: string;
    branchId: string;
    branchName: string;
    temporaryPassword: string;
    status: 'active' | 'inactive';
    hasFullSystemAccess: boolean;
    canAccessAllBranches: boolean;
  }>({
    name: '',
    username: '',
    email: '',
    role: 'sales_rep',
    phone: '',
    branchId: branches[0]?.id || 'br_tipper_hq',
    branchName: branches[0]?.name || 'Showroom - Tipper Garage (HQ)',
    temporaryPassword: 'OffnotStaff2026!',
    status: 'active',
    hasFullSystemAccess: false,
    canAccessAllBranches: false,
  });

  const handleOpenCreate = () => {
    setEditingStaff(null);
    const defaultBranch = branches[0];
    setFormData({
      name: '',
      username: '',
      email: '',
      role: 'admin',
      phone: '',
      branchId: defaultBranch?.id || '',
      branchName: defaultBranch?.name || '',
      temporaryPassword: `Offnot${Math.floor(1000 + Math.random() * 9000)}!`,
      status: 'active',
      hasFullSystemAccess: false,
      canAccessAllBranches: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      phone: staff.phone,
      branchId: staff.branchId,
      branchName: staff.branchName,
      temporaryPassword: staff.temporaryPassword || 'OffnotStaff2026!',
      status: staff.status,
      hasFullSystemAccess: Boolean(staff.hasFullSystemAccess),
      canAccessAllBranches: Boolean(staff.canAccessAllBranches),
    });
    setIsModalOpen(true);
  };

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    setFormData(prev => ({
      ...prev,
      branchId,
      branchName: branch?.name || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (editingStaff) {
      const res = updateStaffAccount(editingStaff.id, formData);
      if (res.success) {
        setFeedback({ type: 'success', text: `Updated staff profile for ${formData.name}.` });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to update staff.' });
      }
    } else {
      const res = createStaffAccount(formData);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Provisioned new account for ${formData.name} (${formData.role}). Ready for login.`,
        });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to create staff account.' });
      }
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopyCredentials = (staff: StaffAccount) => {
    const text = `Offnot Energy Login Credentials\nUsername: ${staff.username || staff.email}\nEmail: ${staff.email}\nRole: ${staff.role.replace('_', ' ')}\nTemporary Password: ${staff.temporaryPassword || 'Contact Admin'}\nBranch: ${staff.branchName}`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenResetModal = (staff: StaffAccount) => {
    setResetModalStaff(staff);
    // Generate an initial random temporary password
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewPasswordValue(`Offnot${rand}!`);
    setShowNewPassword(true);
  };

  const handleGeneratePassword = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewPasswordValue(`Offnot${rand}!`);
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff) return;
    if (!newPasswordValue.trim() || newPasswordValue.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const res = updateStaffAccount(resetModalStaff.id, {
      temporaryPassword: newPasswordValue.trim(),
    });

    if (res.success) {
      const copyText = `Offnot Energy Password Reset\nStaff: ${resetModalStaff.name}\nUsername: ${resetModalStaff.username || resetModalStaff.email}\nNew Password: ${newPasswordValue.trim()}\nRole: ${resetModalStaff.role.replace('_', ' ')}`;
      navigator.clipboard.writeText(copyText);
      setFeedback({
        type: 'success',
        text: `Password for ${resetModalStaff.name} reset to "${newPasswordValue.trim()}" and copied to clipboard!`,
      });
      setResetModalStaff(null);
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Failed to reset password.',
      });
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleDeleteStaff = (staff: StaffAccount) => {
    if (currentUser.role !== 'super_admin') {
      alert('Only the system Super Administrator (Francis Gabriel) can delete staff members.');
      return;
    }

    if (staff.id === currentUser.id || staff.role === 'super_admin') {
      alert('You cannot delete the primary Super Administrator account.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the staff account for "${staff.name}" (${staff.username || staff.email})?\n\nThis will revoke all system credentials and permissions immediately.`
    );

    if (!confirmed) return;

    const res = deleteStaffAccount(staff.id);
    if (res.success) {
      setFeedback({
        type: 'success',
        text: `Staff account "${staff.name}" has been permanently removed.`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Failed to delete staff account.',
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered List
  const filteredStaff = staffAccounts.filter(staff => {
    const matchSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || staff.role === roleFilter;
    const matchBranch = branchFilter === 'all' || staff.branchId === branchFilter;
    return matchSearch && matchRole && matchBranch;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'admin':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold';
      case 'ceo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'inventory_officer':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'sales_rep':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'accountant':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'technical_staff':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'System Administrator (Admin)';
      case 'ceo':
        return 'CEO / Managing Director';
      case 'manager':
        return 'Operations Manager';
      case 'inventory_officer':
        return 'Inventory Officer';
      case 'sales_rep':
        return 'Sales Representative';
      case 'accountant':
        return 'Accountant';
      case 'technical_staff':
        return 'Solar Installation Engineer';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff Account Provisioning Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Superadmin Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Provision and configure accounts for CEO, Operations Manager, Inventory Officers, Sales Reps, Accountants, and Solar Installation Engineers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Staff</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Staff Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Staff Accounts</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {staffAccounts.length}
          </div>
          <span className="text-[11px] text-slate-400">Authorized personnel</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Accounts</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {staffAccounts.filter(s => s.status === 'active').length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Permitted access</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Branches Assigned</span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {branches.length}
          </div>
          <span className="text-[11px] text-slate-400">Ibadan regional hubs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Solar Techs & Installers</span>
          <div className="text-2xl font-bold font-mono text-orange-700 mt-1">
            {staffAccounts.filter(s => s.role === 'technical_staff').length}
          </div>
          <span className="text-[11px] text-slate-400">Field engineering team</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, username, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Administrator</option>
            <option value="admin">System Administrator (Admin)</option>
            <option value="ceo">CEO / Managing Director</option>
            <option value="manager">Operations Manager</option>
            <option value="inventory_officer">Inventory Officer</option>
            <option value="sales_rep">Sales Representative</option>
            <option value="accountant">Accountant</option>
            <option value="technical_staff">Solar Installation Engineer</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 max-w-[180px] truncate"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role Assigned</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Access Password</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No staff accounts match your current filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isPasswordVisible = visiblePasswordId === staff.id;
                  const isCopied = copiedId === staff.id;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{staff.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>@{staff.username || 'user'}</span>
                          <span>•</span>
                          <span>{staff.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(
                              staff.role
                            )}`}
                          >
                            {getRoleLabel(staff.role)}
                          </span>
                          {staff.role === 'admin' && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {staff.hasFullSystemAccess ? (
                                <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                  Full System Access
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  Standard Admin
                                </span>
                              )}
                              {staff.canAccessAllBranches ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  All Branches
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  Store Restricted
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[170px]" title={staff.branchName}>
                            {staff.branchName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {staff.phone || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {isPasswordVisible ? staff.temporaryPassword || 'None' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setVisiblePasswordId(isPasswordVisible ? null : staff.id)
                            }
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStaffStatus(staff.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            staff.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Click to toggle status"
                        >
                          {staff.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(staff)}
                            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Copy Onboarding Credentials"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenResetModal(staff)}
                            className="p-1.5 rounded-md border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 transition-colors"
                            title="Reset Staff Password"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            Edit
                          </button>

                          {currentUser.role === 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff)}
                              disabled={staff.id === currentUser.id || staff.role === 'super_admin'}
                              className="p-1.5 rounded-md border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              title={
                                staff.id === currentUser.id || staff.role === 'super_admin'
                                  ? 'Primary Superadmin cannot be deleted'
                                  : 'Permanently Delete Staff Account'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Provisioning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingStaff ? 'Edit Staff Profile' : 'Provision Staff Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  Create role-based credentials for operations, sales, accounting, or solar engineering.
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Babatunde Fashola"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    placeholder="e.g. bfashola"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. bfashola@offnotenergy.ng"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role & Permission Level *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="admin">System Administrator (Admin)</option>
                    <option value="ceo">CEO / Managing Director</option>
                    <option value="manager">Operations Manager</option>
                    <option value="inventory_officer">Inventory Officer</option>
                    <option value="sales_rep">Sales Representative</option>
                    <option value="accountant">Accountant</option>
                    <option value="technical_staff">Solar Installation Engineer</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>

                {/* Special Superadmin Privilege Delegation for Admin Role */}
                {formData.role === 'admin' && (
                  <div className="col-span-2 p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                        Superadmin Privilege Delegation for Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-900 leading-relaxed">
                      As Superadmin, you decide what access this Admin receives. If granted full access, the Admin can access all modules and branches.
                    </p>
                    <div className="space-y-2 pt-1 border-t border-purple-200/60">
                      <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasFullSystemAccess}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              hasFullSystemAccess: e.target.checked,
                              canAccessAllBranches: e.target.checked ? true : formData.canAccessAllBranches,
                            })
                          }
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            Grant Full System Access
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Can access all application modules, reports, company settings, and governance.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.canAccessAllBranches}
                          onChange={e =>
                            setFormData({ ...formData, canAccessAllBranches: e.target.checked })
                          }
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            Grant All-Branches Access
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Can switch between and monitor all regional branches & warehouses across Ibadan.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Branch Assignment *
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08034567890"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Temporary Password *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.temporaryPassword}
                      onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-emerald-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })
                    }
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Account Active (permits dashboard login immediately)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
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
                  {editingStaff ? 'Save Changes' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Password Reset Modal */}
      {resetModalStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Staff Password</h3>
                  <p className="text-xs text-slate-500">
                    {resetModalStaff.name} ({resetModalStaff.username || resetModalStaff.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Administrative Credential Override</span>
                </p>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Superadmin Francis Gabriel can immediately update this staff member&apos;s password. The new password will be copied to your clipboard on submit.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    New Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-600" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-bold text-slate-900"
                    placeholder="Enter min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showNewPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetModalStaff(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update & Copy Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
