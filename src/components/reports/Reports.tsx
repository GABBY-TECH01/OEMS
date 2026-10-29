import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Package,
  Users,
  Award,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatNaira, formatLagosDateTime, exportToCSV } from '../../utils/formatters';

type ReportType =
  | 'sales_summary'
  | 'product_margins'
  | 'inventory_valuation'
  | 'installer_performance'
  | 'customer_receivables'
  | 'project_profitability'
  | 'slow_moving_stock';

export const Reports: React.FC = () => {
  const { sales, products, customers, projects, purchaseOrders, expenses } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('sales_summary');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Filter sales by date
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    return sales.filter(s => {
      const t = new Date(s.createdAt).getTime();
      switch (dateFilter) {
        case 'today':
          return t >= startOfToday;
        case 'week':
          return t >= startOfWeek;
        case 'month':
          return t >= startOfMonth;
        case 'year':
          return t >= startOfYear;
        default:
          return true;
      }
    });
  }, [sales, dateFilter]);

  // 1. Sales Summary Data
  const salesSummary = useMemo(() => {
    const revenue = filteredSales.reduce((s, sale) => s + sale.grandTotal, 0);
    const cogs = filteredSales.reduce((s, sale) => s + sale.costOfGoodsSold, 0);
    const grossProfit = revenue - cogs;
    const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
    return { count: filteredSales.length, revenue, cogs, grossProfit, margin };
  }, [filteredSales]);

  // 2. Product Margins Breakdown
  const productMargins = useMemo(() => {
    const map: {
      [id: string]: {
        name: string;
        sku: string;
        qtySold: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
      };
    } = {};

    filteredSales.forEach(s => {
      s.items.forEach(item => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            sku: item.sku,
            qtySold: 0,
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
          };
        }
        const lineRev = item.unitPrice * item.quantity - item.discount;
        const lineCost = item.unitCost * item.quantity;
        map[item.productId].qtySold += item.quantity;
        map[item.productId].revenue += lineRev;
        map[item.productId].cogs += lineCost;
        map[item.productId].grossProfit += lineRev - lineCost;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // 3. Slow Moving / Dead Stock Data
  const slowMovingProducts = useMemo(() => {
    const soldProductIds = new Set<string>();
    filteredSales.forEach(s => s.items.forEach(i => soldProductIds.add(i.productId)));

    return products
      .filter(p => !soldProductIds.has(p.id) && p.currentStock > 0)
      .map(p => ({
        ...p,
        tiedCapital: p.currentStock * p.purchaseCost,
      }))
      .sort((a, b) => b.tiedCapital - a.tiedCapital);
  }, [products, filteredSales]);

  // 4. Installer Performance Data
  const installerPerformance = useMemo(() => {
    return customers
      .filter(c => c.type === 'solar_installer' || c.pricingTier === 'installer')
      .map(inst => {
        const instSales = filteredSales.filter(s => s.customerId === inst.id);
        const revenue = instSales.reduce((s, sale) => s + sale.grandTotal, 0);
        return {
          id: inst.id,
          name: inst.name,
          territory: inst.installerDetails?.territory || 'Ibadan Metro',
          ordersCount: instSales.length,
          periodRevenue: revenue,
          lifetimePurchases: inst.totalPurchases,
          balanceDue: inst.outstandingBalance,
        };
      })
      .sort((a, b) => b.periodRevenue - a.periodRevenue);
  }, [customers, filteredSales]);

  // Export Active Report to CSV
  const handleExportActiveReport = () => {
    switch (activeReport) {
      case 'sales_summary': {
        const rows = filteredSales.map(s => ({
          Invoice: s.invoiceNumber,
          Date: s.createdAt,
          Customer: s.customerName,
          Total: s.grandTotal,
          COGS: s.costOfGoodsSold,
          Profit: s.grossProfit,
          Payment: s.paymentMethod,
        }));
        exportToCSV('offnot_sales_report', rows);
        break;
      }
      case 'product_margins': {
        const rows = productMargins.map(p => ({
          Product: p.name,
          SKU: p.sku,
          QtySold: p.qtySold,
          Revenue: p.revenue,
          COGS: p.cogs,
          GrossProfit: p.grossProfit,
          MarginPercent: p.revenue > 0 ? Math.round((p.grossProfit / p.revenue) * 100) : 0,
        }));
        exportToCSV('offnot_product_margins_report', rows);
        break;
      }
      case 'inventory_valuation': {
        const rows = products.map(p => ({
          SKU: p.sku,
          Product: p.name,
          Stock: p.currentStock,
          UnitCost: p.purchaseCost,
          TotalCostValuation: p.currentStock * p.purchaseCost,
          RetailPrice: p.retailPrice,
          TotalRetailValue: p.currentStock * p.retailPrice,
          Warehouse: p.warehouseLocation,
        }));
        exportToCSV('offnot_inventory_valuation_report', rows);
        break;
      }
      case 'slow_moving_stock': {
        const rows = slowMovingProducts.map(p => ({
          SKU: p.sku,
          Product: p.name,
          CurrentStock: p.currentStock,
          UnitCost: p.purchaseCost,
          TiedUpCapital: p.tiedCapital,
          Warehouse: p.warehouseLocation,
        }));
        exportToCSV('offnot_slow_moving_stock_report', rows);
        break;
      }
      case 'installer_performance': {
        const rows = installerPerformance.map(i => ({
          Installer: i.name,
          Territory: i.territory,
          Orders: i.ordersCount,
          PeriodRevenue: i.periodRevenue,
          LifetimePurchases: i.lifetimePurchases,
          OutstandingBalance: i.balanceDue,
        }));
        exportToCSV('offnot_installer_performance_report', rows);
        break;
      }
      case 'customer_receivables': {
        const rows = customers
          .filter(c => c.outstandingBalance > 0)
          .map(c => ({
            Customer: c.name,
            Phone: c.phone,
            Tier: c.pricingTier,
            OutstandingBalance: c.outstandingBalance,
            TotalPurchases: c.totalPurchases,
            Address: c.address,
          }));
        exportToCSV('offnot_customer_receivables_report', rows);
        break;
      }
      case 'project_profitability': {
        const rows = projects.map(p => ({
          Code: p.projectCode,
          Title: p.title,
          Customer: p.customerName,
          ContractAmount: p.contractAmount,
          TotalProjectCost: p.totalProjectCost,
          GrossMargin: p.grossMargin,
          Status: p.status,
        }));
        exportToCSV('offnot_installation_profitability_report', rows);
        break;
      }
    }
  };

  const reportsList: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: 'sales_summary', label: 'Sales & Revenue Summary', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'product_margins', label: 'Product Margins & Profitability', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'inventory_valuation', label: 'Warehouse Inventory Valuation', icon: <Package className="w-4 h-4" /> },
    { id: 'installer_performance', label: 'Installer Sales & Volume', icon: <Award className="w-4 h-4" /> },
    { id: 'customer_receivables', label: 'Customer Receivables & Aging', icon: <AlertTriangle className="w-4 h-4 text-amber-600" /> },
    { id: 'project_profitability', label: 'Solar Installation Profitability', icon: <Wrench className="w-4 h-4" /> },
    { id: 'slow_moving_stock', label: 'Slow-Moving / Dead Stock', icon: <Package className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls: Report Selector & Period Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Reports Nav Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 text-xs">
          {reportsList.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeReport === r.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Date Filter & Export Button */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            {(['today', 'week', 'month', 'year', 'all'] as const).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  dateFilter === df
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {df}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportActiveReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Report 1: Sales Summary */}
      {activeReport === 'sales_summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Revenue</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {formatNaira(salesSummary.revenue)}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Cost of Goods Sold (COGS)</span>
              <span className="text-xl font-bold font-mono text-slate-700 tabular-nums">
                {formatNaira(salesSummary.cogs)}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Gross Profit</span>
              <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">
                {formatNaira(salesSummary.grossProfit)}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Profit Margin</span>
              <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">
                {salesSummary.margin}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3 text-right">Revenue</th>
                    <th className="py-3 px-3 text-right">COGS</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-3 text-right">Margin %</th>
                    <th className="py-3 px-4">Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map(s => {
                    const margin =
                      s.grandTotal > 0 ? Math.round((s.grossProfit / s.grandTotal) * 100) : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                        <td className="py-3 px-3 text-slate-500">{formatLagosDateTime(s.createdAt)}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{s.customerName}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatNaira(s.grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNaira(s.costOfGoodsSold)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatNaira(s.grossProfit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                          {margin}%
                        </td>
                        <td className="py-3 px-4 text-slate-600">{s.salesRepName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Product Margins */}
      {activeReport === 'product_margins' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-right">Units Sold</th>
                  <th className="py-3 px-3 text-right">Total Revenue</th>
                  <th className="py-3 px-3 text-right">Total COGS</th>
                  <th className="py-3 px-3 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productMargins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No sales data recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  productMargins.map(p => {
                    const margin = p.revenue > 0 ? Math.round((p.grossProfit / p.revenue) * 100) : 0;
                    return (
                      <tr key={p.sku} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{p.sku}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{p.qtySold}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatNaira(p.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatNaira(p.cogs)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatNaira(p.grossProfit)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Inventory Valuation */}
      {activeReport === 'inventory_valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Recorded Cost Valuation</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {formatNaira(products.reduce((s, p) => s + p.currentStock * p.purchaseCost, 0))}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Retail Valuation</span>
              <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">
                {formatNaira(products.reduce((s, p) => s + p.currentStock * p.retailPrice, 0))}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Products in Stock</span>
              <span className="text-xl font-bold font-mono text-slate-800 tabular-nums">
                {products.reduce((s, p) => s + p.currentStock, 0)} units
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3 text-right">In Stock</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Valuation (Cost)</th>
                    <th className="py-3 px-3 text-right">Retail Value</th>
                    <th className="py-3 px-4">Warehouse Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatNaira(p.purchaseCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNaira(p.currentStock * p.purchaseCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-800">
                        {formatNaira(p.currentStock * p.retailPrice)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.warehouseLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Installer Performance */}
      {activeReport === 'installer_performance' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Registered Installer</th>
                  <th className="py-3 px-3">Coverage Territory</th>
                  <th className="py-3 px-3 text-right">Period Orders</th>
                  <th className="py-3 px-3 text-right">Period Volume</th>
                  <th className="py-3 px-3 text-right">Lifetime Purchases</th>
                  <th className="py-3 px-4 text-right">Outstanding Receivable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installerPerformance.map(inst => (
                  <tr key={inst.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{inst.name}</td>
                    <td className="py-3 px-3 text-slate-600">{inst.territory}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {inst.ordersCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatNaira(inst.periodRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800 font-semibold">
                      {formatNaira(inst.lifetimePurchases)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {inst.balanceDue > 0 ? (
                        <span className="font-bold text-rose-700">{formatNaira(inst.balanceDue)}</span>
                      ) : (
                        <span className="text-slate-400">₦0.00</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 5: Slow Moving Stock */}
      {activeReport === 'slow_moving_stock' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              These items have recorded zero sales in the selected period. Review stock levels and consider dealer promotional pricing.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3 text-right">Current Stock</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Tied-Up Working Capital</th>
                    <th className="py-3 px-4">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slowMovingProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatNaira(p.purchaseCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                        {formatNaira(p.tiedCapital)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.warehouseLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 6: Customer Receivables */}
      {activeReport === 'customer_receivables' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Debtor Account</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Account Type</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Outstanding Receivable</th>
                  <th className="py-3 px-4">Address in Ibadan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers
                  .filter(c => c.outstandingBalance > 0)
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{c.phone}</td>
                      <td className="py-3 px-3 capitalize text-slate-700">{c.type.replace('_', ' ')}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatNaira(c.totalPurchases)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        {formatNaira(c.outstandingBalance)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{c.address}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 7: Solar Installation Profitability */}
      {activeReport === 'project_profitability' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Project Reference</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3 text-right">Contract Revenue</th>
                  <th className="py-3 px-3 text-right">Equipment Cost</th>
                  <th className="py-3 px-3 text-right">Labour & Transport</th>
                  <th className="py-3 px-3 text-right">Gross Margin</th>
                  <th className="py-3 px-3 text-right">Margin %</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map(p => {
                  const percent =
                    p.contractAmount > 0 ? Math.round((p.grossMargin / p.contractAmount) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{p.projectCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{p.title}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{p.customerName}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNaira(p.contractAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatNaira(p.equipmentCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatNaira(p.labourCost + p.transportCost + p.otherExpenses)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatNaira(p.grossMargin)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                        {percent}%
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-700">{p.status.replace('_', ' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
