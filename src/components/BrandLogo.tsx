'use client';

import React from 'react';

export function BrandLogo({ className = 'h-7', showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Symmetrical Mark */}
      <svg viewBox="0 0 240 240" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(120,120) scale(0.95)">
          <path d="M0,-115 L-80,-65 L-80,25 L0,115 Z" fill="#0E2A47" className="dark:fill-[#123350]" />
          <path d="M0,-115 L80,-65 L80,25 L0,115 Z" fill="#14C9B7" />
          <circle cx="0" cy="0" r="34" fill="#FFFFFF" stroke="#0E2A47" strokeWidth="2" />
          <path d="M0,-14 L14,0 L0,14 L-14,0 Z" fill="#D9A441" />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="text-xs sm:text-sm font-black tracking-wider flex items-center">
            <span className="text-[#0E2A47] dark:text-white">FISCAL</span>
            <span className="text-[#14C9B7]">SENTRY</span>
          </div>
          <span className="hidden sm:block text-[8px] font-bold tracking-widest text-[#86868B] dark:text-[#9AA5B1] uppercase mt-0.5">
            Financial Action Engine
          </span>
        </div>
      )}
    </div>
  );
}
