import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  Wrench,
  Users,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  ChevronRight,
  Calendar,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatNaira, formatLagosDateTime, formatLagosDate, hasPermission } from '../../utils/formatters';
import { StatCard } from '../common/CommonUI';

type DateFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export const Dashboard: React.FC = () => {
  const {
    products: allProducts,
    sales: allSales,
    purchaseOrders,
    customers,
    projects: allProjects,
    quotations,
    expenses: allExpenses,
    stockMovements,
    currentUser,
    setActiveTab,
    activeBranchId,
    branches,
  } = useApp();

  const activeBranch = branches.find(b => b.id === activeBranchId);

  // Branch-specific filtering (or consolidated when 'all')
  const products = useMemo(
    () => (activeBranchId === 'all' ? allProducts : allProducts.filter(p => p.branchId === activeBranchId)),
    [allProducts, activeBranchId]
  );

  const sales = useMemo(
    () => (activeBranchId === 'all' ? allSales : allSales.filter(s => s.branchId === activeBranchId)),
    [allSales, activeBranchId]
  );

  const expenses = useMemo(
    () => (activeBranchId === 'all' ? allExpenses : allExpenses.filter(e => e.branchId === activeBranchId)),
    [allExpenses, activeBranchId]
  );

  const projects = useMemo(
    () => (activeBranchId === 'all' ? allProjects : allProjects.filter(p => p.branchId === activeBranchId)),
    [allProjects, activeBranchId]
  );

  const [dateFilter, setDateFilter] = useState<DateFilter>('month');

  // Filter range calculation
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    return sales.filter(s => {
      const saleTime = new Date(s.createdAt).getTime();
      switch (dateFilter) {
        case 'today':
          return saleTime >= startOfToday;
        case 'week':
          return saleTime >= startOfWeek;
        case 'month':
          return saleTime >= startOfMonth;
        case 'quarter':
          return saleTime >= startOfQuarter;
        case 'year':
          return saleTime >= startOfYear;
        default:
          return true;
      }
    });
  }, [sales, dateFilter]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return expenses.filter(e => new Date(e.createdAt).getTime() >= startOfMonth);
  }, [expenses]);

  // Aggregate Metrics
  const todaySalesTotal = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return sales
      .filter(s => s.createdAt.slice(0, 10) === todayStr)
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales]);

  const weekSalesTotal = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    return sales
      .filter(s => new Date(s.createdAt).getTime() >= oneWeekAgo)
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales]);

  const monthSalesTotal = useMemo(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    return sales
      .filter(s => new Date(s.createdAt).getTime() >= startOfMonth)
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales]);

  const periodSalesTotal = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.grandTotal, 0),
    [filteredSales]
  );

  const periodGrossProfit = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.grossProfit, 0),
    [filteredSales]
  );

  const totalInventoryValuation = useMemo(
    () => products.reduce((sum, p) => sum + p.currentStock * p.purchaseCost, 0),
    [products]
  );

  const totalRetailInventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.currentStock * p.retailPrice, 0),
    [products]
  );

  const customerReceivables = useMemo(
    () => customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0),
    [customers]
  );

  const supplierPayables = useMemo(
    () => purchaseOrders.reduce((sum, po) => sum + Math.max(0, po.totalAmount - po.paidAmount), 0),
    [purchaseOrders]
  );

  const lowStockProducts = useMemo(
    () => products.filter(p => p.currentStock > 0 && p.currentStock <= p.reorderLevel),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter(p => p.currentStock <= 0),
    [products]
  );

  const activeProjects = useMemo(
    () => projects.filter(p => p.status === 'in_progress' || p.status === 'scheduled'),
    [projects]
  );

  const periodExpensesTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  // Sales Trend Chart Data
  const salesTrendData = useMemo(() => {
    const days: { [key: string]: { date: string; revenue: number; profit: number } } = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      days[key] = { date: label, revenue: 0, profit: 0 };
      return key;
    });

    sales.forEach(sale => {
      const key = sale.createdAt.slice(0, 10);
      if (days[key]) {
        days[key].revenue += sale.grandTotal;
        days[key].profit += sale.grossProfit;
      }
    });

    return Object.values(days);
  }, [sales]);

  // Category Distribution
  const categorySalesData = useMemo(() => {
    const catMap: { [cat: string]: number } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'Other solar accessories';
        catMap[cat] = (catMap[cat] || 0) + item.subtotal;
      });
    });

    const colors = ['#047857', '#ea580c', '#0284c7', '#d97706', '#8b5cf6', '#64748b'];
    return Object.entries(catMap)
      .map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sales, products]);

  const canSeeFinancials = hasPermission(currentUser.role, 'view_financials');

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {activeBranch ? activeBranch.name : 'Offnot Energy (Consolidated View)'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {activeBranch ? activeBranch.code : 'All Ibadan Branches'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {activeBranch ? activeBranch.address || `${activeBranch.city}, Oyo State` : 'Consolidated performance across Tipper Garage, Dalute Road, and Iwo Road Hubs'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('branches')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            title="View comparative sales and inventory performance across all branches with D3"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Branch D3 Overview</span>
          </button>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto">
            {(['today', 'week', 'month', 'quarter', 'year', 'all'] as DateFilter[]).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors whitespace-nowrap ${
                  dateFilter === df
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {df === 'all' ? 'All Time' : df}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatNaira(todaySalesTotal)}
          subValue={`This week: ${formatNaira(weekSalesTotal)}`}
          trend={{ value: 'Real-time', isPositive: true }}
          icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />

        {canSeeFinancials ? (
          <StatCard
            label="Gross Profit (Selected Period)"
            value={formatNaira(periodGrossProfit)}
            subValue={`Revenue: ${formatNaira(periodSalesTotal)}`}
            trend={{
              value: periodSalesTotal > 0 ? `${Math.round((periodGrossProfit / periodSalesTotal) * 100)}% margin` : '0%',
              isPositive: true,
            }}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            variant="emerald"
          />
        ) : (
          <StatCard
            label="Sales Orders (Period)"
            value={filteredSales.length}
            subValue="Completed POS Transactions"
            icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
          />
        )}

        {canSeeFinancials ? (
          <StatCard
            label="Inventory Valuation (Cost)"
            value={formatNaira(totalInventoryValuation)}
            subValue={`Retail value: ${formatNaira(totalRetailInventoryValue)}`}
            icon={<Package className="w-4 h-4 text-slate-600" />}
          />
        ) : (
          <StatCard
            label="Total Products in Catalog"
            value={products.length}
            subValue="Across 3 Ibadan Warehouses"
            icon={<Package className="w-4 h-4 text-slate-600" />}
          />
        )}

        <StatCard
          label="Customer Receivables"
          value={formatNaira(customerReceivables)}
          subValue={`Supplier Payables: ${formatNaira(supplierPayables)}`}
          trend={{ value: `${customers.filter(c => c.outstandingBalance > 0).length} accounts`, isPositive: false }}
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          variant={customerReceivables > 0 ? 'amber' : 'default'}
        />
      </div>

      {/* Secondary Operational Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-700 block">Low Stock Items</span>
            <span className="text-lg font-bold font-mono tabular-nums text-amber-800">
              {lowStockProducts.length}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-700 block">Active Solar Projects</span>
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-800">
              {activeProjects.length}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('purchasing')}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-700 block">Pending POs</span>
            <span className="text-lg font-bold font-mono tabular-nums text-blue-800">
              {purchaseOrders.filter(p => p.status === 'pending_approval').length}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-700 block">Expenses (Month)</span>
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatNaira(periodExpensesTotal, false)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit 7-Day Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sales & Margin Trajectory</h3>
              <p className="text-xs text-slate-700">7-day performance at Offnot Energy</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Revenue
              </span>
              {canSeeFinancials && (
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Gross Profit
                </span>
              )}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={val => `₦${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [formatNaira(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                {canSeeFinancials && (
                  <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Product Categories */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Revenue by Category</h3>
            <p className="text-xs text-slate-700 mb-4">Top product departments</p>

            {categorySalesData.length > 0 ? (
              <div className="space-y-3">
                {categorySalesData.map(cat => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {cat.name}
                      </span>
                      <span className="font-mono tabular-nums text-slate-900 font-semibold">
                        {formatNaira(cat.value)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (cat.value / (periodSalesTotal || 1)) * 100)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No sales recorded yet.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
            <span>Branch: Dalute Road, Ibadan</span>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-emerald-800 hover:text-emerald-950 font-semibold"
            >
              Full Analytics →
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Operational Split: Recent Sales & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completed Sales */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Completed Sales</h3>
              <p className="text-xs text-slate-700">Latest customer invoices</p>
            </div>
            <button
              onClick={() => setActiveTab('sales_history')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              View All ({sales.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-900">
                      {sale.invoiceNumber}
                    </span>
                    <span className="text-[11px] text-slate-700 capitalize">
                      · {sale.customerTier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 truncate max-w-xs">{sale.customerName}</p>
                  <p className="text-[11px] text-slate-600">{formatLagosDateTime(sale.createdAt)}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                    {formatNaira(sale.grandTotal)}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      sale.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {sale.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock & Reorder Trigger List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Inventory Attention Needed</h3>
              <p className="text-xs text-slate-700">Items at or below reorder threshold</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Open Stock Ledger
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-600">
                All inventory levels are currently above reorder thresholds.
              </div>
            ) : (
              [...outOfStockProducts, ...lowStockProducts].map(prod => (
                <div key={prod.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {prod.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{prod.sku}</span>
                      <span>·</span>
                      <span>{prod.warehouseLocation}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        prod.currentStock === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prod.currentStock} {prod.unit}s left
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Reorder at: {prod.reorderLevel}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
