'use client';

import React from 'react';
import { X, ShieldCheck, Lock, FileText, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#09090b] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                  Terms of Service & Privacy Policy
                </h2>
                <p className="text-[11px] text-[#86868b]">
                  Last Updated: August 2026 • FiscalSentry Autonomous Action Engine
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#86868b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                1. Statutory Financial Defense & Disclaimer
              </h3>
              <p className="text-[#86868b] dark:text-[#a1a1a6]">
                FiscalSentry provides automated financial document analysis, line-item audits, and procedural dispute drafting referencing public statutory benchmarks including the No Surprises Act (45 C.F.R. § 149), CMS National Correct Coding Initiative (NCCI), and FAR procurement regulations. Output is informational and does not constitute formal legal counsel.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                2. 14-Day Rotating Encryption & Zero-Knowledge Architecture
              </h3>
              <p className="text-[#86868b] dark:text-[#a1a1a6]">
                All sensitive document line items, bank reference numbers, and personal identifiers are encrypted client-side using AES-256-GCM before transmission. Encryption keys automatically rotate every 14 days under cryptographic epochs. Your master secret remains strictly in your control.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                3. Google Workspace & 3rd-Party Action Execution
              </h3>
              <p className="text-[#86868b] dark:text-[#a1a1a6]">
                When you dispatch actions to Google Calendar, Google Tasks, Google Sheets, or Slack, FiscalSentry transmits only the necessary metadata parameters required to create the target entry. You retain full revoke authority over OAuth connections at all times.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                4. 15-Day Session Security Timeout
              </h3>
              <p className="text-[#86868b] dark:text-[#a1a1a6]">
                In compliance with strict financial governance standards, user sessions expire automatically after 15 continuous days, requiring re-authentication to prevent unauthorized terminal access.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black text-xs font-bold transition-all active:scale-[0.97]"
            >
              I Understand & Agree
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
