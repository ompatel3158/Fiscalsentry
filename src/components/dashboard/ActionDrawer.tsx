'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ActionItemPayload } from '@/lib/types';
import {
  Calendar,
  CheckSquare,
  Sheet,
  FolderSync,
  Mail,
  MessageSquare,
  FileDown,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Layers,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ActionDrawer() {
  const { activeAudit, allAudits, executeAction, executeAllPendingActions, setActiveAudit } = useApp();
  const [filterMode, setFilterMode] = useState<'all' | 'current'>('all');

  // Collect all actions across all audits
  const allAuditsActions = useMemo(() => {
    const list: { action: ActionItemPayload; docTitle: string; docId: string }[] = [];
    allAudits.forEach((audit) => {
      (audit.actions || []).forEach((act) => {
        list.push({ action: act, docTitle: audit.title, docId: audit.id });
      });
    });
    return list;
  }, [allAudits]);

  // Filter actions based on active tab
  const displayedItems = useMemo(() => {
    if (filterMode === 'current' && activeAudit) {
      return (activeAudit.actions || []).map((act) => ({
        action: act,
        docTitle: activeAudit.title,
        docId: activeAudit.id,
      }));
    }
    return allAuditsActions;
  }, [filterMode, activeAudit, allAuditsActions]);

  const pendingCount = displayedItems.filter((i) => i.action.status === 'pending').length;
  const completedCount = displayedItems.filter((i) => i.action.status === 'completed').length;

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'google_calendar':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'google_tasks':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'google_sheets':
        return <Sheet className="w-4 h-4 text-green-600" />;
      case 'google_drive':
        return <FolderSync className="w-4 h-4 text-amber-500" />;
      case 'google_messages':
      case 'google_chat':
        return <MessageCircle className="w-4 h-4 text-indigo-500" />;
      case 'gmail':
        return <Mail className="w-4 h-4 text-red-500" />;
      case 'slack':
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'pdf_dispute':
      case 'pdf_po':
      case 'pdf_grant':
      default:
        return <FileDown className="w-4 h-4 text-rose-500" />;
    }
  };

  const handleExecuteAll = async () => {
    const pending = displayedItems.filter((i) => i.action.status === 'pending');
    for (const item of pending) {
      await executeAction(item.action);
    }
  };

  if (allAuditsActions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3 gap-2 flex-wrap">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Multi-Action Queue
          </h3>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2">
          {activeAudit && (
            <div className="flex bg-black/5 dark:bg-white/10 p-0.5 rounded-xl">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b]'
                }`}
              >
                All ({allAuditsActions.length})
              </button>
              <button
                onClick={() => setFilterMode('current')}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  filterMode === 'current'
                    ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b]'
                }`}
              >
                Selected Doc ({activeAudit.actions?.length || 0})
              </button>
            </div>
          )}

          {pendingCount > 0 && (
            <button
              onClick={handleExecuteAll}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs active:scale-[0.97] transition-all shrink-0"
            >
              <Zap className="w-3 h-3" />
              Execute All ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {displayedItems.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#86868b]">
            No actions in queue.
          </div>
        ) : (
          displayedItems.map(({ action, docTitle, docId }) => {
            const isCompleted = action.status === 'completed';

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
                className={`p-3.5 rounded-2xl border transition-all duration-150 ${
                  isCompleted
                    ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border-emerald-500/20'
                    : 'bg-black/[0.015] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121215] border border-black/[0.06] dark:border-white/[0.08] shrink-0 mt-0.5 shadow-2xs">
                      {getServiceIcon(action.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white truncate">
                          {action.title}
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[#86868b] shrink-0">
                          {action.targetService}
                        </span>
                      </div>

                      {/* Parent Document Tag */}
                      <div
                        onClick={() => {
                          const target = allAudits.find((a) => a.id === docId);
                          if (target) setActiveAudit(target);
                        }}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer truncate mt-0.5"
                      >
                        Doc: {docTitle}
                      </div>

                      <p className="text-[11px] text-[#86868b] mt-0.5 leading-relaxed line-clamp-2">
                        {action.description}
                      </p>

                      {action.deadlineDate && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          Deadline: {action.deadlineDate.split('T')[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Execution Button */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Done
                        </span>
                        {(action.executionResult?.externalUrl || action.executionResult?.link) && (
                          <a
                            href={action.executionResult.externalUrl || action.executionResult.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"
                          >
                            Open ↗
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => executeAction(action)}
                        className="px-2.5 py-1 rounded-xl bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/90 text-white dark:text-black text-[11px] font-bold flex items-center gap-1 transition-all active:scale-[0.97]"
                      >
                        Dispatch
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
