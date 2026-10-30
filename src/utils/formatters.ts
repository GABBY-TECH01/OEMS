/**
 * Utilities & Formatters for Offnot Energy Management System
 * Handles Nigerian Naira formatting, Lagos local timezone dates, and sequence generators.
 */

import { PermissionKey, UserRole } from '../types';
import { StorageService, INITIAL_ROLE_PERMISSIONS } from '../services/storage';

/**
 * Format amounts in Nigerian Naira (₦) with standard tabular precision
 */
export function formatNaira(amount: number | undefined | null, includeDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeDecimals ? '₦0.00' : '₦0';
  }
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
  return amount < 0 ? `-₦${formatted}` : `₦${formatted}`;
}

/**
 * Format date in Africa/Lagos timezone: e.g. "27 Oct 2026, 01:45 PM"
 */
export function formatLagosDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format date only: e.g. "27 Oct 2026"
 */
export function formatLagosDate(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Generate sequential, unique professional business identifiers
 */
export function generateReferenceNumber(prefix: string, sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Human readable role labels
 */
export function getRoleLabel(role: UserRole): string {
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
      return 'Inventory Officer / Manager';
    case 'sales_rep':
      return 'Sales Representative';
    case 'accountant':
      return 'Accountant';
    case 'technical_staff':
      return 'Solar Installation Engineer';
    default:
      return role;
  }
}

/**
 * Check fine-grained permissions based on role and custom user delegation
 */
export function hasPermission(
  role: UserRole,
  permission: PermissionKey,
  user?: { hasFullSystemAccess?: boolean; canAccessAllBranches?: boolean; role?: UserRole }
): boolean {
  if (role === 'super_admin') return true;
  if (role === 'admin' && user?.hasFullSystemAccess) return true;
  if (permission === 'access_all_branches' && user?.canAccessAllBranches) return true;

  try {
    const rolePermissions = StorageService.getRolePermissions();
    if (rolePermissions && rolePermissions[role] && rolePermissions[role][permission] !== undefined) {
      return Boolean(rolePermissions[role][permission]);
    }
  } catch {
    // fallback to initial defaults
  }
  return Boolean(INITIAL_ROLE_PERMISSIONS[role]?.[permission]);
}

/**
 * Check if user can access all branches or is restricted strictly to their assigned branch
 * "the superadmin should be the on that can access all branches."
 */
export function canAccessAllBranches(user: { role: UserRole; canAccessAllBranches?: boolean; hasFullSystemAccess?: boolean }): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'admin' && (user.canAccessAllBranches || user.hasFullSystemAccess)) return true;
  return false;
}

/**
 * Check if user can access the Branches & Hubs tab
 * "the manage branch hub which is only the superadmin that will be ble to access"
 */
export function canAccessBranchesHub(user: { role: UserRole; hasFullSystemAccess?: boolean }): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'admin' && user.hasFullSystemAccess) return true;
  return false;
}

/**
 * Return allowed navigation tabs for a given staff member based on role & permissions
 * Enforces strict role isolation and restricts branch governance to Superadmin.
 */
export function getAllowedTabsForUser(user: { role: UserRole; hasFullSystemAccess?: boolean }): import('../types').ActiveTab[] {
  if (user.role === 'super_admin' || (user.role === 'admin' && user.hasFullSystemAccess)) {
    return [
      'dashboard',
      'branches',
      'staff',
      'pos',
      'inventory',
      'sales_history',
      'purchasing',
      'customers',
      'quotations',
      'projects',
      'finance',
      'reports',
      'audit',
      'settings',
    ];
  }

  switch (user.role) {
    case 'admin':
      return [
        'dashboard',
        'pos',
        'inventory',
        'sales_history',
        'purchasing',
        'customers',
        'quotations',
        'projects',
        'finance',
        'reports',
        'audit',
      ];

    case 'ceo':
      return [
        'dashboard',
        'inventory',
        'sales_history',
        'purchasing',
        'customers',
        'quotations',
        'projects',
        'finance',
        'reports',
        'audit',
      ];

    case 'manager':
      return [
        'dashboard',
        'pos',
        'inventory',
        'sales_history',
        'purchasing',
        'customers',
        'quotations',
        'projects',
        'finance',
        'reports',
      ];

    case 'inventory_officer':
      // Warehouse & inventory only
      return ['inventory', 'purchasing'];

    case 'sales_rep':
      // Dashboard removed; shopfloor sales focus only
      return ['pos', 'sales_history', 'customers', 'quotations'];

    case 'accountant':
      // Financial oversight only
      return ['dashboard', 'sales_history', 'finance', 'reports', 'quotations', 'purchasing'];

    case 'technical_staff':
      // Dashboard removed; field engineering & materials lookup
      return ['projects', 'quotations', 'inventory'];

    default:
      return ['dashboard'];
  }
}

/**
 * Default initial landing tab for each role upon login
 */
export function getDefaultTabForUser(user: { role: UserRole; hasFullSystemAccess?: boolean }): import('../types').ActiveTab {
  switch (user.role) {
    case 'inventory_officer':
      return 'inventory';
    case 'sales_rep':
      return 'pos';
    case 'technical_staff':
      return 'projects';
    case 'super_admin':
    case 'admin':
    case 'ceo':
    case 'manager':
    case 'accountant':
    default:
      return 'dashboard';
  }
}

/**
 * Export data array to CSV file in browser
 */
export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
