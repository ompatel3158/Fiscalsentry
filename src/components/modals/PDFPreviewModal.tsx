'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { generateDisputeLetterPDF, generatePurchaseOrderPDF } from '@/lib/pdf-generator';
import { X, Download, FileText, CheckCircle2, ShieldCheck, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ExportDropdown } from '@/components/common/ExportDropdown';

export function PDFPreviewModal() {
  const { isPDFModalOpen, setIsPDFModalOpen, pdfAuditTarget } = useApp();

  if (!isPDFModalOpen || !pdfAuditTarget) return null;

  const handleDownloadPDF = () => {
    try {
      let doc;
      if (pdfAuditTarget.category === 'vendor_quotes') {
        doc = generatePurchaseOrderPDF(pdfAuditTarget);
        doc.save(`Purchase-Order-${pdfAuditTarget.accountNumber || 'PO-2026'}.pdf`);
      } else {
        doc = generateDisputeLetterPDF(pdfAuditTarget);
        doc.save(`Legal-Dispute-Letter-${pdfAuditTarget.accountNumber || 'MH-8849201'}.pdf`);
      }
      toast.success('Signature-ready PDF downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to generate PDF: ' + err.message);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Signature-Ready Document Preview
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {pdfAuditTarget.category === 'vendor_quotes'
                    ? 'Official Commercial Purchase Order (PO)'
                    : 'Statutory Dispute & Compliance Appeal Letter'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ExportDropdown
                audit={pdfAuditTarget}
                onOpenPDF={handleDownloadPDF}
                buttonLabel="Export Formats"
                variant="secondary"
              />

              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all duration-150 active:scale-[0.97]"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={() => setIsPDFModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-[0.97]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Sheet Container */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 dark:bg-slate-900/50">
            <div className="max-w-2xl mx-auto bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200 text-xs font-sans space-y-6">
              {/* Document Banner */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold tracking-tight text-slate-900">
                    🛡️ FISCALSENTRY LEGAL & COMPLIANCE DOSSIER
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    AUTONOMOUS FINANCIAL DEFENSE ENGINE • PUBLIC LAW 116-260
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-600">
                  <div>DATE: {pdfAuditTarget.documentDate}</div>
                  <div className="font-mono">REF: {pdfAuditTarget.accountNumber || pdfAuditTarget.id}</div>
                </div>
              </div>

              {/* Recipient info */}
              <div className="text-[11px] leading-relaxed">
                <div className="font-bold">TO: Patient Financial Services & Billing Compliance Officer</div>
                <div>{pdfAuditTarget.providerOrVendor}</div>
                <div>Account Reference: {pdfAuditTarget.accountNumber || 'MH-8849201-B'}</div>
              </div>

              {/* Subject Banner */}
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg font-bold text-xs text-slate-900">
                SUBJECT: FORMAL NOTICE OF DISPUTED CHARGES & STATUTORY APPEAL (${pdfAuditTarget.potentialRecoveryAmount.toLocaleString()})
              </div>

              {/* Demand Paragraph */}
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Please accept this formal written dispute pursuant to the Federal <strong>No Surprises Act</strong> (Public Law 116-260, 45 CFR § 149) and CMS National Correct Coding Initiative (NCCI) regulations. The itemized charges below contain unbundled procedures and out-of-network balance billing in direct violation of statutory fair pricing standards.
              </p>

              {/* Line Items Table */}
              <table className="w-full text-left text-[10px] border border-slate-300">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Description & Statutory Basis</th>
                    <th className="p-2 text-right">Billed</th>
                    <th className="p-2 text-right">Fair Benchmark</th>
                    <th className="p-2 text-right">Disputed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pdfAuditTarget.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="p-2 font-mono font-bold">{li.code || 'ITEM'}</td>
                      <td className="p-2">
                        <div className="font-semibold">{li.description}</div>
                        <div className="text-slate-500 text-[9px]">{li.violationType}</div>
                      </td>
                      <td className="p-2 text-right">${li.originalAmount.toFixed(2)}</td>
                      <td className="p-2 text-right">${li.benchmarkAmount.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-rose-600">
                        {li.deltaSavings > 0 ? `-$${li.deltaSavings.toFixed(2)}` : 'Verified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Disputed Total Banner */}
              <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg border border-slate-300 font-bold">
                <span>TOTAL DISPUTED RECOVERY DEMAND:</span>
                <span className="text-sm text-rose-600 font-extrabold">
                  ${pdfAuditTarget.potentialRecoveryAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Citations */}
              <div className="space-y-1.5 pt-2">
                <div className="font-bold text-[10px] uppercase text-slate-600">
                  Statutory References & Governance:
                </div>
                {pdfAuditTarget.citations.map((c, i) => (
                  <div key={i} className="text-[10px] text-slate-700">
                    • <strong>{c.statute}</strong> ({c.applicableSection}): {c.summary}
                  </div>
                ))}
              </div>

              {/* Signature Block */}
              <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-[10px]">
                <div>
                  <div className="w-48 border-b border-slate-900 pb-1 mb-1 font-signature text-xs italic">
                    Alex Rivera (Authorized Advocate)
                  </div>
                  <div className="text-slate-500 font-bold">Authorized Signature</div>
                </div>
                <div className="text-right text-slate-500">
                  <div>Certified Electronic Dispatch</div>
                  <div className="font-mono">{new Date().toISOString()}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
