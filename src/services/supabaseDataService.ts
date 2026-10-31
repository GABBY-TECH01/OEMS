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
} from '../types';

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
      settings = {
        companyName: s.company_name || 'Offnot Energy',
        slogan: s.slogan || 'Clean Energy, Stronger Tomorrow',
        location: s.location || 'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
        phone: s.phone || '07047053453',
        email: s.email || 'offnotenergy@gmail.com',
        currencySymbol: s.currency_symbol || '₦',
        currencyCode: s.currency_code || 'NGN',
        defaultVatRate: Number(s.default_vat_rate || 7.5),
        enableTaxByDefault: Boolean(s.enable_tax_by_default),
        minGrossMarginPercent: Number(s.min_gross_margin_percent || 12),
        warehouses: [
          'Main Showroom - Tipper Garage, Ibadan',
          'Primary Warehouse - Tipper Garage, Ibadan',
          'Dalute Road Retail Depot, Ibadan',
        ],
        receiptFooterMessage: s.receipt_footer_message || 'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow.',
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
    const saleRow = {
      id: sale.id,
      invoice_number: sale.invoiceNumber,
      customer_id: sale.customerId || null,
      customer_name: sale.customerName,
      customer_phone: sale.customerPhone || null,
      customer_tier: sale.customerTier || 'retail',
      items: sale.items,
      subtotal: sale.subtotal,
      discount_total: sale.discountTotal,
      tax_amount: sale.taxAmount,
      grand_total: sale.grandTotal,
      paid_amount: sale.paidAmount,
      balance_due: sale.balanceDue,
      cost_of_goods_sold: sale.costOfGoodsSold,
      gross_profit: sale.grossProfit,
      payment_method: sale.paymentMethod,
      payment_status: sale.paymentStatus,
      payments: sale.payments,
      sales_rep_id: sale.salesRepId || null,
      sales_rep_name: sale.salesRepName,
      warehouse_location: sale.warehouseLocation,
      branch_id: sale.branchId || null,
      branch_name: sale.branchName || null,
      notes: sale.notes || null,
      is_returned: Boolean(sale.returned),
      created_at: sale.createdAt,
    };

    const { error: saleErr } = await client.from('sales').upsert(saleRow);
    if (saleErr) throw saleErr;

    // Record individual payment rows if provided
    if (payments && payments.length > 0) {
      const paymentRows = payments.map(p => ({
        id: p.id,
        sale_id: sale.id,
        amount: p.amount,
        method: p.method,
        reference: p.reference || null,
        recorded_by: p.recordedBy,
        paid_at: p.paidAt,
      }));
      await client.from('payments').insert(paymentRows);
    }

    // Decrement current stock on products in Supabase
    for (const item of sale.items) {
      const { data: prodData } = await client.from('products').select('current_stock').eq('id', item.productId).single();
      if (prodData) {
        const newStock = Math.max(0, (prodData.current_stock || 0) - item.quantity);
        await client.from('products').update({ current_stock: newStock }).eq('id', item.productId);
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
      customer_id: project.customerId,
      customer_name: project.customerName,
      customer_phone: project.customerPhone,
      site_address: project.siteAddress,
      capacity_description: project.capacityDescription,
      status: project.status,
      lead_engineer_id: project.leadTechnicianId,
      lead_engineer_name: project.leadTechnicianName,
      assigned_technicians: project.teamMembers,
      contract_amount: project.contractAmount,
      total_material_cost: project.equipmentCost,
      labor_cost: project.labourCost,
      logistics_cost: project.transportCost,
      other_expenses: project.otherExpenses,
      total_project_cost: project.totalProjectCost,
      project_gross_profit: project.grossMargin,
      materials: project.materials,
      start_date: project.startDate || null,
      target_completion_date: project.targetCompletionDate || null,
      commissioning_date: project.actualCompletionDate || null,
      warranty_period_months: project.warrantyPeriodMonths,
      notes: project.technicalNotes || null,
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

    const { error } = await client.from('stock_movements').insert(row);
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
    const row = {
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
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('company_settings').upsert(row);
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
