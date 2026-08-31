'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  FileCode,
  Table,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditResult } from '@/lib/types';
import {
  exportAuditToWord,
  exportAuditToExcel,
  exportAuditToCSV,
  exportAuditToJSON,
  exportMonthlyLedgerToWord,
  exportMonthlyLedgerToExcel,
  exportMonthlyLedgerToCSV,
} from '@/lib/exportUtils';
import { toast } from 'sonner';

interface ExportDropdownProps {
  audit?: AuditResult | null;
  monthlyAudits?: AuditResult[];
  monthLabel?: string;
  onOpenPDF?: () => void;
  buttonLabel?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

export function ExportDropdown({
  audit,
  monthlyAudits,
  monthLabel,
  onOpenPDF,
  buttonLabel = 'Export Dossier',
  variant = 'secondary',
  size = 'md',
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'pdf' | 'word' | 'excel' | 'csv' | 'json') => {
    setIsOpen(false);
    try {
      if (format === 'pdf') {
        if (onOpenPDF) onOpenPDF();
        else window.print();
        toast.success('Opening Printable PDF Dossier...');
        return;
      }
      if (monthlyAudits && monthLabel) {
        if (format === 'word') {
          exportMonthlyLedgerToWord(monthlyAudits, monthLabel);
          toast.success('Exported ' + monthLabel + ' Ledger to Word (.doc)');
        } else if (format === 'excel') {
          exportMonthlyLedgerToExcel(monthlyAudits, monthLabel);
          toast.success('Exported ' + monthLabel + ' Ledger to Excel (.xls)');
        } else if (format === 'csv') {
          exportMonthlyLedgerToCSV(monthlyAudits, monthLabel);
          toast.success('Exported ' + monthLabel + ' Ledger to CSV (.csv)');
        }
        return;
      }
      if (audit) {
        if (format === 'word') {
          exportAuditToWord(audit);
          toast.success('Exported Statement to Word (.doc)');
        } else if (format === 'excel') {
          exportAuditToExcel(audit);
          toast.success('Exported Line Items to Excel (.xls)');
        } else if (format === 'csv') {
          exportAuditToCSV(audit);
          toast.success('Exported Line Items to CSV (.csv)');
        } else if (format === 'json') {
          exportAuditToJSON(audit);
          toast.success('Exported Cryptographic Audit to JSON (.json)');
        }
      }
    } catch (err: any) {
      toast.error('Export failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const buttonClasses =
    variant === 'primary'
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[#1d1d1f] dark:text-white'
      : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white border border-black/[0.06] dark:border-white/[0.08]';

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs gap-1' : 'px-3 py-1.5 text-xs font-semibold gap-1.5';

  return (
    <div className='relative inline-block text-left' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
        className={'inline-flex items-center rounded-xl font-bold transition-all active:scale-[0.97] ' + buttonClasses + ' ' + sizeClasses}
      >
        <FileDown className='w-3.5 h-3.5' />
        <span>{buttonLabel}</span>
        <ChevronDown className={'w-3 h-3 text-[#86868b] transition-transform duration-200 ' + (isOpen ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ type: 'spring', bounce: 0.12, duration: 0.2 }}
            className='absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#121215] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-1.5 z-50 space-y-0.5 backdrop-blur-xl'
          >
            <div className='px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#86868b] border-b border-black/[0.04] dark:border-white/[0.04] mb-1'>
              Select Export Format
            </div>
            <button
              onClick={() => handleExport('pdf')}
              className='w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left'
            >
              <div className='flex items-center gap-2'>
                <div className='p-1 rounded-lg bg-rose-500/10 text-rose-500'>
                  <FileText className='w-3.5 h-3.5' />
                </div>
                <div>
                  <div className='font-bold'>PDF Dossier</div>
                  <div className='text-[10px] text-[#86868b]'>Certified printable PDF (.pdf)</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleExport('word')}
              className='w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left'
            >
              <div className='flex items-center gap-2'>
                <div className='p-1 rounded-lg bg-blue-500/10 text-blue-500'>
                  <FileText className='w-3.5 h-3.5' />
                </div>
                <div>
                  <div className='font-bold'>Word Document</div>
                  <div className='text-[10px] text-[#86868b]'>Microsoft Word (.docx / .doc)</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className='w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left'
            >
              <div className='flex items-center gap-2'>
                <div className='p-1 rounded-lg bg-emerald-500/10 text-emerald-500'>
                  <FileSpreadsheet className='w-3.5 h-3.5' />
                </div>
                <div>
                  <div className='font-bold'>Excel Spreadsheet</div>
                  <div className='text-[10px] text-[#86868b]'>Formatted sheet (.xlsx / .xls)</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className='w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left'
            >
              <div className='flex items-center gap-2'>
                <div className='p-1 rounded-lg bg-amber-500/10 text-amber-500'>
                  <Table className='w-3.5 h-3.5' />
                </div>
                <div>
                  <div className='font-bold'>CSV Spreadsheet</div>
                  <div className='text-[10px] text-[#86868b]'>Comma-separated values (.csv)</div>
                </div>
              </div>
            </button>
            {audit && (
              <button
                onClick={() => handleExport('json')}
                className='w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left'
              >
                <div className='flex items-center gap-2'>
                  <div className='p-1 rounded-lg bg-purple-500/10 text-purple-500'>
                    <FileCode className='w-3.5 h-3.5' />
                  </div>
                  <div>
                    <div className='font-bold'>JSON Vault Object</div>
                    <div className='text-[10px] text-[#86868b]'>Raw cryptographic payload (.json)</div>
                  </div>
                </div>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}