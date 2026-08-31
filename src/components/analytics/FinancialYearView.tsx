'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AuditResult, DocumentCategory, formatCurrency } from '@/lib/types';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  ArrowUpRight,
  Sparkles,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  Search,
} from 'lucide-react';
import { GroupedAuditList } from '@/components/dashboard/GroupedAuditList';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function FinancialYearView() {
  const { allAudits, setActiveAudit, setCurrentView, setIsPDFModalOpen, setPdfAuditTarget } = useApp();
  const [selectedFY, setSelectedFY] = useState<string>('FY 2026');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Available currencies
  const currencyBreakdowns = useMemo(() => {
    const map: Record<string, { currency: string; symbol: string; count: number }> = {};
    allAudits.forEach((a) => {
      const code = a.currency || 'USD';
      const sym = a.currencySymbol || (code === 'INR' ? '₹' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : '$');
      if (!map[code]) {
        map[code] = { currency: code, symbol: sym, count: 0 };
      }
      map[code].count += 1;
    });
    return Object.values(map);
  }, [allAudits]);

  // Primary currency symbol for active filter
  const primarySymbol = useMemo(() => {
    if (selectedCurrency !== 'all') {
      const target = currencyBreakdowns.find((c) => c.currency === selectedCurrency);
      if (target) return target.symbol;
    }
    if (allAudits.length === 0) return '$';
    const counts: Record<string, number> = {};
    allAudits.forEach((a) => {
      const sym = a.currencySymbol || '$';
      counts[sym] = (counts[sym] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || '$';
  }, [allAudits, selectedCurrency, currencyBreakdowns]);

  // Filter audits for the selected Financial Year, Category, and Currency
  const filteredAudits = useMemo(() => {
    const now = new Date();

    return allAudits.filter((audit) => {
      const docDateStr = audit.documentDate || audit.createdAt;
      const docDate = docDateStr ? new Date(docDateStr) : new Date();
      const year = docDate.getFullYear();

      let matchesDate = true;

      if (selectedFY === 'FY 2026') {
        matchesDate = year >= 2026;
      } else if (selectedFY === 'FY 2025') {
        matchesDate = year === 2025;
      } else if (selectedFY === 'last_30_days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = docDate >= thirtyDaysAgo;
      } else if (selectedFY === 'last_7_days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = docDate >= sevenDaysAgo;
      } else if (selectedFY === 'custom') {
        if (customStartDate && docDate < new Date(customStartDate)) {
          matchesDate = false;
        }
        if (customEndDate && docDate > new Date(customEndDate + 'T23:59:59')) {
          matchesDate = false;
        }
      } else if (selectedFY === 'all') {
        matchesDate = true;
      }

      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        matchesCategory = audit.category === selectedCategory;
      }

      let matchesCurrency = true;
      if (selectedCurrency !== 'all') {
        matchesCurrency = (audit.currency || 'USD') === selectedCurrency;
      }

      return matchesDate && matchesCategory && matchesCurrency;
    });
  }, [allAudits, selectedFY, selectedCategory, selectedCurrency, customStartDate, customEndDate]);

  // Aggregate financial metrics
  const totalBilled = filteredAudits.reduce((sum, a) => sum + (a.totalBilledAmount || 0), 0);
  const totalBenchmark = filteredAudits.reduce((sum, a) => sum + (a.fairBenchmarkAmount || 0), 0);
  const totalRecovered = filteredAudits.reduce((sum, a) => sum + (a.potentialRecoveryAmount || 0), 0);
  const recoveryPercentage = totalBilled > 0 ? ((totalRecovered / totalBilled) * 100).toFixed(1) : '0';

  // Monthly breakdown for spending trends
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Record<string, { billed: number; benchmark: number; recovered: number }> = {};
    months.forEach((m) => {
      buckets[m] = { billed: 0, benchmark: 0, recovered: 0 };
    });

    filteredAudits.forEach((a) => {
      const d = a.documentDate ? new Date(a.documentDate) : new Date(a.createdAt);
      const mName = months[d.getMonth()];
      if (buckets[mName]) {
        buckets[mName].billed += a.totalBilledAmount || 0;
        buckets[mName].benchmark += a.fairBenchmarkAmount || 0;
        buckets[mName].recovered += a.potentialRecoveryAmount || 0;
      }
    });

    const maxBilled = Math.max(...Object.values(buckets).map((b) => b.billed), 1000);

    return Object.entries(buckets).map(([month, val]) => ({
      month,
      ...val,
      billedPct: Math.round((val.billed / maxBilled) * 100),
      recoveredPct: Math.round((val.recovered / maxBilled) * 100),
    }));
  }, [filteredAudits]);

  // Category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, { billed: number; recovered: number; count: number; label: string }> = {
      medical_bill: { billed: 0, recovered: 0, count: 0, label: 'Medical Healthcare' },
      vendor_quotes: { billed: 0, recovered: 0, count: 0, label: 'Vendor Procurement' },
      grant_subsidy: { billed: 0, recovered: 0, count: 0, label: 'Grants & Energy Rebates' },
      invoice_receipt: { billed: 0, recovered: 0, count: 0, label: 'Invoices & Receipts' },
    };

    filteredAudits.forEach((a) => {
      const cat = a.category in map ? a.category : 'invoice_receipt';
      map[cat].billed += a.totalBilledAmount || 0;
      map[cat].recovered += a.potentialRecoveryAmount || 0;
      map[cat].count += 1;
    });

    return Object.entries(map).filter(([_, val]) => val.count > 0 || totalBilled === 0);
  }, [filteredAudits, totalBilled]);

  // Export Financial Year Statement (CSV)
  const handleExportCSV = () => {
    if (filteredAudits.length === 0) {
      toast.info('No statement records in current filter to export.');
      return;
    }

    const headers = ['Document ID', 'Title', 'Category', 'Provider/Vendor', 'Date', 'Currency', 'Billed Amount', 'Benchmark', 'Disputed Savings', 'Risk Level'];
    const rows = filteredAudits.map((a) => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.category,
      `"${a.providerOrVendor.replace(/"/g, '""')}"`,
      a.documentDate || a.createdAt,
      a.currency || 'USD',
      a.totalBilledAmount,
      a.fairBenchmarkAmount,
      a.potentialRecoveryAmount,
      a.riskLevel,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FiscalSentry_Statement_${selectedFY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported Statement (${selectedFY}) (CSV)`, {
      description: `${filteredAudits.length} audited items formatted for accounting & tax records.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Custom Date Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#09090b] rounded-3xl p-4 sm:p-6 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
                Financial Year & Spending Statement
              </h1>
              <p className="text-xs text-[#86868b]">
                Audited statements, tax liability records, and statutory dispute ledgers
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter & Multi-Currency Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Switcher if multiple exist */}
          {currencyBreakdowns.length > 1 && (
            <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-2xl flex-wrap">
              <button
                onClick={() => setSelectedCurrency('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                  selectedCurrency === 'all'
                    ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                All
              </button>
              {currencyBreakdowns.map((cb) => (
                <button
                  key={cb.currency}
                  onClick={() => setSelectedCurrency(cb.currency)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                    selectedCurrency === cb.currency
                      ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {cb.symbol} {cb.currency}
                </button>
              ))}
            </div>
          )}

          {/* Date Selector Tabs */}
          <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-2xl flex-wrap">
            {[
              { id: 'FY 2026', label: 'FY 2026' },
              { id: 'FY 2025', label: 'FY 2025' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom Range' },
              { id: 'all', label: 'All Time' },
            ].map((fy) => (
              <button
                key={fy.id}
                onClick={() => setSelectedFY(fy.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedFY === fy.id
                    ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                {fy.label}
              </button>
            ))}
          </div>

          {/* Multi-Format Export Dropdown */}
          <ExportDropdown
            monthlyAudits={filteredAudits}
            monthLabel={selectedFY}
            buttonLabel="Export Ledger"
            variant="primary"
          />
        </div>
      </div>

      {/* Custom Date Range Selector Inputs Bar */}
      {selectedFY === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-white dark:bg-[#09090b] border border-emerald-500/30 flex items-center gap-4 flex-wrap shadow-xs"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f] dark:text-white">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Custom Date Range:</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-[#86868b] font-medium">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-[#1d1d1f] dark:text-white border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-[#86868b] font-medium">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-[#1d1d1f] dark:text-white border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
          </div>

          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs text-rose-500 hover:underline font-semibold ml-auto"
            >
              Clear Filter
            </button>
          )}
        </motion.div>
      )}

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Total Liabilities Billed</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white font-mono">
            {formatCurrency(totalBilled, primarySymbol, selectedCurrency)}
          </div>
          <div className="text-[11px] text-[#86868b]">
            Gross charges across all categories
          </div>
        </div>

        {/* Fair Benchmark */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Fair Statutory Benchmark</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
            {formatCurrency(totalBenchmark, primarySymbol, selectedCurrency)}
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
            Based on Medicare & competitive index
          </div>
        </div>

        {/* Total Disputed Savings */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Total Disputed Savings</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            +{formatCurrency(totalRecovered, primarySymbol, selectedCurrency)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {recoveryPercentage}% of total billable liabilities
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Documents Audited</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
            {filteredAudits.length}
          </div>
          <div className="text-[11px] text-[#86868b]">
            Gemini multi-standard compliance verified
          </div>
        </div>
      </div>

      {/* Main Grid: Monthly Chart & Statements List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Monthly Trend Chart & Categories (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Monthly Spending Trend Bar Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                Monthly Spending & Recovery Trajectory
              </h2>
              <span className="text-[11px] text-[#86868b]">Billed vs Recovered Delta</span>
            </div>

            <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 pt-4 px-2">
              {monthlyData.map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                    {/* Billed Bar */}
                    <div
                      style={{ height: `${Math.max(item.billedPct, 4)}%` }}
                      className="w-1/2 rounded-t-sm bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-all relative"
                      title={`${item.month} Billed: ${formatCurrency(item.billed, primarySymbol, selectedCurrency)}`}
                    />
                    {/* Recovered Bar */}
                    <div
                      style={{ height: `${Math.max(item.recoveredPct, item.recovered > 0 ? 4 : 0)}%` }}
                      className="w-1/2 rounded-t-sm bg-emerald-500 hover:bg-emerald-400 transition-all relative"
                      title={`${item.month} Recovered: ${formatCurrency(item.recovered, primarySymbol, selectedCurrency)}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#86868b]">{item.month}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700" />
                <span className="text-[#86868b]">Original Billed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Disputed Savings</span>
              </div>
            </div>
          </div>

          {/* Category Distribution Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              Category Spend Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryData.map(([key, data]) => {
                const pct = totalBilled > 0 ? ((data.billed / totalBilled) * 100).toFixed(0) : '0';
                const isSelected = selectedCategory === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : key)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/40 bg-black/[0.01] dark:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#1d1d1f] dark:text-white">
                      <span>{data.label}</span>
                      <span className="text-[#86868b] font-mono">{pct}%</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-[#1d1d1f] dark:text-white mt-1">
                      {formatCurrency(data.billed, primarySymbol, selectedCurrency)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                      <span>+{formatCurrency(data.recovered, primarySymbol, selectedCurrency)} savings</span>
                      <span className="text-[#86868b]">{data.count} docs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Filtered Statement Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Audited Statements ({filteredAudits.length})
              </h2>

              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  Reset Category
                </button>
              )}
            </div>

            {filteredAudits.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-xs text-[#86868b]">No statements match the selected date or category.</p>
                <button
                  onClick={() => {
                    setSelectedFY('all');
                    setSelectedCategory('all');
                    setSelectedCurrency('all');
                  }}
                  className="text-xs text-emerald-600 font-bold underline"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <GroupedAuditList
                audits={filteredAudits}
                onSelectAudit={(audit) => {
                  setActiveAudit(audit);
                  setCurrentView('dashboard');
                }}
                compact
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
