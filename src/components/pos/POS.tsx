import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Building2,
  UserCheck,
  Printer,
  RotateCcw,
  AlertTriangle,
  Receipt,
  ScanBarcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, PricingTier, PaymentMethod, Sale } from '../../types';
import { formatNaira, formatLagosDateTime } from '../../utils/formatters';
import { Modal } from '../common/CommonUI';
import { BRAND_LOGO_URL } from '../../constants/branding';

export const POS: React.FC = () => {
  const {
    products,
    customers,
    categories,
    settings,
    currentUser,
    completeSale,
    saveCustomer,
    globalSearchQuery,
  } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    discount: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer & Pricing Tier
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [pricingTier, setPricingTier] = useState<PricingTier>('retail');
  const [warehouseLocation, setWarehouseLocation] = useState<string>(settings.warehouses[0]);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitTransfer, setSplitTransfer] = useState<number>(0);
  const [splitPos, setSplitPos] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // New Customer Quick-Add Modal
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // Sync selected customer tier
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setPricingTier(cust.pricingTier);
      // Update cart prices to match new tier
      setCart(prev =>
        prev.map(item => ({
          ...item,
          unitPrice: getProductTierPrice(item.product, cust.pricingTier),
        }))
      );
    }
  };

  const getProductTierPrice = (prod: Product, tier: PricingTier): number => {
    switch (tier) {
      case 'wholesale':
        return prod.wholesalePrice || prod.retailPrice;
      case 'installer':
        return prod.installerPrice || prod.retailPrice;
      case 'dealer':
        return prod.dealerPrice || prod.retailPrice;
      case 'retail':
      default:
        return prod.retailPrice;
    }
  };

  // Add Product to Cart
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert(`Cannot add more. Current warehouse stock is ${product.currentStock} units.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: getProductTierPrice(product, pricingTier),
            discount: 0,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            if (qty <= 0) return null;
            if (qty > item.product.currentStock) {
              alert(`Maximum available stock is ${item.product.currentStock}.`);
              return item;
            }
            return { ...item, quantity: qty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, discount: Math.max(0, discount) } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Barcode quick scan simulator
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product found with barcode/SKU: ${barcodeInput}`);
    }
  };

  // Cart Calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const totalDiscount = useMemo(
    () => cart.reduce((sum, item) => sum + item.discount, 0),
    [cart]
  );

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const totalCost = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.purchaseCost * item.quantity, 0),
    [cart]
  );

  const estimatedMargin = grandTotal - totalCost;

  // Margin Protection Check: Warning if price is below minimum or below cost
  const marginWarning = useMemo(() => {
    for (const item of cart) {
      const effectiveUnitPrice = (item.unitPrice * item.quantity - item.discount) / item.quantity;
      if (effectiveUnitPrice < item.product.minSellingPrice) {
        return `Item "${item.product.name}" is discounted below the minimum floor price (₦${item.product.minSellingPrice.toLocaleString()}).`;
      }
    }
    return null;
  }, [cart]);

  // Initiate Checkout
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setPaidAmount(grandTotal);
    setSplitCash(grandTotal);
    setSplitTransfer(0);
    setSplitPos(0);
    setPaymentError('');
    setShowPaymentModal(true);
  };

  // Confirm Sale
  const handleConfirmSale = () => {
    setPaymentError('');
    const customerObj = customers.find(c => c.id === selectedCustomerId) || {
      id: 'walk_in',
      name: 'Walk-in Retail Customer',
      phone: '',
      pricingTier: 'retail',
    };

    let calculatedPaid = paidAmount;
    let splitDetails = undefined;

    if (paymentMethod === 'split') {
      calculatedPaid = splitCash + splitTransfer + splitPos;
      splitDetails = {
        cashAmount: splitCash,
        transferAmount: splitTransfer,
        posAmount: splitPos,
      };
    }

    const salePayload = {
      customerId: customerObj.id,
      customerName: customerObj.name,
      customerPhone: customerObj.phone,
      customerTier: pricingTier,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
      paymentMethod,
      paidAmount: calculatedPaid,
      splitDetails,
      notes: saleNotes,
      warehouseLocation,
    };

    const res = completeSale(salePayload);
    if (res.success && res.sale) {
      setShowPaymentModal(false);
      setCart([]);
      setCompletedSale(res.sale);
      setShowReceiptModal(true);
    } else {
      setPaymentError(res.error || 'Sale processing failed.');
    }
  };

  // Filter products for POS grid
  const effectiveSearch = searchQuery || globalSearchQuery;
  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      if (p.status === 'discontinued') return false;
      const matchesSearch =
        p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        p.barcode.includes(effectiveSearch);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, effectiveSearch, selectedCategory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Columns: Product Selection & Catalog */}
      <div className="lg:col-span-7 space-y-4">
        {/* Top Search & Barcode Scan Strip */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search solar panels, inverters, batteries, cables..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Barcode / SKU Scan Input */}
          <form onSubmit={handleBarcodeScan} className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative">
              <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan / Type Barcode"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                className="w-36 pl-8 pr-2 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        {/* Categories Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredCatalog.map(p => {
            const price = getProductTierPrice(p, pricingTier);
            const inCart = cart.find(i => i.product.id === p.id);
            const isOutOfStock = p.currentStock <= 0;

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`p-3 bg-white rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isOutOfStock
                    ? 'opacity-50 border-slate-200 cursor-not-allowed bg-slate-50'
                    : inCart
                    ? 'border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">
                      {p.sku}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : p.currentStock <= p.reorderLevel
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {p.currentStock} {p.unit}s
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                    {p.name}
                  </h4>

                  {p.model && (
                    <span className="text-[11px] text-slate-700 mt-0.5 block truncate">
                      {p.brand} · {p.model}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                      {formatNaira(price)}
                    </div>
                    {pricingTier !== 'retail' && (
                      <span className="text-[10px] text-emerald-800 uppercase font-bold">
                        {pricingTier} tier
                      </span>
                    )}
                  </div>

                  {inCart ? (
                    <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      x{inCart.quantity}
                    </span>
                  ) : (
                    <button
                      disabled={isOutOfStock}
                      className="p-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-800 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 5 Columns: Interactive Sales Cart & Checkout */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-20">
        {/* Cart Top: Customer & Tier Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Current Order Cart</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selection & Quick Add */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={e => handleCustomerChange(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="">-- Walk-in Retail Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type.replace('_', ' ')})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg whitespace-nowrap transition-colors"
              title="Add Customer"
            >
              + Customer
            </button>
          </div>

          {/* Pricing Tier Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-lg text-[11px] font-medium text-center">
            {(['retail', 'wholesale', 'installer', 'dealer'] as PricingTier[]).map(tier => (
              <button
                key={tier}
                onClick={() => {
                  setPricingTier(tier);
                  setCart(prev =>
                    prev.map(i => ({ ...i, unitPrice: getProductTierPrice(i.product, tier) }))
                  );
                }}
                className={`py-1 rounded capitalize transition-colors ${
                  pricingTier === tier
                    ? 'bg-white text-emerald-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
              <ShoppingCart className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click products on the left or scan a barcode</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 truncate">{item.product.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                    <span>{formatNaira(item.unitPrice)} each</span>
                    <span>·</span>
                    <span className="text-slate-400">{item.product.sku}</span>
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right shrink-0 min-w-[70px]">
                  <div className="font-bold font-mono text-slate-900 tabular-nums">
                    {formatNaira(item.unitPrice * item.quantity - item.discount)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[10px] text-rose-600 hover:underline mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom: Calculations & Checkout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl space-y-3">
          {marginWarning && (
            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-lg flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{marginWarning}</span>
            </div>
          )}

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} units)</span>
              <span className="font-mono tabular-nums">{formatNaira(subtotal)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Discounts applied</span>
                <span className="font-mono tabular-nums">-{formatNaira(totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums text-emerald-800 text-base">
                {formatNaira(grandTotal)}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono">({formatNaira(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Sale & Process Payment"
        subtitle={`Invoice Total: ${formatNaira(grandTotal)} · Dalute Road Warehouse`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {paymentError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {paymentError}
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Payment Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
              {[
                { id: 'bank_transfer', label: 'Bank Transfer' },
                { id: 'pos', label: 'POS Terminal' },
                { id: 'cash', label: 'Cash in Hand' },
                { id: 'split', label: 'Split Payment' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    paymentMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid Field */}
          {paymentMethod !== 'split' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid (NGN ₦) *
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-500">
                  Balance due:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {formatNaira(Math.max(0, grandTotal - paidAmount))}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setPaidAmount(grandTotal)}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  Pay in Full
                </button>
              </div>
            </div>
          ) : (
            /* Split Payment Breakdown */
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Split Breakdown</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Cash (₦)</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={e => setSplitCash(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs font-mono border rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Bank Transfer (₦)</label>
                  <input
                    type="number"
                    value={splitTransfer}
                    onChange={e => setSplitTransfer(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs font-mono border rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">POS Card (₦)</label>
                  <input
                    type="number"
                    value={splitPos}
                    onChange={e => setSplitPos(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs font-mono border rounded"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-600 flex justify-between font-medium">
                <span>Total Split Paid: {formatNaira(splitCash + splitTransfer + splitPos)}</span>
                <span>
                  Remaining:{' '}
                  {formatNaira(Math.max(0, grandTotal - (splitCash + splitTransfer + splitPos)))}
                </span>
              </div>
            </div>
          )}

          {/* Warehouse Dispense Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispense from Warehouse Location *
            </label>
            <select
              value={warehouseLocation}
              onChange={e => setWarehouseLocation(e.target.value)}
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
              Internal Sale Notes / Reference
            </label>
            <input
              type="text"
              value={saleNotes}
              onChange={e => setSaleNotes(e.target.value)}
              placeholder="e.g. Paid via Moniepoint POS Terminal #1"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSale}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              Confirm Sale & Generate Receipt
            </button>
          </div>
        </div>
      </Modal>

      {/* Professional Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Official Sales Receipt"
        subtitle={`Invoice #${completedSale?.invoiceNumber} · Offnot Energy`}
        maxWidth="md"
      >
        {completedSale && (
          <div className="space-y-4">
            <div id="printable-receipt" className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs font-sans">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-3 flex flex-col items-center">
                <img
                  src={BRAND_LOGO_URL}
                  alt="Offnot Energy Logo"
                  className="w-14 h-14 object-contain mb-1.5"
                />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  {settings.companyName}
                </h2>
                <p className="text-[11px] text-emerald-800 font-semibold">{settings.slogan}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{settings.location}</p>
                <p className="text-[11px] text-slate-600">
                  Tel: {settings.phone} · Email: {settings.email}
                </p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block">Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900">{completedSale.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Date & Time:</span>
                  <span className="text-slate-700">{formatLagosDateTime(completedSale.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer:</span>
                  <span className="font-medium text-slate-900">{completedSale.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Sales Officer:</span>
                  <span className="text-slate-700">{completedSale.salesRepName}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1">Description</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-2">
                        <div className="font-medium text-slate-900">{item.productName}</div>
                        <div className="font-mono text-[9px] text-slate-400">{item.sku}</div>
                      </td>
                      <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                      <td className="py-1.5 text-right font-mono">{formatNaira(item.unitPrice, false)}</td>
                      <td className="py-1.5 text-right font-mono font-semibold">
                        {formatNaira(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatNaira(completedSale.subtotal)}</span>
                </div>
                {completedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatNaira(completedSale.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-800">{formatNaira(completedSale.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paid ({completedSale.paymentMethod.replace('_', ' ')}):</span>
                  <span className="font-mono font-medium">{formatNaira(completedSale.paidAmount)}</span>
                </div>
                {completedSale.balanceDue > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatNaira(completedSale.balanceDue)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer Message */}
              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 leading-relaxed">
                <p>{settings.receiptFooterMessage}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        title="Quick Add Customer"
        subtitle="Register customer or solar installer"
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const name = form.get('name') as string;
            const phone = form.get('phone') as string;
            const type = form.get('type') as any;
            const tier = form.get('tier') as PricingTier;
            const address = form.get('address') as string;

            saveCustomer({ name, phone, type, pricingTier: tier, address });
            setShowNewCustomerModal(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Business Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Tayo Solar Systems Ltd"
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type</label>
              <select name="type" className="w-full px-2 py-1.5 text-xs border rounded-lg">
                <option value="retail">Retail Customer</option>
                <option value="solar_installer">Solar Installer</option>
                <option value="homeowner">Homeowner</option>
                <option value="business">Business / Commercial</option>
                <option value="dealer">Dealer / Reseller</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Tier</label>
              <select name="tier" className="w-full px-2 py-1.5 text-xs border rounded-lg">
                <option value="retail">Retail</option>
                <option value="installer">Registered Installer</option>
                <option value="wholesale">Wholesale</option>
                <option value="dealer">Dealer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address in Ibadan</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. Bodija, Ibadan"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewCustomerModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
