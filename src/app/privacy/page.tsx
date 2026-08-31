'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  FileText,
  ArrowLeft,
  Mail,
  EyeOff,
  KeyRound,
  Trash2,
  Globe,
  Database,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            SECURITY &amp; PRIVACY ARCHITECTURE
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Effective Date: August 31, 2026 • Version 2.4.0 • Zero-Knowledge Cryptographic Defense
          </p>
        </div>

        {/* Quick Summary Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Zero Data Reselling</h3>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              We never monetize, sell, or license your private banking or invoice data to third parties.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-white">14-Day Epoch Rotation</h3>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              Document line-item secrets rotate under AES-256-GCM epochs to prevent long-term exposure.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-white">User-Controlled OAuth</h3>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              Google Workspace read-only permissions can be disconnected with 1 click anytime.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white dark:bg-[#09090B] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-xs divide-y divide-black/[0.06] dark:divide-white/[0.08] space-y-8">
          {/* Section 1 */}
          <section className="space-y-3 pt-0">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              1. Information We Ingest and Process
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <p>
                FiscalSentry processes financial document data exclusively to detect invoice anomalies, calculate fair market rate benchmarks, and generate procedural dispute packets. We collect:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-[#1D1D1F] dark:text-white">Account Identifiers:</strong> Email address, user display name, and Firebase User ID (UID).</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Audit Artifacts:</strong> Line-item descriptions, billed amounts, billing codes (CPT/HCPCS/NAICS), and vendor metadata.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Inbound Webhooks &amp; Mail Pulls:</strong> Financial transaction emails, payment receipts, and RFPs ingested via automated polling or direct user upload.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 - Google API Limited Use */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              2. Google API Services User Data Policy &amp; Limited Use Disclosure
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-3">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-[#1D1D1F] dark:text-white space-y-1.5">
                <div className="font-semibold text-blue-600 dark:text-blue-400">Google Workspace Scopes Compliance</div>
                <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                  FiscalSentry&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Google API Services User Data Policy</span>, including the Limited Use requirements.
                </p>
              </div>
              <p>
                When you link your Google Account:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-[#1D1D1F] dark:text-white">Gmail Read-Only Scope (<code className="font-mono text-[11px]">gmail.readonly</code>):</strong> Used exclusively by the automated sentry worker to query financial statements, invoices, and billing notices. We filter non-financial emails immediately.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Calendar &amp; Tasks Scopes:</strong> Used strictly to create deadline reminders and appeal tasks explicitly requested by the user.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">No AI Model Training:</strong> Your Google Workspace email data is <strong>never</strong> used to train, retrain, or fine-tune generalized AI foundation models.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 - Zero-Knowledge Cryptography */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              3. Zero-Knowledge Cryptography &amp; 14-Day Epoch Rotation
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <p>
                FiscalSentry employs an advanced cryptographic protection architecture:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-[#1D1D1F] dark:text-white">Client-Side Encryption:</strong> Sensitive line-item notes and bank details are encrypted using AES-256-GCM before persistent storage in Cloud Firestore.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Epoch Key Derivation:</strong> Cryptographic epochs derive distinct initialization vectors (IV) every 14 days, bounding historical exposure.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Per-User Data Isolation:</strong> Firestore security rules strictly isolate all documents to the authenticating user UID (<code className="font-mono text-[11px]">request.auth.uid == userId</code>).</li>
              </ul>
            </div>
          </section>

          {/* Section 4 - Retention & Deletion */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              4. Data Retention, Account Deletion &amp; Right to Erasure
            </h2>
            <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed space-y-2">
              <p>
                You maintain complete ownership of your data at all times:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-[#1D1D1F] dark:text-white">Instant Export:</strong> You can export your full audit dossier in PDF, CSV, or structured JSON anytime from the top-right export ribbon.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Immediate Purge:</strong> Deleting an audit or resetting sandbox data irrevocably removes records from both local cache and Firestore.</li>
                <li><strong className="text-[#1D1D1F] dark:text-white">Sign Out Safety:</strong> Signing out terminates temporary session tokens and wipes in-memory caches from the active browser window.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 - Contact */}
          <section className="space-y-3 pt-8">
            <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500" />
              5. Contact &amp; Data Protection Officer
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed">
              If you have any questions regarding this Privacy Policy or wish to request complete cryptographic erasure of your account, please contact our security team at{' '}
              <a href="mailto:security@fiscalsentry.io" className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2">
                security@fiscalsentry.io
              </a>.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-black/[0.06] dark:border-white/[0.08] text-xs text-[#86868B]">
          <div>© 2026 FiscalSentry. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="font-semibold text-emerald-600 dark:text-emerald-400">
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
