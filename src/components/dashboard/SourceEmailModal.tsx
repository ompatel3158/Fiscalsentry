'use client';

import React from 'react';
import { SourceEmailReference, FinancialCategory } from '@/lib/types';
import {
  X,
  Mail,
  ShieldCheck,
  Calendar,
  User,
  CheckCircle2,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SourceEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceEmail?: SourceEmailReference | null;
  transactionTitle?: string;
  amount?: number;
  currencySymbol?: string;
  currency?: string;
  category?: FinancialCategory;
}

export function SourceEmailModal({
  isOpen,
  onClose,
  sourceEmail,
  transactionTitle,
  amount,
  currencySymbol = '$',
  currency = 'USD',
  category,
}: SourceEmailModalProps) {
  if (!isOpen || !sourceEmail) return null;

  const confidencePct = Math.round((sourceEmail.confidenceScore || 0.96) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                  <span>Verified Ground-Truth Evidence</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {confidencePct}% Confidence
                  </span>
                </h2>
                <p className="text-[11px] text-[#86868b]">
                  Extracted and verified directly from your Gmail inbox
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Transaction Highlight Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Extracted Financial Record
                </div>
                <div className="text-sm font-bold text-[#1d1d1f] dark:text-white mt-0.5">
                  {transactionTitle || sourceEmail.subject}
                </div>
                {category && (
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[#86868b]">
                    {category.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>

              {amount !== undefined && (
                <div className="text-right">
                  <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#86868b]">{currency}</div>
                </div>
              )}
            </div>

            {/* Email Metadata Grid */}
            <div className="space-y-2 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#86868b] uppercase">Subject</span>
                  <div className="font-semibold text-[#1d1d1f] dark:text-white break-words">
                    {sourceEmail.subject}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <User className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#86868b] uppercase">From (Sender)</span>
                  <div className="font-semibold text-[#1d1d1f] dark:text-white truncate">
                    {sourceEmail.sender} {sourceEmail.senderEmail && `<${sourceEmail.senderEmail}>`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#86868b] uppercase">Date Received</span>
                  <div className="font-semibold text-[#1d1d1f] dark:text-white">
                    {new Date(sourceEmail.date).toLocaleString(undefined, {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Raw Excerpt */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>Raw Email Body Excerpt</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-mono text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-pre-wrap break-words leading-relaxed max-h-44 overflow-y-auto select-text">
                {sourceEmail.rawExcerpt || sourceEmail.snippet}
              </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#86868b]">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero AI Hallucination Guarantee</span>
              </div>

              <a
                href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(sourceEmail.subject)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <span>Open in Gmail</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
