import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Download,
  Eye,
  RotateCcw,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatNaira, formatLagosDateTime, exportToCSV } from '../../utils/formatters';
import { Modal } from '../common/CommonUI';
import { PrintableReceipt } from '../common/PrintableReceipt';

export const SalesHistory: React.FC = () => {
  const { sales: allSales, settings, processReturn, globalSearchQuery, activeBranchId, branches } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  const sales = useMemo(
    () => (activeBranchId === 'all' ? allSales : allSales.filter(s => s.branchId === activeBranchId)),
    [allSales, activeBranchId]
  );
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  const [returnProductId, setReturnProductId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
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
      Customer: s.customerName,
      Tier: s.customerTier,
      TotalAmount: s.grandTotal,
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

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');
    if (!returningSale || !returnProductId) return;

    if (!returnReason.trim()) {
      setReturnError('Please specify the customer return reason.');
      return;
    }

    const res = processReturn(returningSale.id, returnProductId, returnQty, returnReason);
    if (res.success) {
      setShowReturnModal(false);
      setReturnProductId('');
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
          <Search className="w-4 h-4 text-slate-400" />
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
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
                <th className="py-3 px-3 text-right">Total Amount</th>
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
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatLagosDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap text-xs">
                      {sale.branchName || 'Tipper Garage (HQ)'}
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
                      {formatNaira(sale.grandTotal)}
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
                        {(sale.returned || sale.refunded) && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Refunded / Restocked</span>
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
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                          title="View / Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setReturningSale(sale);
                            setReturnProductId(sale.items[0]?.productId || '');
                            setReturnQty(1);
                            setShowReturnModal(true);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Process Return / Refund"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
        subtitle={`Invoice #${selectedSale?.invoiceNumber} · Offnot Energy`}
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

      {/* Return & Refund Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Process Customer Return & Restock"
        subtitle={`Invoice #${returningSale?.invoiceNumber} · ${returningSale?.customerName}`}
        maxWidth="md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {returnError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {returnError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Product to Return *
            </label>
            <select
              value={returnProductId}
              onChange={e => {
                const newId = e.target.value;
                setReturnProductId(newId);
                const item = returningSale?.items.find(i => i.productId === newId);
                const maxAvailable = item ? (item.quantity - (item.returnedQuantity || 0)) : 1;
                setReturnQty(Math.max(1, Math.min(returnQty, maxAvailable)));
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            >
              {returningSale?.items.map(item => {
                const returned = item.returnedQuantity || 0;
                const eligible = item.quantity - returned;
                return (
                  <option key={item.productId} value={item.productId} disabled={eligible <= 0}>
                    {item.productName} (Bought: {item.quantity} · Eligible to return: {eligible})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Quantity to Return & Restock *
              </label>
              {(() => {
                const item = returningSale?.items.find(i => i.productId === returnProductId);
                const eligible = item ? (item.quantity - (item.returnedQuantity || 0)) : 1;
                return (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Max eligible: <span className="font-bold text-emerald-800">{eligible}</span>
                  </span>
                );
              })()}
            </div>
            <input
              type="number"
              min="1"
              max={(() => {
                const item = returningSale?.items.find(i => i.productId === returnProductId);
                return item ? Math.max(1, item.quantity - (item.returnedQuantity || 0)) : 1;
              })()}
              value={returnQty}
              onChange={e => setReturnQty(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Return Reason & Condition *
            </label>
            <textarea
              required
              rows={3}
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="e.g. Unopened box returned within 48h, customer upgraded to 10kW inverter."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-snug">
            <span className="font-bold">Inventory Guarantee:</span> Submitting this return immediately restores{' '}
            <span className="font-bold">{returnQty} unit(s)</span> back to active stock at{' '}
            <span className="font-bold">{returningSale?.warehouseLocation || 'the store'}</span> to prevent shortages,
            and marks the official receipt as refunded.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              Confirm Return & Restore Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
