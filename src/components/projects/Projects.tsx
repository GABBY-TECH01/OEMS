import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Package,
  Layers,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstallationProject, ProjectStatus } from '../../types';
import { formatNaira, formatLagosDate, formatLagosDateTime } from '../../utils/formatters';
import { Modal, StatCard } from '../common/CommonUI';

export const Projects: React.FC = () => {
  const {
    projects,
    customers,
    products,
    settings,
    currentUser,
    saveProject,
    issueMaterialToProject,
    returnMaterialFromProject,
    globalSearchQuery,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<InstallationProject | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Issue Material Form
  const [issueProductId, setIssueProductId] = useState<string>(products[0]?.id || '');
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueWarehouse, setIssueWarehouse] = useState<string>(settings.warehouses[0]);
  const [issueError, setIssueError] = useState('');

  // Return Material Form
  const [returnProductId, setReturnProductId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnWarehouse, setReturnWarehouse] = useState<string>(settings.warehouses[0]);
  const [returnError, setReturnError] = useState('');

  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.projectCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.customerName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.siteAddress.toLowerCase().includes(effectiveSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses: { status: ProjectStatus; label: string }[] = [
    { status: 'lead', label: 'Lead' },
    { status: 'site_survey', label: 'Site Survey' },
    { status: 'approved', label: 'Approved' },
    { status: 'scheduled', label: 'Scheduled' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'testing', label: 'Testing' },
    { status: 'completed', label: 'Completed' },
    { status: 'on_hold', label: 'On Hold' },
  ];

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError('');
    if (!selectedProject) return;

    const res = issueMaterialToProject(selectedProject.id, issueProductId, issueQty, issueWarehouse);
    if (res.success) {
      setShowIssueModal(false);
      // update active selection
      const updatedPrj = projects.find(p => p.id === selectedProject.id);
      if (updatedPrj) setSelectedProject(updatedPrj);
    } else {
      setIssueError(res.error || 'Failed to issue material.');
    }
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');
    if (!selectedProject || !returnProductId) return;

    const res = returnMaterialFromProject(selectedProject.id, returnProductId, returnQty, returnWarehouse);
    if (res.success) {
      setShowReturnModal(false);
      const updatedPrj = projects.find(p => p.id === selectedProject.id);
      if (updatedPrj) setSelectedProject(updatedPrj);
    } else {
      setReturnError(res.error || 'Failed to return material.');
    }
  };

  const totalContractRevenue = projects.reduce((s, p) => s + p.contractAmount, 0);
  const totalProjectCosts = projects.reduce((s, p) => s + p.totalProjectCost, 0);
  const activeCount = projects.filter(p => p.status === 'in_progress' || p.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Solar Installations"
          value={activeCount}
          subValue="Projects currently in progress or scheduled"
          icon={<Wrench className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
        <StatCard
          label="Total Project Contracts"
          value={formatNaira(totalContractRevenue)}
          subValue={`Actual costs: ${formatNaira(totalProjectCosts)}`}
          icon={<TrendingUp className="w-4 h-4 text-slate-600" />}
        />
        <StatCard
          label="Average Project Gross Margin"
          value={
            totalContractRevenue > 0
              ? `${Math.round(((totalContractRevenue - totalProjectCosts) / totalContractRevenue) * 100)}%`
              : '0%'
          }
          subValue="Net profitability across installations"
          icon={<Clock className="w-4 h-4 text-blue-600" />}
        />
      </div>

      {/* Filter and New Project Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search installation projects by code, customer, address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => (
              <option key={s.status} value={s.status}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Installation Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map(prj => {
          const marginPercent =
            prj.contractAmount > 0 ? Math.round((prj.grossMargin / prj.contractAmount) * 100) : 0;

          return (
            <div
              key={prj.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-emerald-800">
                      {prj.projectCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{prj.title}</h3>
                  </div>
                  <span
                    className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      prj.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800'
                        : prj.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-800'
                        : prj.status === 'scheduled'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {prj.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{prj.customerName}</span>
                    <span className="font-mono text-slate-400">· {prj.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{prj.siteAddress}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-700 text-[11px] font-medium">
                    ⚡ Capacity: {prj.capacityDescription}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contract Value</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatNaira(prj.contractAmount, false)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Costs</span>
                    <span className="font-mono font-bold text-slate-700">
                      {formatNaira(prj.totalProjectCost, false)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Project Margin</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatNaira(prj.grossMargin, false)} ({marginPercent}%)
                    </span>
                  </div>
                </div>

                {/* Materials Count */}
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    Materials Issued: <strong className="text-slate-800">{prj.materials.length} items</strong>
                  </span>
                  <span>Lead: {prj.leadTechnicianName}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedProject(prj);
                    setIssueWarehouse(settings.warehouses[0]);
                    setShowIssueModal(true);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  + Issue Materials
                </button>

                {prj.materials.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedProject(prj);
                      setReturnProductId(prj.materials[0]?.productId || '');
                      setShowReturnModal(true);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Return Unused Stock
                  </button>
                )}

                <button
                  onClick={() => {
                    const nextStatus: ProjectStatus =
                      prj.status === 'scheduled'
                        ? 'in_progress'
                        : prj.status === 'in_progress'
                        ? 'testing'
                        : prj.status === 'testing'
                        ? 'completed'
                        : prj.status;
                    if (nextStatus !== prj.status) {
                      saveProject({ id: prj.id, status: nextStatus });
                    }
                  }}
                  className="px-3 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Advance Status →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Issue Material to Project Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Inventory to Solar Installation"
        subtitle={`Project: ${selectedProject?.title} (${selectedProject?.projectCode})`}
        maxWidth="md"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          {issueError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
              {issueError}
            </div>
          )}

          <div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-900 text-xs rounded-xl">
            Issuing inventory will automatically deduct units from the warehouse and add the item's purchase cost to the project's expenses.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Product to Issue *
            </label>
            <select
              value={issueProductId}
              onChange={e => setIssueProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) · Available: {p.currentStock} {p.unit}s
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Issue *
            </label>
            <input
              type="number"
              min="1"
              value={issueQty}
              onChange={e => setIssueQty(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono font-bold border rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Warehouse *
            </label>
            <select
              value={issueWarehouse}
              onChange={e => setIssueWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
            >
              {settings.warehouses.map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Confirm Issue & Deduct Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Unused Material Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Return Unused Material to Inventory"
        subtitle={`Project: ${selectedProject?.projectCode}`}
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
              Select Material to Return *
            </label>
            <select
              value={returnProductId}
              onChange={e => setReturnProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
            >
              {selectedProject?.materials.map(m => (
                <option key={m.productId} value={m.productId}>
                  {m.productName} (Issued: {m.quantityIssued - m.quantityReturned})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Return *
            </label>
            <input
              type="number"
              min="1"
              value={returnQty}
              onChange={e => setReturnQty(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono font-bold border rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Return Into Warehouse *
            </label>
            <select
              value={returnWarehouse}
              onChange={e => setReturnWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
            >
              {settings.warehouses.map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Return to Warehouse & Adjust Project Cost
            </button>
          </div>
        </form>
      </Modal>

      {/* New Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Solar Installation Project"
        subtitle="Record site address, capacity sizing, contract amount, and technician team"
        maxWidth="lg"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const custId = form.get('customerId') as string;
            const cust = customers.find(c => c.id === custId);

            saveProject({
              title: form.get('title') as string,
              customerId: custId,
              customerName: cust?.name || (form.get('customerName') as string),
              customerPhone: cust?.phone || (form.get('customerPhone') as string),
              siteAddress: form.get('siteAddress') as string,
              capacityDescription: form.get('capacityDescription') as string,
              contractAmount: Number(form.get('contractAmount')) || 0,
              labourCost: Number(form.get('labourCost')) || 0,
              transportCost: Number(form.get('transportCost')) || 0,
              leadTechnicianName: form.get('leadTechnicianName') as string,
              status: 'scheduled',
              startDate: form.get('startDate') as string,
              technicalNotes: form.get('technicalNotes') as string,
            });
            setShowCreateModal(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Ring Road 10kVA Commercial Hybrid Solar Installation"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
              <select name="customerId" className="w-full px-2.5 py-1.5 text-xs border rounded-lg">
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Technician</label>
              <input
                type="text"
                name="leadTechnicianName"
                defaultValue={currentUser.name}
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site Address in Ibadan *</label>
            <input
              type="text"
              name="siteAddress"
              required
              placeholder="e.g. Behind Tiper Garage, Dalute Road / Oluyole Estate"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">System Capacity & Equipment</label>
            <input
              type="text"
              name="capacityDescription"
              required
              placeholder="e.g. 5kVA Felicity Hybrid + 10kWh LiFePO4 + 8x 550W Jinko Panels"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Amount (₦) *</label>
              <input
                type="number"
                name="contractAmount"
                required
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Cost (₦)</label>
              <input
                type="number"
                name="labourCost"
                defaultValue={150000}
                className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics (₦)</label>
              <input
                type="number"
                name="transportCost"
                defaultValue={35000}
                className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes</label>
            <textarea
              name="technicalNotes"
              rows={2}
              placeholder="Roof orientation, earthing resistance target, surge protector details..."
              className="w-full p-2 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              Schedule Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
