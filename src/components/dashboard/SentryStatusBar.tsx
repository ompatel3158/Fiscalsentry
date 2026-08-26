'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Radio, RefreshCw, Mail, MessageSquare, Webhook, CheckCircle, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function SentryStatusBar() {
  const { sentryConfig, setSentryConfig, triggerManualSentryScan, sentryLogs } = useApp();

  const toggleSource = (sourceKey: keyof typeof sentryConfig.monitoredSources) => {
    setSentryConfig((prev) => ({
      ...prev,
      monitoredSources: {
        ...prev.monitoredSources,
        [sourceKey]: !prev.monitoredSources[sourceKey],
      },
    }));
  };

  return (
    <div className="p-4 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left: Status Beacon & Watcher Details */}
      <div className="flex items-center gap-3">
        <div className="relative p-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Autonomous Workspace Sentry
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Live 24/7 Watcher
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring financial paperwork, invoices, and RFP emails every 60s
          </p>
        </div>
      </div>

      {/* Center: Source Badges */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={() => toggleSource('gmail')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] border ${
            sentryConfig.monitoredSources.gmail
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
          }`}
          title="Toggle Gmail inbox monitoring"
        >
          <Mail className="w-3.5 h-3.5" />
          Gmail Inbox
        </button>

        <button
          onClick={() => toggleSource('slack')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] border ${
            sentryConfig.monitoredSources.slack
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
          }`}
          title="Toggle Slack feed monitoring"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Slack Channels
        </button>

        <button
          onClick={() => toggleSource('inboundWebhooks')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] border ${
            sentryConfig.monitoredSources.inboundWebhooks
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
          }`}
          title="Toggle Inbound ERP Webhooks"
        >
          <Webhook className="w-3.5 h-3.5" />
          ERP / Webhooks
        </button>
      </div>

      {/* Right: Manual Scan Trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => triggerManualSentryScan()}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all duration-150 active:scale-[0.97]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Scan Feeds Now
        </button>
      </div>
    </div>
  );
}
