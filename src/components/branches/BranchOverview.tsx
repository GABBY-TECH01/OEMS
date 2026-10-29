/**
 * Branch Overview Dashboard Component
 * Visualizes comparative sales, revenue, and inventory performance across all registered branches using D3.js.
 * Location: Ibadan, Oyo State, Nigeria
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Building2,
  TrendingUp,
  Package,
  Layers,
  CircleDollarSign,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  MapPin,
  Users,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types';
import { formatNaira } from '../../utils/formatters';
import { BRAND_LOGO_URL } from '../../constants/branding';

type MetricMode = 'sales' | 'inventory_value' | 'stock_units' | 'expenses';

interface BranchStat {
  branch: Branch;
  salesTotal: number;
  salesCount: number;
  inventoryValue: number;
  stockUnits: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expensesTotal: number;
  netMargin: number;
  staffCount: number;
}

export const BranchOverview: React.FC = () => {
  const {
    branches,
    sales,
    allSales,
    products,
    allProducts,
    expenses,
    allExpenses,
    staffAccounts,
    activeBranchId,
    setActiveBranchId,
    setActiveTab,
  } = useApp();

  const comparisonSales = allSales || sales;
  const comparisonProducts = allProducts || products;
  const comparisonExpenses = allExpenses || expenses;

  const [metricMode, setMetricMode] = useState<MetricMode>('inventory_value');
  const [hoveredBranch, setHoveredBranch] = useState<BranchStat | null>(null);

  const barChartRef = useRef<SVGSVGElement | null>(null);
  const pieChartRef = useRef<SVGSVGElement | null>(null);

  // Compute aggregated stats for each branch
  const branchStats: BranchStat[] = useMemo(() => {
    return branches.map(b => {
      // Sales for this branch
      const branchSales = comparisonSales.filter(s => s.branchId === b.id || (!s.branchId && b.isHeadquarters));
      const salesTotal = branchSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
      const salesCount = branchSales.length;

      // Products / Inventory for this branch
      const branchProducts = comparisonProducts.filter(
        p => p.branchId === b.id || (!p.branchId && b.isHeadquarters)
      );
      const inventoryValue = branchProducts.reduce(
        (acc, p) => acc + (p.currentStock || 0) * (p.purchaseCost || 0),
        0
      );
      const stockUnits = branchProducts.reduce((acc, p) => acc + (p.currentStock || 0), 0);
      const inStockCount = branchProducts.filter(p => (p.currentStock || 0) > 0).length;
      const lowStockCount = branchProducts.filter(
        p => (p.currentStock || 0) <= (p.reorderLevel || 5) && (p.currentStock || 0) > 0
      ).length;
      const outOfStockCount = branchProducts.filter(p => (p.currentStock || 0) === 0).length;

      // Expenses for this branch
      const branchExpenses = expenses.filter(
        e => e.branchId === b.id || (!e.branchId && b.isHeadquarters)
      );
      const expensesTotal = branchExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      // Staff deployed to this branch
      const staffCount = staffAccounts.filter(
        s => s.branchId === b.id || (!s.branchId && b.isHeadquarters)
      ).length;

      return {
        branch: b,
        salesTotal,
        salesCount,
        inventoryValue,
        stockUnits,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        expensesTotal,
        netMargin: salesTotal - expensesTotal,
        staffCount,
      };
    });
  }, [branches, sales, products, expenses, staffAccounts]);

  // Overall totals across network
  const networkTotals = useMemo(() => {
    return {
      totalSales: branchStats.reduce((acc, s) => acc + s.salesTotal, 0),
      totalInventoryValue: branchStats.reduce((acc, s) => acc + s.inventoryValue, 0),
      totalStockUnits: branchStats.reduce((acc, s) => acc + s.stockUnits, 0),
      totalExpenses: branchStats.reduce((acc, s) => acc + s.expensesTotal, 0),
      totalStaff: branchStats.reduce((acc, s) => acc + s.staffCount, 0),
    };
  }, [branchStats]);

  // D3 Bar Chart Render Effect
  useEffect(() => {
    if (!barChartRef.current || branchStats.length === 0) return;

    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();

    const width = 680;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 95 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // SVG Defs: Gradients
    const defs = svg.append('defs');

    // Emerald gradient
    const emeraldGrad = defs
      .append('linearGradient')
      .attr('id', 'emerald-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    emeraldGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    emeraldGrad.append('stop').attr('offset', '100%').attr('stop-color', '#047857');

    // Amber gradient
    const amberGrad = defs
      .append('linearGradient')
      .attr('id', 'amber-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    amberGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
    amberGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d97706');

    // Blue gradient
    const blueGrad = defs
      .append('linearGradient')
      .attr('id', 'blue-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    blueGrad.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
    blueGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1d4ed8');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extract metric value accessor
    const getValue = (d: BranchStat) => {
      switch (metricMode) {
        case 'sales':
          return d.salesTotal;
        case 'inventory_value':
          return d.inventoryValue;
        case 'stock_units':
          return d.stockUnits;
        case 'expenses':
          return d.expensesTotal;
      }
    };

    const maxValue = d3.max(branchStats, getValue) || 0;
    // Provide a reasonable upper domain when all numbers are 0 (clean zero ledger)
    const yDomainMax = maxValue > 0 ? maxValue * 1.15 : 100000;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(branchStats.map(d => d.branch.name))
      .range([0, innerWidth])
      .padding(0.35);

    const yScale = d3.scaleLinear().domain([0, yDomainMax]).range([innerHeight, 0]);

    // Gridlines (horizontal)
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.8);

    g.select('.domain').remove();

    // Bottom X-Axis
    const xAxis = d3.axisBottom(xScale);
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', '#cbd5e1');
    xAxisG
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('dy', '1.1em')
      .text((d: any) => {
        const str = String(d);
        return str.length > 20 ? str.slice(0, 18) + '...' : str;
      });

    // Left Y-Axis with Naira formatting
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d: any) => {
      const val = Number(d);
      if (metricMode === 'stock_units') {
        return `${val.toLocaleString()} units`;
      }
      if (val >= 1000000) {
        return `₦${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `₦${(val / 1000).toFixed(0)}k`;
      }
      return `₦${val}`;
    });

    const yAxisG = g.append('g').call(yAxis);
    yAxisG.select('.domain').attr('stroke', '#cbd5e1');
    yAxisG.selectAll('text').attr('fill', '#64748b').attr('font-size', '10px').attr('font-family', 'monospace');

    // Bar Color based on metric
    const getBarFill = () => {
      switch (metricMode) {
        case 'sales':
          return 'url(#emerald-bar-gradient)';
        case 'inventory_value':
          return 'url(#emerald-bar-gradient)';
        case 'expenses':
          return 'url(#amber-bar-gradient)';
        case 'stock_units':
          return 'url(#blue-bar-gradient)';
      }
    };

    // Render Bars
    g.selectAll('.bar')
      .data(branchStats)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.branch.name) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => {
        const val = getValue(d);
        // Minimum visual height when 0 so users see interactive anchor bar
        return val > 0 ? yScale(val) : innerHeight - 4;
      })
      .attr('height', d => {
        const val = getValue(d);
        return val > 0 ? innerHeight - yScale(val) : 4;
      })
      .attr('rx', 6)
      .attr('fill', getBarFill())
      .attr('cursor', 'pointer')
      .attr('opacity', d => (activeBranchId === d.branch.id || activeBranchId === 'all' ? 1 : 0.45))
      .on('mouseenter', (event: React.MouseEvent<SVGRectElement> | MouseEvent, d) => {
        setHoveredBranch(d);
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(150)
          .attr('opacity', 0.8)
          .attr('stroke', '#065f46')
          .attr('stroke-width', 2);
      })
      .on('mouseleave', (event: React.MouseEvent<SVGRectElement> | MouseEvent, d) => {
        setHoveredBranch(null);
        d3.select(event.currentTarget as SVGRectElement)
          .transition()
          .duration(150)
          .attr('opacity', activeBranchId === d.branch.id || activeBranchId === 'all' ? 1 : 0.45)
          .attr('stroke', 'none');
      })
      .on('click', (_, d) => {
        setActiveBranchId(d.branch.id);
      });

    // Value Labels on Top of Bars
    g.selectAll('.value-label')
      .data(branchStats)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => (xScale(d.branch.name) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => {
        const val = getValue(d);
        return val > 0 ? yScale(val) - 8 : innerHeight - 10;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', '#1e293b')
      .text(d => {
        const val = getValue(d);
        if (metricMode === 'stock_units') return `${val} units`;
        return formatNaira(val);
      });
  }, [branchStats, metricMode, activeBranchId]);

  // D3 Donut Chart Render Effect
  useEffect(() => {
    if (!pieChartRef.current || branchStats.length === 0) return;

    const svg = d3.select(pieChartRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 280;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Prepare pie data based on metric
    const getValue = (d: BranchStat) => {
      switch (metricMode) {
        case 'sales':
          return d.salesTotal;
        case 'inventory_value':
          return d.inventoryValue;
        case 'stock_units':
          return d.stockUnits;
        case 'expenses':
          return d.expensesTotal;
      }
    };

    const hasData = branchStats.some(d => getValue(d) > 0);
    // If all zero, display equal representation placeholder segments
    const pieData = branchStats.map(d => ({
      ...d,
      chartValue: hasData ? getValue(d) : 1,
    }));

    const color = d3
      .scaleOrdinal<string>()
      .domain(branchStats.map(d => d.branch.id))
      .range(['#047857', '#0284c7', '#d97706', '#7c3aed', '#059669']);

    const pie = d3
      .pie<any>()
      .value(d => d.chartValue)
      .sort(null);

    const arc = d3
      .arc<any>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<any>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius + 6)
      .cornerRadius(4);

    const arcs = g
      .selectAll('.arc')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.branch.id))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event: React.MouseEvent<SVGPathElement> | MouseEvent, d) => {
        setHoveredBranch(d.data);
        d3.select(event.currentTarget as SVGPathElement)
          .transition()
          .duration(150)
          .attr('d', arcHover);
      })
      .on('mouseleave', (event: React.MouseEvent<SVGPathElement> | MouseEvent) => {
        setHoveredBranch(null);
        d3.select(event.currentTarget as SVGPathElement)
          .transition()
          .duration(150)
          .attr('d', arc);
      })
      .on('click', (_, d) => {
        setActiveBranchId(d.data.branch.id);
      });

    // Center Label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .attr('text-transform', 'uppercase')
      .text('Network Total');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('font-size', '13px')
      .attr('font-weight', '800')
      .attr('font-family', 'monospace')
      .attr('fill', '#0f172a')
      .text(() => {
        switch (metricMode) {
          case 'sales':
            return formatNaira(networkTotals.totalSales);
          case 'inventory_value':
            return formatNaira(networkTotals.totalInventoryValue);
          case 'stock_units':
            return `${networkTotals.totalStockUnits.toLocaleString()} units`;
          case 'expenses':
            return formatNaira(networkTotals.totalExpenses);
        }
      });
  }, [branchStats, metricMode, networkTotals]);

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-lg shrink-0 flex items-center justify-center border border-emerald-500/30">
            <img
              src={BRAND_LOGO_URL}
              alt="Offnot Energy"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Branch D3 Performance Intelligence</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Branch Performance Overview</h2>
            <p className="text-xs md:text-sm text-emerald-100/80 mt-0.5">
              D3-powered comparative visualization across Ibadan registered hubs, stock depots, and retail outlets.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveBranchId('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
              activeBranchId === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            All Branches (Consolidated)
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Manage Hub Facilities</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Registered Hubs</span>
            <Building2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {branches.length} <span className="text-xs font-normal text-slate-500">Facilities</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Ibadan Oyo State Operations</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Network Inventory Value</span>
            <Package className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl md:text-2xl font-black text-emerald-800 mt-2 font-mono">
            {formatNaira(networkTotals.totalInventoryValue)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {networkTotals.totalStockUnits} solar units in warehouses
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Network Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatNaira(networkTotals.totalSales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {branchStats.reduce((acc, b) => acc + b.salesCount, 0)} completed invoices
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Network Personnel</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {networkTotals.totalStaff} <span className="text-xs font-normal text-slate-500">Staff</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Engineers, sales & inventory officers</p>
        </div>
      </div>

      {/* Metric Mode Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
          <span>Comparative D3 Metric:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMetricMode('inventory_value')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metricMode === 'inventory_value'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inventory Valuation (₦)
          </button>
          <button
            onClick={() => setMetricMode('sales')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metricMode === 'sales'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Gross Sales (₦)
          </button>
          <button
            onClick={() => setMetricMode('stock_units')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metricMode === 'stock_units'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Stock Physical Units
          </button>
          <button
            onClick={() => setMetricMode('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metricMode === 'expenses'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Operating Expenses (₦)
          </button>
        </div>
      </div>

      {/* Main D3 Visualizations Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* D3 Bar Chart (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-800" />
                <span>Comparative Branch Metric Analysis</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                D3 SVG comparative chart. Click any bar to instantly filter the system to that branch.
              </p>
            </div>

            {activeBranchId !== 'all' && (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Active View Filtered
              </span>
            )}
          </div>

          <div className="overflow-x-auto flex justify-center py-2">
            <svg
              ref={barChartRef}
              viewBox="0 0 680 300"
              className="w-full max-w-[680px] h-auto select-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Comparative Multi-Branch Scale (Africa/Lagos)</span>
            </span>
            <span className="font-mono text-[11px]">Hover or click bars for granular telemetry</span>
          </div>
        </div>

        {/* D3 Donut Chart (1 column) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-800" />
              <span>Asset Share & Concentration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proportional distribution across registered facilities
            </p>
          </div>

          <div className="flex items-center justify-center py-2">
            <svg
              ref={pieChartRef}
              viewBox="0 0 280 280"
              className="w-full max-w-[240px] h-auto select-none"
            />
          </div>

          {/* Branch Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {branchStats.map((bs, idx) => {
              const colors = ['#047857', '#0284c7', '#d97706', '#7c3aed'];
              const col = colors[idx % colors.length];
              const isSelected = activeBranchId === bs.branch.id;
              return (
                <button
                  key={bs.branch.id}
                  onClick={() => setActiveBranchId(bs.branch.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    isSelected ? 'bg-emerald-50 font-bold text-emerald-950' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                    <span className="truncate max-w-[130px]">{bs.branch.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {bs.branch.isHeadquarters ? 'HQ' : bs.branch.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hovered Branch Telemetry Card (if user is hovering over D3 elements) */}
      {hoveredBranch && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-sm">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{hoveredBranch.branch.name}</span>
                {hoveredBranch.branch.isHeadquarters && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    Headquarters
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Manager: <span className="font-semibold">{hoveredBranch.branch.managerName || 'Gabriel Francis'}</span> • {hoveredBranch.branch.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Inventory Value</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">
                {formatNaira(hoveredBranch.inventoryValue)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Gross Sales</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatNaira(hoveredBranch.salesTotal)}
              </span>
            </div>
            <button
              onClick={() => setActiveBranchId(hoveredBranch.branch.id)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-2xs"
            >
              Filter View
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Cross-Branch Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800" />
              <span>Comparative Facility Ledger & Performance Scorecard</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side breakdown of operational status, staff deployment, stock valuation, and revenue metrics.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('branches')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>Manage Branch Hubs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Branch Hub / Code</th>
                <th className="py-3 px-3">Location & Address</th>
                <th className="py-3 px-3">Manager / Staff</th>
                <th className="py-3 px-3 text-right">Inventory Value (₦)</th>
                <th className="py-3 px-3 text-right">Stock Units</th>
                <th className="py-3 px-3 text-right">Gross Sales (₦)</th>
                <th className="py-3 px-3 text-right">Expenses (₦)</th>
                <th className="py-3 px-3 text-center">Active Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchStats.map(stat => {
                const isSelected = activeBranchId === stat.branch.id;
                return (
                  <tr
                    key={stat.branch.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-emerald-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {stat.branch.name[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{stat.branch.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {stat.branch.code} {stat.branch.isHeadquarters && '• Main Headquarters'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-700 block">{stat.branch.address}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{stat.branch.city}, {stat.branch.state}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {stat.branch.managerName || 'Gabriel Francis'}
                      </span>
                      <span className="text-[10px] text-slate-400">{stat.staffCount} Staff Assigned</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900">
                      {formatNaira(stat.inventoryValue)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {stat.stockUnits.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatNaira(stat.salesTotal)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                      {formatNaira(stat.expensesTotal)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          stat.branch.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {stat.branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setActiveBranchId(stat.branch.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Currently Viewing' : 'Switch View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
