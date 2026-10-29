import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  PackageCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  Download,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier, PurchaseOrder, PurchaseOrderItem } from '../../types';
import { formatNaira, formatLagosDateTime, exportToCSV, hasPermission } from '../../utils/formatters';
import { Modal, StatCard } from '../common/CommonUI';

export const Purchasing: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    products,
    settings,
    currentUser,
    saveSupplier,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receiveGoods,
    recordSupplierPayment,
    globalSearchQuery,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'suppliers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New PO state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; orderedQty: number; unitCost: number }[]>([
    { productId: products[0]?.id || '', orderedQty: 5, unitCost: products[0]?.purchaseCost || 0 },
  ]);
  const [poShipping, setPoShipping] = useState<number>(0);
  const [poNotes, setPoNotes] = useState<string>('');
  const [poWarehouse, setPoWarehouse] = useState<string>(settings.warehouses[0]);

  // Receiving state
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);
  const [receivedQtyMap, setReceivedQtyMap] = useState<{ [productId: string]: number }>({});
  const [receiveWarehouse, setReceiveWarehouse] = useState<string>(settings.warehouses[0]);
  const [receiveError, setReceiveError] = useState('');

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const canApprove = hasPermission(currentUser.role, 'approve_purchases');

  // Add Item row to PO
  const addPoItemRow = () => {
    const nextProd = products[0];
    if (nextProd) {
      setPoItems(prev => [...prev, { productId: nextProd.id, orderedQty: 1, unitCost: nextProd.purchaseCost }]);
    }
  };

  const removePoItemRow = (idx: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePoItem = (idx: number, field: 'productId' | 'orderedQty' | 'unitCost', value: any) => {
    setPoItems(prev => {
      const copy = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        copy[idx] = {
          ...copy[idx],
          productId: value,
          unitCost: prod?.purchaseCost || copy[idx].unitCost,
        };
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

  // Submit new PO
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) return;

    const items: PurchaseOrderItem[] = poItems
      .filter(i => i.productId && i.orderedQty > 0)
      .map(i => {
        const prod = products.find(p => p.id === i.productId)!;
        return {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          orderedQuantity: Number(i.orderedQty),
          receivedQuantity: 0,
          unitCost: Number(i.unitCost),
          totalCost: Number(i.orderedQty) * Number(i.unitCost),
        };
      });

    if (items.length === 0) {
      alert('Please include at least one valid product.');
      return;
    }

    createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.companyName,
      items,
      shippingAndLogistics: Number(poShipping),
      warehouseLocation: poWarehouse,
      notes: poNotes,
    });

    setShowPOModal(false);
    setPoItems([{ productId: products[0]?.id || '', orderedQty: 5, unitCost: products[0]?.purchaseCost || 0 }]);
    setPoShipping(0);
    setPoNotes('');
  };

  // Confirm goods receipt
  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveError('');
    if (!activePO) return;

    const receiptPayload = activePO.items.map(item => ({
      productId: item.productId,
      receivedQty: Number(receivedQtyMap[item.productId] || 0),
    }));

    const totalQty = receiptPayload.reduce((sum, i) => sum + i.receivedQty, 0);
    if (totalQty <= 0) {
      setReceiveError('Please specify the quantity being received for at least one item.');
      return;
    }

    const res = receiveGoods(activePO.id, receiptPayload, receiveWarehouse);
    if (res.success) {
      setShowReceiveModal(false);
      setActivePO(null);
    } else {
      setReceiveError(res.error || 'Failed to record goods receipt.');
    }
  };

  // Confirm supplier payment
  const handleConfirmSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO || paymentAmount <= 0) return;

    recordSupplierPayment(activePO.id, paymentAmount);
    setShowPaymentModal(false);
    setActivePO(null);
    setPaymentAmount(0);
  };

  // Summary Metrics
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  const pendingCount = purchaseOrders.filter(p => p.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Outstanding Supplier Payables"
          value={formatNaira(totalPayables)}
          subValue={`Across ${suppliers.length} active vendors`}
          icon={<DollarSign className="w-4 h-4 text-slate-600" />}
          variant="amber"
        />
        <StatCard
          label="Pending Purchase Approvals"
          value={pendingCount}
          subValue="POs requiring manager sign-off"
          icon={<Clock className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          label="Total Registered Vendors"
          value={suppliers.length}
          subValue="Direct Solar Distributors & Depots"
          icon={<Truck className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Sub-tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'orders'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'suppliers'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            Supplier Directory ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'suppliers' ? (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPOModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* PO Tab */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                    <th className="py-3 px-4">PO #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Target Warehouse</th>
                    <th className="py-3 px-3 text-right">Items Qty</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No purchase orders recorded yet. Click "Create Purchase Order" above.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map(po => {
                      const totalQty = po.items.reduce((s, i) => s + i.orderedQuantity, 0);
                      const receivedQty = po.items.reduce((s, i) => s + i.receivedQuantity, 0);

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {po.poNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {formatLagosDateTime(po.createdAt)}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{po.supplierName}</td>
                          <td className="py-3 px-3 text-slate-600 text-[11px] truncate max-w-[130px]">
                            {po.warehouseLocation}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                            {receivedQty} / {totalQty}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                            {formatNaira(po.totalAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-emerald-700">
                            {formatNaira(po.paidAmount)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                po.status === 'received'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : po.status === 'partially_received'
                                  ? 'bg-blue-50 text-blue-800'
                                  : po.status === 'approved'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {po.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Approve Button */}
                              {po.status === 'pending_approval' && canApprove && (
                                <button
                                  onClick={() => updatePurchaseOrderStatus(po.id, 'approved')}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
                                >
                                  Approve PO
                                </button>
                              )}

                              {/* Receive Goods Button */}
                              {(po.status === 'approved' || po.status === 'partially_received') && (
                                <button
                                  onClick={() => {
                                    setActivePO(po);
                                    // initialize received inputs to pending amounts
                                    const initMap: { [id: string]: number } = {};
                                    po.items.forEach(i => {
                                      initMap[i.productId] = Math.max(0, i.orderedQuantity - i.receivedQuantity);
                                    });
                                    setReceivedQtyMap(initMap);
                                    setReceiveWarehouse(po.warehouseLocation);
                                    setShowReceiveModal(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Receive Goods</span>
                                </button>
                              )}

                              {/* Record Payment Button */}
                              {po.paidAmount < po.totalAmount && (
                                <button
                                  onClick={() => {
                                    setActivePO(po);
                                    setPaymentAmount(po.totalAmount - po.paidAmount);
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                  Pay Vendor
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

      {/* Suppliers Tab */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{sup.companyName}</h4>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {sup.paymentTerms}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                </div>

                {sup.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sup.categories.map(c => (
                      <span key={c} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Balance Due:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatNaira(sup.outstandingBalance)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedSupplierId(sup.id);
                    setShowPOModal(true);
                  }}
                  className="text-emerald-800 font-semibold hover:underline"
                >
                  Create PO →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      <Modal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        title="Create Purchase Requisition / PO"
        subtitle="Specify products, ordered quantities and target Ibadan warehouse"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Vendor / Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiving Warehouse *
              </label>
              <select
                value={poWarehouse}
                onChange={e => setPoWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
              >
                {settings.warehouses.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Purchase Order Line Items
              </label>
              <button
                type="button"
                onClick={addPoItemRow}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                + Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {poItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <select
                    value={item.productId}
                    onChange={e => updatePoItem(idx, 'productId', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border rounded"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.orderedQty}
                      onChange={e => updatePoItem(idx, 'orderedQty', Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 text-xs font-mono font-bold border rounded bg-white"
                    />
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={e => updatePoItem(idx, 'unitCost', Number(e.target.value))}
                      placeholder="Cost (₦)"
                      className="w-full px-2 py-1.5 text-xs font-mono border rounded bg-white"
                    />
                  </div>

                  {poItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoItemRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Landed Logistics / Shipping (₦)
              </label>
              <input
                type="number"
                value={poShipping}
                onChange={e => setPoShipping(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Terms
              </label>
              <input
                type="text"
                value={poNotes}
                onChange={e => setPoNotes(e.target.value)}
                placeholder="e.g. Delivery expected via interstate haulage"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowPOModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Submit Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Goods Receipt Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Record Goods Received (GRN)"
        subtitle={`PO #${activePO?.poNumber} · ${activePO?.supplierName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmReceive} className="space-y-4">
          {receiveError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {receiveError}
            </div>
          )}

          <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <p>
              Confirm physical receipt and condition. Stock levels will be increased and permanently recorded in the stock ledger only upon submitting this receipt.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Warehouse To Stock In *
            </label>
            <select
              value={receiveWarehouse}
              onChange={e => setReceiveWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
            >
              {settings.warehouses.map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Items Received
            </label>
            {activePO?.items.map(item => {
              const pending = item.orderedQuantity - item.receivedQuantity;
              return (
                <div key={item.productId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-900">{item.productName}</h5>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Ordered: {item.orderedQuantity} · Already received: {item.receivedQuantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Receiving now:</span>
                    <input
                      type="number"
                      min="0"
                      max={pending}
                      value={receivedQtyMap[item.productId] ?? pending}
                      onChange={e =>
                        setReceivedQtyMap(prev => ({ ...prev, [item.productId]: Number(e.target.value) }))
                      }
                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-center border rounded bg-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReceiveModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              Confirm Goods Receipt & Update Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment to Supplier"
        subtitle={`PO #${activePO?.poNumber} · Balance: ${formatNaira(
          (activePO?.totalAmount || 0) - (activePO?.paidAmount || 0)
        )}`}
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmSupplierPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (NGN ₦) *
            </label>
            <input
              type="number"
              min="1"
              value={paymentAmount}
              onChange={e => setPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono font-bold border rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Add Solar Vendor / Supplier Profile"
        subtitle="Manage wholesale contacts, payment terms and product lines"
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            saveSupplier({
              companyName: form.get('companyName') as string,
              contactPerson: form.get('contactPerson') as string,
              phone: form.get('phone') as string,
              email: form.get('email') as string,
              address: form.get('address') as string,
              paymentTerms: form.get('paymentTerms') as string,
              notes: form.get('notes') as string,
            });
            setShowSupplierModal(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="companyName"
              required
              placeholder="e.g. Deye Inverters Direct Hub"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="e.g. Babatunde Ade"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="080..."
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="orders@supplier.com"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Depot Location</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. Ikeja, Lagos / Dugbe, Ibadan"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select name="paymentTerms" className="w-full px-2 py-1.5 text-xs border rounded-lg">
              <option value="Immediate">Immediate / Advance</option>
              <option value="14 Days Net">14 Days Net</option>
              <option value="30 Days Net">30 Days Net</option>
              <option value="Consignment">Consignment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Supplied brands, warranty terms..."
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSupplierModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
