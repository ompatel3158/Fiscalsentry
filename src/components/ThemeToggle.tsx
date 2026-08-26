'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 shadow-subtle transition-all duration-150 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      <div className="w-5 h-5 relative flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0,
          }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          className="absolute"
        >
          <Sun className="w-4 h-4 text-amber-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90,
          }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          className="absolute"
        >
          <Moon className="w-4 h-4 text-indigo-400" />
        </motion.div>
      </div>
    </button>
  );
}
