'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  FileText,
  BrainCircuit,
  Workflow,
  Calendar,
  CheckSquare,
  Sheet,
  FolderSync,
  Mail,
  MessageSquare,
  FileCheck2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ExecutionDAG() {
  const { activeAudit } = useApp();

  const executedActionsCount = (activeAudit?.actions || []).filter((a) => a.status === 'completed').length;
  const totalActionsCount = activeAudit?.actions.length || 0;

  return (
    <div className="p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Autonomous Pipeline Flow (DAG)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {executedActionsCount}/{totalActionsCount} Actions Dispatched
        </span>
      </div>

      {/* Visual Pipeline Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
        {/* Node 1: Ingestion */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Stage 1 • Ingestion
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-bold">
                Completed
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {activeAudit?.title || 'Document Ingested'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {activeAudit?.providerOrVendor || 'Auto-Extracted from Inbound Feed'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500">
            <span>Billed: ${activeAudit?.totalBilledAmount.toLocaleString()}</span>
            <span>Date: {activeAudit?.documentDate}</span>
          </div>
        </motion.div>

        {/* Node 2: Gemini Multimodal Brain */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35, delay: 0.05 }}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-300/60 dark:border-emerald-800/60 flex flex-col justify-between relative shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Stage 2 • Gemini 3.7 Flash Brain
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                Audited & Benchmarked
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Statutory Audit Engine
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              {activeAudit?.summary || 'Line-items cross-referenced with statutory fair price benchmarks.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span>Potential Recovery:</span>
            <span>+${activeAudit?.potentialRecoveryAmount.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Node 3: Multi-Destination Action Execution */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35, delay: 0.1 }}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Stage 3 • Multi-Action Dispatch
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  executedActionsCount === totalActionsCount && totalActionsCount > 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}
              >
                {executedActionsCount === totalActionsCount && totalActionsCount > 0 ? 'All Dispatched' : 'Ready to Dispatch'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-2">
              <div
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300"
                title="Google Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[9px] mt-0.5">Cal</span>
              </div>
              <div
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300"
                title="Google Tasks"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[9px] mt-0.5">Tasks</span>
              </div>
              <div
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300"
                title="Google Sheets"
              >
                <Sheet className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[9px] mt-0.5">Sheets</span>
              </div>
              <div
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300"
                title="PDF Engine"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[9px] mt-0.5">PDF</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500">
            <span>Connected: Workspace & Slack</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">1-Click Ready</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
