import React, { useState } from 'react';
import { Printer, RotateCcw, CheckCircle2, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { Sale, CompanySettings } from '../../types';
import { formatNaira, formatLagosDateTime } from '../../utils/formatters';
import { BRAND_LOGO_URL } from '../../constants/branding';

interface PrintableReceiptProps {
  sale: Sale;
  settings: CompanySettings;
  onClose?: () => void;
  showActions?: boolean;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  sale,
  settings,
  onClose,
  showActions = true,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);
  const [paperFormat, setPaperFormat] = useState<'thermal' | 'full'>('thermal');

  const logoSrc = settings.pwaLogoUrl || BRAND_LOGO_URL;

  // Check if this sale has returns or refunds
  const isRefunded = Boolean(
    sale.returned ||
    sale.refunded ||
    (sale.returnRecords && sale.returnRecords.length > 0) ||
    sale.items.some(i => (i.returnedQuantity || 0) > 0)
  );

  const totalReturnedQty = sale.items.reduce((acc, i) => acc + (i.returnedQuantity || 0), 0) ||
    (sale.returnRecords ? sale.returnRecords.reduce((acc, r) => acc + r.quantity, 0) : 0);

  const totalRefundAmount = sale.refundAmount ||
    (sale.returnRecords ? sale.returnRecords.reduce((acc, r) => acc + r.refundAmount, 0) : 0);

  const latestReturn = sale.returnRecords && sale.returnRecords.length > 0 ? sale.returnRecords[0] : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* View & Print Action Bar */}
      {showActions && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format:</span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPaperFormat('thermal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  paperFormat === 'thermal'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Thermal Roll (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('full')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  paperFormat === 'full'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Standard Page (A4)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* Printable Receipt Canvas */}
      <div className="flex justify-center w-full overflow-x-auto">
        <div
          id="printable-receipt-root"
          className={`bg-white text-slate-950 p-6 border border-slate-300 shadow-md transition-all font-sans antialiased text-xs ${
            paperFormat === 'thermal'
              ? 'w-full max-w-[390px] rounded-none sm:rounded-lg'
              : 'w-full max-w-[620px] rounded-lg'
          }`}
          style={{ minHeight: 'auto' }}
        >
          {/* REFUND BADGE / STAMP IF REFUNDED */}
          {isRefunded && (
            <div className="mb-4 p-3 bg-rose-50 border-2 border-dashed border-rose-500 rounded-lg text-center">
              <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider mb-1">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Official Refund & Return Receipt</span>
              </div>
              <p className="text-[11px] font-extrabold text-rose-900 uppercase tracking-tight">
                Stock Restored to Inventory · No Shortage
              </p>
              <p className="text-[10px] text-rose-700 mt-0.5">
                Returned items verified & re-inventoried into {sale.warehouseLocation || 'store shelf'}
              </p>
            </div>
          )}

          {/* Company Branding Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 flex flex-col items-center">
            {logoLoaded && (
              <img
                src={logoSrc}
                alt="Offnot Energy Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-2 print:w-20 print:h-20"
                onError={() => {
                  if (logoSrc !== BRAND_LOGO_URL) {
                    setLogoLoaded(true);
                  }
                }}
              />
            )}
            <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
              {settings.companyName || 'Offnot Energy'}
            </h1>
            {settings.slogan && (
              <p className="text-[11px] font-bold text-emerald-800 tracking-tight mt-0.5">
                {settings.slogan}
              </p>
            )}
            <div className="text-[10px] text-slate-600 mt-1 space-y-0.5 leading-snug">
              {settings.location && (
                <p className="flex items-center justify-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0 inline" />
                  <span>{settings.location}</span>
                </p>
              )}
              <p className="flex items-center justify-center gap-2">
                {settings.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0 inline" />
                    <span>{settings.phone}</span>
                  </span>
                )}
                {settings.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0 inline" />
                    <span>{settings.email}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Invoice / Receipt Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 grid grid-cols-2 gap-2 text-[11px] leading-tight">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                {isRefunded ? 'Refund Ref / Invoice:' : 'Invoice No:'}
              </span>
              <span className="font-mono font-black text-slate-900 text-xs">
                {sale.invoiceNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Date & Time:</span>
              <span className="text-slate-800 font-medium">
                {formatLagosDateTime(sale.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Customer:</span>
              <span className="font-bold text-slate-900 truncate block">
                {sale.customerName}
              </span>
              {sale.customerPhone && (
                <span className="text-[10px] text-slate-500 block">{sale.customerPhone}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Store / Branch:</span>
              <span className="text-slate-800 font-semibold truncate block">
                {sale.branchName || 'Tipper Garage (HQ)'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Rep: {sale.salesRepName || 'Sales Desk'}
              </span>
            </div>
          </div>

          {/* Refund Notice Box (If Applicable) */}
          {isRefunded && (
            <div className="my-3 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] space-y-1">
              <div className="flex items-center justify-between text-rose-900 font-bold border-b border-slate-200 pb-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                  <span>Refund Audit Log</span>
                </span>
                <span className="font-mono">₦{formatNaira(totalRefundAmount, false)} REFUNDED</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700 pt-0.5">
                <div>
                  <span className="text-slate-400">Processed On:</span>{' '}
                  <span className="font-medium">
                    {formatLagosDateTime(sale.refundedAt || latestReturn?.timestamp || sale.createdAt)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Authorized Officer:</span>{' '}
                  <span className="font-medium">
                    {sale.refundedBy || latestReturn?.performedByUserName || 'Manager'}
                  </span>
                </div>
              </div>
              {(sale.refundReason || latestReturn?.reason) && (
                <div className="text-[10px] text-slate-600 italic pt-0.5">
                  <span className="font-bold not-italic text-slate-500">Reason:</span> "
                  {sale.refundReason || latestReturn?.reason}"
                </div>
              )}
            </div>
          )}

          {/* Dynamic Items Table (Expands continuously for any quantity of items sold) */}
          <div className="py-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Items Purchased ({sale.items.length})</span>
              <span>Price & Qty</span>
            </div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 font-bold">
                  <th className="py-1 text-left">Item Description</th>
                  <th className="py-1 text-center w-12">Qty</th>
                  <th className="py-1 text-right w-18">Unit (₦)</th>
                  <th className="py-1 text-right w-20">Total (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => {
                  const isItemReturned = Boolean(item.returned || (item.returnedQuantity || 0) > 0);
                  const returnedQty = item.returnedQuantity || (item.returned ? item.quantity : 0);

                  return (
                    <tr key={idx} className={isItemReturned ? 'bg-rose-50/50' : ''}>
                      <td className="py-1.5 pr-2 align-top">
                        <div className="font-bold text-slate-900 leading-tight">
                          {item.productName}
                        </div>
                        <div className="font-mono text-[9px] text-slate-500">
                          SKU: {item.sku}
                        </div>
                        {isItemReturned && (
                          <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>RETURNED: {returnedQty} unit(s) restocked</span>
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 text-center font-mono align-top text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-1.5 text-right font-mono align-top text-slate-700 tabular-nums">
                        {formatNaira(item.unitPrice, false)}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold align-top text-slate-900 tabular-nums">
                        {formatNaira(item.subtotal, false)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">{formatNaira(sale.subtotal)}</span>
            </div>

            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Discount Applied:</span>
                <span className="font-mono tabular-nums">-{formatNaira(sale.discountTotal)}</span>
              </div>
            )}

            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>VAT / Tax:</span>
                <span className="font-mono tabular-nums">{formatNaira(sale.taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm text-slate-950 pt-1.5 border-t border-slate-300">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-900 tabular-nums">
                {formatNaira(sale.grandTotal)}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 pt-0.5">
              <span>
                Paid ({sale.paymentMethod ? sale.paymentMethod.replace('_', ' ') : 'Cash/Transfer'}):
              </span>
              <span className="font-mono font-bold text-emerald-800 tabular-nums">
                {formatNaira(sale.paidAmount)}
              </span>
            </div>

            {sale.balanceDue > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono tabular-nums">{formatNaira(sale.balanceDue)}</span>
              </div>
            )}

            {/* Total Refund Deduction Line */}
            {isRefunded && totalRefundAmount > 0 && (
              <div className="mt-1 pt-1 border-t border-dashed border-rose-300 flex justify-between font-black text-rose-900 bg-rose-50 px-2 py-1 rounded">
                <span>Total Refunded (Reversed):</span>
                <span className="font-mono tabular-nums">-₦{formatNaira(totalRefundAmount, false)}</span>
              </div>
            )}
          </div>

          {/* Stock Restoration Certificate */}
          {isRefunded && (
            <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded text-center text-[10px] text-slate-600">
              <p className="font-bold text-slate-800 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>Restock Certification & Inventory Balance</span>
              </p>
              <p className="mt-0.5">
                Physical goods totaling {totalReturnedQty} unit(s) were returned in good condition and
                added back to warehouse stock. Ledger reconciled with zero shortage.
              </p>
            </div>
          )}

          {/* Barcode Simulation for POS Scanning */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center">
            <div className="inline-block py-1 px-3 bg-slate-100 rounded">
              <div className="font-mono tracking-widest text-[9px] uppercase font-bold text-slate-700">
                ||||| | |||| |||||| | ||||| || |||||| | |||||
              </div>
              <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                {sale.invoiceNumber}
              </div>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center text-[10px] text-slate-500 pt-3 leading-relaxed">
            <p className="font-medium">{settings.receiptFooterMessage || 'Thank you for choosing Offnot Energy! Powering sustainable futures.'}</p>
            <p className="text-[9px] text-slate-400 mt-1">
              Printed on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')} · Offnot Energy ERP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
