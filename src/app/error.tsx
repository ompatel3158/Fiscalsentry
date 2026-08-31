'use client';

import React, { useEffect } from 'react';
import { ShieldX, RefreshCw, Home, Terminal, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FiscalSentry Sentry Boundary Error]:', error);
  }, [error]);

  const handleRecover = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fs_cached_audits');
        localStorage.removeItem('fs_chat_sessions');
        localStorage.removeItem('fs_chat_messages_map');
      }
    } catch (_) {}
    reset();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  const handleReturnHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(239,68,68,0.1),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-[#121215]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            SENTRY_SECURITY_INTERCEPT
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Workspace Interception Handled
          </h1>
          <p className="text-xs text-[#86868b] leading-relaxed max-w-sm mx-auto">
            {error?.message || 'An unexpected cryptographic exception occurred during document ingestion.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRecover}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recover Workspace
          </button>
          <button
            onClick={handleReturnHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Return Home
          </button>
        </div>

        <div className="pt-4 border-t border-white/[0.06] text-[11px] text-[#86868b] font-mono flex items-center justify-between">
          <span>Digest: {error.digest || 'LOCAL_EXCEPTION'}</span>
          <span className="text-emerald-400 font-semibold">Self-Healing Active</span>
        </div>
      </div>
    </div>
  );
}
