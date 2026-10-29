import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Award,
  DollarSign,
  Briefcase,
  ChevronRight,
  UserCheck,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerType, PricingTier, LeadStage } from '../../types';
import { formatNaira, formatLagosDateTime } from '../../utils/formatters';
import { Modal, StatCard } from '../common/CommonUI';

export const Customers: React.FC = () => {
  const { customers, currentUser, saveCustomer, globalSearchQuery } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'installers' | 'pipeline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const effectiveSearch = searchQuery || globalSearchQuery;

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        c.phone.includes(effectiveSearch) ||
        (c.email && c.email.toLowerCase().includes(effectiveSearch.toLowerCase())) ||
        c.address.toLowerCase().includes(effectiveSearch.toLowerCase());

      const matchesTier = tierFilter === 'all' || c.pricingTier === tierFilter;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      const matchesSubTab =
        activeSubTab !== 'installers' ||
        c.type === 'solar_installer' ||
        c.pricingTier === 'installer' ||
        c.pricingTier === 'dealer';

      return matchesSearch && matchesTier && matchesType && matchesSubTab;
    });
  }, [customers, effectiveSearch, tierFilter, typeFilter, activeSubTab]);

  // Aggregate Metrics
  const totalReceivables = useMemo(
    () => customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0),
    [customers]
  );

  const totalRegisteredInstallers = useMemo(
    () => customers.filter(c => c.type === 'solar_installer' || c.pricingTier === 'installer').length,
    [customers]
  );

  const activeBuyingInstallers = useMemo(
    () =>
      customers.filter(
        c => (c.type === 'solar_installer' || c.pricingTier === 'installer') && c.totalPurchases > 0
      ).length,
    [customers]
  );

  // Pipeline columns
  const pipelineStages: { stage: LeadStage; label: string }[] = [
    { stage: 'new_lead', label: 'New Lead' },
    { stage: 'contacted', label: 'Contacted' },
    { stage: 'qualified', label: 'Qualified' },
    { stage: 'site_survey', label: 'Site Survey' },
    { stage: 'quotation_sent', label: 'Quotation Sent' },
    { stage: 'negotiation', label: 'Negotiation' },
    { stage: 'won', label: 'Won / Customer' },
    { stage: 'lost', label: 'Lost' },
  ];

  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const contactPerson = form.get('contactPerson') as string;
    const phone = form.get('phone') as string;
    const email = form.get('email') as string;
    const address = form.get('address') as string;
    const type = form.get('type') as CustomerType;
    const pricingTier = form.get('pricingTier') as PricingTier;
    const leadStage = form.get('leadStage') as LeadStage;
    const notes = form.get('notes') as string;

    const installerDetails =
      type === 'solar_installer' || pricingTier === 'installer'
        ? {
            certifications: form.get('certifications') as string,
            territory: form.get('territory') as string,
            monthlyCapacityKw: Number(form.get('monthlyCapacityKw')) || 0,
          }
        : undefined;

    saveCustomer({
      ...(editingCustomer ? { id: editingCustomer.id } : {}),
      name,
      contactPerson,
      phone,
      email,
      address,
      type,
      pricingTier,
      leadStage,
      notes,
      installerDetails,
    });

    setShowCustomerModal(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Customer Receivables"
          value={formatNaira(totalReceivables)}
          subValue="Outstanding customer balances in Ibadan"
          icon={<DollarSign className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />
        <StatCard
          label="Registered Solar Installers"
          value={totalRegisteredInstallers}
          subValue={`${activeBuyingInstallers} active purchasing partners`}
          icon={<Award className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
        <StatCard
          label="Total Client Accounts"
          value={customers.length}
          subValue="Retail, residential, business & dealers"
          icon={<Users className="w-4 h-4 text-slate-600" />}
        />
      </div>

      {/* Sub-tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Accounts ({customers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('installers')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'installers'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Registered Installers ({totalRegisteredInstallers})
          </button>
          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'pipeline'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Sales CRM Pipeline
          </button>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowCustomerModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer / Installer</span>
        </button>
      </div>

      {/* Filter Strip */}
      {activeSubTab !== 'pipeline' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="retail">Retail</option>
              <option value="installer">Installer</option>
              <option value="wholesale">Wholesale</option>
              <option value="dealer">Dealer</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="retail">Retail</option>
              <option value="homeowner">Homeowner</option>
              <option value="business">Commercial Business</option>
              <option value="hospital">Hospital / Clinic</option>
              <option value="church">Church / Religious</option>
              <option value="school">School / Institution</option>
              <option value="solar_installer">Solar Installer</option>
              <option value="dealer">Dealer / Reseller</option>
            </select>
          </div>
        </div>
      )}

      {/* Table Views: All / Installers */}
      {activeSubTab !== 'pipeline' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold tracking-tight">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3">Contact Person & Phone</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Pricing Tier</th>
                  <th className="py-3 px-3">Location in Ibadan</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Receivable Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No customer records match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{cust.name}</div>
                        {cust.installerDetails?.territory && (
                          <div className="text-[11px] text-emerald-800 font-medium">
                            Territory: {cust.installerDetails.territory}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800">{cust.contactPerson || cust.name}</div>
                        <div className="text-[11px] font-mono text-slate-700">{cust.phone}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="capitalize text-slate-700 font-medium">
                          {cust.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            cust.pricingTier === 'installer'
                              ? 'bg-emerald-50 text-emerald-800'
                              : cust.pricingTier === 'dealer'
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cust.pricingTier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-xs">{cust.address}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        {formatNaira(cust.totalPurchases)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {cust.outstandingBalance > 0 ? (
                          <span className="text-rose-700 font-bold">
                            {formatNaira(cust.outstandingBalance)}
                          </span>
                        ) : (
                          <span className="text-slate-400">₦0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingCustomer(cust);
                            setShowCustomerModal(true);
                          }}
                          className="px-2 py-1 text-xs text-emerald-800 hover:text-emerald-950 font-semibold"
                        >
                          Edit Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRM Pipeline Kanban Board */}
      {activeSubTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {pipelineStages.map(stageObj => {
            const stageCustomers = customers.filter(c => (c.leadStage || 'new_lead') === stageObj.stage);
            return (
              <div key={stageObj.stage} className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex flex-col h-[550px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    {stageObj.label}
                  </h4>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full text-slate-700">
                    {stageCustomers.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {stageCustomers.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-center text-[11px] text-slate-400">
                      No leads in this stage
                    </div>
                  ) : (
                    stageCustomers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setEditingCustomer(c);
                          setShowCustomerModal(true);
                        }}
                        className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-600 shadow-xs cursor-pointer transition-all space-y-1.5 text-xs"
                      >
                        <div className="font-semibold text-slate-900 truncate">{c.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{c.phone}</span>
                          <span className="capitalize text-emerald-800 font-medium">{c.pricingTier}</span>
                        </div>
                        {c.notes && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded">
                            {c.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title={editingCustomer ? 'Edit Customer Profile' : 'Register Customer / Installer'}
        subtitle="Manage contact details, pricing tier, CRM pipeline and certifications"
        maxWidth="xl"
      >
        <form onSubmit={handleCustomerSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingCustomer?.name || ''}
                placeholder="e.g. Adekunle Solar Innovations"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                defaultValue={editingCustomer?.contactPerson || ''}
                placeholder="e.g. Engr. Adekunle"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                defaultValue={editingCustomer?.phone || ''}
                placeholder="080..."
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                defaultValue={editingCustomer?.email || ''}
                placeholder="contact@installer.com"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type *</label>
              <select
                name="type"
                defaultValue={editingCustomer?.type || 'retail'}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
              >
                <option value="retail">Retail Customer</option>
                <option value="solar_installer">Solar Installer</option>
                <option value="electrician">Electrician / Contractor</option>
                <option value="homeowner">Homeowner</option>
                <option value="business">Commercial Business</option>
                <option value="hospital">Hospital / Clinic</option>
                <option value="church">Church / Religious</option>
                <option value="school">School / Institution</option>
                <option value="dealer">Strategic Dealer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Tier *</label>
              <select
                name="pricingTier"
                defaultValue={editingCustomer?.pricingTier || 'retail'}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
              >
                <option value="retail">Retail Price</option>
                <option value="installer">Registered Installer</option>
                <option value="wholesale">Wholesale</option>
                <option value="dealer">Dealer / Distributor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CRM Stage *</label>
              <select
                name="leadStage"
                defaultValue={editingCustomer?.leadStage || 'new_lead'}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
              >
                {pipelineStages.map(p => (
                  <option key={p.stage} value={p.stage}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address / Site Location in Ibadan *
            </label>
            <input
              type="text"
              name="address"
              required
              defaultValue={editingCustomer?.address || ''}
              placeholder="e.g. Ring Road, Ibadan, Oyo State"
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          {/* Installer Specific Fields */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Installer & Partner Credentials (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Certifications</label>
                <input
                  type="text"
                  name="certifications"
                  defaultValue={editingCustomer?.installerDetails?.certifications || ''}
                  placeholder="e.g. NEMSA, COREN"
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Coverage Territory</label>
                <input
                  type="text"
                  name="territory"
                  defaultValue={editingCustomer?.installerDetails?.territory || ''}
                  placeholder="e.g. Bodija & Ibadan North"
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Monthly Capacity (kW)</label>
                <input
                  type="number"
                  name="monthlyCapacityKw"
                  defaultValue={editingCustomer?.installerDetails?.monthlyCapacityKw || 0}
                  placeholder="e.g. 20"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              CRM Notes & Project Interests
            </label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={editingCustomer?.notes || ''}
              placeholder="e.g. Requested survey for 10kVA solar setup..."
              className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCustomerModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
            >
              {editingCustomer ? 'Save Changes' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
