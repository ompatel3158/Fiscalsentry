import { AuditResult, formatCurrency } from './types';
import { YearlyFinancialHealthReport } from './financialManager';

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
 * 1. Export Single Audit to Word (.doc)
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
        <td style="border: 1px solid #ddd; padding: 8px;">${li.code || 'N/A'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${li.description || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${li.financialCategory || 'General'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(li.originalAmount || 0, audit.currency, audit.currencySymbol)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(li.benchmarkAmount || 0, audit.currency, audit.currencySymbol)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #10b981; font-weight: bold;">${formatCurrency(li.deltaSavings || 0, audit.currency, audit.currencySymbol)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${(li.status || '').toUpperCase()}</td>
      </tr>
    `
    )
    .join('');

  const citationsHtml = (audit.citations || [])
    .map(
      (c) => `
      <div style="margin-bottom: 12px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #10b981;">
        <strong>${c.statute || ''}: ${c.title || ''}</strong> (${c.applicableSection || ''})<br/>
        <span style="font-size: 11pt; color: #555;">${c.summary || ''}</span>
      </div>
    `
    )
    .join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; }
        h1 { font-size: 18pt; color: #0f766e; margin-bottom: 4px; }
        h2 { font-size: 14pt; color: #111827; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        .meta-table { width: 100%; margin-bottom: 16px; border-collapse: collapse; }
        .meta-table td { padding: 6px 0; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .data-table th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; }
        .total-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; margin-top: 16px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <h1>FiscalSentry Autonomous Financial Defense Dossier</h1>
      <p style="color: #6b7280; font-size: 10pt;">Certified via Google Gemini 3.7 Flash AI • Generated on ${new Date().toLocaleDateString()}</p>
      
      <table class="meta-table">
        <tr>
          <td><strong>Statement Title:</strong> ${audit.title || 'N/A'}</td>
          <td><strong>Document Date:</strong> ${safeDate}</td>
        </tr>
        <tr>
          <td><strong>Provider / Vendor:</strong> ${safeProvider}</td>
          <td><strong>Account / Ref #:</strong> ${audit.accountNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td><strong>Risk Level:</strong> <span style="color: ${audit.riskLevel === 'critical' ? '#ef4444' : '#10b981'}; font-weight: bold;">${(audit.riskLevel || 'standard').toUpperCase()}</span></td>
          <td><strong>Financial Category:</strong> ${audit.financialCategory || 'invoice_receipt'}</td>
        </tr>
      </table>

      <div class="total-box">
        <table style="width: 100%;">
          <tr>
            <td><strong>Total Billed Amount:</strong> ${formatCurrency(audit.totalBilledAmount || 0, audit.currency, audit.currencySymbol)}</td>
            <td><strong>Fair Benchmark:</strong> ${formatCurrency(audit.fairBenchmarkAmount || 0, audit.currency, audit.currencySymbol)}</td>
            <td style="color: #059669; font-size: 13pt;"><strong>Potential Recovery:</strong> +${formatCurrency(audit.potentialRecoveryAmount || 0, audit.currency, audit.currencySymbol)}</td>
          </tr>
        </table>
      </div>

      <h2>Executive Audit Summary</h2>
      <p>${safeSummary}</p>

      <h2>Itemized Transaction Audit</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Category</th>
            <th style="text-align: right;">Billed</th>
            <th style="text-align: right;">Benchmark</th>
            <th style="text-align: right;">Dispute / Delta</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml || '<tr><td colspan="7" style="text-align:center; padding:12px;">No itemized lines recorded</td></tr>'}
        </tbody>
      </table>

      ${citationsHtml ? `<h2>Statutory Precedents & Legal Basis</h2>${citationsHtml}` : ''}

      <hr style="margin-top: 30px; border: 0; border-top: 1px solid #ddd;" />
      <p style="font-size: 9pt; color: #9ca3af; text-align: center;">
        FiscalSentry Void Autonomous Intelligence • Zero-Knowledge Encrypted Paperwork Sentry
      </p>
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
 * 5. Export Monthly Ledger to Word (.doc)
 */
export function exportMonthlyLedgerToWord(monthAudits: AuditResult[], monthLabel: string) {
  const safeMonth = (monthLabel || 'Monthly_Ledger').replace(/[<>:"/\\|?*]/g, '_');
  const totalBilled = monthAudits.reduce((acc, a) => acc + (a.totalBilledAmount || 0), 0);
  const totalRecovery = monthAudits.reduce((acc, a) => acc + (a.potentialRecoveryAmount || 0), 0);

  const auditsHtml = monthAudits
    .map(
      (a) => `
      <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #fafafa;">
        <h3 style="margin: 0 0 6px 0; color: #111827;">${a.title || 'Statement'}</h3>
        <p style="font-size: 10pt; color: #6b7280; margin: 0 0 8px 0;">
          <strong>Date:</strong> ${a.documentDate || a.createdAt?.split('T')[0] || ''} | 
          <strong>Provider:</strong> ${a.providerOrVendor || ''} | 
          <strong>Billed:</strong> ${formatCurrency(a.totalBilledAmount || 0, a.currency, a.currencySymbol)} | 
          <strong style="color: #059669;">Disputed:</strong> +${formatCurrency(a.potentialRecoveryAmount || 0, a.currency, a.currencySymbol)}
        </p>
        <p style="font-size: 10pt; color: #374151; margin: 0;">${a.summary || ''}</p>
      </div>
    `
    )
    .join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>FiscalSentry Monthly Financial Ledger - ${monthLabel}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #222; }
        h1 { font-size: 18pt; color: #0f766e; }
      </style>
    </head>
    <body>
      <h1>FiscalSentry Monthly Ledger - ${monthLabel}</h1>
      <p style="color: #6b7280;">Certified via Google Gemini 3.7 Flash AI • Generated on ${new Date().toLocaleDateString()}</p>
      <div style="background: #ecfdf5; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
        <strong>Total Incurred / Billed:</strong> ${formatCurrency(totalBilled)} | 
        <strong style="color: #059669;">Total Disputed Savings:</strong> +${formatCurrency(totalRecovery)} | 
        <strong>Total Documents:</strong> ${monthAudits.length}
      </div>
      <h2>Audited Statements & Transactions</h2>
      ${auditsHtml || '<p>No audited statements recorded for this month.</p>'}
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
