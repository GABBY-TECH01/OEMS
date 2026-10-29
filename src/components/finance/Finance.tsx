import React, { useState, useMemo } from 'react';
import {
  CircleDollarSign,
  Plus,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Calendar,
  Filter,
  DollarSign,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatNaira, formatLagosDateTime, exportToCSV } from '../../utils/formatters';
import { Modal, StatCard } from '../common/CommonUI';

export const Finance: React.FC = () => {
  const {
    expenses: allExpenses,
    sales: allSales,
    purchaseOrders,
    customers,
    currentUser,
    recordExpense,
    globalSearchQuery,
    branches,
    activeBranchId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const expenses = useMemo(
    () => (activeBranchId === 'all' ? allExpenses : allExpenses.filter(e => e.branchId === activeBranchId)),
    [allExpenses, activeBranchId]
  );

  const sales = useMemo(
    () => (activeBranchId === 'all' ? allSales : allSales.filter(s => s.branchId === activeBranchId)),
    [allSales, activeBranchId]
  );

  const categories: ExpenseCategory[] = [
    'Transport & Logistics',
    'Fuel & Power',
    'Rent & Facilities',
    'Salaries & Wages',
    'Marketing & Advertising',
    'Internet & Communication',
    'Installation Labour',
    'Repairs & Maintenance',
    'Office Supplies',
    'Bank Charges & POS Fees',
    'Other Operating Expenses',
  ];

  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch =
        e.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.payee.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (e.reference && e.reference.toLowerCase().includes(effectiveSearch.toLowerCase()));
      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [expenses, effectiveSearch, categoryFilter]);

  // Financial Ledger Calculations
  const totalRevenue = useMemo(() => sales.reduce((s, sale) => s + sale.grandTotal, 0), [sales]);
  const totalCogs = useMemo(() => sales.reduce((s, sale) => s + sale.costOfGoodsSold, 0), [sales]);
  const grossProfit = totalRevenue - totalCogs;
  const totalOperatingExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const operatingProfit = grossProfit - totalOperatingExpenses;

  const totalReceivables = customers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
  const totalPayables = purchaseOrders.reduce((s, p) => s + Math.max(0, p.totalAmount - p.paidAmount), 0);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const map: { [c: string]: number } = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleExportExpenses = () => {
    const rows = expenses.map(e => ({
      Date: e.date,
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      PaymentMethod: e.paymentMethod,
      Payee: e.payee,
      Reference: e.reference,
      ApprovedBy: e.approvedBy,
      RecordedBy: e.recordedByUserName,
    }));
    exportToCSV(`offnot_operating_expenses_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const branchId = (form.get('branchId') as string) || (activeBranchId !== 'all' ? activeBranchId : branches[0]?.id);
    const branch = branches.find(b => b.id === branchId);

    recordExpense({
      date: new Date().toISOString(),
      category: form.get('category') as ExpenseCategory,
      description: form.get('description') as string,
      amount: Number(form.get('amount')) || 0,
      paymentMethod: form.get('paymentMethod') as any,
      payee: form.get('payee') as string,
      reference: form.get('reference') as string,
      approvedBy: form.get('approvedBy') as string,
      branchId: branch?.id,
      branchName: branch?.name,
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Accounting Summaries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales Revenue"
          value={formatNaira(totalRevenue)}
          subValue={`${sales.length} completed transactions`}
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />

        <StatCard
          label="Gross Profit (Revenue - COGS)"
          value={formatNaira(grossProfit)}
          subValue={`COGS: ${formatNaira(totalCogs)}`}
          trend={{
            value: totalRevenue > 0 ? `${Math.round((grossProfit / totalRevenue) * 100)}% margin` : '0%',
            isPositive: true,
          }}
          icon={<CircleDollarSign className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />

        <StatCard
          label="Total Operating Expenses"
          value={formatNaira(totalOperatingExpenses)}
          subValue={`${expenses.length} operating disbursements`}
          icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
          variant="rose"
        />

        <StatCard
          label="Estimated Operating Profit (EBITDA)"
          value={formatNaira(operatingProfit)}
          subValue={`Net Margin: ${totalRevenue > 0 ? Math.round((operatingProfit / totalRevenue) * 100) : 0}%`}
          trend={{ value: operatingProfit >= 0 ? 'Profitable' : 'Deficit', isPositive: operatingProfit >= 0 }}
          icon={<DollarSign className="w-4 h-4 text-slate-600" />}
          variant={operatingProfit >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Financial Statement Overview & Expense Breakdown Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income & Margin Statement Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Operating Financial Statement (Management Summary)
              </h3>
              <p className="text-xs text-slate-500">
                Real-time reconciliation of sales, merchandise cost, and operating overheads
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Ibadan Headquarters
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-700">
              <span className="font-medium">Total Invoiced Sales Revenue</span>
              <span className="font-mono font-bold text-slate-900">{formatNaira(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
              <span>Less: Cost of Goods Sold (Inventory Purchase Cost)</span>
              <span className="font-mono text-rose-700">-{formatNaira(totalCogs)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 font-bold text-emerald-800 bg-emerald-50/40 px-2 rounded">
              <span>Gross Profit Margin</span>
              <span className="font-mono">{formatNaira(grossProfit)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
              <span>Less: Operating Expenses (Fuel, Starlink, Logistics, Labour)</span>
              <span className="font-mono text-rose-700">-{formatNaira(totalOperatingExpenses)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-bold text-slate-900 bg-slate-50 px-2 rounded border border-slate-200">
              <span>Net Operating Profit</span>
              <span className={`font-mono ${operatingProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                {formatNaira(operatingProfit)}
              </span>
            </div>
          </div>

          {/* Working Capital Balances */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
              <span className="text-amber-800 font-semibold block">Customer Receivables</span>
              <span className="text-base font-mono font-bold text-slate-900 tabular-nums">
                {formatNaira(totalReceivables)}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Unpaid customer invoices</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
              <span className="text-blue-800 font-semibold block">Supplier Payables</span>
              <span className="text-base font-mono font-bold text-slate-900 tabular-nums">
                {formatNaira(totalPayables)}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Outstanding vendor balances</p>
            </div>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Expenses by Category</h3>
            <p className="text-xs text-slate-500 mb-4">Operational disbursement breakdown</p>

            <div className="space-y-3">
              {categoryBreakdown.map(([cat, amt]) => {
                const percent =
                  totalOperatingExpenses > 0 ? Math.round((amt / totalOperatingExpenses) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate max-w-[160px]">{cat}</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        {formatNaira(amt, false)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <button
              onClick={handleExportExpenses}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Export Expense CSV →
            </button>
          </div>
        </div>
      </div>

      {/* Expense Entries Table and Action */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by payee, description, reference..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Expense Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                  <th className="py-3 px-4">Date (Lagos)</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Payee / Vendor</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-4">Recorded By / Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No operating expenses recorded yet. Click "Record Expense" above.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatLagosDateTime(exp.date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{exp.category}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-600">
                        {exp.branchName || 'Tipper Garage (HQ)'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-sm truncate">{exp.description}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-rose-700">
                        {formatNaira(exp.amount)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap capitalize text-slate-600">
                        {exp.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[140px]">
                        {exp.payee}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {exp.reference || '—'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <span>{exp.recordedByUserName}</span>
                        {exp.approvedBy && <span className="block text-emerald-700">Appr: {exp.approvedBy}</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Operating Expense"
        subtitle="Log operational overheads for Dalute Road and Tipper Garage facilities"
        maxWidth="md"
      >
        <form onSubmit={handleAddExpense} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
            <select name="category" className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none">
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              name="description"
              required
              placeholder="e.g. Fuel purchase for Dalute Road generator (100L)"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (NGN ₦) *</label>
              <input
                type="number"
                name="amount"
                required
                min="1"
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs font-mono font-bold border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select name="paymentMethod" className="w-full px-2.5 py-1.5 text-xs border rounded-lg">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payee / Recipient *</label>
              <input
                type="text"
                name="payee"
                required
                placeholder="e.g. Bovas Petrol Station / Haulage Driver"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Ref #</label>
              <input
                type="text"
                name="reference"
                placeholder="e.g. REC-98492"
                className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch *</label>
              <select
                name="branchId"
                defaultValue={activeBranchId !== 'all' ? activeBranchId : branches[0]?.id}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approved By</label>
              <input
                type="text"
                name="approvedBy"
                defaultValue={currentUser.name}
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
