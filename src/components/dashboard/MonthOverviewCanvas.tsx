'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AuditResult, formatCurrency } from '@/lib/types';
import {
  Calendar,
  ArrowLeft,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Receipt,
  Download,
  FileSpreadsheet,
  ArrowRight,
  PieChart,
  Layers,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface MonthOverviewCanvasProps {
  monthKey: string; // e.g. '2026-08'
  onBack: () => void;
  onSelectAudit: (audit: AuditResult) => void;
}

export function MonthOverviewCanvas({
  monthKey,
  onBack,
  onSelectAudit,
}: MonthOverviewCanvasProps) {
  const { allAudits } = useApp();

  // Filter audits that match this month
  const monthAudits = useMemo(() => {
    return allAudits.filter((audit) => {
      const dateStr = audit.documentDate || audit.createdAt;
      const d = dateStr ? new Date(dateStr) : new Date();
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === monthKey;
    });
  }, [allAudits, monthKey]);

  // Derive human month label
  const monthLabel = useMemo(() => {
    if (monthAudits.length > 0) {
      const d = new Date(monthAudits[0].documentDate || monthAudits[0].createdAt);
      return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    const [y, m] = monthKey.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [monthAudits, monthKey]);

  // Primary currency symbol
  const primarySymbol = useMemo(() => {
    if (monthAudits.length === 0) return '$';
    const counts: Record<string, number> = {};
    monthAudits.forEach((a) => {
      const sym = a.currencySymbol || '$';
      counts[sym] = (counts[sym] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || '$';
  }, [monthAudits]);

  // Aggregate monthly metrics
  const stats = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalRecovered = 0;
    let totalHolds = 0;
    let subscriptionsCount = 0;

    monthAudits.forEach((a) => {
      const billed = a.totalBilledAmount || 0;
      totalGross += billed;
      totalRecovered += a.potentialRecoveryAmount || 0;

      if (a.isRecurringSubscription) subscriptionsCount++;

      if (a.transactionType === 'hold_lien') {
        totalHolds += billed;
      } else if (a.transactionType === 'unblocked_lien' || a.transactionType === 'refund') {
        // net 0
      } else {
        totalNet += a.actualNetSpend !== undefined ? a.actualNetSpend : billed;
      }
    });

    return {
      totalGross,
      totalNet,
      totalRecovered,
      totalHolds,
      subscriptionsCount,
    };
  }, [monthAudits]);

  // Export Month Statement (CSV)
  const handleExportCSV = () => {
    if (monthAudits.length === 0) {
      toast.info('No statement records in this month to export.');
      return;
    }

    const headers = ['Document ID', 'Title', 'Category', 'Provider/Vendor', 'Date', 'Billed Amount', 'Fair Benchmark', 'Disputed Savings'];
    const rows = monthAudits.map((a) => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.category,
      `"${a.providerOrVendor.replace(/"/g, '""')}"`,
      a.documentDate || a.createdAt,
      a.totalBilledAmount,
      a.fairBenchmarkAmount,
      a.potentialRecoveryAmount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FiscalSentry_Statement_${monthLabel.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${monthLabel} Financial Statement (CSV)`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#09090b] rounded-3xl p-6 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-all active:scale-[0.97]"
            title="Back to Command Center Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-white">
                {monthLabel} Financial Breakdown
              </h1>
            </div>
            <p className="text-xs text-[#86868b] mt-0.5">
              {monthAudits.length} transactions and statements recorded in {monthLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.97]"
          >
            <Download className="w-3.5 h-3.5" />
            Export Month CSV
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Verified Spend */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Net Month Spend</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
            {formatCurrency(stats.totalNet, primarySymbol)}
          </div>
          <div className="text-[11px] text-[#86868b]">
            Gross: {formatCurrency(stats.totalGross, primarySymbol)}
          </div>
        </div>

        {/* Disputed Recoveries */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Disputed Overcharges</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalRecovered, primarySymbol)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Savings identified in {monthLabel}
          </div>
        </div>

        {/* Subscriptions in Month */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Subscriptions Tracked</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
            {stats.subscriptionsCount}
          </div>
          <div className="text-[11px] text-[#86868b]">
            Auto-renewals & monthly billers
          </div>
        </div>

        {/* Total Documents */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Statements Audited</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
            {monthAudits.length}
          </div>
          <div className="text-[11px] text-[#86868b]">
            All transactions categorized
          </div>
        </div>
      </div>

      {/* Month Statements Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-500" />
            All Statements in {monthLabel} ({monthAudits.length})
          </h2>
          <span className="text-[11px] text-[#86868b]">
            Click any item to inspect full line items & compliance notes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthAudits.map((audit) => {
            const sym = audit.currencySymbol || primarySymbol;
            const isHoldOrReleased =
              audit.transactionType === 'hold_lien' || audit.transactionType === 'unblocked_lien';

            return (
              <div
                key={audit.id}
                onClick={() => onSelectAudit(audit)}
                className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/40 bg-black/[0.01] dark:bg-white/[0.02] hover:bg-emerald-500/5 cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1d1d1f] dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {audit.title}
                    </div>
                    <div className="text-[10px] text-[#86868b] truncate mt-0.5">
                      {audit.providerOrVendor}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[9px] font-mono font-bold shrink-0">
                    {audit.currency || 'USD'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#1d1d1f] dark:text-white">
                      {formatCurrency(audit.totalBilledAmount, sym, audit.currency)}
                    </div>
                    <div className="text-[9px] text-[#86868b]">
                      {audit.documentDate || audit.createdAt.split('T')[0]}
                    </div>
                  </div>

                  <div className="text-right">
                    {isHoldOrReleased ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        IPO Released
                      </span>
                    ) : audit.potentialRecoveryAmount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        +{formatCurrency(audit.potentialRecoveryAmount, sym, audit.currency)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#86868b] font-medium">
                        Compliant
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
