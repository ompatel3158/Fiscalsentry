import { AuditResult, formatCurrency } from './types';
import { generateDisputeLetterPDF, generatePurchaseOrderPDF, generateMonthlyLedgerPDF } from './pdf-generator';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Export Single Audit to PDF (.pdf)
 */
export function exportAuditToPDF(audit: AuditResult) {
  const title = (audit.title || 'Financial_Audit_Dossier').replace(/[<>:"/\\|?*]/g, '_');
  try {
    let doc;
    if (audit.category === 'vendor_quotes') {
      doc = generatePurchaseOrderPDF(audit);
      doc.save(`${title}_PO.pdf`);
    } else {
      doc = generateDisputeLetterPDF(audit);
      doc.save(`${title}_Dispute_Dossier.pdf`);
    }
  } catch (err: any) {
    console.error('PDF export error:', err);
    window.print();
  }
}

/**
 * 2. Export Monthly / Yearly Ledger to PDF (.pdf)
 */
export function exportMonthlyLedgerToPDF(monthAudits: AuditResult[], monthLabel: string) {
  const safeMonth = (monthLabel || 'Monthly_Ledger').replace(/[<>:"/\\|?*]/g, '_');
  try {
    const doc = generateMonthlyLedgerPDF(monthAudits, monthLabel);
    doc.save(`FiscalSentry_Ledger_${safeMonth}.pdf`);
  } catch (err: any) {
    console.error('Monthly PDF export error:', err);
    window.print();
  }
}

/**
 * 3. Export Single Audit to Word (.doc / .docx compatible) with 1-inch margins & fixed table width
 */
export function exportAuditToWord(audit: AuditResult) {
  const title = (audit.title || 'Financial_Audit_Report').replace(/[<>:"/\\|?*]/g, '_');
  const safeProvider = audit.providerOrVendor || 'Vendor';
  const safeSummary = audit.summary || 'No summary available.';
  const safeDate = audit.documentDate || audit.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];

  const lineItemsHtml = (audit.lineItems || [])
    .map(
      (li) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">${li.code || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">${li.description || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">${li.financialCategory || 'General'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; text-align: right; word-break: break-word;">${formatCurrency(li.originalAmount || 0, audit.currency, audit.currencySymbol)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; text-align: right; word-break: break-word;">${formatCurrency(li.benchmarkAmount || 0, audit.currency, audit.currencySymbol)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; text-align: right; color: #047857; font-weight: bold; word-break: break-word;">${formatCurrency(li.deltaSavings || 0, audit.currency, audit.currencySymbol)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">${(li.status || '').toUpperCase()}</td>
      </tr>
    `
    )
    .join('');

  const citationsHtml = (audit.citations || [])
    .map(
      (c) => `
      <div style="margin-bottom: 10px; padding: 8px 12px; background-color: #f8fafc; border-left: 4px solid #059669;">
        <strong style="font-size: 10pt; color: #0f172a;">${c.statute || ''}: ${c.title || ''}</strong> <span style="font-size: 9.5pt; color: #64748b;">(${c.applicableSection || ''})</span><br/>
        <span style="font-size: 9.5pt; color: #334155;">${c.summary || ''}</span>
      </div>
    `
    )
    .join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 8.5in 11.0in;
          margin: 1.0in 1.0in 1.0in 1.0in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
        }
        h1 {
          font-size: 16pt;
          color: #047857;
          margin-bottom: 2px;
          font-weight: bold;
        }
        h2 {
          font-size: 12pt;
          color: #0f172a;
          margin-top: 18px;
          margin-bottom: 6px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
        }
        table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          margin-top: 10px;
          margin-bottom: 10px;
          word-wrap: break-word !important;
        }
        table.meta-table td {
          padding: 4px 0;
          font-size: 10pt;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 6px 8px !important;
          font-size: 9.5pt !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        table.data-table th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: bold !important;
        }
        .total-box {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 10px;
          margin-top: 12px;
          margin-bottom: 12px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h1>FiscalSentry Autonomous Financial Defense Dossier</h1>
        <p style="color: #64748b; font-size: 9.5pt; margin-top: 0;">Certified via Google Gemini 3.7 Flash AI • Generated on ${new Date().toLocaleDateString()}</p>
        
        <table class="meta-table" style="width: 100%; border: none;">
          <tr>
            <td style="width: 50%;"><strong>Statement Title:</strong> ${audit.title || 'N/A'}</td>
            <td style="width: 50%;"><strong>Document Date:</strong> ${safeDate}</td>
          </tr>
          <tr>
            <td><strong>Provider / Vendor:</strong> ${safeProvider}</td>
            <td><strong>Account / Ref #:</strong> ${audit.accountNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Risk Level:</strong> <span style="color: ${audit.riskLevel === 'critical' ? '#dc2626' : '#059669'}; font-weight: bold;">${(audit.riskLevel || 'standard').toUpperCase()}</span></td>
            <td><strong>Financial Category:</strong> ${audit.financialCategory || 'invoice_receipt'}</td>
          </tr>
        </table>

        <div class="total-box">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; font-size: 10pt;"><strong>Total Billed Amount:</strong> ${formatCurrency(audit.totalBilledAmount || 0, audit.currency, audit.currencySymbol)}</td>
              <td style="border: none; font-size: 10pt;"><strong>Fair Benchmark:</strong> ${formatCurrency(audit.fairBenchmarkAmount || 0, audit.currency, audit.currencySymbol)}</td>
              <td style="border: none; font-size: 11pt; color: #047857;"><strong>Potential Recovery:</strong> +${formatCurrency(audit.potentialRecoveryAmount || 0, audit.currency, audit.currencySymbol)}</td>
            </tr>
          </table>
        </div>

        <h2>Executive Audit Summary</h2>
        <p style="font-size: 10pt; line-height: 1.45; color: #334155;">${safeSummary}</p>

        <h2>Itemized Transaction Audit</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 12%;">Code</th>
              <th style="width: 30%;">Description</th>
              <th style="width: 14%;">Category</th>
              <th style="width: 12%; text-align: right;">Billed</th>
              <th style="width: 12%; text-align: right;">Benchmark</th>
              <th style="width: 12%; text-align: right;">Dispute</th>
              <th style="width: 8%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml || '<tr><td colspan="7" style="text-align:center; padding:10px;">No itemized lines recorded</td></tr>'}
          </tbody>
        </table>

        ${citationsHtml ? `<h2>Statutory Precedents & Legal Basis</h2>${citationsHtml}` : ''}

        <hr style="margin-top: 24px; border: 0; border-top: 1px solid #cbd5e1;" />
        <p style="font-size: 8.5pt; color: #94a3b8; text-align: center; margin-top: 6px;">
          FiscalSentry Void Autonomous Intelligence • Zero-Knowledge Encrypted Paperwork Sentry
        </p>
      </div>
    </body>
    </html>
  `;

  downloadFile(docHtml, `${title}.doc`, 'application/msword');
}

/**
 * 2. Export Single Audit to Excel (.xls)
 */
export function exportAuditToExcel(audit: AuditResult) {
  const title = (audit.title || 'Financial_Audit_Ledger').replace(/[<>:"/\\|?*]/g, '_');
  const safeDate = audit.documentDate || audit.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];

  const rowsHtml = (audit.lineItems || [])
    .map(
      (li) => `
      <tr>
        <td>${li.code || ''}</td>
        <td>${li.description || ''}</td>
        <td>${li.financialCategory || 'expense'}</td>
        <td>${li.originalAmount || 0}</td>
        <td>${li.benchmarkAmount || 0}</td>
        <td>${li.deltaSavings || 0}</td>
        <td>${li.status || 'compliant'}</td>
        <td>${li.violationType || ''}</td>
        <td>${li.reasoning || ''}</td>
      </tr>
    `
    )
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        th { background-color: #10b981; color: white; font-weight: bold; border: 1px solid #059669; }
        td { border: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <table>
        <tr><th colspan="9" style="background-color: #064e3b; font-size: 14pt; color: white;">FiscalSentry Financial Audit: ${audit.title || ''}</th></tr>
        <tr><td><strong>Provider:</strong></td><td colspan="8">${audit.providerOrVendor || ''}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${safeDate}</td><td><strong>Total Billed:</strong></td><td>${audit.totalBilledAmount || 0}</td><td><strong>Recovery Amount:</strong></td><td>${audit.potentialRecoveryAmount || 0}</td><td><strong>Currency:</strong></td><td colspan="2">${audit.currency || 'USD'}</td></tr>
        <tr><td colspan="9"></td></tr>
        <tr>
          <th>Code / SKU</th>
          <th>Description</th>
          <th>Category</th>
          <th>Billed Amount</th>
          <th>Fair Benchmark</th>
          <th>Dispute Delta</th>
          <th>Status</th>
          <th>Violation Type</th>
          <th>Reasoning</th>
        </tr>
        ${rowsHtml}
      </table>
    </body>
    </html>
  `;

  downloadFile(excelHtml, `${title}.xls`, 'application/vnd.ms-excel');
}

/**
 * 3. Export Single Audit to CSV
 */
export function exportAuditToCSV(audit: AuditResult) {
  const title = (audit.title || 'Financial_Audit').replace(/[<>:"/\\|?*]/g, '_');
  const headers = ['Code', 'Description', 'Category', 'Billed Amount', 'Benchmark Amount', 'Delta Savings', 'Status', 'Violation Type', 'Reasoning'];

  const rows = (audit.lineItems || []).map((li) => [
    `"${(li.code || '').replace(/"/g, '""')}"`,
    `"${(li.description || '').replace(/"/g, '""')}"`,
    `"${(li.financialCategory || 'expense').replace(/"/g, '""')}"`,
    li.originalAmount || 0,
    li.benchmarkAmount || 0,
    li.deltaSavings || 0,
    `"${(li.status || 'compliant').replace(/"/g, '""')}"`,
    `"${(li.violationType || '').replace(/"/g, '""')}"`,
    `"${(li.reasoning || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, `${title}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 4. Export Single Audit to JSON
 */
export function exportAuditToJSON(audit: AuditResult) {
  const title = (audit.title || 'Financial_Audit').replace(/[<>:"/\\|?*]/g, '_');
  const jsonStr = JSON.stringify(audit, null, 2);
  downloadFile(jsonStr, `${title}.json`, 'application/json');
}

/**
 * 7. Export Monthly / Yearly Ledger to Word (.doc) with 1-inch margins & fixed table width
 */
export function exportMonthlyLedgerToWord(monthAudits: AuditResult[], monthLabel: string) {
  const safeMonth = (monthLabel || 'Monthly_Ledger').replace(/[<>:"/\\|?*]/g, '_');
  const totalBilled = monthAudits.reduce((acc, a) => acc + (a.totalBilledAmount || 0), 0);
  const totalRecovery = monthAudits.reduce((acc, a) => acc + (a.potentialRecoveryAmount || 0), 0);

  const rowsHtml = monthAudits
    .map(
      (a) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">${a.documentDate || a.createdAt?.split('T')[0] || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">
          <strong>${a.title || ''}</strong><br/>
          <span style="font-size: 8.5pt; color: #64748b;">${a.providerOrVendor || ''}</span>
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word;">${a.financialCategory || a.category || 'General'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; text-align: right; word-break: break-word;">${formatCurrency(a.totalBilledAmount || 0, a.currency, a.currencySymbol)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; text-align: right; color: #047857; font-weight: bold; word-break: break-word;">+${formatCurrency(a.potentialRecoveryAmount || 0, a.currency, a.currencySymbol)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; word-break: break-word; color: ${a.riskLevel === 'critical' ? '#dc2626' : '#334155'};">${(a.riskLevel || 'standard').toUpperCase()}</td>
      </tr>
    `
    )
    .join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>FiscalSentry Monthly Financial Ledger - ${monthLabel}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 8.5in 11.0in;
          margin: 1.0in 1.0in 1.0in 1.0in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
        }
        h1 {
          font-size: 16pt;
          color: #047857;
          margin-bottom: 2px;
          font-weight: bold;
        }
        h2 {
          font-size: 12pt;
          color: #0f172a;
          margin-top: 18px;
          margin-bottom: 6px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
        }
        table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          margin-top: 10px;
          margin-bottom: 10px;
          word-wrap: break-word !important;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 6px 8px !important;
          font-size: 9.5pt !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        table.data-table th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: bold !important;
        }
        .total-box {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 10px;
          margin-top: 12px;
          margin-bottom: 12px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h1>FiscalSentry Monthly Financial Ledger</h1>
        <p style="color: #64748b; font-size: 9.5pt; margin-top: 0;">Period: ${monthLabel} • Certified via Google Gemini 3.7 Flash AI • Generated on ${new Date().toLocaleDateString()}</p>
        
        <div class="total-box">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; font-size: 10pt;"><strong>Total Billed / Incurred:</strong> ${formatCurrency(totalBilled)}</td>
              <td style="border: none; font-size: 11pt; color: #047857;"><strong>Disputed Savings:</strong> +${formatCurrency(totalRecovery)}</td>
              <td style="border: none; font-size: 10pt;"><strong>Verified Statements:</strong> ${monthAudits.length}</td>
            </tr>
          </table>
        </div>

        <h2>Itemized Statements & Audited Liabilities</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 12%;">Date</th>
              <th style="width: 36%;">Statement / Vendor</th>
              <th style="width: 16%;">Category</th>
              <th style="width: 12%; text-align: right;">Billed</th>
              <th style="width: 14%; text-align: right;">Savings</th>
              <th style="width: 10%;">Risk</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:10px;">No statements recorded in this period.</td></tr>'}
          </tbody>
        </table>

        <hr style="margin-top: 24px; border: 0; border-top: 1px solid #cbd5e1;" />
        <p style="font-size: 8.5pt; color: #94a3b8; text-align: center; margin-top: 6px;">
          FiscalSentry Void Autonomous Intelligence • Zero-Knowledge Encrypted Paperwork Sentry
        </p>
      </div>
    </body>
    </html>
  `;

  downloadFile(docHtml, `FiscalSentry_Ledger_${safeMonth}.doc`, 'application/msword');
}

/**
 * 6. Export Monthly Ledger to Excel (.xls)
 */
export function exportMonthlyLedgerToExcel(monthAudits: AuditResult[], monthLabel: string) {
  const safeMonth = (monthLabel || 'Monthly_Ledger').replace(/[<>:"/\\|?*]/g, '_');

  const rowsHtml = monthAudits
    .map(
      (a) => `
      <tr>
        <td>${a.documentDate || a.createdAt?.split('T')[0] || ''}</td>
        <td>${a.title || ''}</td>
        <td>${a.providerOrVendor || ''}</td>
        <td>${a.financialCategory || ''}</td>
        <td>${a.totalBilledAmount || 0}</td>
        <td>${a.fairBenchmarkAmount || 0}</td>
        <td>${a.potentialRecoveryAmount || 0}</td>
        <td>${a.riskLevel || 'medium'}</td>
        <td>${a.summary || ''}</td>
      </tr>
    `
    )
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        th { background-color: #10b981; color: white; font-weight: bold; border: 1px solid #059669; }
        td { border: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <table>
        <tr><th colspan="9" style="background-color: #064e3b; font-size: 14pt; color: white;">FiscalSentry Monthly Ledger - ${monthLabel}</th></tr>
        <tr>
          <th>Date</th>
          <th>Title</th>
          <th>Provider</th>
          <th>Category</th>
          <th>Billed Amount</th>
          <th>Benchmark</th>
          <th>Recovery / Savings</th>
          <th>Risk</th>
          <th>Summary</th>
        </tr>
        ${rowsHtml}
      </table>
    </body>
    </html>
  `;

  downloadFile(excelHtml, `FiscalSentry_Ledger_${safeMonth}.xls`, 'application/vnd.ms-excel');
}

/**
 * 7. Export Monthly Ledger to CSV
 */
export function exportMonthlyLedgerToCSV(monthAudits: AuditResult[], monthLabel: string) {
  const safeMonth = (monthLabel || 'Monthly_Ledger').replace(/[<>:"/\\|?*]/g, '_');
  const headers = ['Date', 'Title', 'Provider', 'Category', 'Billed Amount', 'Benchmark Amount', 'Potential Recovery', 'Risk Level', 'Summary'];

  const rows = monthAudits.map((a) => [
    `"${a.documentDate || a.createdAt?.split('T')[0] || ''}"`,
    `"${(a.title || '').replace(/"/g, '""')}"`,
    `"${(a.providerOrVendor || '').replace(/"/g, '""')}"`,
    `"${(a.financialCategory || '').replace(/"/g, '""')}"`,
    a.totalBilledAmount || 0,
    a.fairBenchmarkAmount || 0,
    a.potentialRecoveryAmount || 0,
    `"${(a.riskLevel || '').replace(/"/g, '""')}"`,
    `"${(a.summary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, `FiscalSentry_Ledger_${safeMonth}.csv`, 'text/csv;charset=utf-8;');
}
