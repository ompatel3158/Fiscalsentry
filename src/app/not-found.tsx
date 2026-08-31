'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, Sparkles, RefreshCw, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        className="relative z-10 max-w-lg w-full bg-[#121215]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6"
      >
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldAlert className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            ERR_404_ROUTE_NOT_FOUND
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Security Perimeter Cleared
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed max-w-sm mx-auto">
            The encrypted statement, document hash, or endpoint you are looking for has been rotated, deleted, or relocated by the FiscalSentry vault.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97]"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            Re-scan Sentry Route
          </button>
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#86868b] font-mono">
          <span>Autonomous Paperwork Defense</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Gemini 3.7 Online
          </span>
        </div>
      </motion.div>
    </div>
  );
}
