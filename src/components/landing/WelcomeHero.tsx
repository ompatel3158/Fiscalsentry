'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  FileSpreadsheet,
  FileDown,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  TrendingDown,
  Globe,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function WelcomeHero() {
  const { setCurrentView, loadTemporarySandboxData } = useApp();
  const { user, connectGoogleWorkspace } = useAuth();

  const handleGetStarted = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fs_has_seen_welcome', 'true');
    }
    if (!user) {
      await connectGoogleWorkspace();
    }
    setCurrentView('dashboard');
  };

  const handleTryDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fs_has_seen_welcome', 'true');
    }
    loadTemporarySandboxData();
    setCurrentView('dashboard');
  };

  const handleEnterDashboard = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fs_has_seen_welcome', 'true');
    }
    setCurrentView('dashboard');
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#fbfbfd] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* 1. Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 max-w-6xl mx-auto text-center space-y-8">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Google All Things Agentic Hackathon • Powered by Gemini 3.5 Flash</span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white leading-[1.1]">
            The Autonomous AI Agent That Protects Your Money & Automates Financial Paperwork
          </h1>
          <p className="text-base sm:text-xl text-[#86868b] max-w-3xl mx-auto font-normal leading-relaxed">
            Stop losing thousands to illegal medical balance billing, unbundled fees, and chaotic paperwork.
            <strong className="text-[#1d1d1f] dark:text-white font-medium"> FiscalSentry</strong> continuously monitors your inbox 24/7, audits line items against federal regulations, reconciles bank liens, and takes real-world action across Google Workspace.
          </p>
        </motion.div>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2"
        >
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#1d1d1f] dark:bg-white text-white dark:text-black font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Mail className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Connect Google Workspace (1-Click Start)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleTryDemo}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/[0.06] dark:border-white/[0.1] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Try Interactive Sandbox (No Sign-In Required)</span>
          </button>

          <button
            onClick={handleEnterDashboard}
            className="w-full sm:w-auto px-5 py-3.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            Enter Dashboard Directly →
          </button>
        </motion.div>

        {/* Trust & Guarantee Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#86868b]"
        >
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Trust Client Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>No Surprises Act (45 CFR § 149) Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            <span>Multi-Currency (₹ INR, $ USD, € EUR)</span>
          </div>
        </motion.div>
      </section>

      {/* 2. Key Pillars Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Engineered For Autonomous Execution
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Not Just A Chatbot. A Complete Financial Defense System.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-all space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              24/7 Autonomous Inbox Sentry
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Monitors Gmail & webhooks automatically every 1 hour. Pulls bank debit alerts and invoices while automatically filtering out promotional discount spam.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-all space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              Deep Regulatory Auditing
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Audits CPT/ICD-10 unbundling, checks Medicare allowable benchmarks (MPFS 2026), and enforces No Surprises Act balance billing caps.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-all space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              Smart Lien & Multi-Currency Ledger
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Reconciles temporary capital blocks (IPO mandates unblocked) so net spend is ₹0.00. Seamlessly supports ₹ INR, $ USD, and € EUR.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-all space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              Multi-Destination Action Dispatch
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Dispatches appeal deadlines to Google Calendar, call scripts to Tasks, logs to Sheets, and builds signature-ready dispute PDFs in 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Scenario Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-5xl mx-auto">
        <div className="p-6 sm:p-10 rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Real-World Scenarios
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mt-1">
                See How FiscalSentry Saves Real Money
              </h3>
            </div>
            <button
              onClick={handleTryDemo}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-[0.97]"
            >
              <Zap className="w-3.5 h-3.5" />
              Load All 3 Scenarios
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <div className="text-[11px] font-bold text-rose-500 uppercase">Hospital Medical Bill</div>
              <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">Metro General Hospital</div>
              <div className="text-xs text-[#86868b]">Billed: $4,200.00 • CMS Benchmark: $2,360.00</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                +$1,840.00 Disputed Recovery
              </div>
              <p className="text-[11px] text-[#86868b] pt-1">
                Flagged CPT 99214 unbundling & out-of-network balance billing under No Surprises Act Sec. 102.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <div className="text-[11px] font-bold text-blue-500 uppercase">Hardware Procurement</div>
              <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">3-Vendor Quote Matrix</div>
              <div className="text-xs text-[#86868b]">Apex vs. Vertex vs. Nexus Proposals</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                +$3,200.00 Direct Savings
              </div>
              <p className="text-[11px] text-[#86868b] pt-1">
                Normalized quotes, awarded to Nexus Cloud Solutions, and auto-generated Purchase Order PO-2026-9921.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <div className="text-[11px] font-bold text-emerald-500 uppercase">Clean Energy Rebate</div>
              <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">Commercial Solar & Storage</div>
              <div className="text-xs text-[#86868b]">Capital Expense: $15,000.00</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                +$4,500.00 ITC Tax Credit
              </div>
              <p className="text-[11px] text-[#86868b] pt-1">
                Audited against Inflation Reduction Act (IRA) Section 48 for a 30% investment tax credit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Strip */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 text-center max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
          Ready to Automate Your Financial Defense?
        </h2>
        <p className="text-sm sm:text-base text-[#86868b] max-w-xl mx-auto">
          Connect your Google Workspace in 10 seconds or try the sandbox demo to experience autonomous AI paperwork execution.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            Start Free 1-Click Audit
          </button>
          <button
            onClick={handleTryDemo}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]"
          >
            Load Interactive Demo
          </button>
        </div>
      </section>
    </div>
  );
}
