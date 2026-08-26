'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { LayoutDashboard, MessageSquareText, Settings, BarChart3, Menu, User as UserIcon, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { currentView, setCurrentView, loadPresetAudit, isSandboxDemoActive, clearSandboxData, loadTemporarySandboxData } = useApp();
  const { user, openAuthModal } = useAuth();

  return (
    <header className="h-14 w-full border-b border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#000000]/90 backdrop-blur-2xl px-2.5 sm:px-4 flex items-center justify-between shrink-0 z-30 transition-colors">
      {/* Left: Mobile Drawer Trigger & Brand Logo */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-colors active:scale-[0.97] shrink-0"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <BrandLogo className="h-7" />

        {/* Temporary Sandbox Mode Pill */}
        {isSandboxDemoActive && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Sandbox Mode (Temp)</span>
            <button
              onClick={clearSandboxData}
              className="ml-1 hover:text-rose-500 transition-colors p-0.5 rounded"
              title="Clear temporary sandbox data"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Center: Segmented Navigation Control */}
      <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shrink-0">
        {/* Command Center */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`relative px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors ${
            currentView === 'dashboard'
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          {currentView === 'dashboard' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-white dark:bg-[#18181b] rounded-lg shadow-sm"
              transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Command Center</span>
            <span className="md:hidden">Audit</span>
          </span>
        </button>

        {/* AI Workstation */}
        <button
          onClick={() => setCurrentView('chat')}
          className={`relative px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors ${
            currentView === 'chat'
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          {currentView === 'chat' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-white dark:bg-[#18181b] rounded-lg shadow-sm"
              transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
            <MessageSquareText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Workstation</span>
            <span className="md:hidden">Chat</span>
          </span>
        </button>

        {/* Financial Year & Analytics */}
        <button
          onClick={() => setCurrentView('analytics')}
          className={`relative px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors ${
            currentView === 'analytics'
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          {currentView === 'analytics' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-white dark:bg-[#18181b] rounded-lg shadow-sm"
              transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Financial Year</span>
            <span className="md:hidden">FY</span>
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setCurrentView('settings')}
          className={`relative px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors ${
            currentView === 'settings'
              ? 'text-[#1d1d1f] dark:text-white'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          {currentView === 'settings' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-white dark:bg-[#18181b] rounded-lg shadow-sm"
              transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Settings</span>
          </span>
        </button>
      </div>

      {/* Right: Demo Presets, Auth Profile, Theme Toggle */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Preset Selector with explicit dark mode styling */}
        <div className="hidden lg:flex items-center">
          <select
            onChange={(e) => {
              if (e.target.value === 'clear') {
                clearSandboxData();
              } else if (e.target.value) {
                loadPresetAudit(e.target.value);
              }
            }}
            value=""
            className="text-xs bg-black/5 dark:bg-[#18181b] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-xl px-2.5 py-1 font-medium focus:outline-none cursor-pointer border border-black/[0.06] dark:border-white/[0.1] shadow-2xs"
          >
            <option value="" disabled className="bg-white dark:bg-[#18181b] text-[#86868b]">
              ⚡ Test Scenarios
            </option>
            <option value="medical-metro-health" className="bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white">
              🏥 Metro Health ($1,840 Dispute)
            </option>
            <option value="vendor-techcorp-procurement" className="bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white">
              💻 TechCorp ($3,200 Savings)
            </option>
            <option value="grant-clean-energy-rebate" className="bg-white dark:bg-[#18181b] text-[#1d1d1f] dark:text-white">
              ☀️ Clean Energy ($4,500 ITC)
            </option>
            <option value="clear" className="bg-white dark:bg-[#18181b] text-rose-500 font-semibold">
              🧹 Clear Sandbox
            </option>
          </select>
        </div>

        {/* User Account / Profile Badge */}
        {user ? (
          <button
            onClick={() => setCurrentView('settings')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all"
            title="Open Account Settings"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-4 h-4 rounded-full" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="max-w-[100px] truncate hidden sm:inline">
              {user.displayName || user.email?.split('@')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-[0.97]"
          >
            Sign In
          </button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
