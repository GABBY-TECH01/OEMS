import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ArrowUpDown,
  History,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Boxes,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, StockMovement, SolarSpecifications } from '../../types';
import { formatNaira, formatLagosDateTime, exportToCSV, hasPermission } from '../../utils/formatters';
import { Modal, EmptyState } from '../common/CommonUI';

export const Inventory: React.FC = () => {
  const {
    products,
    stockMovements,
    categories,
    suppliers,
    settings,
    currentUser,
    saveProduct,
    deleteProduct,
    adjustStock,
    globalSearchQuery,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'ledger' | 'stocktaking'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustmentWarehouse, setAdjustmentWarehouse] = useState<string>(settings.warehouses[0]);
  const [adjustError, setAdjustError] = useState<string>('');

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const canViewFinancials = hasPermission(currentUser.role, 'view_financials');
  const canAdjustInventory = hasPermission(currentUser.role, 'adjust_inventory');

  // Search & Filter
  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status === 'discontinued') return false;
      const matchesSearch =
        p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        p.model.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        p.barcode.includes(effectiveSearch);

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesWarehouse = selectedWarehouse === 'all' || p.warehouseLocation === selectedWarehouse;

      let matchesStock = true;
      if (stockStatusFilter === 'low') {
        matchesStock = p.currentStock > 0 && p.currentStock <= p.reorderLevel;
      } else if (stockStatusFilter === 'out') {
        matchesStock = p.currentStock <= 0;
      }

      return matchesSearch && matchesCat && matchesWarehouse && matchesStock;
    });
  }, [products, effectiveSearch, selectedCategory, selectedWarehouse, stockStatusFilter]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const rows = products.map(p => ({
      SKU: p.sku,
      Name: p.name,
      Brand: p.brand,
      Category: p.category,
      Model: p.model,
      CurrentStock: p.currentStock,
      Unit: p.unit,
      PurchaseCost: p.purchaseCost,
      RetailPrice: p.retailPrice,
      WholesalePrice: p.wholesalePrice,
      InstallerPrice: p.installerPrice,
      DealerPrice: p.dealerPrice,
      Warehouse: p.warehouseLocation,
      ReorderLevel: p.reorderLevel,
      Supplier: p.supplierName,
      Barcode: p.barcode,
    }));
    exportToCSV(`offnot_energy_inventory_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  // Handle CSV Import
  const handleCSVImport = () => {
    setImportError('');
    setImportSuccess('');
    if (!importText.trim()) {
      setImportError('Please paste CSV data or headers.');
      return;
    }

    try {
      const lines = importText.trim().split('\n');
      if (lines.length < 2) {
        setImportError('CSV must include a header line and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const skuIdx = headers.findIndex(h => h.includes('sku'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('purchase'));
      const retailIdx = headers.findIndex(h => h.includes('retail') || h.includes('price'));
      const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty'));
      const catIdx = headers.findIndex(h => h.includes('category'));

      if (skuIdx === -1 || nameIdx === -1) {
        setImportError('CSV must have columns for SKU and Product Name.');
        return;
      }

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (!row[skuIdx] || !row[nameIdx]) continue;

        const sku = row[skuIdx];
        const name = row[nameIdx];
        const cost = costIdx !== -1 ? Number(row[costIdx]) || 0 : 0;
        const retail = retailIdx !== -1 ? Number(row[retailIdx]) || cost * 1.2 : cost * 1.2;
        const stock = stockIdx !== -1 ? Number(row[stockIdx]) || 0 : 0;
        const cat = catIdx !== -1 && row[catIdx] ? row[catIdx] : categories[0];

        saveProduct({
          sku,
          name,
          category: cat,
          purchaseCost: cost,
          retailPrice: retail,
          wholesalePrice: retail * 0.93,
          installerPrice: retail * 0.9,
          dealerPrice: retail * 0.88,
          minSellingPrice: cost * 1.05,
          currentStock: stock,
          reorderLevel: 5,
          warehouseLocation: settings.warehouses[0],
        });
        importedCount++;
      }

      setImportSuccess(`Successfully imported/updated ${importedCount} products.`);
      setImportText('');
    } catch (err: any) {
      setImportError(`Import failed: ${err.message}`);
    }
  };

  // Submit Product Form
  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sku = formData.get('sku') as string;
    const name = formData.get('name') as string;
    const brand = formData.get('brand') as string;
    const category = formData.get('category') as string;
    const model = formData.get('model') as string;
    const description = formData.get('description') as string;
    const unit = formData.get('unit') as string;
    const purchaseCost = Number(formData.get('purchaseCost')) || 0;
    const retailPrice = Number(formData.get('retailPrice')) || 0;
    const wholesalePrice = Number(formData.get('wholesalePrice')) || retailPrice;
    const installerPrice = Number(formData.get('installerPrice')) || retailPrice;
    const dealerPrice = Number(formData.get('dealerPrice')) || retailPrice;
    const minSellingPrice = Number(formData.get('minSellingPrice')) || purchaseCost;
    const currentStock = Number(formData.get('currentStock')) || 0;
    const reorderLevel = Number(formData.get('reorderLevel')) || 5;
    const warehouseLocation = formData.get('warehouseLocation') as string;
    const supplierId = formData.get('supplierId') as string;
    const barcode = formData.get('barcode') as string;

    const specs: SolarSpecifications = {
      powerRatingKw: formData.get('powerRatingKw') ? Number(formData.get('powerRatingKw')) : undefined,
      batteryCapacityKwh: formData.get('batteryCapacityKwh') ? Number(formData.get('batteryCapacityKwh')) : undefined,
      panelWattageW: formData.get('panelWattageW') ? Number(formData.get('panelWattageW')) : undefined,
      voltage: (formData.get('voltage') as string) || undefined,
      chemistry: (formData.get('chemistry') as string) || undefined,
      warrantyMonths: formData.get('warrantyMonths') ? Number(formData.get('warrantyMonths')) : undefined,
    };

    const supObj = suppliers.find(s => s.id === supplierId);

    const res = saveProduct({
      ...(editingProduct?.id ? { id: editingProduct.id } : {}),
      sku,
      name,
      brand,
      category,
      model,
      description,
      unit,
      purchaseCost,
      retailPrice,
      wholesalePrice,
      installerPrice,
      dealerPrice,
      minSellingPrice,
      currentStock,
      reorderLevel,
      warehouseLocation,
      supplierId,
      supplierName: supObj?.companyName || '',
      barcode,
      specs,
    });

    if (res.success) {
      setShowProductModal(false);
      setEditingProduct(null);
    } else {
      alert(res.error || 'Failed to save product');
    }
  };

  // Submit Adjustment
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    if (!adjustingProduct) return;
    if (adjustmentQty === 0) {
      setAdjustError('Adjustment quantity cannot be 0.');
      return;
    }
    if (!adjustmentReason.trim()) {
      setAdjustError('Please provide an auditable reason for this stock adjustment.');
      return;
    }

    const res = adjustStock(adjustingProduct.id, adjustmentQty, adjustmentReason, adjustmentWarehouse);
    if (res.success) {
      setShowAdjustModal(false);
      setAdjustingProduct(null);
      setAdjustmentQty(0);
      setAdjustmentReason('');
    } else {
      setAdjustError(res.error || 'Adjustment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'catalog'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Product Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'ledger'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movements Ledger ({stockMovements.length})
          </button>
          <button
            onClick={() => setActiveSubTab('stocktaking')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'stocktaking'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Stocktaking & Valuation
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canAdjustInventory && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU, name, model, barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Warehouse Filter */}
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Locations ({settings.warehouses.length})</option>
                {settings.warehouses.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setStockStatusFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    stockStatusFilter === 'all' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockStatusFilter('low')}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    stockStatusFilter === 'low' ? 'bg-white shadow-xs font-semibold text-amber-700' : 'text-slate-600'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setStockStatusFilter('out')}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    stockStatusFilter === 'out' ? 'bg-white shadow-xs font-semibold text-rose-700' : 'text-slate-600'
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </div>

          {/* Product Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                    <th className="py-3 px-4">Product & Model</th>
                    <th className="py-3 px-3">SKU / Barcode</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Stock Level</th>
                    {canViewFinancials && <th className="py-3 px-3 text-right">Cost Price</th>}
                    <th className="py-3 px-3 text-right">Retail Price</th>
                    <th className="py-3 px-3 text-right">Installer Price</th>
                    <th className="py-3 px-3">Warehouse</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={canViewFinancials ? 9 : 8} className="py-12 text-center text-slate-500">
                        No products match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const isLow = p.currentStock > 0 && p.currentStock <= p.reorderLevel;
                      const isOut = p.currentStock <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                            <div className="text-[11px] text-slate-700 flex items-center gap-1.5 mt-0.5">
                              <span>{p.brand}</span>
                              {p.model && (
                                <>
                                  <span>·</span>
                                  <span>{p.model}</span>
                                </>
                              )}
                              {p.specs?.powerRatingKw && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">{p.specs.powerRatingKw}kW</span>
                                </>
                              )}
                              {p.specs?.batteryCapacityKwh && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">{p.specs.batteryCapacityKwh}kWh</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            <div>{p.sku}</div>
                            {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[130px] truncate">{p.category}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono font-bold tabular-nums text-xs px-2 py-0.5 rounded-md ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-800'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-50 text-emerald-800'
                                }`}
                              >
                                {p.currentStock} {p.unit}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Min: {p.reorderLevel}</span>
                          </td>
                          {canViewFinancials && (
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                              {formatNaira(p.purchaseCost)}
                            </td>
                          )}
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {formatNaira(p.retailPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                            {formatNaira(p.installerPrice)}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[140px] truncate">
                            {p.warehouseLocation}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {canAdjustInventory && (
                                <button
                                  onClick={() => {
                                    setAdjustingProduct(p);
                                    setAdjustmentWarehouse(p.warehouseLocation);
                                    setShowAdjustModal(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                                  title="Adjust Stock Level"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setShowProductModal(true);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {currentUser.role === 'super_admin' && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Discontinue product ${p.name}?`)) {
                                      deleteProduct(p.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                                  title="Discontinue Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Stock Movement Ledger Tab */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <p>
              Auditable double-entry stock movement ledger. Every receipt, sale, project transfer, or adjustment is permanently recorded.
            </p>
            <span className="font-mono text-slate-700 font-semibold">{stockMovements.length} total entries</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Timestamp (Lagos)</th>
                    <th className="py-3 px-3">Product / SKU</th>
                    <th className="py-3 px-3">Movement Type</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Stock (Prev → New)</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-4">Authorized User / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements.map(m => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatLagosDateTime(m.timestamp)}
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-medium text-slate-900 truncate">{m.productName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{m.sku}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              m.type === 'goods_received' || m.type === 'opening_stock' || m.type === 'adjustment_positive' || m.type === 'project_return' || m.type === 'customer_return'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {m.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                          {m.previousStock} → <span className="font-semibold text-slate-900">{m.newStock}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 text-[11px]">{m.referenceId}</td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] truncate max-w-[120px]">
                          {m.warehouseLocation}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-slate-900 truncate">{m.performedByUserName}</div>
                          <div className="text-[11px] text-slate-500 truncate">{m.reason}</div>
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

      {/* Stocktaking & Valuation Tab */}
      {activeSubTab === 'stocktaking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Inventory Valuation (Cost)</span>
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {formatNaira(products.reduce((s, p) => s + p.currentStock * p.purchaseCost, 0))}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Based on actual recorded purchase cost</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Potential Retail Revenue</span>
              <span className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                {formatNaira(products.reduce((s, p) => s + p.currentStock * p.retailPrice, 0))}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Full retail price conversion</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Potential Gross Margin</span>
              <span className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
                {formatNaira(
                  products.reduce((s, p) => s + p.currentStock * (p.retailPrice - p.purchaseCost), 0)
                )}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Unrealized gross profit in warehouse</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Physical Stocktaking Worksheet</h3>
                <p className="text-xs text-slate-500">
                  Use this sheet during monthly counts at Tipper Garage and Dalute Road warehouses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const rows = products.map((p, index) => ({
                    'S/N': index + 1,
                    'Product Name': p.name,
                    'SKU / Item Code': p.sku,
                    'Category': p.category,
                    'Brand': p.brand,
                    'Warehouse Location': p.warehouseLocation,
                    'System Recorded Stock': p.currentStock,
                    'Unit of Measure': p.unit,
                    'Physical Count (Write Here)': '',
                    'Discrepancy / Variance': '',
                    'Counted By Staff': '',
                    'Auditor Signature': '',
                    'Audit Date': today,
                    'Condition / Remarks': '',
                  }));
                  exportToCSV(`Offnot_Energy_Stock_Count_Sheet_${today}`, rows);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                title="Download complete physical stock count audit worksheet"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Download Stock Count Sheet</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Warehouse Location</th>
                    <th className="py-2.5 px-3 text-right">System Qty</th>
                    <th className="py-2.5 px-3 text-right">Physical Count</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                    <th className="py-2.5 px-3">Counted By & Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.warehouseLocation}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        <span className="inline-block w-16 border-b border-slate-300"></span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        <span className="inline-block w-16 border-b border-slate-300"></span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        <span className="inline-block w-32 border-b border-slate-300"></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct?.id ? 'Edit Product' : 'Add New Solar Product'}
        subtitle="Configure pricing tiers, technical specifications, and warehouse stock"
        maxWidth="2xl"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Item Code *
              </label>
              <input
                type="text"
                name="sku"
                required
                defaultValue={editingProduct?.sku || ''}
                placeholder="e.g. INV-FEL-5KW-48V"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingProduct?.name || ''}
                placeholder="e.g. Felicity 5kVA Pure Sine Wave Hybrid Inverter"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                defaultValue={editingProduct?.category || categories[0]}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                name="brand"
                defaultValue={editingProduct?.brand || 'Offnot Energy'}
                placeholder="e.g. Felicity, Deye, Jinko, Itel"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Number</label>
              <input
                type="text"
                name="model"
                defaultValue={editingProduct?.model || ''}
                placeholder="e.g. IVEM5048"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <select
                name="unit"
                defaultValue={editingProduct?.unit || 'Unit'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none"
              >
                <option value="Unit">Unit / Piece</option>
                <option value="Roll">Roll (e.g. 100m)</option>
                <option value="Set">Set</option>
                <option value="Pair">Pair</option>
                <option value="Pack">Pack</option>
                <option value="Meter">Meter</option>
              </select>
            </div>
          </div>

          {/* Pricing Tiers Section */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pricing Hierarchy (NGN ₦)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Purchase Cost *
                </label>
                <input
                  type="number"
                  name="purchaseCost"
                  required
                  defaultValue={editingProduct?.purchaseCost || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Retail Price *
                </label>
                <input
                  type="number"
                  name="retailPrice"
                  required
                  defaultValue={editingProduct?.retailPrice || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Wholesale Price
                </label>
                <input
                  type="number"
                  name="wholesalePrice"
                  defaultValue={editingProduct?.wholesalePrice || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Installer Price
                </label>
                <input
                  type="number"
                  name="installerPrice"
                  defaultValue={editingProduct?.installerPrice || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Dealer / Distributor
                </label>
                <input
                  type="number"
                  name="dealerPrice"
                  defaultValue={editingProduct?.dealerPrice || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Min Floor Price
                </label>
                <input
                  type="number"
                  name="minSellingPrice"
                  defaultValue={editingProduct?.minSellingPrice || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stock & Warehouse */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Warehouse & Stock Tracking
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  {editingProduct?.id ? 'Current Stock' : 'Opening Stock'}
                </label>
                <input
                  type="number"
                  name="currentStock"
                  defaultValue={editingProduct?.currentStock || 0}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Reorder Alert Level
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  defaultValue={editingProduct?.reorderLevel || 5}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Warehouse Location
                </label>
                <select
                  name="warehouseLocation"
                  defaultValue={editingProduct?.warehouseLocation || settings.warehouses[0]}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                >
                  {settings.warehouses.map(w => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Technical Specifications (Solar Specific) */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Technical Specifications (Optional)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Power Rating (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  name="powerRatingKw"
                  defaultValue={editingProduct?.specs?.powerRatingKw}
                  placeholder="e.g. 5.0"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Battery Capacity (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  name="batteryCapacityKwh"
                  defaultValue={editingProduct?.specs?.batteryCapacityKwh}
                  placeholder="e.g. 5.12"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Panel Wattage (W)</label>
                <input
                  type="number"
                  name="panelWattageW"
                  defaultValue={editingProduct?.specs?.panelWattageW}
                  placeholder="e.g. 550"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">System Voltage</label>
                <input
                  type="text"
                  name="voltage"
                  defaultValue={editingProduct?.specs?.voltage || ''}
                  placeholder="e.g. 48V, 24V"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Battery Chemistry</label>
                <input
                  type="text"
                  name="chemistry"
                  defaultValue={editingProduct?.specs?.chemistry || ''}
                  placeholder="e.g. LiFePO4, Gel"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Warranty (Months)</label>
                <input
                  type="number"
                  name="warrantyMonths"
                  defaultValue={editingProduct?.specs?.warrantyMonths || 24}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              {editingProduct?.id ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setAdjustingProduct(null);
        }}
        title={`Adjust Stock: ${adjustingProduct?.name}`}
        subtitle={`Current balance: ${adjustingProduct?.currentStock} ${adjustingProduct?.unit}s (${adjustingProduct?.sku})`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
          {adjustError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {adjustError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Adjust (+ or -) *
            </label>
            <input
              type="number"
              required
              value={adjustmentQty}
              onChange={e => setAdjustmentQty(Number(e.target.value))}
              placeholder="e.g. +5 for found stock, -2 for damaged"
              className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-lg focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              New balance will be:{' '}
              <span className="font-mono font-bold text-slate-900">
                {(adjustingProduct?.currentStock || 0) + adjustmentQty} {adjustingProduct?.unit}s
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Location *</label>
            <select
              value={adjustmentWarehouse}
              onChange={e => setAdjustmentWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            >
              {settings.warehouses.map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Auditable Reason & Approval Notes *
            </label>
            <textarea
              required
              rows={3}
              value={adjustmentReason}
              onChange={e => setAdjustmentReason(e.target.value)}
              placeholder="e.g. Stocktaking count variance reconciliation verified by manager"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              Record Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Products via CSV"
        subtitle="Paste CSV text formatted with SKU, Name, Cost, Retail, and Stock columns"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {importError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
              {importSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sample CSV Structure:
            </label>
            <pre className="p-2.5 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-lg overflow-x-auto">
              SKU,Name,Category,Cost,Retail,Stock{'\n'}
              INV-FEL-10KW,Felicity 10kW Hybrid Inverter,Hybrid inverters,1200000,1450000,5{'\n'}
              CBL-DC-4MM,4mm Solar Cable Roll,Solar cables,45000,60000,20
            </pre>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paste CSV Data:
            </label>
            <textarea
              rows={6}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste comma-separated rows here..."
              className="w-full p-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCSVImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              Parse & Import
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
