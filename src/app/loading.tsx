'use client';

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.15),transparent_65%)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 border-r-teal-400 shadow-lg shadow-emerald-500/10"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-dashed border-emerald-500/30"
          />
          <div className="w-14 h-14 rounded-2xl bg-[#121215] border border-white/[0.08] flex items-center justify-center shadow-xl">
            <Shield className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-2">
            FiscalSentry Decrypting Workspace
          </h2>
          <p className="text-xs text-[#86868b] max-w-xs leading-relaxed">
            Synchronizing zero-knowledge encryption keys and Gemini 3.7 financial intelligence...
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>SENTRY_NODE_INITIALIZING</span>
        </div>
      </div>
    </div>
  );
}
