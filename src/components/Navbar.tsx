'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  MessageSquareText,
  Settings,
  BarChart3,
  Menu,
  User as UserIcon,
  Zap,
  X,
  Sparkles,
  Compass,
  ArrowRight,
  Shield,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const {
    currentView,
    setCurrentView,
    setActiveAudit,
    loadPresetAudit,
    isSandboxDemoActive,
    clearSandboxData,
    triggerManualSentryScan,
  } = useApp();
  const { user, openAuthModal } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navigateTo = (view: 'welcome' | 'dashboard' | 'chat' | 'analytics' | 'settings', resetActiveAudit = true) => {
    if (resetActiveAudit) {
      setActiveAudit(null);
    }
    setCurrentView(view);
    setIsMobileNavOpen(false);
  };

  return (
    <>
      <header className="h-14 w-full border-b border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#000000]/90 backdrop-blur-2xl px-2.5 sm:px-4 flex items-center justify-between shrink-0 z-30 transition-colors">
        {/* Left: Mobile Statement Feed Drawer Trigger (ONLY on dashboard view) & Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onToggleMobileSidebar && currentView === 'dashboard' && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-colors active:scale-[0.97] shrink-0"
              aria-label="Toggle statements feed drawer"
              title="Open Statements Feed"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div
            onClick={() => navigateTo('welcome')}
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            <BrandLogo className="h-7" />
          </div>

          {/* Temporary Sandbox Mode Pill */}
          {isSandboxDemoActive && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Sandbox (Temp)</span>
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

        {/* Center: Desktop Segmented Navigation Control (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shrink-0">
          {/* Welcome Tour */}
          <button
            onClick={() => navigateTo('welcome')}
            className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              currentView === 'welcome'
                ? 'text-[#1d1d1f] dark:text-white'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            {currentView === 'welcome' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-white dark:bg-[#18181b] rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Welcome Tour</span>
            </span>
          </button>

          {/* Command Center */}
          <button
            onClick={() => navigateTo('dashboard')}
            className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
            <span className="relative z-10 flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </span>
          </button>

          {/* AI Workstation */}
          <button
            onClick={() => navigateTo('chat', false)}
            className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
            <span className="relative z-10 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-500" />
              <span>Voidy AI</span>
            </span>
          </button>

          {/* Financial Year & Analytics */}
          <button
            onClick={() => navigateTo('analytics', false)}
            className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
            <span className="relative z-10 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financial Year</span>
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigateTo('settings', false)}
            className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
            <span className="relative z-10 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </span>
          </button>
        </div>

        {/* Right Controls: Desktop Presets, Profile, Theme Toggle + Mobile Menu Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Preset Selector */}
          <div className="hidden lg:flex items-center">
            <select
              onChange={(e) => {
                if (e.target.value === 'clear') {
                  clearSandboxData();
                } else if (e.target.value) {
                  loadPresetAudit(e.target.value);
                  navigateTo('dashboard', false);
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

          {/* User Account Button (Desktop) */}
          <div className="hidden sm:flex items-center">
            {user ? (
              <button
                onClick={() => navigateTo('settings', false)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all"
                title="Open Account Settings"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-4 h-4 rounded-full" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="max-w-[100px] truncate">
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
          </div>

          {/* Theme Toggle (Desktop) */}
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>

          {/* Mobile Roll-Out Navigation Button (Prominent on all mobile & tablet screens) */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="lg:hidden px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs active:scale-[0.96] transition-all"
            aria-label="Open Mobile Menu"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Roll-Out Side Drawer (Unfolds like a smooth roll) */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md lg:hidden"
            />

            {/* Unrolling Drawer Panel */}
            <motion.aside
              initial={{ x: '100%', opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm bg-white dark:bg-[#0c0c0e] border-l border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:hidden"
            >
              <div className="space-y-6">
                {/* Header with Brand & Close Button */}
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <BrandLogo className="h-6" />
                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Navigation Hub */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] px-2 mb-1">
                    Navigation
                  </div>

                  <button
                    onClick={() => navigateTo('welcome')}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-[0.98] ${
                      currentView === 'welcome'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Welcome Tour</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>

                  <button
                    onClick={() => navigateTo('dashboard')}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-[0.98] ${
                      currentView === 'dashboard'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 text-blue-500" />
                      <span>Command Center (Overview)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>

                  <button
                    onClick={() => navigateTo('chat', false)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-[0.98] ${
                      currentView === 'chat'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Bot className="w-4 h-4 text-purple-500" />
                      <span>Voidy AI (Chat)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>

                  <button
                    onClick={() => navigateTo('analytics', false)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-[0.98] ${
                      currentView === 'analytics'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      <span>Financial Year & Trends</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>

                  <button
                    onClick={() => navigateTo('settings', false)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-[0.98] ${
                      currentView === 'settings'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-neutral-500" />
                      <span>Settings & Integrations</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                </div>

                {/* Instant Actions & Scenarios */}
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] px-2">
                    Quick Actions & Demos
                  </div>

                  <button
                    onClick={() => {
                      triggerManualSentryScan();
                      setIsMobileNavOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Scan Gmail Inbox Now</span>
                  </button>

                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        loadPresetAudit('medical-metro-health');
                        navigateTo('dashboard', false);
                      }}
                      className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-left text-xs font-semibold flex items-center justify-between"
                    >
                      <span>🏥 Metro Health ($1,840 Dispute)</span>
                      <span className="text-[10px] text-emerald-500 font-bold">Load</span>
                    </button>
                    <button
                      onClick={() => {
                        loadPresetAudit('vendor-techcorp-procurement');
                        navigateTo('dashboard', false);
                      }}
                      className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-left text-xs font-semibold flex items-center justify-between"
                    >
                      <span>💻 TechCorp ($3,200 Savings)</span>
                      <span className="text-[10px] text-emerald-500 font-bold">Load</span>
                    </button>
                    <button
                      onClick={() => {
                        loadPresetAudit('grant-clean-energy-rebate');
                        navigateTo('dashboard', false);
                      }}
                      className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-left text-xs font-semibold flex items-center justify-between"
                    >
                      <span>☀️ Clean Energy ($4,500 ITC)</span>
                      <span className="text-[10px] text-emerald-500 font-bold">Load</span>
                    </button>
                    {isSandboxDemoActive && (
                      <button
                        onClick={() => {
                          clearSandboxData();
                          setIsMobileNavOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Sandbox Demo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Drawer Footer: User Status & Theme Switcher */}
              <div className="pt-6 mt-6 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                {user ? (
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="text-xs">
                      <div className="font-bold truncate max-w-[140px]">
                        {user.displayName || 'User'}
                      </div>
                      <div className="text-[10px] text-[#86868b] truncate max-w-[140px]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      openAuthModal('login');
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white"
                  >
                    Sign In
                  </button>
                )}

                <ThemeToggle />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
