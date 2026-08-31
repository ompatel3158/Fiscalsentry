'use client';

import React from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  Lock,
  FileText,
  ArrowLeft,
  AlertTriangle,
  Zap,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased selection:bg-[#14C9B7]/20 selection:text-[#0E2A47] dark:selection:text-[#14C9B7]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 h-16 w-full border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#000000]/80 backdrop-blur-2xl px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold transition-all active:scale-[0.97]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Title Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
            <Scale className="w-3.5 h-3.5" />
            LEGAL &amp; OPERATIONAL GOVERNANCE
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
            Terms and Conditions
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Effective Date: August 31, 2026 • Version 2.4.0 • FiscalSentry Autonomous Action Engine
          </p>
        </div>

        {/* Quick Highlights Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Statutory Financial Benchmarks</h3>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              Audits reference federal standards including the No Surprises Act (45 C.F.R. § 149) and CMS NCCI rules.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Action Execution Consent</h3>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              Calendar scheduling, task creation, and dispute filing are executed only upon explicit user triggers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-white">15-Day Session Lifetime</h3>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              In-browser active sessions auto-expire after 15 continuous days to prevent unauthorized workstation access.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-xs divide-y divide-black/[0.06] dark:divide-white/[0.08] space-y-8">
          {/* Section 1 */}
          <section className="space-y-3 pt-0">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              1. Acceptance of Terms &amp; Scope of Services
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <p>
                By accessing, authenticating into, or using FiscalSentry (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. FiscalSentry is an autonomous paperwork reasoning engine powered by multimodal artificial intelligence (Gemini 3.7 Flash) designed to assist individuals and businesses in auditing financial statements, RFP proposals, medical bills, utility statements, and SaaS subscription commitments.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              2. Financial Defense Informational Disclaimer
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#1D1D1F] dark:text-white space-y-1">
                <div className="font-semibold text-amber-600 dark:text-amber-400">Not Legal or Financial Advice</div>
                <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                  The outputs, benchmark calculations, statutory citations, and procedural dispute letters generated by FiscalSentry are for informational and decision-support purposes only. They do not constitute formal legal counsel, tax advice, or certified public accountancy.
                </p>
              </div>
              <p>
                You retain ultimate discretion over whether to submit generated dispute dossiers to billing departments, insurance payers, or statutory dispute resolution bodies.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              3. Automated Sentry Worker &amp; External Integrations
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <p>
                When connecting external integrations (including Google Workspace, ERP webhooks, Slack, and Discord):
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>You authorize FiscalSentry to pull and inspect incoming financial transaction emails on your designated schedule.</li>
                <li>When executing action DAG items, FiscalSentry will create corresponding Google Calendar deadlines, Google Tasks, or send webhook payloads to your configured endpoints.</li>
                <li>You can disconnect any integration at any time from your Account Settings.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              4. Cryptographic Security &amp; User Responsibilities
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <p>
                You are responsible for maintaining the confidentiality of your credentials. You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Attempt to bypass client-side encryption or extract decrypted payload buffers belonging to other users.</li>
                <li>Abuse API rate limits or deploy adversarial scripts intended to disrupt platform availability.</li>
                <li>Upload fraudulent documents with the intent to generate deceptive legal claims.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              5. Limitation of Liability
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed">
              To the maximum extent permitted by applicable law, FiscalSentry and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform, the outcome of any billing dispute, or any typographical inaccuracies in vendor invoices.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-black/[0.06] dark:border-white/[0.08] text-xs text-[#86868B]">
          <div>© 2026 FiscalSentry. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="font-semibold text-emerald-600 dark:text-emerald-400">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
