/**
 * Real-time Supabase Data Service
 * Offnot Energy Management System
 * Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
 * 
 * Serves as the primary data exchange layer between the React application
 * and the live Supabase PostgreSQL database. Ensures that all devices
 * (Vercel web, Android mobile, laptops) read from and write to the same
 * authoritative cloud database.
 */

import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  Branch,
  Product,
  Sale,
  StockMovement,
  Customer,
  Supplier,
  PurchaseOrder,
  Quotation,
  InstallationProject,
  Expense,
  User,
  StaffAccount,
  CompanySettings,
  AuditLog,
  AppNotification,
  PaymentRecord,
  StaffKpi,
  KpiDailyLog,
} from '../types';
import { INITIAL_SETTINGS } from './storage';

function isMissingColumnError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  const code = String(err?.code || '');
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('could not find') ||
    (msg.includes('column') && (msg.includes('does not exist') || msg.includes('schema cache')))
  );
}

export interface SupabaseDataset {
  branches: Branch[];
  products: Product[];
  sales: Sale[];
  stockMovements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  quotations: Quotation[];
  projects: InstallationProject[];
  expenses: Expense[];
  users: User[];
  staffAccounts: StaffAccount[];
  settings: CompanySettings | null;
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  staffKpis: StaffKpi[];
}

// ============================================================================
// DATA FETCHING (Cloud Database -> React State)
// ============================================================================

export async function fetchAllDataFromSupabase(): Promise<SupabaseDataset | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const [
      branchesRes,
      usersRes,
      productsRes,
      salesRes,
      movementsRes,
      customersRes,
      suppliersRes,
      ordersRes,
      quotesRes,
      projectsRes,
      expensesRes,
      settingsRes,
      auditRes,
      notifsRes,
      kpisRes,
      kpiLogsRes,
    ] = await Promise.all([
      client.from('branches').select('*').order('created_at', { ascending: true }),
      client.from('user_profiles').select('*').order('created_at', { ascending: true }),
      client.from('products').select('*').order('name', { ascending: true }),
      client.from('sales').select('*').order('created_at', { ascending: false }),
      client.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(200),
      client.from('customers').select('*').order('name', { ascending: true }),
      client.from('suppliers').select('*').order('company_name', { ascending: true }),
      client.from('purchase_orders').select('*').order('created_at', { ascending: false }),
      client.from('quotations').select('*').order('created_at', { ascending: false }),
      client.from('installation_projects').select('*').order('created_at', { ascending: false }),
      client.from('expenses').select('*').order('date', { ascending: false }),
      client.from('company_settings').select('*').limit(1),
      client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      client.from('app_notifications').select('*').order('created_at', { ascending: false }).limit(50),
      client.from('staff_kpis').select('*').order('created_at', { ascending: false }),
      client.from('kpi_daily_logs').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    // Map Branches
    const branches: Branch[] = (branchesRes.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      city: b.city || 'Ibadan',
      state: b.state || 'Oyo State',
      address: b.address || '',
      phone: b.phone || '07047053453',
      email: b.email,
      managerName: b.manager_name,
      isHeadquarters: Boolean(b.is_headquarters),
      isActive: b.is_active !== false,
      createdAt: b.created_at,
    }));

    // Map Users & Staff Accounts
    const users: User[] = [];
    const staffAccounts: StaffAccount[] = [];

    (usersRes.data || []).forEach((u: any) => {
      const userObj: User = {
        id: u.id,
        name: u.name,
        username: u.username || u.email?.split('@')[0],
        email: u.email,
        phone: u.phone || '',
        role: u.role || 'sales_rep',
        branchId: u.branch_id || undefined,
        branchName: u.branch_name || undefined,
        status: u.status || 'active',
        hasFullSystemAccess: Boolean(u.has_full_system_access),
        canAccessAllBranches: Boolean(u.can_access_all_branches),
        lastActive: u.last_active,
        avatar: u.avatar_url,
        temporaryPassword: u.temporary_password || '',
      };
      users.push(userObj);

      const staffObj: StaffAccount = {
        id: u.id,
        name: u.name,
        username: u.username || u.email?.split('@')[0],
        email: u.email,
        phone: u.phone || '',
        role: u.role || 'sales_rep',
        branchId: u.branch_id || '',
        branchName: u.branch_name || '',
        temporaryPassword: u.temporary_password || '',
        status: u.status || 'active',
        hasFullSystemAccess: Boolean(u.has_full_system_access),
        canAccessAllBranches: Boolean(u.can_access_all_branches),
        createdAt: u.created_at,
        lastLogin: u.last_active,
      };
      staffAccounts.push(staffObj);
    });

    // Map Products
    const products: Product[] = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand || 'Offnot Energy',
      category: p.category,
      model: p.model || '',
      description: p.description || '',
      unit: p.unit || 'Unit',
      purchaseCost: Number(p.purchase_cost || 0),
      retailPrice: Number(p.retail_price || 0),
      wholesalePrice: Number(p.wholesale_price || 0),
      installerPrice: Number(p.installer_price || 0),
      dealerPrice: Number(p.dealer_price || 0),
      minSellingPrice: Number(p.min_selling_price || 0),
      currentStock: Number(p.current_stock || 0),
      reorderLevel: Number(p.reorder_level || 5),
      warehouseLocation: p.warehouse_location || 'Main Showroom Tipper Garage',
      branchId: p.branch_id || undefined,
      branchName: p.branch_name || undefined,
      supplierId: p.supplier_id || undefined,
      supplierName: p.supplier_name || undefined,
      barcode: p.barcode || undefined,
      specs: p.specs || {},
      status: p.status || 'active',
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    // Map Sales
    const sales: Sale[] = (salesRes.data || []).map((s: any) => ({
      id: s.id,
      invoiceNumber: s.invoice_number,
      customerId: s.customer_id || undefined,
      customerName: s.customer_name,
      customerPhone: s.customer_phone || undefined,
      customerTier: s.customer_tier || 'retail',
      items: Array.isArray(s.items) ? s.items : [],
      subtotal: Number(s.subtotal || 0),
      discountTotal: Number(s.discount_total || 0),
      taxAmount: Number(s.tax_amount || 0),
      grandTotal: Number(s.grand_total || 0),
      paidAmount: Number(s.paid_amount || 0),
      balanceDue: Number(s.balance_due || 0),
      costOfGoodsSold: Number(s.cost_of_goods_sold || 0),
      grossProfit: Number(s.gross_profit || 0),
      paymentMethod: s.payment_method || 'bank_transfer',
      paymentStatus: s.payment_status || 'paid',
      payments: Array.isArray(s.payments) ? s.payments : [],
      salesRepId: s.sales_rep_id || '',
      salesRepName: s.sales_rep_name,
      warehouseLocation: s.warehouse_location || 'Tipper Garage',
      branchId: s.branch_id || undefined,
      branchName: s.branch_name || undefined,
      notes: s.notes || undefined,
      returned: Boolean(s.is_returned || s.returned),
      originalGrandTotal: s.original_grand_total !== undefined && s.original_grand_total !== null
        ? Number(s.original_grand_total)
        : undefined,
      refundAmount: s.refund_amount !== undefined && s.refund_amount !== null
        ? Number(s.refund_amount)
        : undefined,
      refundReason: s.refund_reason || undefined,
      refundedAt: s.refunded_at || undefined,
      refundedBy: s.refunded_by || undefined,
      refundedByUserId: s.refunded_by_user_id || undefined,
      returnRecords: Array.isArray(s.return_records) ? s.return_records : undefined,
      createdAt: s.created_at,
    }));

    // Map Stock Movements
    const stockMovements: StockMovement[] = (movementsRes.data || []).map((m: any) => ({
      id: m.id,
      productId: m.product_id,
      productName: m.product_name,
      sku: m.sku,
      type: m.type,
      quantity: Number(m.quantity || 0),
      previousStock: Number(m.previous_stock || 0),
      newStock: Number(m.new_stock || 0),
      unitCost: Number(m.unit_cost || 0),
      totalCost: Number(m.total_cost || 0),
      referenceId: m.reference_id,
      warehouseLocation: m.warehouse_location,
      branchId: m.branch_id || undefined,
      branchName: m.branch_name || undefined,
      reason: m.reason,
      performedByUserId: m.performed_by_user_id || '',
      performedByUserName: m.performed_by_user_name,
      approvedBy: m.approved_by || undefined,
      timestamp: m.created_at || m.timestamp || new Date().toISOString(),
    }));

    // Map Customers
    const customers: Customer[] = (customersRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      contactPerson: c.contact_person || undefined,
      phone: c.phone,
      email: c.email || undefined,
      address: c.address,
      type: c.type || 'retail',
      pricingTier: c.pricing_tier || 'retail',
      leadStage: c.lead_stage || 'new_lead',
      totalPurchases: Number(c.total_purchases || 0),
      outstandingBalance: Number(c.outstanding_balance || 0),
      lastPurchaseDate: c.last_purchase_date || undefined,
      assignedStaffId: c.assigned_staff_id || undefined,
      assignedStaffName: c.assigned_staff_name || undefined,
      notes: c.notes || undefined,
      createdAt: c.created_at,
    }));

    // Map Suppliers
    const suppliers: Supplier[] = (suppliersRes.data || []).map((sup: any) => ({
      id: sup.id,
      companyName: sup.company_name,
      contactPerson: sup.contact_person,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      categories: Array.isArray(sup.categories) ? sup.categories : [],
      paymentTerms: sup.payment_terms || 'Immediate',
      outstandingBalance: Number(sup.outstanding_balance || 0),
      notes: sup.notes,
      createdAt: sup.created_at,
    }));

    // Map Purchase Orders
    const purchaseOrders: PurchaseOrder[] = (ordersRes.data || []).map((po: any) => ({
      id: po.id,
      poNumber: po.po_number,
      supplierId: po.supplier_id,
      supplierName: po.supplier_name,
      items: Array.isArray(po.items) ? po.items : [],
      subtotal: Number(po.subtotal || 0),
      shippingAndLogistics: Number(po.shipping_and_logistics || 0),
      totalAmount: Number(po.total_amount || 0),
      paidAmount: Number(po.paid_amount || 0),
      status: po.status || 'draft',
      warehouseLocation: po.warehouse_location,
      branchId: po.branch_id || undefined,
      expectedDeliveryDate: po.expected_delivery_date || undefined,
      approvedAt: po.approved_at || undefined,
      approvedBy: po.approved_by || undefined,
      notes: po.notes || undefined,
      createdAt: po.created_at,
    }));

    // Map Quotations
    const quotations: Quotation[] = (quotesRes.data || []).map((q: any) => ({
      id: q.id,
      quotationNumber: q.quotation_number,
      customerId: q.customer_id || undefined,
      customerName: q.customer_name,
      customerPhone: q.customer_phone || undefined,
      customerAddress: q.customer_address || undefined,
      items: Array.isArray(q.items) ? q.items : [],
      installationCharges: Number(q.installation_charges || 0),
      logisticsCharges: Number(q.logistics_charges || 0),
      subtotal: Number(q.subtotal || 0),
      vatRate: Number(q.vat_rate || 0),
      taxAmount: Number(q.tax_amount || 0),
      totalAmount: Number(q.total_amount || 0),
      status: q.status || 'sent',
      validUntil: q.valid_until,
      terms: q.terms,
      createdBy: q.created_by,
      convertedToSaleId: q.converted_to_sale_id || undefined,
      convertedToProjectId: q.converted_to_project_id || undefined,
      createdAt: q.created_at,
    }));

    // Map Projects
    const projects: InstallationProject[] = (projectsRes.data || []).map((p: any) => ({
      id: p.id,
      projectCode: p.project_code,
      title: p.title,
      customerId: p.customer_id,
      customerName: p.customer_name,
      customerPhone: p.customer_phone,
      siteAddress: p.site_address,
      capacityDescription: p.capacity_description || `${p.system_capacity_kva || 5}kVA Solar Hybrid`,
      leadTechnicianId: p.lead_engineer_id || p.lead_technician_id || '',
      leadTechnicianName: p.lead_engineer_name || p.lead_technician_name || 'Lead Solar Engineer',
      teamMembers: Array.isArray(p.team_members) ? p.team_members : (Array.isArray(p.assigned_technicians) ? p.assigned_technicians : []),
      status: p.status || 'lead',
      startDate: p.start_date || undefined,
      targetCompletionDate: p.target_completion_date || undefined,
      actualCompletionDate: p.commissioning_date || p.actual_completion_date || undefined,
      quotationId: p.quotation_id || undefined,
      contractAmount: Number(p.contract_amount || 0),
      equipmentCost: Number(p.total_material_cost || p.equipment_cost || 0),
      labourCost: Number(p.labor_cost || p.labour_cost || 0),
      transportCost: Number(p.logistics_cost || p.transport_cost || 0),
      otherExpenses: Number(p.other_expenses || 0),
      totalProjectCost: Number(p.total_project_cost || (Number(p.total_material_cost || 0) + Number(p.labor_cost || 0) + Number(p.logistics_cost || 0))),
      grossMargin: Number(p.project_gross_profit || p.gross_margin || (Number(p.contract_amount || 0) - Number(p.total_material_cost || 0) - Number(p.labor_cost || 0))),
      materials: Array.isArray(p.materials) ? p.materials : (Array.isArray(p.bill_of_materials) ? p.bill_of_materials : []),
      technicalNotes: p.technical_notes || p.notes || '',
      warrantyPeriodMonths: Number(p.warranty_period_months || 12),
      branchId: p.branch_id || undefined,
      branchName: p.branch_name || undefined,
      createdAt: p.created_at,
    }));

    // Map Expenses
    const expenses: Expense[] = (expensesRes.data || []).map((e: any) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: Number(e.amount || 0),
      paymentMethod: e.payment_method || 'bank_transfer',
      payee: e.payee,
      reference: e.reference || undefined,
      recordedByUserId: e.recorded_by_user_id || '',
      recordedByUserName: e.recorded_by_user_name,
      approvedBy: e.approved_by || undefined,
      projectId: e.project_id || undefined,
      branchId: e.branch_id || undefined,
      branchName: e.branch_name || undefined,
      createdAt: e.created_at,
    }));

    // Map Settings
    let settings: CompanySettings | null = null;
    if (settingsRes.data && settingsRes.data.length > 0) {
      const s = settingsRes.data[0];
      const parsedWarehouses =
        Array.isArray(s.warehouses) && s.warehouses.length > 0
          ? s.warehouses
          : INITIAL_SETTINGS.warehouses;
      settings = {
        companyName: s.company_name || INITIAL_SETTINGS.companyName,
        slogan: s.slogan || INITIAL_SETTINGS.slogan,
        location: s.location || INITIAL_SETTINGS.location,
        phone: s.phone || INITIAL_SETTINGS.phone,
        email: s.email || INITIAL_SETTINGS.email,
        headOfficeAddress: s.head_office_address || INITIAL_SETTINGS.headOfficeAddress,
        branchOfficeAddress: s.branch_office_address || INITIAL_SETTINGS.branchOfficeAddress,
        dugbePhone: s.dugbe_phone || INITIAL_SETTINGS.dugbePhone,
        dalutePhone: s.dalute_phone || INITIAL_SETTINGS.dalutePhone,
        customerServicePhone: s.customer_service_phone || s.phone || INITIAL_SETTINGS.customerServicePhone,
        facebookHandle: s.facebook_handle || INITIAL_SETTINGS.facebookHandle,
        instagramHandle: s.instagram_handle || INITIAL_SETTINGS.instagramHandle,
        tiktokHandle: s.tiktok_handle || INITIAL_SETTINGS.tiktokHandle,
        currencySymbol: s.currency_symbol || '₦',
        currencyCode: s.currency_code || 'NGN',
        defaultVatRate: Number(s.default_vat_rate ?? 7.5),
        enableTaxByDefault: Boolean(s.enable_tax_by_default),
        minGrossMarginPercent: Number(s.min_gross_margin_percent ?? 12),
        warehouses: parsedWarehouses,
        receiptFooterMessage: s.receipt_footer_message || INITIAL_SETTINGS.receiptFooterMessage,
        pwaAppTitle: s.pwa_app_title || INITIAL_SETTINGS.pwaAppTitle,
        pwaShortName: s.pwa_short_name || INITIAL_SETTINGS.pwaShortName,
        pwaLogoUrl: s.pwa_logo_url || INITIAL_SETTINGS.pwaLogoUrl,
        pwaThemeColor: s.pwa_theme_color || INITIAL_SETTINGS.pwaThemeColor,
        pwaBackgroundColor: s.pwa_background_color || INITIAL_SETTINGS.pwaBackgroundColor,
        enablePwaPrompt: s.enable_pwa_prompt !== false,
        pwaPromptDelaySeconds: Number(s.pwa_prompt_delay_seconds ?? 2),
        rolePermissions: s.role_permissions && typeof s.role_permissions === 'object' ? s.role_permissions : undefined,
      };
    }

    // Map Audit Logs
    const auditLogs: AuditLog[] = (auditRes.data || []).map((a: any) => ({
      id: a.id,
      timestamp: a.timestamp,
      userId: a.user_id || '',
      userName: a.user_name,
      userRole: a.user_role,
      action: a.action,
      module: a.module,
      recordId: a.record_id || undefined,
      details: a.details,
      ipAddress: a.ip_address || undefined,
    }));

    // Map Notifications
    const notifications: AppNotification[] = (notifsRes.data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || 'info',
      read: Boolean(n.read),
      linkModule: n.link_module || undefined,
      createdAt: n.created_at,
    }));

    // Map KPI Daily Logs
    const rawLogs: KpiDailyLog[] = (kpiLogsRes?.data || []).map((l: any) => ({
      id: l.id,
      kpiId: l.kpi_id,
      staffId: l.staff_id,
      logDate: l.log_date,
      activitiesCompleted: l.activities_completed || '',
      itemsHandled: Number(l.items_handled || 0),
      revenueGenerated: Number(l.revenue_generated || 0),
      challengesOrBlockers: l.challenges_or_blockers || undefined,
      createdAt: l.created_at,
    }));

    // Map Staff KPIs
    const staffKpis: StaffKpi[] = (kpisRes?.data || []).map((k: any) => ({
      id: k.id,
      staffId: k.staff_id,
      staffName: k.staff_name,
      staffRole: k.staff_role,
      branchId: k.branch_id || undefined,
      branchName: k.branch_name || undefined,
      period: k.period || 'November 2026',
      monthlySalesTarget: Number(k.monthly_sales_target || 0),
      actualSalesAchieved: Number(k.actual_sales_achieved || 0),
      grossProfitTarget: Number(k.gross_profit_target || 0),
      actualGrossProfit: Number(k.actual_gross_profit || 0),
      quotationsTarget: Number(k.quotations_target || 0),
      quotationsCreated: Number(k.quotations_created || 0),
      quotationsConverted: Number(k.quotations_converted || 0),
      stockAuditAccuracyPercent: Number(k.stock_audit_accuracy_percent || 100),
      installationsTarget: Number(k.installations_target || 0),
      installationsCompleted: Number(k.installations_completed || 0),
      customerSatisfactionScore: Number(k.customer_satisfaction_score || 5),
      attendancePunctualityPercent: Number(k.attendance_punctuality_percent || 100),
      status: k.status || 'active',
      acceptedAt: k.accepted_at || undefined,
      acceptedByStaffId: k.accepted_by_staff_id || undefined,
      acceptanceNotes: k.acceptance_notes || undefined,
      selfAssessmentNotes: k.self_assessment_notes || '',
      managerReviewNotes: k.manager_review_notes || '',
      performanceRating: k.performance_rating || 'Pending',
      dailyLogs: rawLogs.filter(l => l.kpiId === k.id),
      lastUpdatedByStaffAt: k.last_updated_by_staff_at || undefined,
      lastReviewedByManagerAt: k.last_reviewed_by_manager_at || undefined,
      createdAt: k.created_at,
      updatedAt: k.updated_at,
    }));

    return {
      branches,
      products,
      sales,
      stockMovements,
      customers,
      suppliers,
      purchaseOrders,
      quotations,
      projects,
      expenses,
      users,
      staffAccounts,
      settings,
      auditLogs,
      notifications,
      staffKpis,
    };
  } catch (err) {
    console.error('Failed to fetch data from Supabase:', err);
    return null;
  }
}

// ============================================================================
// CLOUD MUTATIONS (React Action -> Live Supabase PostgreSQL)
// ============================================================================

export async function saveProductToSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand || 'Offnot Energy',
      category: product.category,
      model: product.model || null,
      description: product.description || null,
      unit: product.unit || 'Unit',
      purchase_cost: product.purchaseCost,
      retail_price: product.retailPrice,
      wholesale_price: product.wholesalePrice,
      installer_price: product.installerPrice,
      dealer_price: product.dealerPrice,
      min_selling_price: product.minSellingPrice,
      current_stock: product.currentStock,
      reorder_level: product.reorderLevel,
      warehouse_location: product.warehouseLocation,
      branch_id: product.branchId || null,
      branch_name: product.branchName || null,
      supplier_id: product.supplierId || null,
      supplier_name: product.supplierName || null,
      barcode: product.barcode || null,
      specs: product.specs || {},
      status: product.status || 'active',
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('products').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('saveProductToSupabase error:', err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const { error } = await client.from('products').delete().eq('id', productId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveBranchToSupabase(branch: Branch): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    // If setting as HQ, unset HQ on other branches in Supabase
    if (branch.isHeadquarters) {
      await client.from('branches').update({ is_headquarters: false }).neq('id', branch.id);
    }

    const row = {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      city: branch.city || 'Ibadan',
      state: branch.state || 'Oyo State',
      address: branch.address || null,
      phone: branch.phone || null,
      email: branch.email || null,
      manager_name: branch.managerName || null,
      is_headquarters: Boolean(branch.isHeadquarters),
      is_active: branch.isActive !== false,
    };

    const { error } = await client.from('branches').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('saveBranchToSupabase error:', err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteBranchFromSupabase(branchId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const { error } = await client.from('branches').delete().eq('id', branchId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveSaleToSupabase(sale: Sale, payments?: PaymentRecord[]): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    // 1. Pre-validate customer_id so foreign keys never fail
    let validCustomerId: string | null = null;
    const isRealCustomerId = Boolean(
      sale.customerId &&
      sale.customerId !== 'walk_in' &&
      sale.customerId !== 'cust_walk_in' &&
      sale.customerId !== 'null' &&
      sale.customerId !== 'undefined'
    );
    if (isRealCustomerId && sale.customerId) {
      try {
        const { data: custExists } = await client
          .from('customers')
          .select('id')
          .eq('id', sale.customerId)
          .maybeSingle();
        if (custExists) {
          validCustomerId = custExists.id;
        }
      } catch (e) {
        validCustomerId = null;
      }
    }

    // 2. Pre-validate branch_id so foreign keys never fail
    let validBranchId: string | null = null;
    const isRealBranchId = Boolean(
      sale.branchId &&
      sale.branchId !== 'all' &&
      sale.branchId !== 'br_consolidated' &&
      sale.branchId !== 'null' &&
      sale.branchId !== 'undefined'
    );
    if (isRealBranchId && sale.branchId) {
      try {
        const { data: branchExists } = await client
          .from('branches')
          .select('id')
          .eq('id', sale.branchId)
          .maybeSingle();
        if (branchExists) {
          validBranchId = branchExists.id;
        }
      } catch (e) {
        validBranchId = null;
      }
    }

    const saleRow: Record<string, any> = {
      id: sale.id,
      invoice_number: sale.invoiceNumber,
      customer_id: validCustomerId,
      customer_name: sale.customerName || 'Walk-in Retail Customer',
      customer_phone: sale.customerPhone || null,
      customer_tier: sale.customerTier || 'retail',
      items: sale.items || [],
      subtotal: Number(sale.subtotal || 0),
      discount_total: Number(sale.discountTotal || 0),
      tax_amount: Number(sale.taxAmount || 0),
      grand_total: Number(sale.grandTotal || 0),
      paid_amount: Number(sale.paidAmount || 0),
      balance_due: Number(sale.balanceDue || 0),
      cost_of_goods_sold: Number(sale.costOfGoodsSold || 0),
      gross_profit: Number(sale.grossProfit || 0),
      payment_method: sale.paymentMethod || 'bank_transfer',
      payment_status: sale.paymentStatus || 'paid',
      payments: sale.payments || [],
      sales_rep_id: sale.salesRepId || null,
      sales_rep_name: sale.salesRepName || 'Sales Staff',
      warehouse_location: sale.warehouseLocation || 'Tipper Garage (HQ)',
      branch_id: validBranchId,
      branch_name: sale.branchName || null,
      notes: sale.notes || null,
      is_returned: Boolean(sale.returned),
      original_grand_total: Number(sale.originalGrandTotal ?? sale.grandTotal ?? 0),
      refund_amount: Number(sale.refundAmount || 0),
      refund_reason: sale.refundReason || null,
      refunded_at: sale.refundedAt || null,
      refunded_by: sale.refundedBy || null,
      refunded_by_user_id: sale.refundedByUserId || null,
      return_records: Array.isArray(sale.returnRecords) ? sale.returnRecords : [],
      created_at: sale.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const stripExtendedSaleCols = (row: Record<string, any>) => {
      const copy = { ...row };
      delete copy.original_grand_total;
      delete copy.refund_amount;
      delete copy.refund_reason;
      delete copy.refunded_at;
      delete copy.refunded_by;
      delete copy.refunded_by_user_id;
      delete copy.return_records;
      return copy;
    };

    // 3. Check if sale exists by id OR invoice_number to avoid unique constraint violations
    let existingRecordId: string | null = null;
    try {
      const { data: existing } = await client
        .from('sales')
        .select('id, invoice_number')
        .or(`id.eq.${sale.id},invoice_number.eq.${sale.invoiceNumber}`)
        .maybeSingle();
      if (existing) {
        existingRecordId = existing.id;
      }
    } catch (e) {
      // Ignore select error and attempt insert/upsert
    }

    const writeSaleRow = async (payload: Record<string, any>) => {
      let errOut: any = null;
      if (existingRecordId) {
        const { error } = await client.from('sales').update(payload).eq('id', existingRecordId);
        errOut = error;
      } else {
        const { error } = await client.from('sales').insert(payload);
        errOut = error;
        if (errOut && (errOut.code === '23505' || errOut.message?.includes('invoice_number'))) {
          const { error: updErr } = await client.from('sales').update(payload).eq('invoice_number', sale.invoiceNumber);
          errOut = updErr;
        }
      }
      return errOut;
    };

    let saleErr: any = await writeSaleRow(saleRow);

    if (saleErr && isMissingColumnError(saleErr)) {
      saleErr = await writeSaleRow(stripExtendedSaleCols(saleRow));
    }

    // Safety fallback: If any foreign key constraint still fails, strip customer_id & branch_id and retry
    if (saleErr && (saleErr.code === '23503' || saleErr.message?.includes('foreign key') || saleErr.message?.includes('fkey'))) {
      console.warn('Foreign key fallback: retrying sale insert with null customer_id & branch_id:', saleErr.message);
      saleRow.customer_id = null;
      saleRow.branch_id = null;
      let { error: retryErr } = await client.from('sales').upsert(saleRow);
      if (retryErr && isMissingColumnError(retryErr)) {
        const res = await client.from('sales').upsert(stripExtendedSaleCols(saleRow));
        retryErr = res.error;
      }
      saleErr = retryErr;
    }

    if (saleErr) throw saleErr;

    // Record individual payment rows only for new sales (prevents duplicates on reconciliation)
    if (!existingRecordId && payments && payments.length > 0) {
      try {
        const paymentRows = payments.map(p => ({
          id: p.id,
          sale_id: sale.id,
          amount: p.amount,
          method: p.method,
          reference: p.reference || null,
          recorded_by: p.recordedBy || 'Cashier',
          paid_at: p.paidAt || new Date().toISOString(),
        }));
        await client.from('payments').upsert(paymentRows);
      } catch (payErr) {
        console.warn('Supabase payment insert warning (sale was saved):', payErr);
      }
    }

    // Decrement current stock ONLY when inserting a brand-new sale (never on update/reconciliation)
    if (!existingRecordId && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        try {
          const { data: prodData } = await client.from('products').select('current_stock').eq('id', item.productId).single();
          if (prodData) {
            const newStock = Math.max(0, (prodData.current_stock || 0) - item.quantity);
            await client.from('products').update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq('id', item.productId);
          }
        } catch (stockErr) {
          console.warn(`Product stock update warning for ${item.productId}:`, stockErr);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('saveSaleToSupabase error:', err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveCustomerToSupabase(customer: Customer): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: customer.id,
      name: customer.name,
      contact_person: customer.contactPerson || null,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address,
      type: customer.type || 'retail',
      pricing_tier: customer.pricingTier || 'retail',
      lead_stage: customer.leadStage || 'new_lead',
      total_purchases: customer.totalPurchases || 0,
      outstanding_balance: customer.outstandingBalance || 0,
      last_purchase_date: customer.lastPurchaseDate || null,
      assigned_staff_id: customer.assignedStaffId || null,
      assigned_staff_name: customer.assignedStaffName || null,
      notes: customer.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('customers').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveSupplierToSupabase(supplier: Supplier): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: supplier.id,
      company_name: supplier.companyName,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || null,
      address: supplier.address || null,
      categories: supplier.categories || [],
      payment_terms: supplier.paymentTerms || 'Immediate',
      outstanding_balance: supplier.outstandingBalance || 0,
      notes: supplier.notes || null,
    };

    const { error } = await client.from('suppliers').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function savePurchaseOrderToSupabase(po: PurchaseOrder): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: po.id,
      po_number: po.poNumber,
      supplier_id: po.supplierId,
      supplier_name: po.supplierName,
      items: po.items,
      subtotal: po.subtotal,
      shipping_and_logistics: po.shippingAndLogistics,
      total_amount: po.totalAmount,
      paid_amount: po.paidAmount,
      status: po.status,
      warehouse_location: po.warehouseLocation,
      branch_id: po.branchId || null,
      expected_delivery_date: po.expectedDeliveryDate || null,
      approved_at: po.approvedAt || null,
      approved_by: po.approvedBy || null,
      notes: po.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('purchase_orders').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveQuotationToSupabase(quote: Quotation): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: quote.id,
      quotation_number: quote.quotationNumber,
      customer_id: quote.customerId || null,
      customer_name: quote.customerName,
      customer_phone: quote.customerPhone || null,
      customer_address: quote.customerAddress || null,
      items: quote.items,
      installation_charges: quote.installationCharges,
      logistics_charges: quote.logisticsCharges,
      subtotal: quote.subtotal,
      vat_rate: quote.vatRate,
      tax_amount: quote.taxAmount,
      total_amount: quote.totalAmount,
      status: quote.status,
      valid_until: quote.validUntil,
      terms: quote.terms,
      created_by: quote.createdBy,
      converted_to_sale_id: quote.convertedToSaleId || null,
      converted_to_project_id: quote.convertedToProjectId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('quotations').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveProjectToSupabase(project: InstallationProject): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: project.id,
      project_code: project.projectCode,
      title: project.title,
      customer_id: project.customerId || null,
      customer_name: project.customerName,
      customer_phone: project.customerPhone || null,
      site_address: project.siteAddress,
      capacity_description: project.capacityDescription,
      status: project.status,
      lead_technician_id: project.leadTechnicianId || null,
      lead_technician_name: project.leadTechnicianName || 'Lead Solar Engineer',
      team_members: Array.isArray(project.teamMembers) ? project.teamMembers : [],
      contract_amount: project.contractAmount,
      equipment_cost: project.equipmentCost,
      labour_cost: project.labourCost,
      transport_cost: project.transportCost,
      other_expenses: project.otherExpenses,
      total_project_cost: project.totalProjectCost,
      gross_margin: project.grossMargin,
      materials: project.materials || [],
      start_date: project.startDate || null,
      target_completion_date: project.targetCompletionDate || null,
      actual_completion_date: project.actualCompletionDate || null,
      warranty_period_months: project.warrantyPeriodMonths || 24,
      technical_notes: project.technicalNotes || null,
      branch_id: project.branchId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('installation_projects').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveExpenseToSupabase(expense: Expense): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: expense.id,
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      payment_method: expense.paymentMethod,
      payee: expense.payee,
      reference: expense.reference || null,
      recorded_by_user_id: expense.recordedByUserId || null,
      recorded_by_user_name: expense.recordedByUserName,
      approved_by: expense.approvedBy || null,
      project_id: expense.projectId || null,
      branch_id: expense.branchId || null,
    };

    const { error } = await client.from('expenses').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveStaffProfileToSupabase(staff: StaffAccount): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: staff.id,
      name: staff.name,
      username: staff.username || staff.email.split('@')[0],
      email: staff.email,
      phone: staff.phone || null,
      role: staff.role,
      branch_id: staff.branchId || null,
      branch_name: staff.branchName || null,
      temporary_password: staff.temporaryPassword || null,
      status: staff.status || 'active',
      has_full_system_access: Boolean(staff.hasFullSystemAccess),
      can_access_all_branches: Boolean(staff.canAccessAllBranches),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('user_profiles').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteStaffProfileFromSupabase(staffId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const { error } = await client.from('user_profiles').delete().eq('id', staffId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveStockMovementToSupabase(m: StockMovement): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: m.id,
      product_id: m.productId,
      product_name: m.productName,
      sku: m.sku,
      type: m.type,
      quantity: m.quantity,
      previous_stock: m.previousStock,
      new_stock: m.newStock,
      unit_cost: m.unitCost,
      total_cost: m.totalCost,
      reference_id: m.referenceId,
      warehouse_location: m.warehouseLocation,
      branch_id: m.branchId || null,
      branch_name: m.branchName || null,
      reason: m.reason,
      performed_by_user_id: m.performedByUserId || null,
      performed_by_user_name: m.performedByUserName,
      approved_by: m.approvedBy || null,
      created_at: m.timestamp || new Date().toISOString(),
    };

    const { error } = await client.from('stock_movements').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveSettingsToSupabase(settings: CompanySettings): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const baseRow = {
      id: 'cfg_offnot_main',
      company_name: settings.companyName,
      slogan: settings.slogan,
      location: settings.location,
      phone: settings.phone,
      email: settings.email,
      currency_symbol: settings.currencySymbol || '₦',
      currency_code: settings.currencyCode || 'NGN',
      default_vat_rate: settings.defaultVatRate,
      enable_tax_by_default: Boolean(settings.enableTaxByDefault),
      min_gross_margin_percent: settings.minGrossMarginPercent,
      receipt_footer_message: settings.receiptFooterMessage,
      pwa_app_title: settings.pwaAppTitle || 'Offnot Energy Management System',
      pwa_short_name: settings.pwaShortName || 'OffnotEnergy',
      pwa_logo_url: settings.pwaLogoUrl || '/pwa-512x512.png',
      pwa_theme_color: settings.pwaThemeColor || '#064e3b',
      pwa_background_color: settings.pwaBackgroundColor || '#0f172a',
      enable_pwa_prompt: settings.enablePwaPrompt !== false,
      pwa_prompt_delay_seconds: settings.pwaPromptDelaySeconds || 2,
      updated_at: new Date().toISOString(),
    };

    const fullRow = {
      ...baseRow,
      head_office_address: settings.headOfficeAddress || null,
      branch_office_address: settings.branchOfficeAddress || null,
      dugbe_phone: settings.dugbePhone || null,
      dalute_phone: settings.dalutePhone || null,
      customer_service_phone: settings.customerServicePhone || settings.phone || null,
      facebook_handle: settings.facebookHandle || null,
      instagram_handle: settings.instagramHandle || null,
      tiktok_handle: settings.tiktokHandle || null,
      warehouses: Array.isArray(settings.warehouses) ? settings.warehouses : [],
      role_permissions: settings.rolePermissions || null,
    };

    let { error } = await client.from('company_settings').upsert(fullRow);
    if (error && isMissingColumnError(error)) {
      const retry = await client.from('company_settings').upsert(baseRow);
      error = retry.error;
    }
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveAuditLogToSupabase(log: AuditLog): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return;

  try {
    const row = {
      id: log.id,
      timestamp: log.timestamp,
      user_id: log.userId || null,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      module: log.module,
      record_id: log.recordId || null,
      details: log.details,
      ip_address: log.ipAddress || null,
    };
    await client.from('audit_logs').insert(row);
  } catch (err) {
    // Non-blocking for audit log inserts
    console.warn('Audit log Supabase write warning:', err);
  }
}

export async function saveKpiToSupabase(kpi: StaffKpi): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: kpi.id,
      staff_id: kpi.staffId,
      staff_name: kpi.staffName,
      staff_role: kpi.staffRole,
      branch_id: kpi.branchId || null,
      branch_name: kpi.branchName || null,
      period: kpi.period,
      monthly_sales_target: kpi.monthlySalesTarget,
      actual_sales_achieved: kpi.actualSalesAchieved,
      gross_profit_target: kpi.grossProfitTarget,
      actual_gross_profit: kpi.actualGrossProfit,
      quotations_target: kpi.quotationsTarget,
      quotations_created: kpi.quotationsCreated,
      quotations_converted: kpi.quotationsConverted,
      stock_audit_accuracy_percent: kpi.stockAuditAccuracyPercent,
      installations_target: kpi.installationsTarget,
      installations_completed: kpi.installationsCompleted,
      customer_satisfaction_score: kpi.customerSatisfactionScore,
      attendance_punctuality_percent: kpi.attendancePunctualityPercent,
      status: kpi.status,
      accepted_at: kpi.acceptedAt || null,
      accepted_by_staff_id: kpi.acceptedByStaffId || null,
      acceptance_notes: kpi.acceptanceNotes || null,
      self_assessment_notes: kpi.selfAssessmentNotes,
      manager_review_notes: kpi.managerReviewNotes,
      performance_rating: kpi.performanceRating,
      last_updated_by_staff_at: kpi.lastUpdatedByStaffAt || null,
      last_reviewed_by_manager_at: kpi.lastReviewedByManagerAt || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('staff_kpis').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveKpiDailyLogToSupabase(log: KpiDailyLog): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const row = {
      id: log.id,
      kpi_id: log.kpiId,
      staff_id: log.staffId,
      log_date: log.logDate,
      activities_completed: log.activitiesCompleted,
      items_handled: log.itemsHandled,
      revenue_generated: log.revenueGenerated,
      challenges_or_blockers: log.challengesOrBlockers || null,
    };

    const { error } = await client.from('kpi_daily_logs').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteKpiFromSupabase(kpiId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const { error } = await client.from('staff_kpis').delete().eq('id', kpiId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveSaleReturnToSupabase(
  sale: Sale,
  returnedProducts: Product | Product[],
  movements: StockMovement | StockMovement[],
  customer?: Customer | null
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured' };

  try {
    const prodList = Array.isArray(returnedProducts) ? returnedProducts : [returnedProducts];
    const moveList = Array.isArray(movements) ? movements : [movements];
    const resolvedProductIds = new Map<string, string>();
    const now = new Date().toISOString();

    // 1. Update products with restored current_stock in Supabase (match by id or sku)
    for (const prod of prodList) {
      let targetCloudId = prod.id;
      const { data: updatedById, error: prodErr } = await client
        .from('products')
        .update({
          current_stock: prod.currentStock,
          updated_at: now,
        })
        .eq('id', prod.id)
        .select('id');

      if (prodErr) throw prodErr;

      if ((!updatedById || updatedById.length === 0) && prod.sku) {
        const { data: updatedBySku, error: skuErr } = await client
          .from('products')
          .update({
            current_stock: prod.currentStock,
            updated_at: now,
          })
          .eq('sku', prod.sku)
          .select('id');
        if (skuErr) throw skuErr;
        if (updatedBySku && updatedBySku.length > 0) {
          targetCloudId = updatedBySku[0].id;
        }
      }
      resolvedProductIds.set(prod.id, targetCloudId);
      if (prod.sku) {
        resolvedProductIds.set(prod.sku, targetCloudId);
      }
    }

    // 2. Update sale record with net grand_total, COGS, gross_profit, paid_amount, balance_due, items, and refund metadata
    const baseSaleUpdate = {
      is_returned: Boolean(sale.returned),
      items: sale.items,
      grand_total: Number(sale.grandTotal || 0),
      paid_amount: Number(sale.paidAmount || 0),
      balance_due: Number(sale.balanceDue || 0),
      cost_of_goods_sold: Number(sale.costOfGoodsSold || 0),
      gross_profit: Number(sale.grossProfit || 0),
      payment_status: sale.paymentStatus || 'paid',
      notes: sale.notes || null,
      updated_at: now,
    };

    const fullSaleUpdate = {
      ...baseSaleUpdate,
      original_grand_total: Number(sale.originalGrandTotal ?? sale.grandTotal ?? 0),
      refund_amount: Number(sale.refundAmount || 0),
      refund_reason: sale.refundReason || null,
      refunded_at: sale.refundedAt || null,
      refunded_by: sale.refundedBy || null,
      refunded_by_user_id: sale.refundedByUserId || null,
      return_records: Array.isArray(sale.returnRecords) ? sale.returnRecords : [],
    };

    let { data: updatedSaleRows, error: saleUpdErr } = await client
      .from('sales')
      .update(fullSaleUpdate)
      .eq('id', sale.id)
      .select('id');

    if (saleUpdErr && isMissingColumnError(saleUpdErr)) {
      const retry = await client
        .from('sales')
        .update(baseSaleUpdate)
        .eq('id', sale.id)
        .select('id');
      updatedSaleRows = retry.data;
      saleUpdErr = retry.error;
    }

    // Fallback by invoice_number if id differed across synced devices
    if (!saleUpdErr && (!updatedSaleRows || updatedSaleRows.length === 0) && sale.invoiceNumber) {
      let { error: invErr } = await client
        .from('sales')
        .update(fullSaleUpdate)
        .eq('invoice_number', sale.invoiceNumber);
      if (invErr && isMissingColumnError(invErr)) {
        const retryInv = await client
          .from('sales')
          .update(baseSaleUpdate)
          .eq('invoice_number', sale.invoiceNumber);
        invErr = retryInv.error;
      }
      saleUpdErr = invErr;
    }

    if (saleUpdErr) throw saleUpdErr;

    // 3. Record customer return movements in stock_movements using exact schema columns (`type`, `created_at`)
    if (moveList.length > 0) {
      const movementRows = moveList.map(movement => ({
        id: movement.id,
        product_id: resolvedProductIds.get(movement.productId) || resolvedProductIds.get(movement.sku) || movement.productId,
        product_name: movement.productName,
        sku: movement.sku,
        type: 'customer_return',
        quantity: movement.quantity,
        previous_stock: movement.previousStock,
        new_stock: movement.newStock,
        unit_cost: movement.unitCost,
        total_cost: movement.totalCost,
        reference_id: movement.referenceId,
        warehouse_location: movement.warehouseLocation,
        branch_id: movement.branchId || null,
        branch_name: movement.branchName || null,
        reason: movement.reason,
        performed_by_user_id: movement.performedByUserId || null,
        performed_by_user_name: movement.performedByUserName,
        created_at: movement.timestamp || now,
      }));
      const { error: movErr } = await client.from('stock_movements').upsert(movementRows);
      if (movErr) throw movErr;
    }

    // 4. Update customer totals if customer provided
    if (customer && customer.id && customer.id !== 'walk_in' && customer.id !== 'cust_walk_in') {
      await client
        .from('customers')
        .update({
          total_purchases: Number(customer.totalPurchases || 0),
          outstanding_balance: Number(customer.outstandingBalance || 0),
          updated_at: now,
        })
        .eq('id', customer.id);
    }

    return { success: true };
  } catch (err: any) {
    console.error('saveSaleReturnToSupabase error:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Reset all cloud transactional tables (sales, payments, stock_movements, POs, quotations,
 * projects, expenses, KPI actuals, notifications & audit logs) and set EVERY product's current_stock = 0.
 * Strictly preserves user_profiles (real staff), branches, categories, company_settings (logo/contacts),
 * and customer/supplier/product catalog definitions.
 */
export async function resetCleanZeroLedgerInSupabase(
  cleanNotification?: AppNotification,
  cleanAuditLog?: AuditLog
): Promise<{ success: boolean; error?: string; clearedTables: string[] }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured', clearedTables: [] };
  }

  const now = new Date().toISOString();
  const clearedTables: string[] = [];

  try {
    // Attempt server-side atomic RPC first (created by Migration Patch 10)
    const { data: rpcData, error: rpcErr } = await client.rpc('fn_reset_clean_zero_ledger');
    if (!rpcErr && rpcData) {
      if (cleanNotification) {
        await client.from('app_notifications').insert({
          id: cleanNotification.id,
          title: cleanNotification.title,
          message: cleanNotification.message,
          type: cleanNotification.type,
          read: cleanNotification.read,
          link_module: cleanNotification.linkModule || 'dashboard',
          created_at: cleanNotification.createdAt,
        });
      }
      if (cleanAuditLog) {
        await saveAuditLogToSupabase(cleanAuditLog);
      }
      return {
        success: true,
        clearedTables: [
          'payments',
          'stock_movements',
          'sales',
          'purchase_orders',
          'quotations',
          'installation_projects',
          'expenses',
          'kpi_daily_logs',
          'products(stock=0)',
          'customers(balances=0)',
          'suppliers(balances=0)',
          'staff_kpis(actuals=0)',
        ],
      };
    }

    // Fallback: direct REST operations across operational tables (safe with Patch 06/07 FOR ALL policies)
    const tablesToClear = [
      'payments',
      'stock_movements',
      'sales',
      'purchase_orders',
      'quotations',
      'installation_projects',
      'expenses',
      'kpi_daily_logs',
      'audit_logs',
      'app_notifications',
    ];

    const deleteErrors: string[] = [];
    for (const tbl of tablesToClear) {
      const { error } = await client.from(tbl).delete().neq('id', '');
      if (error) {
        // Ignore missing optional tables (e.g. if KPI patch wasn't applied yet)
        const msg = String(error.message || '').toLowerCase();
        if (!msg.includes('does not exist') && !msg.includes('schema cache')) {
          deleteErrors.push(`${tbl}: ${error.message}`);
        }
      } else {
        clearedTables.push(tbl);
      }
    }

    // Zero all product stock quantities without deleting any catalog items
    const { error: prodErr } = await client
      .from('products')
      .update({ current_stock: 0, updated_at: now })
      .neq('id', '');
    if (prodErr) {
      deleteErrors.push(`products: ${prodErr.message}`);
    } else {
      clearedTables.push('products(stock=0)');
    }

    // Zero customer transactional balances while keeping CRM profiles
    const { error: custErr } = await client
      .from('customers')
      .update({
        total_purchases: 0,
        outstanding_balance: 0,
        last_purchase_date: null,
        updated_at: now,
      })
      .neq('id', '');
    if (!custErr) {
      clearedTables.push('customers(balances=0)');
    }

    // Zero supplier payables
    const { error: supErr } = await client
      .from('suppliers')
      .update({ outstanding_balance: 0 })
      .neq('id', '');
    if (!supErr) {
      clearedTables.push('suppliers(balances=0)');
    }

    // Reset KPI actuals to 0 while keeping assigned staff targets
    const { error: kpiErr } = await client
      .from('staff_kpis')
      .update({
        actual_sales_achieved: 0,
        actual_gross_profit: 0,
        quotations_created: 0,
        quotations_converted: 0,
        installations_completed: 0,
        self_assessment_notes: '',
        manager_review_notes: '',
        performance_rating: 'Pending',
        updated_at: now,
      })
      .neq('id', '');
    if (!kpiErr) {
      clearedTables.push('staff_kpis(actuals=0)');
    }

    if (cleanNotification) {
      await client.from('app_notifications').insert({
        id: cleanNotification.id,
        title: cleanNotification.title,
        message: cleanNotification.message,
        type: cleanNotification.type,
        read: cleanNotification.read,
        link_module: cleanNotification.linkModule || 'dashboard',
        created_at: cleanNotification.createdAt,
      });
    }
    if (cleanAuditLog) {
      await saveAuditLogToSupabase(cleanAuditLog);
    }

    if (deleteErrors.length > 0) {
      return {
        success: false,
        error: deleteErrors.join(' | '),
        clearedTables,
      };
    }

    return { success: true, clearedTables };
  } catch (err: any) {
    console.error('resetCleanZeroLedgerInSupabase error:', err);
    return {
      success: false,
      error: err.message || String(err),
      clearedTables,
    };
  }
}


