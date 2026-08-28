'use client';

import React, { useState, useMemo } from 'react';
import { AuditResult, formatCurrency } from '@/lib/types';
import {
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  ArrowRight,
  Receipt,
  Calendar,
  Layers,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AggregateOverviewProps {
  audits: AuditResult[];
  onSelectAudit: (audit: AuditResult) => void;
  onScanNow: () => void;
  onLoadDemo: () => void;
}

export function AggregateOverview({
  audits,
  onSelectAudit,
  onScanNow,
  onLoadDemo,
}: AggregateOverviewProps) {
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('all');

  // Compute available currencies and breakdown
  const currencyBreakdowns = useMemo(() => {
    const map: Record<
      string,
      {
        currency: string;
        symbol: string;
        totalNet: number;
        totalGross: number;
        totalDisputed: number;
        totalHolds: number;
        count: number;
      }
    > = {};

    audits.forEach((a) => {
      const code = a.currency || 'USD';
      const sym =
        a.currencySymbol || (code === 'INR' ? '₹' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : '$');

      if (!map[code]) {
        map[code] = {
          currency: code,
          symbol: sym,
          totalNet: 0,
          totalGross: 0,
          totalDisputed: 0,
          totalHolds: 0,
          count: 0,
        };
      }

      const billed = a.totalBilledAmount || 0;
      map[code].totalGross += billed;
      map[code].totalDisputed += a.potentialRecoveryAmount || 0;
      map[code].count += 1;

      if (a.transactionType === 'hold_lien') {
        map[code].totalHolds += billed;
      } else if (a.transactionType === 'unblocked_lien' || a.transactionType === 'refund') {
        // Net 0
      } else {
        map[code].totalNet += a.actualNetSpend !== undefined ? a.actualNetSpend : billed;
      }
    });

    return Object.values(map);
  }, [audits]);

  // Filter audits based on selected currency
  const filteredAudits = useMemo(() => {
    if (selectedCurrencyFilter === 'all') return audits;
    return audits.filter((a) => (a.currency || 'USD') === selectedCurrencyFilter);
  }, [audits, selectedCurrencyFilter]);

  // Determine primary currency symbol for active filter
  const primarySymbol = useMemo(() => {
    if (selectedCurrencyFilter !== 'all') {
      const target = currencyBreakdowns.find((c) => c.currency === selectedCurrencyFilter);
      if (target) return target.symbol;
    }
    if (audits.length === 0) return '$';
    const counts: Record<string, number> = {};
    audits.forEach((a) => {
      const sym = a.currencySymbol || '$';
      counts[sym] = (counts[sym] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || '$';
  }, [audits, selectedCurrencyFilter, currencyBreakdowns]);

  // Aggregate financial metrics with smart reconciliation
  const stats = useMemo(() => {
    let totalGrossBilled = 0;
    let totalNetSpend = 0;
    let totalHolds = 0;
    let totalReleasedHolds = 0;
    let totalRecoveries = 0;
    let activeSubscriptions = 0;
    const reconciledItems: { id: string; title: string; amount: number; note: string }[] = [];

    filteredAudits.forEach((a) => {
      const billed = a.totalBilledAmount || 0;
      const recovered = a.potentialRecoveryAmount || 0;
      totalGrossBilled += billed;
      totalRecoveries += recovered;

      if (a.isRecurringSubscription) {
        activeSubscriptions++;
      }

      if (a.transactionType === 'hold_lien') {
        totalHolds += billed;
      } else if (a.transactionType === 'unblocked_lien') {
        totalReleasedHolds += billed;
        reconciledItems.push({
          id: a.id,
          title: a.title,
          amount: billed,
          note: 'IPO Mandate Released (Net Spend: 0.00)',
        });
      } else if (a.transactionType === 'refund') {
        reconciledItems.push({
          id: a.id,
          title: a.title,
          amount: billed,
          note: 'Refund Processed',
        });
      } else {
        totalNetSpend += a.actualNetSpend !== undefined ? a.actualNetSpend : billed;
      }
    });

    return {
      totalGrossBilled,
      totalNetSpend,
      totalHolds,
      totalReleasedHolds,
      totalRecoveries,
      activeSubscriptions,
      reconciledItems,
    };
  }, [filteredAudits]);

  if (audits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Command Center Ready
          </h2>
          <p className="text-xs text-[#86868b] leading-relaxed">
            Connect your Google Workspace or drop any billing PDF to audit line items, detect IPO holds, and prevent overcharges.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={onScanNow}
            className="px-4 py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold shadow-xs hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Scan Gmail (Last 15 Days)
          </button>

          <button
            onClick={onLoadDemo}
            className="px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white text-xs font-bold active:scale-[0.97] transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Load Sample Scenarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner & Multi-Currency Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#09090b] rounded-3xl p-4 sm:p-6 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
                Autonomous Financial Defense & Multi-Currency Ledger
              </h1>
              <p className="text-xs text-[#86868b]">
                {filteredAudits.length} statements analyzed • Auto-Currency & Smart Reconciliation Active
              </p>
            </div>
          </div>
        </div>

        {/* Currency Filter Tabs & Scan Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Switcher Pills */}
          {currencyBreakdowns.length > 1 && (
            <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-2xl flex-wrap">
              <button
                onClick={() => setSelectedCurrencyFilter('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                  selectedCurrencyFilter === 'all'
                    ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                All Currencies
              </button>
              {currencyBreakdowns.map((cb) => (
                <button
                  key={cb.currency}
                  onClick={() => setSelectedCurrencyFilter(cb.currency)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                    selectedCurrencyFilter === cb.currency
                      ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {cb.symbol} {cb.currency} ({cb.count})
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onScanNow}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Scan Mails
          </button>
        </div>
      </div>

      {/* Multi-Currency Summary Cards (When multiple currencies exist) */}
      {currencyBreakdowns.length > 1 && selectedCurrencyFilter === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currencyBreakdowns.map((cb) => (
            <div
              key={cb.currency}
              onClick={() => setSelectedCurrencyFilter(cb.currency)}
              className="p-4 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/40 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#86868b]">
                <span>{cb.currency} Portfolio</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10">
                  {cb.count} items
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white">
                {formatCurrency(cb.totalNet, cb.symbol, cb.currency)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                +{formatCurrency(cb.totalDisputed, cb.symbol, cb.currency)} disputed recoveries
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actual Net Spend */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Net Verified Spend</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white font-mono">
            {formatCurrency(stats.totalNetSpend, primarySymbol, selectedCurrencyFilter)}
          </div>
          <div className="text-[11px] text-[#86868b]">
            Excludes released holds & refunds
          </div>
        </div>

        {/* IPO & Lien Mandates */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>IPO Holds & Mandates</span>
            {stats.totalReleasedHolds > 0 ? (
              <Unlock className="w-4 h-4 text-blue-500" />
            ) : (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
            {formatCurrency(stats.totalReleasedHolds || stats.totalHolds, primarySymbol, selectedCurrencyFilter)}
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
            {stats.totalReleasedHolds > 0 ? '✓ Released / Unallocated (₹0 Net)' : 'Active hold'}
          </div>
        </div>

        {/* Total Recoveries / Savings */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Disputed Overcharges</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            +{formatCurrency(stats.totalRecoveries, primarySymbol, selectedCurrencyFilter)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Statutory violations & savings flagged
          </div>
        </div>

        {/* Subscriptions Active */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span>Subscriptions Tracked</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
            {stats.activeSubscriptions}
          </div>
          <div className="text-[11px] text-[#86868b]">
            Auto-renewals & rate monitors
          </div>
        </div>
      </div>

      {/* Smart Reconciliation Callout if IPO unblock or refund exists */}
      {stats.reconciledItems.length > 0 && (
        <div className="p-4 rounded-3xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                Smart Reconciliation: {stats.reconciledItems.length} Held/Refunded Items Netting Zero Expense
              </div>
              <p className="text-[11px] text-[#86868b]">
                FiscalSentry automatically detected unallocated IPO mandates and refunded transactions, preserving net cash accuracy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Statements Grid */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All Audited Statements & Transactions ({filteredAudits.length})</span>
          </h2>
          <span className="text-[11px] text-[#86868b]">
            Click any statement to inspect line items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAudits.map((audit) => {
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
