import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  RotateCcw,
  Printer,
  CheckSquare,
  Square,
  Minus,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatNaira, formatLagosDateTime, exportToCSV } from '../../utils/formatters';
import { Modal } from '../common/CommonUI';
import { PrintableReceipt } from '../common/PrintableReceipt';

interface ReturnSelectionState {
  selected: boolean;
  quantity: number;
}

export const SalesHistory: React.FC = () => {
  const { sales: allSales, settings, processReturns, globalSearchQuery, activeBranchId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  const sales = useMemo(
    () => (activeBranchId === 'all' ? allSales : allSales.filter(s => s.branchId === activeBranchId)),
    [allSales, activeBranchId]
  );
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Multi-Item Return & Refund Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  const [returnSelections, setReturnSelections] = useState<Record<string, ReturnSelectionState>>({});
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnError, setReturnError] = useState<string>('');

  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch =
        s.invoiceNumber.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        s.customerName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (s.customerPhone && s.customerPhone.includes(effectiveSearch)) ||
        s.items.some(i => i.productName.toLowerCase().includes(effectiveSearch.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, effectiveSearch, statusFilter]);

  const handleExportSales = () => {
    const rows = sales.map(s => ({
      InvoiceNumber: s.invoiceNumber,
      Date: s.createdAt,
      Branch: s.branchName || settings.headOfficeAddress || 'Head Office - Dugbe',
      Customer: s.customerName,
      Tier: s.customerTier,
      NetTotalAmount: s.grandTotal,
      RefundedAmount: s.refundAmount || 0,
      PaidAmount: s.paidAmount,
      BalanceDue: s.balanceDue,
      PaymentMethod: s.paymentMethod,
      PaymentStatus: s.paymentStatus,
      COGS: s.costOfGoodsSold,
      GrossProfit: s.grossProfit,
      SalesRep: s.salesRepName,
    }));
    exportToCSV(`offnot_sales_invoices_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const getReturnedQty = (item: Sale['items'][number]) =>
    item.returnedQuantity ?? (item.returned ? item.quantity : 0);

  const getSaleReturnStats = (sale: Sale) => {
    const totalSoldUnits = sale.items.reduce((s, i) => s + i.quantity, 0);
    const totalReturnedUnits = sale.items.reduce((s, i) => s + getReturnedQty(i), 0);
    const remainingUnits = Math.max(0, totalSoldUnits - totalReturnedUnits);
    return {
      totalSoldUnits,
      totalReturnedUnits,
      remainingUnits,
      hasRefundableItems: remainingUnits > 0,
      isPartialReturn: totalReturnedUnits > 0 && remainingUnits > 0,
      isFullyReturned: totalReturnedUnits > 0 && remainingUnits === 0,
    };
  };

  const openReturnModal = (sale: Sale) => {
    const eligibleIndices = sale.items
      .map((i, idx) => ({ item: i, idx, eligible: Math.max(0, i.quantity - getReturnedQty(i)) }))
      .filter(entry => entry.eligible > 0);
    const initialSelections: Record<string, ReturnSelectionState> = {};

    sale.items.forEach((item, idx) => {
      const eligible = Math.max(0, item.quantity - getReturnedQty(item));
      initialSelections[String(idx)] = {
        selected: eligibleIndices.length === 1 && eligible > 0,
        quantity: eligible > 0 ? eligible : 0,
      };
    });

    setReturningSale(sale);
    setReturnSelections(initialSelections);
    setReturnReason('');
    setReturnError('');
    setShowReturnModal(true);
  };

  const eligibleEntriesForModal = useMemo(() => {
    if (!returningSale) return [];
    return returningSale.items
      .map((item, idx) => ({
        item,
        idx,
        key: String(idx),
        eligible: Math.max(0, item.quantity - getReturnedQty(item)),
      }))
      .filter(entry => entry.eligible > 0);
  }, [returningSale]);

  const allEligibleSelected = useMemo(() => {
    if (eligibleEntriesForModal.length === 0) return false;
    return eligibleEntriesForModal.every(entry => returnSelections[entry.key]?.selected);
  }, [eligibleEntriesForModal, returnSelections]);

  const handleToggleSelectAll = () => {
    const nextSelectAll = !allEligibleSelected;
    setReturnSelections(prev => {
      const updated: Record<string, ReturnSelectionState> = { ...prev };
      eligibleEntriesForModal.forEach(({ key, eligible }) => {
        const currentQty = prev[key]?.quantity || eligible;
        updated[key] = {
          selected: nextSelectAll && eligible > 0,
          quantity: Math.max(1, Math.min(currentQty, eligible)),
        };
      });
      return updated;
    });
  };

  const toggleItemSelection = (rowKey: string, eligibleQty: number) => {
    if (eligibleQty <= 0) return;
    setReturnSelections(prev => {
      const cur = prev[rowKey] || { selected: false, quantity: eligibleQty };
      return {
        ...prev,
        [rowKey]: {
          selected: !cur.selected,
          quantity: cur.quantity > 0 ? Math.min(cur.quantity, eligibleQty) : eligibleQty,
        },
      };
    });
  };

  const updateItemReturnQty = (rowKey: string, nextQty: number, eligibleQty: number) => {
    const clamped = Math.max(1, Math.min(nextQty, eligibleQty));
    setReturnSelections(prev => ({
      ...prev,
      [rowKey]: {
        selected: true,
        quantity: clamped,
      },
    }));
  };

  const returnSummary = useMemo(() => {
    if (!returningSale) return { itemsCount: 0, totalUnits: 0, totalRefundAmount: 0 };
    let itemsCount = 0;
    let totalUnits = 0;
    let totalRefundAmount = 0;

    returningSale.items.forEach((item, idx) => {
      const sel = returnSelections[String(idx)];
      const eligible = Math.max(0, item.quantity - getReturnedQty(item));
      if (sel?.selected && eligible > 0) {
        const qty = Math.max(1, Math.min(sel.quantity, eligible));
        const unitNet =
          item.quantity > 0
            ? Math.max(0, (item.unitPrice * item.quantity - (item.discount || 0)) / item.quantity)
            : item.unitPrice;
        itemsCount += 1;
        totalUnits += qty;
        totalRefundAmount += Math.round(Math.max(0, unitNet * qty) * 100) / 100;
      }
    });

    return { itemsCount, totalUnits, totalRefundAmount };
  }, [returningSale, returnSelections]);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');
    if (!returningSale) return;

    const selectedList = returningSale.items
      .map((item, idx) => ({ item, idx, eligible: Math.max(0, item.quantity - getReturnedQty(item)) }))
      .filter(({ idx, eligible }) => eligible > 0 && returnSelections[String(idx)]?.selected)
      .map(({ item, idx, eligible }) => ({
        productId: item.productId,
        sku: item.sku,
        itemIndex: idx,
        quantity: Math.max(1, Math.min(returnSelections[String(idx)]?.quantity || eligible, eligible)),
      }));

    if (selectedList.length === 0) {
      setReturnError('Please select at least one product to refund & restock.');
      return;
    }

    if (!returnReason.trim()) {
      setReturnError('Please specify the customer return reason.');
      return;
    }

    const res = processReturns(returningSale.id, selectedList, returnReason);
    if (res.success) {
      setShowReturnModal(false);
      setReturnSelections({});
      setReturnReason('');
      if (res.updatedSale) {
        setSelectedSale(res.updatedSale);
        setShowReceiptModal(true);
      }
      setReturningSale(null);
    } else {
      setReturnError(res.error || 'Failed to process return.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, product..."
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            {(['all', 'paid', 'partial', 'unpaid'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportSales}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-3 md:hidden">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No sales invoices found matching your criteria.
          </div>
        ) : (
          filteredSales.map(sale => {
            const { remainingUnits, hasRefundableItems, isPartialReturn, isFullyReturned } = getSaleReturnStats(sale);
            return (
              <div key={sale.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-slate-900">{sale.invoiceNumber}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{formatLagosDateTime(sale.createdAt)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-800'
                          : sale.paymentStatus === 'partial'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                    {isPartialReturn && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Partially Refunded ({remainingUnits} left)</span>
                      </span>
                    )}
                    {isFullyReturned && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Fully Returned</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 truncate">{sale.customerName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {sale.branchName || 'Head Office - Dugbe'} · {sale.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-slate-900">{formatNaira(sale.grandTotal)}</div>
                    {(sale.refundAmount || 0) > 0 && (
                      <div className="font-mono text-[10px] text-rose-700 font-semibold">
                        -{formatNaira(sale.refundAmount || 0)} refunded
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowReceiptModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                  <button
                    type="button"
                    disabled={!hasRefundableItems}
                    onClick={() => openReturnModal(sale)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {isPartialReturn
                        ? `Refund (${remainingUnits} left)`
                        : hasRefundableItems
                        ? 'Refund'
                        : 'Fully Returned'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Sales Invoices Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date (Lagos)</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Pricing Tier</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Net Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No sales invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const { remainingUnits, hasRefundableItems, isPartialReturn, isFullyReturned } = getSaleReturnStats(sale);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatLagosDateTime(sale.createdAt)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap text-xs">
                        {sale.branchName || 'Head Office - Dugbe'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {sale.customerName}
                        </div>
                        {sale.customerPhone && (
                          <div className="text-[11px] text-slate-500">{sale.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="capitalize text-slate-700 font-medium">
                          {sale.customerTier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {sale.items.reduce((s, i) => s + i.quantity, 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        <div>{formatNaira(sale.grandTotal)}</div>
                        {(sale.refundAmount || 0) > 0 && (
                          <div className="text-[10px] font-semibold text-rose-700">
                            -{formatNaira(sale.refundAmount || 0)} refund
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {formatNaira(sale.paidAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {sale.balanceDue > 0 ? (
                          <span className="text-rose-700 font-bold">{formatNaira(sale.balanceDue)}</span>
                        ) : (
                          <span className="text-slate-400">₦0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              sale.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-800'
                                : sale.paymentStatus === 'partial'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                          {isPartialReturn && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Partially Refunded ({remainingUnits} left)</span>
                            </span>
                          )}
                          {isFullyReturned && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Fully Returned</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowReceiptModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                            title="View / Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={!hasRefundableItems}
                            onClick={() => openReturnModal(sale)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded transition-colors disabled:opacity-40"
                            title={
                              isPartialReturn
                                ? `Refund remaining ${remainingUnits} unit(s)`
                                : hasRefundableItems
                                ? 'Select goods to refund & restock'
                                : 'All items already refunded'
                            }
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>
                              {isPartialReturn
                                ? `Refund (${remainingUnits} left)`
                                : hasRefundableItems
                                ? 'Refund'
                                : 'Returned'}
                            </span>
                          </button>
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

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title={selectedSale?.returned || selectedSale?.refunded ? 'Official Refund & Return Receipt' : 'Official Sales Receipt'}
        subtitle={`Invoice #${selectedSale?.invoiceNumber} · ${settings.companyName || 'Offnot Energy'}`}
        maxWidth="lg"
      >
        {selectedSale && (
          <PrintableReceipt
            sale={selectedSale}
            settings={settings}
            onClose={() => setShowReceiptModal(false)}
          />
        )}
      </Modal>

      {/* Multi-Item Return & Refund Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Process Customer Return & Refund"
        subtitle={`Invoice #${returningSale?.invoiceNumber} · ${returningSale?.customerName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {returnError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {returnError}
            </div>
          )}

          {/* Select All Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              disabled={eligibleEntriesForModal.length === 0}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-emerald-800 disabled:opacity-40"
            >
              {allEligibleSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-700" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {allEligibleSelected
                  ? 'Deselect All Products'
                  : `Select All Eligible Goods (${eligibleEntriesForModal.length})`}
              </span>
            </button>
            <span className="text-[11px] font-semibold text-slate-600">
              Selected: <span className="font-mono font-bold text-emerald-800">{returnSummary.itemsCount}</span> line(s) ·{' '}
              <span className="font-mono font-bold text-emerald-800">{returnSummary.totalUnits}</span> unit(s)
            </span>
          </div>

          {/* Per-Item Checklist (indexed by row for deterministic partial selection) */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {returningSale?.items.map((item, idx) => {
              const rowKey = String(idx);
              const alreadyReturned = getReturnedQty(item);
              const eligible = Math.max(0, item.quantity - alreadyReturned);
              const sel = returnSelections[rowKey] || { selected: false, quantity: eligible };
              const perUnitNet =
                item.quantity > 0
                  ? Math.max(0, (item.unitPrice * item.quantity - (item.discount || 0)) / item.quantity)
                  : item.unitPrice;
              const activeQty = sel.selected ? Math.max(1, Math.min(sel.quantity, eligible)) : 0;

              return (
                <div
                  key={`${item.productId}_${idx}`}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    eligible <= 0
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : sel.selected
                      ? 'bg-rose-50/40 border-rose-400 ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={eligible <= 0}
                      onClick={() => toggleItemSelection(rowKey, eligible)}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0 disabled:cursor-not-allowed"
                    >
                      {eligible > 0 && sel.selected ? (
                        <CheckSquare className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-snug">{item.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          SKU: {item.sku} · {formatNaira(perUnitNet)}/unit
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Sold: <span className="font-bold">{item.quantity}</span>
                          {alreadyReturned > 0 && (
                            <span className="text-rose-700 font-semibold"> · Already returned: {alreadyReturned}</span>
                          )}
                          {' · '}
                          <span className={eligible > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            {eligible > 0 ? `Eligible: ${eligible}` : 'Fully Refunded'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {eligible > 0 && (
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-6 sm:pl-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!sel.selected || activeQty <= 1}
                            onClick={() => updateItemReturnQty(rowKey, activeQty - 1, eligible)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={eligible}
                            value={sel.selected ? activeQty : eligible}
                            onChange={e =>
                              updateItemReturnQty(rowKey, Number(e.target.value) || 1, eligible)
                            }
                            className="w-12 py-1 text-center font-mono font-bold border border-slate-300 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            disabled={!sel.selected || activeQty >= eligible}
                            onClick={() => updateItemReturnQty(rowKey, activeQty + 1, eligible)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right min-w-[78px]">
                          <div className="font-mono font-bold text-rose-700">
                            {sel.selected ? `-${formatNaira(activeQty * perUnitNet)}` : '₦0.00'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Refund Deduction Summary */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-rose-900">Refund Deduction Summary</div>
              <div className="text-[11px] text-rose-700">
                Restocks {returnSummary.totalUnits} unit(s) to {returningSale?.warehouseLocation || 'inventory'} & deducts from daily revenue
              </div>
            </div>
            <div className="text-right font-mono font-black text-base text-rose-800 shrink-0 pl-2">
              -{formatNaira(returnSummary.totalRefundAmount)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Return Reason &amp; Condition *
            </label>
            <textarea
              required
              rows={2}
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="e.g. Unopened box returned within 48h, customer changed specification."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={returnSummary.totalUnits === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              Confirm Refund (-{formatNaira(returnSummary.totalRefundAmount)}) &amp; Restore Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
