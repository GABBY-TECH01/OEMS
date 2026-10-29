import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Quotation, QuotationLineItem } from '../../types';
import { formatNaira, formatLagosDateTime, formatLagosDate } from '../../utils/formatters';
import { Modal } from '../common/CommonUI';
import { BRAND_LOGO_URL } from '../../constants/branding';
import { downloadQuotationPDF } from '../../utils/quotationPdf';

export const Quotations: React.FC = () => {
  const {
    quotations,
    customers,
    products,
    settings,
    currentUser,
    saveQuotation,
    convertQuotationToOrder,
    globalSearchQuery,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const handleDownloadPdf = async (quote: Quotation) => {
    try {
      setDownloadingPdfId(quote.id);
      await downloadQuotationPDF(quote, settings);
    } catch (err) {
      console.error('Failed to generate PDF quotation:', err);
      alert('Could not download PDF quotation. Falling back to browser print.');
      window.print();
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // New quotation form state
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [quoteItems, setQuoteItems] = useState<QuotationLineItem[]>([
    {
      productId: products[0]?.id,
      description: products[0]?.name || '',
      quantity: 1,
      unitPrice: products[0]?.retailPrice || 0,
      unitCost: products[0]?.purchaseCost || 0,
      subtotal: products[0]?.retailPrice || 0,
    },
  ]);
  const [installFee, setInstallFee] = useState<number>(150000);
  const [logisticsFee, setLogisticsFee] = useState<number>(35000);
  const [applyVat, setApplyVat] = useState<boolean>(settings.enableTaxByDefault);
  const [validDays, setValidDays] = useState<number>(14);
  const [termsText, setTermsText] = useState(
    '70% advance deposit upon quotation acceptance. 30% balance upon delivery and installation commissioning. Warranty: 2 years on hybrid inverters, 5 years on lithium storage banks. Offnot Energy, Dalute Road, Ibadan.'
  );

  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredQuotes = quotations.filter(q => {
    return (
      q.quotationNumber.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      q.customerName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      q.customerPhone.includes(effectiveSearch)
    );
  });

  const addItemRow = () => {
    const prod = products[0];
    if (prod) {
      setQuoteItems(prev => [
        ...prev,
        {
          productId: prod.id,
          description: prod.name,
          quantity: 1,
          unitPrice: prod.retailPrice,
          unitCost: prod.purchaseCost,
          subtotal: prod.retailPrice,
        },
      ]);
    }
  };

  const updateItem = (index: number, field: keyof QuotationLineItem, value: any) => {
    setQuoteItems(prev => {
      const copy = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          copy[index] = {
            ...copy[index],
            productId: prod.id,
            description: prod.name,
            unitPrice: prod.retailPrice,
            unitCost: prod.purchaseCost,
            subtotal: prod.retailPrice * copy[index].quantity,
          };
        }
      } else if (field === 'quantity') {
        const q = Number(value) || 1;
        copy[index] = { ...copy[index], quantity: q, subtotal: q * copy[index].unitPrice };
      } else if (field === 'unitPrice') {
        const p = Number(value) || 0;
        copy[index] = { ...copy[index], unitPrice: p, subtotal: p * copy[index].quantity };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const removeItemRow = (idx: number) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== idx));
  };

  const quoteSubtotal = quoteItems.reduce((s, i) => s + i.subtotal, 0);
  const vatRate = applyVat ? settings.defaultVatRate : 0;
  const quoteVat = ((quoteSubtotal + installFee + logisticsFee) * vatRate) / 100;
  const quoteTotal = quoteSubtotal + installFee + logisticsFee + quoteVat;

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    saveQuotation({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      items: quoteItems,
      installationCharges: Number(installFee),
      logisticsCharges: Number(logisticsFee),
      vatRate,
      validUntil: new Date(Date.now() + validDays * 86400000).toISOString(),
      terms: termsText,
    });

    setShowCreateModal(false);
  };

  const handleConvert = (quote: Quotation) => {
    if (confirm(`Convert accepted quotation #${quote.quotationNumber} into a live sales order?`)) {
      const res = convertQuotationToOrder(quote.id);
      if (res.success) {
        alert('Quotation converted to live sales order successfully! Stock has been deducted.');
      } else {
        alert(res.error || 'Conversion failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation by quote #, client name, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Solar Quotation</span>
        </button>
      </div>

      {/* Quotations List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Client / Project Site</th>
                <th className="py-3 px-3 text-right">Equipment Subtotal</th>
                <th className="py-3 px-3 text-right">Install & Logistics</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3">Valid Until</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No solar quotations created yet. Click "Generate Solar Quotation" above.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {quote.quotationNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatLagosDate(quote.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 truncate max-w-xs">{quote.customerName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{quote.customerAddress}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatNaira(quote.subtotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatNaira(quote.installationCharges + quote.logisticsCharges)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-800">
                      {formatNaira(quote.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {formatLagosDate(quote.validUntil)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          quote.status === 'converted'
                            ? 'bg-emerald-50 text-emerald-800'
                            : quote.status === 'accepted'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedQuote(quote);
                            setShowPreviewModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Preview Quotation"
                        >
                          <FileCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(quote)}
                          disabled={downloadingPdfId === quote.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs disabled:opacity-50"
                          title="Download Official Quotation as PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingPdfId === quote.id ? 'Generating...' : 'PDF'}</span>
                        </button>
                        {quote.status !== 'converted' && (
                          <button
                            onClick={() => handleConvert(quote)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-2xs"
                          >
                            Convert to Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Solar Quotation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate Solar Installation Quotation"
        subtitle="Itemize solar panels, inverters, battery bank, installation & logistics"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Client / Prospect *
            </label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.address}) - {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Equipment & Materials Breakdown
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                + Add Equipment
              </button>
            </div>

            {quoteItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-lg">
                <select
                  value={item.productId}
                  onChange={e => updateItem(idx, 'productId', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border rounded"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>

                <div className="w-16">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-full px-2 py-1.5 text-xs font-mono font-bold border rounded bg-white text-center"
                  />
                </div>

                <div className="w-28">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                    placeholder="Price (₦)"
                    className="w-full px-2 py-1.5 text-xs font-mono border rounded bg-white"
                  />
                </div>

                <div className="w-28 text-right font-mono font-bold text-xs text-slate-900 pr-2">
                  {formatNaira(item.subtotal, false)}
                </div>

                {quoteItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Additional Charges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Installation & Labor Charges (₦)
              </label>
              <input
                type="number"
                value={installFee}
                onChange={e => setInstallFee(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Logistics & Transport (₦)
              </label>
              <input
                type="number"
                value={logisticsFee}
                onChange={e => setLogisticsFee(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Validity (Days)
              </label>
              <input
                type="number"
                value={validDays}
                onChange={e => setValidDays(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-slate-700">
            <input
              type="checkbox"
              id="vatToggle"
              checked={applyVat}
              onChange={e => setApplyVat(e.target.checked)}
              className="rounded text-emerald-800"
            />
            <label htmlFor="vatToggle">Apply 7.5% VAT (₦{quoteVat.toLocaleString()})</label>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Quotation Grand Total:</span>
            <span className="font-mono font-bold text-base text-emerald-800">
              {formatNaira(quoteTotal)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={termsText}
              onChange={e => setTermsText(e.target.value)}
              className="w-full p-2 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Generate Quotation
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview / Print Quotation Document */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Commercial Solar System Quotation"
        subtitle={`Quotation #${selectedQuote?.quotationNumber} · Offnot Energy`}
        maxWidth="lg"
      >
        {selectedQuote && (
          <div className="space-y-4">
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 text-xs font-sans">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={BRAND_LOGO_URL}
                    alt="Offnot Energy"
                    className="w-14 h-14 object-contain rounded-lg border border-slate-100 bg-white p-0.5 shadow-xs"
                  />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 uppercase">
                      {settings.companyName}
                    </h2>
                    <p className="text-[11px] text-emerald-800 font-semibold">{settings.slogan}</p>
                    <p className="text-[11px] text-slate-600">{settings.location}</p>
                    <p className="text-[11px] text-slate-600">
                      Tel: {settings.phone} · Email: {settings.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-900 block">
                    {selectedQuote.quotationNumber}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Date: {formatLagosDate(selectedQuote.createdAt)}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Valid Until: {formatLagosDate(selectedQuote.validUntil)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Prepared For:
                </span>
                <h4 className="font-bold text-slate-900">{selectedQuote.customerName}</h4>
                <p className="text-[11px] text-slate-600">{selectedQuote.customerAddress}</p>
                <p className="text-[11px] text-slate-600 font-mono">{selectedQuote.customerPhone}</p>
              </div>

              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1.5">Description</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Unit Price</th>
                    <th className="py-1.5 text-right">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedQuote.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium text-slate-900">{item.description}</td>
                      <td className="py-2 text-center font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">{formatNaira(item.unitPrice, false)}</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        {formatNaira(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="py-1.5 font-medium text-slate-700">
                      Installation, Electrical Cabling & Commissioning Labor
                    </td>
                    <td className="py-1.5 text-right font-mono font-semibold">
                      {formatNaira(selectedQuote.installationCharges)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1.5 font-medium text-slate-700">
                      Transport & Site Logistics
                    </td>
                    <td className="py-1.5 text-right font-mono font-semibold">
                      {formatNaira(selectedQuote.logisticsCharges)}
                    </td>
                  </tr>
                  {selectedQuote.taxAmount > 0 && (
                    <tr>
                      <td colSpan={3} className="py-1.5 font-medium text-slate-700">
                        VAT ({selectedQuote.vatRate}%)
                      </td>
                      <td className="py-1.5 text-right font-mono font-semibold">
                        {formatNaira(selectedQuote.taxAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Project Investment:</span>
                <span className="font-mono text-emerald-800 text-base">
                  {formatNaira(selectedQuote.totalAmount)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 block">Terms and Warranty Conditions:</span>
                <p>{selectedQuote.terms}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Browser Print</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedQuote)}
                disabled={downloadingPdfId === selectedQuote.id}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingPdfId === selectedQuote.id ? 'Generating PDF...' : 'Download Official Quotation (PDF)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
