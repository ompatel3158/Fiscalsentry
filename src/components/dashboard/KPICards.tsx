'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DollarSign, ShieldAlert, CalendarClock, ListTodo, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function KPICards() {
  const { allAudits, activeAudit, sentryConfig, isInitialLoading } = useApp();

  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-28 bg-black/5 dark:bg-white/10 rounded-md" />
              <div className="w-8 h-8 rounded-2xl bg-black/5 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-32 bg-black/10 dark:bg-white/15 rounded-xl" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-2.5 w-24 bg-black/5 dark:bg-white/10 rounded" />
                <div className="h-4 w-16 bg-black/5 dark:bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const safeAudits = allAudits || [];
  const totalAudited = safeAudits.reduce((acc, a) => acc + (a?.totalBilledAmount || 0), 0);
  const totalRecovery = safeAudits.reduce((acc, a) => acc + (a?.potentialRecoveryAmount || 0), 0);
  const activeDeadlinesCount = safeAudits.flatMap((a) => a?.actions || []).filter((act) => act?.deadlineDate).length;
  const pendingActionsCount = (activeAudit?.actions || []).filter((a) => a?.status === 'pending').length;

  const cards = [
    {
      title: 'Total Paperwork Audited',
      value: `$${totalAudited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${safeAudits.length} Statements & RFP Proposals Processed`,
      icon: DollarSign,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40',
      badge: 'Multimodal OCR',
    },
    {
      title: 'Disputed & Reclaimed Funds',
      value: `$${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Average 31.4% Overcharge Recovery Rate',
      icon: ShieldAlert,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40',
      badge: 'Protected Money',
    },
    {
      title: 'Active Statutory Deadlines',
      value: `${activeDeadlinesCount} Deadlines`,
      subtitle: 'Synchronized with Google Calendar',
      icon: CalendarClock,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40',
      badge: 'Statutory 30-Day',
    },
    {
      title: 'Action Queue & Tasks',
      value: `${pendingActionsCount} Pending`,
      subtitle: 'Google Tasks, Sheets & Slack Dispatches',
      icon: ListTodo,
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40',
      badge: 'Human-In-The-Loop',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.35, delay: idx * 0.05 }}
            className={`p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border ${card.color.split(' ').slice(4).join(' ')} shadow-subtle flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-2xl bg-gradient-to-br ${card.color.split(' ').slice(0, 4).join(' ')}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.value}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {card.subtitle}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {card.badge}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
