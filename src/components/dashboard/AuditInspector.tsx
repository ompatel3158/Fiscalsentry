'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/types';
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Scale,
  ArrowLeft,
  Mail,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuditInspector() {
  const { activeAudit, setActiveAudit, setIsPDFModalOpen, setPdfAuditTarget } = useApp();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'line_items' | 'raw_email'>('line_items');

  if (!activeAudit) return null;

  const sym = activeAudit.currencySymbol || '$';
  const isHoldOrReleased =
    activeAudit.transactionType === 'hold_lien' || activeAudit.transactionType === 'unblocked_lien';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overcharge':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20 font-mono">
            OVERCHARGE
          </span>
        );
      case 'unbundled':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 font-mono">
            UNBUNDLED
          </span>
        );
      case 'statutory_violation':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-500/30 font-mono">
            NSA BREACH
          </span>
        );
      case 'negotiable':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 font-mono">
            NEGOTIABLE
          </span>
        );
      case 'rebate_eligible':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-mono">
            REBATE
          </span>
        );
      case 'compliant':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[#86868b] text-[10px] font-semibold font-mono">
            COMPLIANT
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Document Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveAudit(null)}
              className="p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-all active:scale-[0.97]"
              title="Back to Overview Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-white">
                  {activeAudit.title}
                </h1>
                {isHoldOrReleased && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
                    IPO Mandate Released (Net Spend: 0.00)
                  </span>
                )}
                {activeAudit.isRecurringSubscription && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                    Recurring Subscription
                  </span>
                )}
              </div>
              <div className="text-xs text-[#86868b] mt-0.5 flex items-center gap-2">
                <span>{activeAudit.providerOrVendor}</span>
                <span>•</span>
                <span>{activeAudit.documentDate || activeAudit.createdAt.split('T')[0]}</span>
                <span>•</span>
                <span className="font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  {activeAudit.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick PDF Packet Generator */}
          <button
            onClick={() => {
              setPdfAuditTarget(activeAudit);
              setIsPDFModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-bold transition-all active:scale-[0.97] self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Packet (PDF)
          </button>
        </div>

        {/* Metric Cards Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[10px] font-bold text-[#86868b] uppercase">Billed Amount</div>
            <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white mt-0.5">
              {formatCurrency(activeAudit.totalBilledAmount, sym, activeAudit.currency)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[10px] font-bold text-[#86868b] uppercase">Fair Benchmark Target</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {formatCurrency(activeAudit.fairBenchmarkAmount, sym, activeAudit.currency)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[10px] font-bold text-[#86868b] uppercase">Disputed Savings Identified</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(activeAudit.potentialRecoveryAmount, sym, activeAudit.currency)}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-[#1d1d1f] dark:text-[#f5f5f7]">
          <strong>Gemini 3.1 Analysis:</strong> {activeAudit.summary}
        </div>
      </div>

      {/* Tab Switcher: Line Items vs Raw Mail */}
      <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('line_items')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'line_items'
              ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          Line-Item Audit ({activeAudit.lineItems.length})
        </button>

        <button
          onClick={() => setActiveTab('raw_email')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'raw_email'
              ? 'bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white shadow-xs'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          Decoded Email & Paperwork
        </button>
      </div>

      {/* 1. Line Items Table */}
      {activeTab === 'line_items' ? (
        <div className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#86868b] font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Description & Regulatory Basis</th>
                  <th className="py-2.5 px-4 text-right">Billed</th>
                  <th className="py-2.5 px-4 text-right">Fair Rate</th>
                  <th className="py-2.5 px-4 text-right">Savings Delta</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {activeAudit.lineItems.map((item) => {
                  const isExpanded = expandedItemId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors duration-100 ${
                          isExpanded ? 'bg-black/[0.03] dark:bg-white/[0.04]' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#1d1d1f] dark:text-white">
                          {item.code || 'ITEM'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1d1d1f] dark:text-white">
                            {item.description}
                          </div>
                          {item.violationType && (
                            <div className="text-[11px] text-[#86868b] mt-0.5">
                              {item.violationType}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#1d1d1f] dark:text-white">
                          {formatCurrency(item.originalAmount, sym, activeAudit.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.benchmarkAmount, sym, activeAudit.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {item.deltaSavings > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              -{formatCurrency(item.deltaSavings, sym, activeAudit.currency)}
                            </span>
                          ) : (
                            <span className="text-[#86868b]">$0.00</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-2 text-center text-[#86868b]">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </td>
                      </tr>

                      {/* Expandable Reasoning */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-y border-black/[0.04] dark:border-white/[0.04]">
                            <div className="flex items-start gap-2.5 text-xs">
                              <Scale className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-[#1d1d1f] dark:text-white">
                                  Gemini 3.1 Statutory Audit & Compliance Precedent:
                                </span>
                                <p className="text-[#86868b] dark:text-slate-300 mt-1 leading-relaxed">
                                  {item.reasoning}
                                </p>
                                <div className="mt-2 text-[10px] text-[#86868b] font-mono">
                                  Confidence: {(item.confidenceScore * 100).toFixed(0)}% • Verified against statutory benchmarks
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Statutory Citations Footer */}
          {activeAudit.citations && activeAudit.citations.length > 0 && (
            <div className="p-4 bg-black/[0.01] dark:bg-white/[0.01] border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Statutory Governance & Applicable Laws
              </div>
              {activeAudit.citations.map((cit, idx) => (
                <div key={idx} className="text-xs text-[#86868b] pl-5">
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{cit.statute}</strong> ({cit.applicableSection}): {cit.summary}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 2. Raw Email / Paperwork Viewer */
        <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1d1d1f] dark:text-white">
            <Mail className="w-4 h-4 text-blue-500" />
            Decoded Email & Document Content
          </div>
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] font-mono text-xs text-[#1d1d1f] dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {activeAudit.rawDocumentText || 'No raw email body text recorded for this statement.'}
          </div>
        </div>
      )}
    </div>
  );
}
