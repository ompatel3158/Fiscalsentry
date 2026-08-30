'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { WelcomeHero } from '@/components/landing/WelcomeHero';
import { DropZone } from '@/components/dashboard/DropZone';
import { AuditInspector } from '@/components/dashboard/AuditInspector';
import { ActionDrawer } from '@/components/dashboard/ActionDrawer';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsView } from '@/components/settings/SettingsView';
import { FinancialYearView } from '@/components/analytics/FinancialYearView';
import { GroupedAuditList } from '@/components/dashboard/GroupedAuditList';
import { AggregateOverview } from '@/components/dashboard/AggregateOverview';
import { MonthOverviewCanvas } from '@/components/dashboard/MonthOverviewCanvas';
import { PDFPreviewModal } from '@/components/modals/PDFPreviewModal';
import { IntegrationsModal } from '@/components/modals/IntegrationsModal';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  TrendingDown,
  Sparkles,
  FileDown,
  X,
  Shield,
  UploadCloud,
  FileSpreadsheet,
  Cpu,
  Trash2,
  Scale,
  Zap,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const {
    currentView,
    setCurrentView,
    allAudits,
    activeAudit,
    setActiveAudit,
    isSandboxDemoActive,
    loadTemporarySandboxData,
    clearSandboxData,
    triggerManualSentryScan,
    executeAllPendingActions,
    setPdfAuditTarget,
    setIsPDFModalOpen,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const totalRecovery = allAudits.reduce((acc, a) => acc + (a.potentialRecoveryAmount || 0), 0);

  const primarySymbol = useMemo(() => {
    if (allAudits.length === 0) return '$';
    const counts: Record<string, number> = {};
    allAudits.forEach((a) => {
      const sym = a.currencySymbol || '$';
      counts[sym] = (counts[sym] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || '$';
  }, [allAudits]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#fbfbfd] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] overflow-hidden select-none">
      {/* 1. Responsive Top Navigation */}
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentView === 'welcome' ? (
          /* Welcome Landing Page for first-time visitors & tour */
          <WelcomeHero />
        ) : currentView === 'dashboard' ? (
          <div className="flex-1 flex w-full h-full overflow-hidden relative">
            {/* Desktop Left Feed Pane (320px) */}
            <aside className="hidden lg:flex w-80 h-full border-r border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl flex-col shrink-0">
              {/* Sentry Watcher Status */}
              <div className="p-3.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                    24/7 Workspace Sentry
                  </span>
                </div>
                <button
                  onClick={() => triggerManualSentryScan()}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-colors active:scale-[0.97]"
                >
                  Scan Now
                </button>
              </div>

              {/* Stat Metric Ribbon */}
              <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-[#86868b] uppercase tracking-wider font-semibold">
                    Total Funds Disputed
                  </div>
                  {isSandboxDemoActive && (
                    <button
                      onClick={clearSandboxData}
                      className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
                      title="Clear Sandbox Demo Data"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear Sandbox
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  {formatCurrency(totalRecovery, primarySymbol)}
                </div>
                <div className="text-[11px] text-[#86868b] mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-emerald-500" />
                  {allAudits.length > 0 ? '31.4% avg. healthcare/vendor recovery rate' : 'No active disputes logged'}
                </div>
              </div>

              {/* Feed Header */}
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#86868b] flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04]">
                <span>Audited Statements ({allAudits.length})</span>
                <button
                  onClick={() => {
                    setSelectedMonthKey(null);
                    setActiveAudit(null);
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeAudit === null && selectedMonthKey === null
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                  title="View Total Aggregate Dashboard"
                >
                  Total Overview
                </button>
              </div>

              {/* Document List or Clean State */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {allAudits.length === 0 ? (
                  <div className="p-6 text-center space-y-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#86868b] mx-auto opacity-40" />
                    <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">
                      Live Workspace Clean
                    </p>
                    <p className="text-[11px] text-[#86868b] leading-relaxed">
                      Upload any medical bill, invoice, or vendor quote PDF to trigger Gemini 3.5 auditing.
                    </p>
                    <button
                      onClick={loadTemporarySandboxData}
                      className="w-full py-2 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-[#1d1d1f] dark:text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Load Temporary Demo Data
                    </button>
                  </div>
                ) : (
                  <GroupedAuditList
                    audits={allAudits}
                    activeAuditId={activeAudit?.id}
                    onSelectAudit={(audit) => {
                      setSelectedMonthKey(null);
                      setActiveAudit(audit);
                    }}
                    onSelectMonth={(mKey) => {
                      setActiveAudit(null);
                      setSelectedMonthKey(mKey);
                    }}
                    compact
                  />
                )}
              </div>
            </aside>

            {/* Mobile Slide-Over Drawer for Feed */}
            <AnimatePresence>
              {isMobileSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
                    className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-[#09090b] border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col lg:hidden shadow-2xl"
                  >
                    <div className="p-3.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold">Statements & Sentry</span>
                      </div>
                      <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868b]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                      <div className="text-[10px] text-[#86868b] uppercase font-semibold">Total Funds Disputed</div>
                      <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalRecovery, primarySymbol)}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                      {allAudits.length === 0 ? (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-[#86868b]">No statements loaded yet.</p>
                          <button
                            onClick={() => {
                              loadTemporarySandboxData();
                              setIsMobileSidebarOpen(false);
                            }}
                            className="text-xs text-emerald-600 font-bold underline"
                          >
                            Load Demo Scenarios
                          </button>
                        </div>
                      ) : (
                        <GroupedAuditList
                          audits={allAudits}
                          activeAuditId={activeAudit?.id}
                          onSelectAudit={(audit) => {
                            setSelectedMonthKey(null);
                            setActiveAudit(audit);
                            setIsMobileSidebarOpen(false);
                          }}
                          onSelectMonth={(mKey) => {
                            setActiveAudit(null);
                            setSelectedMonthKey(mKey);
                            setIsMobileSidebarOpen(false);
                          }}
                          compact
                        />
                      )}
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Right Main Canvas: Total Dashboard Overview by default, or specific audit detail */}
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#fbfbfd] dark:bg-[#000000] p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {activeAudit ? (
                <>
                  {/* Document Header & Responsive Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <div>
                      {/* Back to Overview Button */}
                      <button
                        onClick={() => setActiveAudit(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-2 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Total Dashboard Overview</span>
                      </button>

                      <div className="flex items-center flex-wrap gap-2">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
                          {activeAudit.title}
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {activeAudit.riskLevel} Overcharge
                        </span>
                        {isSandboxDemoActive && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                            ⚡ Demo Sandbox
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#86868b] mt-1 flex items-center flex-wrap gap-2 sm:gap-3">
                        <span>Provider: {activeAudit.providerOrVendor}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Date: {activeAudit.documentDate}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Ref: {activeAudit.accountNumber || activeAudit.id}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => {
                          setPdfAuditTarget(activeAudit);
                          setIsPDFModalOpen(true);
                        }}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5 border border-black/[0.06] dark:border-white/[0.08] transition-all active:scale-[0.97]"
                      >
                        <FileDown className="w-3.5 h-3.5 text-rose-500" />
                        <span className="hidden sm:inline">Preview</span> PDF
                      </button>

                      <button
                        onClick={() => executeAllPendingActions(activeAudit.id)}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all active:scale-[0.97]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Execute All
                      </button>
                    </div>
                  </div>

                  {/* Responsive Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-[#86868b]">Original Billed</span>
                      <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#1d1d1f] dark:text-white mt-0.5">
                        {formatCurrency(activeAudit.totalBilledAmount, activeAudit.currencySymbol, activeAudit.currency)}
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-[#86868b]">CMS Benchmark</span>
                      <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(activeAudit.fairBenchmarkAmount, activeAudit.currencySymbol, activeAudit.currency)}
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        Disputed Recovery Target
                      </span>
                      <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">
                        +{formatCurrency(activeAudit.potentialRecoveryAmount, activeAudit.currencySymbol, activeAudit.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Responsive 12-Column Layout */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
                    <div className="xl:col-span-8 w-full overflow-hidden">
                      <AuditInspector />
                    </div>
                    <div className="xl:col-span-4 w-full space-y-4 sm:space-y-6">
                      <ActionDrawer />
                      <DropZone />
                    </div>
                  </div>
                </>
              ) : selectedMonthKey ? (
                /* In-Canvas Month Overview */
                <MonthOverviewCanvas
                  monthKey={selectedMonthKey}
                  onBack={() => setSelectedMonthKey(null)}
                  onSelectAudit={(audit) => {
                    setSelectedMonthKey(null);
                    setActiveAudit(audit);
                  }}
                />
              ) : (
                /* Total Aggregate Financial Dashboard Overview (Default on Load) */
                <div className="space-y-6">
                  <AggregateOverview
                    audits={allAudits}
                    onSelectAudit={(audit) => {
                      setSelectedMonthKey(null);
                      setActiveAudit(audit);
                    }}
                    onScanNow={(tier) => triggerManualSentryScan(undefined, tier || 'delta')}
                    onLoadDemo={loadTemporarySandboxData}
                  />
                  <div className="max-w-2xl mx-auto pt-2">
                    <DropZone />
                  </div>
                </div>
              )}
            </main>
          </div>
        ) : currentView === 'chat' ? (
          /* Responsive AI Workstation View */
          <div className="flex-1 flex h-full w-full overflow-hidden relative">
            {/* Desktop Chat Sidebar */}
            <div className="hidden lg:flex h-full">
              <ChatSidebar />
            </div>

            {/* Mobile Slide-Over Chat Sidebar */}
            <AnimatePresence>
              {isMobileSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
                    className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-[#09090b] flex lg:hidden shadow-2xl"
                  >
                    <ChatSidebar isMobile onCloseMobile={() => setIsMobileSidebarOpen(false)} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Chat Area & Universal Input */}
            <div className="flex-1 flex flex-col h-full bg-[#fbfbfd] dark:bg-[#000000]">
              <ChatArea />
              <ChatInput />
            </div>
          </div>
        ) : currentView === 'analytics' ? (
          /* Financial Year & Spending Tracker View */
          <div className="flex-1 flex h-full w-full overflow-y-auto bg-[#fbfbfd] dark:bg-[#000000]">
            <FinancialYearView />
          </div>
        ) : (
          /* Dedicated Control Center & Settings View */
          <div className="flex-1 flex h-full w-full overflow-hidden">
            <SettingsView />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <AuthModal />
      <PDFPreviewModal />
      <IntegrationsModal />
    </div>
  );
}
