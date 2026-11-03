import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  Calendar,
  Plus,
  Edit3,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  AlertCircle,
  Trash2,
  Wallet,
} from 'lucide-react';
import { StaffKpi, KpiStatus, KpiPerformanceRating } from '../../types';
import { formatNaira } from '../../utils/formatters';

export const KpiDashboard: React.FC = () => {
  const {
    currentUser,
    staffAccounts,
    branches,
    staffKpis,
    saveStaffKpi,
    acceptStaffKpi,
    updateStaffKpiSelfReview,
    reviewStaffKpi,
    addKpiDailyLog,
    deleteStaffKpi,
    canAccessAllBranches,
  } = useApp();

  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState<boolean>(false);
  const [isSelfReviewModalOpen, setIsSelfReviewModalOpen] = useState<boolean>(false);
  const [isManagerReviewModalOpen, setIsManagerReviewModalOpen] = useState<boolean>(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState<boolean>(false);
  const [acceptanceNotes, setAcceptanceNotes] = useState<string>('');
  const [activeKpiForAction, setActiveKpiForAction] = useState<StaffKpi | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const isManagement = ['super_admin', 'admin', 'ceo', 'manager'].includes(currentUser.role) || currentUser.hasFullSystemAccess;

  // Find current user's KPI for selected period
  const myKpi = useMemo(() => {
    return staffKpis.find(k => k.staffId === currentUser.id && k.period === selectedMonth) ||
           staffKpis.find(k => k.staffId === currentUser.id) ||
           null;
  }, [staffKpis, currentUser, selectedMonth]);

  // Filtered KPIs for table / management
  const filteredKpis = useMemo(() => {
    return staffKpis.filter(kpi => {
      if (!canAccessAllBranches && currentUser.branchId && kpi.branchId !== currentUser.branchId) {
        return false;
      }
      if (selectedMonth && kpi.period !== selectedMonth) {
        return false;
      }
      if (selectedBranch !== 'all' && kpi.branchId !== selectedBranch) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          kpi.staffName.toLowerCase().includes(q) ||
          kpi.staffRole.toLowerCase().includes(q) ||
          (kpi.branchName && kpi.branchName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [staffKpis, canAccessAllBranches, currentUser, selectedMonth, selectedBranch, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalAssigned = filteredKpis.reduce((acc, k) => acc + (k.monthlySalesTarget || 0), 0);
    const totalAchieved = filteredKpis.reduce((acc, k) => acc + (k.actualSalesAchieved || 0), 0);
    const totalQuotesConverted = filteredKpis.reduce((acc, k) => acc + (k.quotationsConverted || 0), 0);
    const totalInstallations = filteredKpis.reduce((acc, k) => acc + (k.installationsCompleted || 0), 0);
    const avgAttainment = totalAssigned > 0 ? Math.round((totalAchieved / totalAssigned) * 100) : 0;

    return {
      totalAssigned,
      totalAchieved,
      totalQuotesConverted,
      totalInstallations,
      avgAttainment,
    };
  }, [filteredKpis]);

  // Export CSV
  const exportToCsv = () => {
    const headers = [
      'Staff Name',
      'Role',
      'Branch',
      'Period',
      'Monthly Sales Target (NGN)',
      'Achieved Sales (NGN)',
      'Attainment (%)',
      'Quotes Created',
      'Quotes Converted',
      'Installations',
      'Rating',
      'Status',
    ];

    const rows = filteredKpis.map(k => [
      `"${k.staffName}"`,
      `"${k.staffRole}"`,
      `"${k.branchName || ''}"`,
      `"${k.period}"`,
      k.monthlySalesTarget,
      k.actualSalesAchieved,
      k.monthlySalesTarget > 0 ? Math.round((k.actualSalesAchieved / k.monthlySalesTarget) * 100) : 0,
      k.quotationsCreated || 0,
      k.quotationsConverted || 0,
      k.installationsCompleted || 0,
      `"${k.performanceRating || 'Pending'}"`,
      `"${k.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `offnot_staff_kpi_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', `Exported ${filteredKpis.length} staff KPI records to CSV.`);
  };

  // Form states for Assign Target Modal
  const [assignForm, setAssignForm] = useState({
    staffId: '',
    period: currentMonthStr,
    monthlySalesTarget: 2500000,
    grossProfitTarget: 500000,
    quotationsTarget: 10,
    installationsTarget: 4,
    notes: '',
  });

  // Form states for Daily Log Modal
  const [logForm, setLogForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    activitiesCompleted: '',
    revenueGenerated: 0,
    itemsHandled: 1,
    challengesOrBlockers: '',
  });

  // Form states for Self-Review Modal
  const [selfReviewForm, setSelfReviewForm] = useState({
    actualSalesAchieved: 0,
    quotationsCreated: 0,
    quotationsConverted: 0,
    installationsCompleted: 0,
    selfAssessmentNotes: '',
  });

  // Form states for Manager Review Modal
  const [managerReviewForm, setManagerReviewForm] = useState<{
    managerReviewNotes: string;
    performanceRating: KpiPerformanceRating;
    status: KpiStatus;
  }>({
    managerReviewNotes: '',
    performanceRating: 'C - Meets Expectations',
    status: 'completed',
  });

  // Handlers
  const handleOpenAssignModal = (existing?: StaffKpi) => {
    if (existing) {
      setActiveKpiForAction(existing);
      setAssignForm({
        staffId: existing.staffId,
        period: existing.period,
        monthlySalesTarget: existing.monthlySalesTarget,
        grossProfitTarget: existing.grossProfitTarget || 0,
        quotationsTarget: existing.quotationsTarget || 10,
        installationsTarget: existing.installationsTarget || 4,
        notes: existing.managerReviewNotes || '',
      });
    } else {
      setActiveKpiForAction(null);
      setAssignForm({
        staffId: staffAccounts[0]?.id || '',
        period: selectedMonth,
        monthlySalesTarget: 2500000,
        grossProfitTarget: 500000,
        quotationsTarget: 10,
        installationsTarget: 4,
        notes: '',
      });
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.staffId) {
      showFeedback('error', 'Please select a staff member.');
      return;
    }

    const res = saveStaffKpi({
      id: activeKpiForAction?.id,
      staffId: assignForm.staffId,
      period: assignForm.period,
      monthlySalesTarget: Number(assignForm.monthlySalesTarget),
      grossProfitTarget: Number(assignForm.grossProfitTarget),
      quotationsTarget: Number(assignForm.quotationsTarget),
      installationsTarget: Number(assignForm.installationsTarget),
      managerReviewNotes: assignForm.notes,
    });

    if (res.success) {
      showFeedback('success', activeKpiForAction ? 'KPI target updated successfully!' : 'Monthly KPI target assigned successfully!');
      setIsAssignModalOpen(false);
    } else {
      showFeedback('error', res.error || 'Failed to assign KPI');
    }
  };

  const handleOpenDailyLog = (kpi: StaffKpi) => {
    setActiveKpiForAction(kpi);
    setLogForm({
      logDate: new Date().toISOString().slice(0, 10),
      activitiesCompleted: '',
      revenueGenerated: 0,
      itemsHandled: 1,
      challengesOrBlockers: '',
    });
    setIsDailyLogModalOpen(true);
  };

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKpiForAction) return;
    if (!logForm.activitiesCompleted.trim()) {
      showFeedback('error', 'Please enter a summary of the activity completed today.');
      return;
    }

    const res = addKpiDailyLog(activeKpiForAction.id, {
      logDate: logForm.logDate,
      activitiesCompleted: logForm.activitiesCompleted.trim(),
      revenueGenerated: Number(logForm.revenueGenerated) || 0,
      itemsHandled: Number(logForm.itemsHandled) || 0,
      challengesOrBlockers: logForm.challengesOrBlockers.trim(),
    });

    if (res.success) {
      showFeedback('success', 'Daily activity logged and added to monthly progress!');
      setIsDailyLogModalOpen(false);
    } else {
      showFeedback('error', res.error || 'Failed to record daily log');
    }
  };

  const handleOpenSelfReview = (kpi: StaffKpi) => {
    setActiveKpiForAction(kpi);
    setSelfReviewForm({
      actualSalesAchieved: kpi.actualSalesAchieved || 0,
      quotationsCreated: kpi.quotationsCreated || 0,
      quotationsConverted: kpi.quotationsConverted || 0,
      installationsCompleted: kpi.installationsCompleted || 0,
      selfAssessmentNotes: kpi.selfAssessmentNotes || '',
    });
    setIsSelfReviewModalOpen(true);
  };

  const handleSaveSelfReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKpiForAction) return;

    const res = updateStaffKpiSelfReview(activeKpiForAction.id, {
      selfAssessmentNotes: selfReviewForm.selfAssessmentNotes.trim(),
      actualSalesAchieved: Number(selfReviewForm.actualSalesAchieved),
      quotationsCreated: Number(selfReviewForm.quotationsCreated),
      quotationsConverted: Number(selfReviewForm.quotationsConverted),
      installationsCompleted: Number(selfReviewForm.installationsCompleted),
    });

    if (res.success) {
      showFeedback('success', 'Self-assessment and KPI progress saved!');
      setIsSelfReviewModalOpen(false);
    } else {
      showFeedback('error', res.error || 'Failed to save self review');
    }
  };

  const handleOpenManagerReview = (kpi: StaffKpi) => {
    setActiveKpiForAction(kpi);
    setManagerReviewForm({
      managerReviewNotes: kpi.managerReviewNotes || '',
      performanceRating: kpi.performanceRating || 'C - Meets Expectations',
      status: 'completed',
    });
    setIsManagerReviewModalOpen(true);
  };

  const handleSaveManagerReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKpiForAction) return;

    const res = reviewStaffKpi(activeKpiForAction.id, {
      managerReviewNotes: managerReviewForm.managerReviewNotes.trim(),
      performanceRating: managerReviewForm.performanceRating,
      status: managerReviewForm.status,
    });

    if (res.success) {
      showFeedback('success', `KPI review submitted with rating ${managerReviewForm.performanceRating}!`);
      setIsManagerReviewModalOpen(false);
    } else {
      showFeedback('error', res.error || 'Failed to submit review');
    }
  };

  const handleOpenAcceptModal = (kpi: StaffKpi) => {
    setActiveKpiForAction(kpi);
    setAcceptanceNotes('');
    setIsAcceptModalOpen(true);
  };

  const handleConfirmAcceptKpi = () => {
    if (!activeKpiForAction) return;
    const res = acceptStaffKpi(activeKpiForAction.id, acceptanceNotes.trim());
    if (res.success) {
      showFeedback('success', `KPI target for ${activeKpiForAction.period} accepted! Target is now active.`);
      setIsAcceptModalOpen(false);
    } else {
      showFeedback('error', res.error || 'Failed to accept KPI');
    }
  };

  const getRatingBadge = (rating?: KpiPerformanceRating, status?: KpiStatus) => {
    if (status === 'pending_acceptance') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Awaiting Staff Acceptance</span>
        </span>
      );
    }
    switch (rating) {
      case 'A - Outstanding':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Grade A - Outstanding</span>;
      case 'B - Exceeds Expectations':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Grade B - Exceeds Expectations</span>;
      case 'C - Meets Expectations':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Grade C - Meets Expectations</span>;
      case 'D - Needs Improvement':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Grade D - Needs Improvement</span>;
      default:
        if (status === 'active') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>In Progress (Active)</span>
            </span>
          );
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Target Active</span>;
    }
  };

  const getStatusBadge = (status: KpiStatus) => {
    switch (status) {
      case 'pending_acceptance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Pending Acceptance</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Active Target</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Under Review
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Completed
          </span>
        );
      case 'exceeded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
            Exceeded Target
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Target className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Staff KPIs & Performance Hub
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live quota tracking, sales target attainment, conversion ratios, and daily work logs across Ibadan branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Log My Daily Activity */}
            {myKpi && (
              <button
                onClick={() => handleOpenDailyLog(myKpi)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Today's Activity</span>
              </button>
            )}

            {/* Assign Target (Managers / SuperAdmin) */}
            {isManagement && (
              <button
                onClick={() => handleOpenAssignModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                <Target className="w-4 h-4" />
                <span>Assign KPI Target</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {canAccessAllBranches && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Ibadan Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isHeadquarters ? '(HQ)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by name, role or depot..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* PENDING ACCEPTANCE NOTIFICATION BANNER (When Target is Assigned by Superadmin) */}
      {myKpi && myKpi.status === 'pending_acceptance' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-emerald-600/15 border-2 border-amber-400 dark:border-amber-500 rounded-2xl p-5 sm:p-6 shadow-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 rounded-2xl shrink-0 shadow-xs border border-amber-300 dark:border-amber-700">
                <Clock className="w-6 h-6 animate-pulse text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Action Required
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Period: {myKpi.period}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  New Monthly KPI Target Assigned to You
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Superadmin Francis Gabriel has assigned your targets: Sales Target of <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNaira(myKpi.monthlySalesTarget)}</span>, Gross Profit of <span className="font-semibold text-slate-800 dark:text-slate-200">{formatNaira(myKpi.grossProfitTarget || 0)}</span>, and {myKpi.quotationsTarget} customer quotations. Review and click accept to activate your performance tracking.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 sm:self-center">
              <button
                onClick={() => handleOpenAcceptModal(myKpi)}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept KPI Target</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY PERSONAL KPI CARD (Shown prominently for all staff) */}
      {myKpi ? (
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
            <Target className="w-64 h-64 text-emerald-400" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold uppercase tracking-wider">
                  My Assigned KPI ({selectedMonth})
                </span>
                {getRatingBadge(myKpi.performanceRating, myKpi.status)}
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">
                {myKpi.staffName}
              </h2>
              <p className="text-emerald-200/80 text-sm mt-0.5">
                Role: <span className="text-white capitalize">{myKpi.staffRole.replace(/_/g, ' ')}</span> &bull; Branch: <span className="text-white">{myKpi.branchName || 'HQ'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {myKpi.status === 'pending_acceptance' ? (
                <button
                  onClick={() => handleOpenAcceptModal(myKpi)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Target</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenDailyLog(myKpi)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Daily Activity</span>
                </button>
              )}
              <button
                onClick={() => handleOpenSelfReview(myKpi)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium rounded-xl text-sm transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Self-Assessment</span>
              </button>
            </div>
          </div>

          {/* Progress Bars & Targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 relative z-10">
            {/* Sales Attainment */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>Monthly Sales Target</span>
                <span className="font-semibold text-white">
                  {myKpi.monthlySalesTarget > 0 ? Math.round((myKpi.actualSalesAchieved / myKpi.monthlySalesTarget) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-white">
                {formatNaira(myKpi.actualSalesAchieved)}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target: {formatNaira(myKpi.monthlySalesTarget)}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, myKpi.monthlySalesTarget > 0 ? (myKpi.actualSalesAchieved / myKpi.monthlySalesTarget) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quotations Conversion */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>Quotations Converted</span>
                <span className="font-semibold text-white">
                  {myKpi.quotationsCreated > 0 ? Math.round((myKpi.quotationsConverted / myKpi.quotationsCreated) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-white">
                {myKpi.quotationsConverted} / {myKpi.quotationsCreated}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official quotes converted to closed orders
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, myKpi.quotationsCreated > 0 ? (myKpi.quotationsConverted / myKpi.quotationsCreated) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Installations Completed */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>Installations Delivered</span>
                <span className="font-semibold text-white">Projects</span>
              </div>
              <div className="mt-2 text-xl font-bold text-white">
                {myKpi.installationsCompleted} Done
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Solar & battery commissioned systems
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-amber-400 h-2 rounded-full w-full opacity-80" />
              </div>
            </div>

            {/* Stock Audit / Rating */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>Audit Accuracy</span>
                <span className="font-semibold text-white">{myKpi.stockAuditAccuracyPercent || 100}%</span>
              </div>
              <div className="mt-2 text-xl font-bold text-white">
                {myKpi.customerSatisfactionScore || 5.0} / 5.0
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Client CSAT & Physical stock variance score
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-purple-400 h-2 rounded-full w-full opacity-80" />
              </div>
            </div>
          </div>

          {/* Self-Assessment Note / Manager Feedback preview */}
          {(myKpi.selfAssessmentNotes || myKpi.managerReviewNotes) && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-200">
              {myKpi.selfAssessmentNotes && (
                <div className="bg-white/5 p-3 rounded-lg">
                  <span className="font-semibold text-emerald-300 block mb-1">My Self-Assessment:</span>
                  <p className="italic text-slate-300">"{myKpi.selfAssessmentNotes}"</p>
                </div>
              )}
              {myKpi.managerReviewNotes && (
                <div className="bg-white/5 p-3 rounded-lg">
                  <span className="font-semibold text-blue-300 block mb-1">Manager/Director Feedback:</span>
                  <p className="italic text-slate-300">"{myKpi.managerReviewNotes}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center">
          <Target className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No KPI target recorded for your profile for {selectedMonth}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Superadmin Francis Gabriel or your store manager can assign monthly sales and activity targets, or you can record your self-assessment.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                const res = saveStaffKpi({
                  staffId: currentUser.id,
                  staffName: currentUser.name,
                  staffRole: currentUser.role,
                  branchId: currentUser.branchId || 'br_tipper_hq',
                  branchName: currentUser.branchName || 'HQ Store',
                  period: selectedMonth,
                  monthlySalesTarget: 2500000,
                  actualSalesAchieved: 0,
                  status: 'active',
                });
                if (res.success) {
                  showFeedback('success', `Initialized your KPI for ${selectedMonth}!`);
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Initialize My {selectedMonth} KPI
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards across all staff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Target (₦)
            </span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {formatNaira(summaryMetrics.totalAssigned)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assigned across {filteredKpis.length} staff records
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Sales Achieved
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatNaira(summaryMetrics.totalAchieved)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {summaryMetrics.avgAttainment}% average target attainment
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quotes Converted
            </span>
            <span className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {summaryMetrics.totalQuotesConverted} Quotes
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Converted to confirmed orders & revenue
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Installations Done
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {summaryMetrics.totalInstallations} Sites
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Completed technical energy deployments
          </div>
        </div>
      </div>

      {/* Staff Roster KPI Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Staff KPI & Performance Register ({selectedMonth})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and update monthly quotas, achievements, self-assessments, and supervisor ratings.
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
            Showing {filteredKpis.length} staff records
          </span>
        </div>

        {/* Desktop Data Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Role & Branch</th>
                <th className="py-3 px-4 font-semibold">Monthly Target (₦)</th>
                <th className="py-3 px-4 font-semibold">Achieved (₦)</th>
                <th className="py-3 px-4 font-semibold">Attainment</th>
                <th className="py-3 px-4 font-semibold">Quotes</th>
                <th className="py-3 px-4 font-semibold">Rating Grade</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredKpis.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">
                      No KPI targets assigned for {selectedMonth} yet.
                    </p>
                    {isManagement && (
                      <button
                        onClick={() => handleOpenAssignModal()}
                        className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        + Assign target to staff now
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredKpis.map(kpi => {
                  const attainmentPct = kpi.monthlySalesTarget > 0 ? Math.round((kpi.actualSalesAchieved / kpi.monthlySalesTarget) * 100) : 0;
                  const isMyRecord = kpi.staffId === currentUser.id;

                  return (
                    <tr
                      key={kpi.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {kpi.staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold block">{kpi.staffName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        <span className="font-medium capitalize text-slate-800 dark:text-slate-200 block">
                          {kpi.staffRole.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-400">{kpi.branchName || 'HQ Store'}</span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {formatNaira(kpi.monthlySalesTarget)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNaira(kpi.actualSalesAchieved)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            attainmentPct >= 100
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : attainmentPct >= 70
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {attainmentPct}%
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                attainmentPct >= 100 ? 'bg-emerald-500' : attainmentPct >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, attainmentPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {kpi.quotationsConverted} / {kpi.quotationsCreated}
                      </td>

                      <td className="py-3.5 px-4">
                        {getRatingBadge(kpi.performanceRating, kpi.status)}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(kpi.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Staff Accept Target button */}
                          {kpi.status === 'pending_acceptance' && (isMyRecord || isManagement) && (
                            <button
                              onClick={() => handleOpenAcceptModal(kpi)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-2xs"
                              title="Review & Accept KPI Target"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                          )}

                          {/* Log daily for this staff */}
                          <button
                            onClick={() => handleOpenDailyLog(kpi)}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                            title="Log Daily Activity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {/* Self Review or Edit */}
                          {(isMyRecord || isManagement) && (
                            <button
                              onClick={() => handleOpenSelfReview(kpi)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                              title="Update Self Assessment & Actuals"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Manager Review */}
                          {isManagement && (
                            <button
                              onClick={() => handleOpenManagerReview(kpi)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                              title="Review & Score Rating"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete KPI (Superadmin only) */}
                          {currentUser.role === 'super_admin' && (
                            <button
                              onClick={() => {
                                deleteStaffKpi(kpi.id);
                                showFeedback('success', 'KPI target removed.');
                              }}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                              title="Delete KPI"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Mobile Card View (block md:hidden) - Fully responsive touch-friendly cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredKpis.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">
                No KPI targets assigned for {selectedMonth} yet.
              </p>
              {isManagement && (
                <button
                  onClick={() => handleOpenAssignModal()}
                  className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"
                >
                  + Assign target to staff now
                </button>
              )}
            </div>
          ) : (
            filteredKpis.map(kpi => {
              const attainmentPct = kpi.monthlySalesTarget > 0 ? Math.round((kpi.actualSalesAchieved / kpi.monthlySalesTarget) * 100) : 0;
              const isMyRecord = kpi.staffId === currentUser.id;

              return (
                <div key={`mob_${kpi.id}`} className="p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {kpi.staffName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {kpi.staffName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                          {kpi.staffRole.replace(/_/g, ' ')} &bull; {kpi.branchName || 'HQ Store'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(kpi.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Performance Rating:</span>
                    {getRatingBadge(kpi.performanceRating, kpi.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Monthly Target</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatNaira(kpi.monthlySalesTarget)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Achieved Sales</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatNaira(kpi.actualSalesAchieved)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Quotations</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {kpi.quotationsConverted} / {kpi.quotationsCreated} converted
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Attainment</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {attainmentPct}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${attainmentPct >= 100 ? 'bg-emerald-500' : attainmentPct >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, attainmentPct)}%` }}
                    />
                  </div>

                  {/* Mobile action button group */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {kpi.status === 'pending_acceptance' && (isMyRecord || isManagement) && (
                      <button
                        onClick={() => handleOpenAcceptModal(kpi)}
                        className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept Target</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenDailyLog(kpi)}
                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-xl flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Activity</span>
                    </button>
                    {(isMyRecord || isManagement) && (
                      <button
                        onClick={() => handleOpenSelfReview(kpi)}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    )}
                    {isManagement && (
                      <button
                        onClick={() => handleOpenManagerReview(kpi)}
                        className="py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-xs rounded-xl flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Score</span>
                      </button>
                    )}
                    {currentUser.role === 'super_admin' && (
                      <button
                        onClick={() => {
                          deleteStaffKpi(kpi.id);
                          showFeedback('success', 'KPI target removed.');
                        }}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl ml-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Daily Work Logs Timeline (Recent activities) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Staff Daily Activity Submissions
            </h3>
          </div>
          <span className="text-xs text-slate-400">Last updated in real-time</span>
        </div>

        {filteredKpis.flatMap(k => (k.dailyLogs || []).map(l => ({ ...l, staffName: k.staffName, branchName: k.branchName }))).length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No daily activity logs recorded for this period yet. Click "Log Today's Activity" above to post your first entry.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredKpis
              .flatMap(k => (k.dailyLogs || []).map(l => ({ ...l, staffName: k.staffName, branchName: k.branchName })))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
              .map(log => (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {log.staffName}
                      </span>
                      {log.branchName && <span className="text-xs text-slate-400">({log.branchName})</span>}
                      <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5 rounded">
                        {log.logDate}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                      {log.activitiesCompleted}
                    </p>
                    {log.challengesOrBlockers && (
                      <p className="text-amber-600 dark:text-amber-400 text-xs italic mt-0.5">
                        Note/Challenge: {log.challengesOrBlockers}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    {log.revenueGenerated > 0 && (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatNaira(log.revenueGenerated)}
                      </span>
                    )}
                    {log.itemsHandled > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {log.itemsHandled} Items Handled
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Assign KPI Target */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {activeKpiForAction ? 'Edit Staff KPI Target' : 'Assign New Monthly KPI Target'}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Staff Member
                </label>
                <select
                  disabled={Boolean(activeKpiForAction)}
                  value={assignForm.staffId}
                  onChange={e => setAssignForm({ ...assignForm, staffId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose employee --</option>
                  {staffAccounts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role.replace(/_/g, ' ')}) &bull; {s.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Month Period (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={assignForm.period}
                    onChange={e => setAssignForm({ ...assignForm, period: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Sales Target (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={assignForm.monthlySalesTarget}
                    onChange={e => setAssignForm({ ...assignForm, monthlySalesTarget: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Gross Profit (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={assignForm.grossProfitTarget}
                    onChange={e => setAssignForm({ ...assignForm, grossProfitTarget: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Installations Done
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={assignForm.installationsTarget}
                    onChange={e => setAssignForm({ ...assignForm, installationsTarget: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Instructions or Expectations
                </label>
                <textarea
                  rows={2}
                  value={assignForm.notes}
                  onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="e.g. Focus on Tipper Garage commercial leads and 5kVA inverter bundles."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Daily Activity */}
      {isDailyLogModalOpen && activeKpiForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Log Daily Activity for {activeKpiForAction.staffName}
                </h3>
              </div>
              <button
                onClick={() => setIsDailyLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDailyLog} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Date
                </label>
                <input
                  type="date"
                  value={logForm.logDate}
                  onChange={e => setLogForm({ ...logForm, logDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Summary of Activities Completed Today *
                </label>
                <textarea
                  required
                  rows={3}
                  value={logForm.activitiesCompleted}
                  onChange={e => setLogForm({ ...logForm, activitiesCompleted: e.target.value })}
                  placeholder="e.g. Visited 3 clients in Bodija, delivered 1x Felicity 10kWh battery to depot, closed walk-in sale."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sales Revenue Generated (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={logForm.revenueGenerated}
                    onChange={e => setLogForm({ ...logForm, revenueGenerated: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Items / Units Handled
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={logForm.itemsHandled}
                    onChange={e => setLogForm({ ...logForm, itemsHandled: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bottlenecks / Field Challenges (Optional)
                </label>
                <input
                  type="text"
                  value={logForm.challengesOrBlockers}
                  onChange={e => setLogForm({ ...logForm, challengesOrBlockers: e.target.value })}
                  placeholder="e.g. Client requested 2-day delivery confirmation for tubular battery rack."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDailyLogModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Self-Assessment */}
      {isSelfReviewModalOpen && activeKpiForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Self-Assessment & Progress: {activeKpiForAction.staffName}
                </h3>
              </div>
              <button
                onClick={() => setIsSelfReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSelfReview} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Sales Achieved (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={selfReviewForm.actualSalesAchieved}
                    onChange={e => setSelfReviewForm({ ...selfReviewForm, actualSalesAchieved: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quotes Converted
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={selfReviewForm.quotationsConverted}
                    onChange={e => setSelfReviewForm({ ...selfReviewForm, quotationsConverted: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Self-Assessment Notes & Highlights
                </label>
                <textarea
                  rows={4}
                  value={selfReviewForm.selfAssessmentNotes}
                  onChange={e => setSelfReviewForm({ ...selfReviewForm, selfAssessmentNotes: e.target.value })}
                  placeholder="Summarize your monthly progress, major contracts won, and areas for improvement..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSelfReviewModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Submit Self-Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Manager Performance Review */}
      {isManagerReviewModalOpen && activeKpiForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Score Performance: {activeKpiForAction.staffName}
                </h3>
              </div>
              <button
                onClick={() => setIsManagerReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManagerReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Performance Rating
                </label>
                <select
                  value={managerReviewForm.performanceRating}
                  onChange={e => setManagerReviewForm({
                    ...managerReviewForm,
                    performanceRating: e.target.value as KpiPerformanceRating,
                  })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="A - Outstanding">Grade A - Outstanding (Exceeded Target & Exemplary Conduct)</option>
                  <option value="B - Exceeds Expectations">Grade B - Exceeds Expectations</option>
                  <option value="C - Meets Expectations">Grade C - Meets Expectations (Satisfactory)</option>
                  <option value="D - Needs Improvement">Grade D - Needs Improvement (Below Target)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Review Feedback & Recommendations
                </label>
                <textarea
                  required
                  rows={4}
                  value={managerReviewForm.managerReviewNotes}
                  onChange={e => setManagerReviewForm({ ...managerReviewForm, managerReviewNotes: e.target.value })}
                  placeholder="State strengths observed, areas of commendation, or corrective actions..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManagerReviewModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Confirm & Finalize Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Accept KPI Performance Target */}
      {isAcceptModalOpen && activeKpiForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Accept KPI Performance Target
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Period: {activeKpiForAction.period} &bull; {activeKpiForAction.staffName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAcceptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Target Breakdown Assigned:</p>
                <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Monthly Sales Target:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatNaira(activeKpiForAction.monthlySalesTarget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gross Profit Target:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatNaira(activeKpiForAction.grossProfitTarget || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Quotations Target:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {activeKpiForAction.quotationsTarget} Quotes
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Installations Target:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {activeKpiForAction.installationsTarget} Installations
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Acceptance / Acknowledgment Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={acceptanceNotes}
                  onChange={e => setAcceptanceNotes(e.target.value)}
                  placeholder="e.g. Target reviewed and accepted. Ready to execute monthly solar goals."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAcceptKpi}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Accept Target</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
