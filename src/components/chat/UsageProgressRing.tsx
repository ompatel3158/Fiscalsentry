'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoidyRateLimit, formatCooldown } from '@/lib/rateLimiter';
import { Zap, Clock, AlertTriangle, X, Sparkles } from 'lucide-react';

interface UsageProgressRingProps {
  charCount: number;
  maxChars?: number;
  rateLimit: VoidyRateLimit;
  onRefreshState?: () => void;
}

export function UsageProgressRing({
  charCount,
  maxChars = 4000,
  rateLimit,
}: UsageProgressRingProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldownText, setCooldownText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isModalOpen]);

  // Calculate character consumption ratio
  const charPercent = Math.min(100, Math.round((charCount / maxChars) * 100));

  // Calculate rate limit request usage ratio
  const quotaPercent = Math.min(
    100,
    Math.round((rateLimit.usedRequests / rateLimit.maxRequests) * 100)
  );

  // If user is actively typing, highlight char budget, otherwise show 5-hour request quota
  const isTyping = charCount > 0;
  const activePercent = isTyping ? charPercent : quotaPercent;

  // Real-time cooldown timer update
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, rateLimit.resetAtMs - now);
      setCooldownText(formatCooldown(remainingMs));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [rateLimit.resetAtMs]);

  // Determine color theme
  let strokeColor = '#10b981';
  let badgeColor = 'text-emerald-500';
  let glowColor = 'rgba(16, 185, 129, 0.2)';

  if (activePercent >= 90 || rateLimit.isRateLimited) {
    strokeColor = '#ef4444';
    badgeColor = 'text-rose-500';
    glowColor = 'rgba(239, 68, 68, 0.4)';
  } else if (activePercent >= 70) {
    strokeColor = '#f59e0b';
    badgeColor = 'text-amber-500';
    glowColor = 'rgba(245, 158, 11, 0.3)';
  }

  // SVG Geometry
  const size = 26;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activePercent / 100) * circumference;

  const showDetails = isHovered || isModalOpen;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Tooltip / Mobile Popover Card */}
      <AnimatePresence>
        {showDetails && (
          <>
            {/* Mobile backdrop for easy dismissal */}
            {isModalOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs sm:hidden"
                onClick={() => setIsModalOpen(false)}
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-72 sm:w-64 rounded-2xl bg-white dark:bg-[#121215] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-3.5 z-50 text-xs backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-2 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-[#1d1d1f] dark:text-white">
                  <Zap className={`w-3.5 h-3.5 ${badgeColor}`} />
                  <span>Voidy AI Usage Quota</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    rateLimit.isRateLimited
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {rateLimit.isRateLimited ? 'RATE LIMITED' : 'ACTIVE'}
                  </span>
                  {isModalOpen && (
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quota Details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[#86868b]">
                  <span>5-Hour Queries:</span>
                  <span className="font-mono font-bold text-[#1d1d1f] dark:text-white">
                    {rateLimit.usedRequests} / {rateLimit.maxRequests} used
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#86868b]">
                  <span>Remaining Requests:</span>
                  <span className={`font-mono font-bold ${rateLimit.remainingRequests <= 3 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {rateLimit.remainingRequests} left
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#86868b]">
                  <span>Message Length:</span>
                  <span className="font-mono font-bold text-[#1d1d1f] dark:text-white">
                    {charCount} / {maxChars} chars
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#86868b] pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Resets in:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-500">
                    {cooldownText}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SVG Circular Progress Ring Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen((prev) => !prev)}
        aria-label="View Voidy AI Quota Usage"
        className={`relative cursor-pointer transition-transform active:scale-95 focus:outline-none rounded-full ${
          rateLimit.isRateLimited ? 'animate-pulse' : ''
        }`}
        style={{
          filter: activePercent >= 90 ? `drop-shadow(0 0 4px ${glowColor})` : 'none',
        }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Active Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {rateLimit.isRateLimited ? (
            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
          ) : isTyping ? (
            <span className="text-[8px] font-mono font-bold text-slate-600 dark:text-slate-300">
              {charPercent}%
            </span>
          ) : (
            <Zap className={`w-2.5 h-2.5 ${badgeColor}`} />
          )}
        </div>
      </button>
    </div>
  );
}