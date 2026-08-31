'use client';

import React, { useState, useMemo } from 'react';
import { AuditResult, formatCurrency } from '@/lib/types';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Search,
  Layers,
  List,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  X,
  ArrowRight,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GroupedAuditListProps {
  audits: AuditResult[];
  activeAuditId?: string;
  onSelectAudit: (audit: AuditResult) => void;
  onSelectMonth?: (monthKey: string) => void;
  compact?: boolean;
}

interface DayGroup {
  dayKey: string;
  dayLabel: string;
  dateObj: Date;
  audits: AuditResult[];
  totalBilled: number;
  totalRecovered: number;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  year: number;
  days: DayGroup[];
  allMonthAudits: AuditResult[];
  totalAudits: number;
  totalBilled: number;
  totalRecovered: number;
}

export function GroupedAuditList({
  audits,
  activeAuditId,
  onSelectAudit,
  onSelectMonth,
  compact = false,
}: GroupedAuditListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  // Filter audits by search query
  const filteredAudits = useMemo(() => {
    const list = audits || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        (a?.title && a.title.toLowerCase().includes(q)) ||
        (a?.providerOrVendor && a.providerOrVendor.toLowerCase().includes(q)) ||
        (a?.category && a.category.toLowerCase().includes(q))
    );
  }, [audits, searchQuery]);

  // Group audits by Month -> Day
  const monthGroups = useMemo(() => {
    const monthsMap: Record<string, { label: string; year: number; allAudits: AuditResult[]; daysMap: Record<string, AuditResult[]> }> = {};

    filteredAudits.forEach((audit) => {
      const dateStr = audit.documentDate || audit.createdAt;
      const d = dateStr ? new Date(dateStr) : new Date();

      // Month Key: YYYY-MM
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Day Key: YYYY-MM-DD
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {
          label: monthLabel,
          year: d.getFullYear(),
          allAudits: [],
          daysMap: {},
        };
      }

      monthsMap[monthKey].allAudits.push(audit);

      if (!monthsMap[monthKey].daysMap[dayKey]) {
        monthsMap[monthKey].daysMap[dayKey] = [];
      }

      monthsMap[monthKey].daysMap[dayKey].push(audit);
    });

    // Convert map to sorted structure
    const sortedMonthKeys = Object.keys(monthsMap).sort((a, b) => b.localeCompare(a));

    return sortedMonthKeys.map((mKey) => {
      const mData = monthsMap[mKey];
      const sortedDayKeys = Object.keys(mData.daysMap).sort((a, b) => b.localeCompare(a));

      let mBilled = 0;
      let mRecovered = 0;
      let mTotalCount = 0;

      const days: DayGroup[] = sortedDayKeys.map((dKey) => {
        const dayAudits = mData.daysMap[dKey];
        const dBilled = dayAudits.reduce((sum, a) => sum + (a.totalBilledAmount || 0), 0);
        const dRecovered = dayAudits.reduce((sum, a) => sum + (a.potentialRecoveryAmount || 0), 0);
        mBilled += dBilled;
        mRecovered += dRecovered;
        mTotalCount += dayAudits.length;

        const dateObj = new Date(dKey);
        const isToday = new Date().toDateString() === dateObj.toDateString();
        const isYesterday = new Date(Date.now() - 86400000).toDateString() === dateObj.toDateString();

        let dayLabel = dateObj.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
        if (isToday) dayLabel = `Today (${dayLabel})`;
        else if (isYesterday) dayLabel = `Yesterday (${dayLabel})`;

        return {
          dayKey: dKey,
          dayLabel,
          dateObj,
          audits: dayAudits,
          totalBilled: dBilled,
          totalRecovered: dRecovered,
        };
      });

      return {
        monthKey: mKey,
        monthLabel: mData.label,
        year: mData.year,
        days,
        allMonthAudits: mData.allAudits,
        totalAudits: mTotalCount,
        totalBilled: mBilled,
        totalRecovered: mRecovered,
      } as MonthGroup;
    });
  }, [filteredAudits]);

  const toggleMonth = (mKey: string) => {
    setCollapsedMonths((prev) => ({ ...prev, [mKey]: !prev[mKey] }));
  };

  const toggleDay = (dKey: string) => {
    setCollapsedDays((prev) => ({ ...prev, [dKey]: !prev[dKey] }));
  };

  if (audits.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#86868b]">
        No audited statements available.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 select-text">
      {/* Search & View Mode Switcher */}
      <div className="flex items-center gap-1.5 px-1 select-none">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter emails, bank alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] border border-transparent focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Group / Flat View Toggle */}
        <div className="flex bg-black/5 dark:bg-white/10 p-0.5 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('grouped')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grouped'
                ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-[#86868b]'
            }`}
            title="Group by Month & Day"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'flat'
                ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-[#86868b]'
            }`}
            title="Flat List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Grouped (Month -> Day) View */}
      {viewMode === 'grouped' ? (
        <div className="space-y-3">
          {monthGroups.map((mGroup) => {
            const isMonthCollapsed = collapsedMonths[mGroup.monthKey];
            const sym = mGroup.allMonthAudits[0]?.currencySymbol || '$';

            return (
              <div
                key={mGroup.monthKey}
                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.015] overflow-hidden"
              >
                {/* Month Accordion Header */}
                <div className="px-3 py-2 bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between transition-colors">
                  <div
                    onClick={() => {
                      if (onSelectMonth) {
                        onSelectMonth(mGroup.monthKey);
                      } else {
                        toggleMonth(mGroup.monthKey);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f] dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none flex-1 truncate"
                    title={`Open ${mGroup.monthLabel} in Command Center`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{mGroup.monthLabel}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-[#86868b] shrink-0">
                      {mGroup.totalAudits}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono select-none shrink-0">
                    <span className="text-[#86868b]">{formatCurrency(mGroup.totalBilled, sym)}</span>
                    {mGroup.totalRecovered > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +{formatCurrency(mGroup.totalRecovered, sym)}
                      </span>
                    )}

                    {/* Toggle expand/collapse arrow */}
                    <button
                      onClick={() => toggleMonth(mGroup.monthKey)}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868b]"
                      title="Expand/Collapse Days"
                    >
                      {isMonthCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Days List Inside Month */}
                {!isMonthCollapsed && (
                  <div className="p-2 space-y-2">
                    {mGroup.days.map((dGroup) => {
                      const isDayCollapsed = collapsedDays[dGroup.dayKey];

                      return (
                        <div key={dGroup.dayKey} className="space-y-1.5">
                          {/* Day Header */}
                          <div
                            onClick={() => toggleDay(dGroup.dayKey)}
                            className="flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors select-none"
                          >
                            <div className="flex items-center gap-1">
                              {isDayCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              <span>{dGroup.dayLabel}</span>
                              <span className="text-[9px] text-[#86868b]">({dGroup.audits.length})</span>
                            </div>
                            <span className="text-[10px] font-mono font-medium">
                              {formatCurrency(dGroup.totalBilled, sym)}
                            </span>
                          </div>

                          {/* Statement Items Inside Day */}
                          {!isDayCollapsed && (
                            <div className="space-y-1 pl-2">
                              {dGroup.audits.map((audit) => {
                                const isActive = activeAuditId === audit.id;
                                const itemSym = audit.currencySymbol || sym;

                                return (
                                  <div
                                    key={audit.id}
                                    onClick={() => onSelectAudit(audit)}
                                    className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                                      isActive
                                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xs'
                                        : 'bg-white dark:bg-[#121215] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-[#1d1d1f] dark:text-white truncate">
                                          {audit.title}
                                        </div>
                                        <div className="text-[10px] text-[#86868b] truncate mt-0.5">
                                          {audit.providerOrVendor}
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <div className="text-xs font-mono font-bold text-[#1d1d1f] dark:text-white">
                                          {formatCurrency(audit.totalBilledAmount, itemSym, audit.currency)}
                                        </div>
                                        {audit.potentialRecoveryAmount > 0 ? (
                                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            +{formatCurrency(audit.potentialRecoveryAmount, itemSym, audit.currency)}
                                          </div>
                                        ) : (
                                          <div className="text-[9px] text-[#86868b]">Compliant</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. Flat List View */
        <div className="space-y-1.5">
          {filteredAudits.map((audit) => {
            const isActive = activeAuditId === audit.id;
            const sym = audit.currencySymbol || '$';

            return (
              <div
                key={audit.id}
                onClick={() => onSelectAudit(audit)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xs'
                    : 'bg-white dark:bg-[#121215] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold truncate text-[#1d1d1f] dark:text-white">
                    {audit.title}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                    +{formatCurrency(audit.potentialRecoveryAmount, sym, audit.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[#86868b]">
                  <span className="truncate">{audit.providerOrVendor}</span>
                  <span>{audit.documentDate || audit.createdAt.split('T')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
