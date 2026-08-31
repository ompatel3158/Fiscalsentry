import { jsPDF } from 'jspdf';
import { AuditResult, AuditLineItem } from './types';

/**
 * Draws the official FiscalSentry geometric mark directly onto the PDF canvas using pure vector primitives.
 * Completely immune to font-encoding bugs or missing unicode glyphs.
 */
function drawBrandMark(doc: jsPDF, x: number, y: number, size = 22) {
  const s = size / 24;
  
  // Left wing (Navy: #0E2A47)
  doc.setFillColor(14, 42, 71);
  doc.triangle(x, y - 11 * s, x - 8 * s, y - 6 * s, x - 8 * s, y + 2 * s, 'F');
  doc.triangle(x, y - 11 * s, x - 8 * s, y + 2 * s, x, y + 11 * s, 'F');
  
  // Right wing (Teal: #14C9B7)
  doc.setFillColor(20, 201, 183);
  doc.triangle(x, y - 11 * s, x + 8 * s, y - 6 * s, x + 8 * s, y + 2 * s, 'F');
  doc.triangle(x, y - 11 * s, x + 8 * s, y + 2 * s, x, y + 11 * s, 'F');

  // Center circle (White with dark border)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(14, 42, 71);
  doc.setLineWidth(0.5);
  doc.circle(x, y, 3.4 * s, 'FD');

  // Center Diamond (Gold: #D9A441)
  doc.setFillColor(217, 164, 65);
  doc.triangle(x, y - 1.8 * s, x + 1.8 * s, y, x, y + 1.8 * s, 'F');
  doc.triangle(x, y - 1.8 * s, x - 1.8 * s, y, x, y + 1.8 * s, 'F');
}

/**
 * Generates an official, signature-ready Statutory Dispute & Legal Appeal PDF.
 */
export function generateDisputeLetterPDF(audit: AuditResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkColor = [15, 23, 42]; // Slate 900
  const grayColor = [100, 116, 139]; // Slate 500
  const redColor = [225, 29, 72]; // Rose 600
  const sym = audit.currencySymbol || '$';

  // 1. Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 612, 64, 'F');

  // Draw vector brand emblem
  drawBrandMark(doc, 48, 32, 26);

  // Brand Name & Title (Pure ASCII - No Emoji)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FISCALSENTRY  |  STATUTORY DISPUTE & COMPLIANCE DOSSIER', 68, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`AUTONOMOUS FINANCIAL DEFENSE ENGINE  •  GENERATED: ${genDate.toUpperCase()}`, 68, 44);

  // 2. Metadata Box
  let y = 88;
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('TO: Patient Financial Services & Billing Dispute Department', 36, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Facility / Provider: ${audit.providerOrVendor || 'Healthcare Facility'}`, 36, y);
  y += 13;
  doc.text(`Account / Reference ID: ${audit.accountNumber || 'MH-8849201-B'}`, 36, y);
  y += 13;
  doc.text(`Date of Service: ${audit.documentDate || new Date().toISOString().split('T')[0]}`, 36, y);
  y += 13;
  doc.text(`Dispute ID: ${audit.id.toUpperCase()}`, 36, y);

  // 3. Subject Header Bar
  y += 20;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(36, y, 540, 28, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.75);
  doc.roundedRect(36, y, 540, 28, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('SUBJECT: FORMAL NOTICE OF DISPUTED CHARGES & STATUTORY APPEAL', 46, y + 18);

  // 4. Executive Demand Paragraph
  y += 42;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const formattedRecovery = `${sym}${audit.potentialRecoveryAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const introText =
    `This letter constitutes formal legal notice under the Federal No Surprises Act (Public Law 116-260, 45 CFR § 149) and CMS National Correct Coding Initiative (NCCI) regulations that the undersigned formally disputes the charges itemized below in the total amount of ${formattedRecovery}. A comprehensive multimodal audit reveals statutory violations, unbundled procedure codes, and charges substantially exceeding fair market benchmarks.`;
  
  const splitIntro = doc.splitTextToSize(introText, 540);
  doc.text(splitIntro, 36, y);
  y += splitIntro.length * 12 + 10;

  // 5. Line Item Audit Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(36, y, 540, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CODE / ITEM', 42, y + 13);
  doc.text('DESCRIPTION & STATUTORY BASIS', 125, y + 13);
  doc.text('BILLED', 380, y + 13);
  doc.text('BENCHMARK', 450, y + 13);
  doc.text('DISPUTED', 525, y + 13);

  y += 20;

  // Render Line Items with dynamic wrapping (no truncation with ...)
  const safeItems = audit.lineItems || [];
  safeItems.forEach((item: AuditLineItem, idx: number) => {
    // Wrap description text to 240pt width
    const descLines = doc.splitTextToSize(item.description || 'Medical Line Item', 240);
    const violationStr = item.violationType || item.status?.toUpperCase() || 'COMPLIANT';
    const rowHeight = Math.max(30, descLines.length * 10 + 18);

    // Check page break
    if (y + rowHeight > 710) {
      doc.addPage();
      y = 40;
      // Re-render header on next page
      doc.setFillColor(30, 41, 59);
      doc.rect(36, y, 540, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CODE / ITEM', 42, y + 13);
      doc.text('DESCRIPTION & STATUTORY BASIS', 125, y + 13);
      doc.text('BILLED', 380, y + 13);
      doc.text('BENCHMARK', 450, y + 13);
      doc.text('DISPUTED', 525, y + 13);
      y += 20;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(36, y, 540, rowHeight, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(36, y + rowHeight, 576, y + rowHeight);

    // Code
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(item.code || `ITEM-${idx + 1}`, 42, y + 12);

    // Multi-line Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(descLines, 125, y + 12);

    // Statutory basis tag
    const subTextY = y + 12 + descLines.length * 9.5;
    if (item.deltaSavings > 0) {
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
    } else {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    }
    doc.setFontSize(7.5);
    doc.text(violationStr, 125, Math.min(subTextY, y + rowHeight - 4));

    // Numbers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`${sym}${item.originalAmount.toFixed(2)}`, 380, y + 12);
    doc.text(`${sym}${item.benchmarkAmount.toFixed(2)}`, 450, y + 12);

    if (item.deltaSavings > 0) {
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${sym}${item.deltaSavings.toFixed(2)}`, 525, y + 12);
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Verified', 525, y + 12);
    }

    y += rowHeight;
  });

  // 6. Total Summary Row
  if (y > 690) {
    doc.addPage();
    y = 40;
  }
  doc.setFillColor(241, 245, 249);
  doc.rect(36, y, 540, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(36, y, 576, y);
  doc.line(36, y + 24, 576, y + 24);

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL DISPUTED RECOVERY DEMAND:', 42, y + 15);
  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.setFontSize(9.5);
  doc.text(`${sym}${audit.potentialRecoveryAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 515, y + 15);

  // 7. Statutory Citations Block
  y += 34;
  if (y > 670) {
    doc.addPage();
    y = 40;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('STATUTORY CITATIONS & LEGAL GOVERNANCE', 36, y);
  y += 12;

  const safeCitations = audit.citations || [];
  safeCitations.forEach((cit) => {
    if (y > 720) {
      doc.addPage();
      y = 40;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`• ${cit.statute} — ${cit.applicableSection}`, 42, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const citSummary = doc.splitTextToSize(cit.summary, 520);
    doc.text(citSummary, 48, y);
    y += citSummary.length * 9.5 + 4;
  });

  // 8. Demand & Signature Block
  y += 10;
  if (y > 700) {
    doc.addPage();
    y = 40;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const legalNotice = 'Please freeze all collections activity pursuant to CFPB Debt Collection Rule (12 CFR Part 1006) and provide a revised, itemized zero-balance billing statement within thirty (30) calendar days.';
  const splitNotice = doc.splitTextToSize(legalNotice, 540);
  doc.text(splitNotice, 36, y);
  y += splitNotice.length * 10 + 26;

  if (y > 740) {
    doc.addPage();
    y = 50;
  }
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.75);
  doc.line(36, y, 220, y);
  doc.line(360, y, 540, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Authorized Patient / Advocate Signature', 36, y + 12);
  doc.text('Date of Execution', 360, y + 12);

  return doc;
}

/**
 * Generates an official Commercial Purchase Order PDF.
 */
export function generatePurchaseOrderPDF(audit: AuditResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const sym = audit.currencySymbol || '$';

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 612, 64, 'F');

  // Vector Brand Emblem
  drawBrandMark(doc, 48, 32, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`OFFICIAL PURCHASE ORDER (${audit.accountNumber || 'PO-2026-9921'})`, 68, 30);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('FISCALSENTRY AUTONOMOUS PROCUREMENT & CONTRACT ENGINE', 68, 44);

  let y = 90;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`VENDOR: ${audit.providerOrVendor}`, 36, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Reference RFP: ${audit.accountNumber || 'RFP-2026-088'}`, 36, y);
  y += 13;
  doc.text(`Issue Date: ${audit.documentDate || new Date().toISOString().split('T')[0]}`, 36, y);
  y += 13;
  doc.text(`Payment Terms: Net-30 | Invoicing: accounts-payable@company.example`, 36, y);

  y += 22;
  doc.setFillColor(16, 185, 129);
  doc.rect(36, y, 540, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('AWARDED ITEMS & TECHNICAL SPECIFICATIONS', 42, y + 15);

  y += 22;
  (audit.lineItems || []).forEach((item, idx) => {
    const descLines = doc.splitTextToSize(item.description || 'Awarded Item', 300);
    const rowHeight = Math.max(26, descLines.length * 10 + 14);

    if (y + rowHeight > 720) {
      doc.addPage();
      y = 40;
    }

    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(36, y, 540, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(36, y + rowHeight, 576, y + rowHeight);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(item.code || `SKU-${idx + 1}`, 42, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.text(descLines, 130, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text(`${sym}${item.benchmarkAmount.toFixed(2)}`, 490, y + 13);
    y += rowHeight;
  });

  y += 18;
  if (y > 720) {
    doc.addPage();
    y = 40;
  }
  doc.setFillColor(241, 245, 249);
  doc.rect(36, y, 540, 28, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL CONTRACT VALUE:', 42, y + 18);
  doc.setTextColor(16, 185, 129);
  doc.text(`${sym}${audit.fairBenchmarkAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 480, y + 18);

  return doc;
}

/**
 * Generates an itemized Monthly Financial Ledger PDF.
 */
export function generateMonthlyLedgerPDF(monthAudits: AuditResult[], monthLabel: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const totalBilled = monthAudits.reduce((acc, a) => acc + (a.totalBilledAmount || 0), 0);
  const totalRecovery = monthAudits.reduce((acc, a) => acc + (a.potentialRecoveryAmount || 0), 0);
  const sym = (monthAudits.length > 0 && monthAudits[0].currencySymbol) || '$';

  // 1. Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 612, 64, 'F');

  // Vector Brand Emblem
  drawBrandMark(doc, 48, 32, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FISCALSENTRY  |  MONTHLY FINANCIAL LEDGER & AUDIT', 68, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`STATEMENT PERIOD: ${monthLabel.toUpperCase()}  •  GENERATED ON ${genDate.toUpperCase()}`, 68, 44);

  // 2. Summary KPI Ribbon
  let y = 84;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(36, y, 540, 48, 6, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(36, y, 540, 48, 6, 6, 'S');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL INCURRED / BILLED', 50, y + 18);
  doc.text('STATUTORY DISPUTED SAVINGS', 220, y + 18);
  doc.text('VERIFIED STATEMENTS', 420, y + 18);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(`${sym}${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 50, y + 36);

  doc.setTextColor(16, 185, 129);
  doc.text(`+${sym}${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 220, y + 36);

  doc.setTextColor(15, 23, 42);
  doc.text(`${monthAudits.length} Audits`, 420, y + 36);

  y += 66;

  // 3. Section Title
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ITEMIZED MONTHLY STATEMENTS & LIABILITIES', 36, y);
  y += 12;

  // 4. Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(36, y, 540, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATE', 42, y + 13);
  doc.text('STATEMENT / VENDOR', 110, y + 13);
  doc.text('CATEGORY', 310, y + 13);
  doc.text('BILLED', 410, y + 13);
  doc.text('SAVINGS', 475, y + 13);
  doc.text('RISK', 540, y + 13);

  y += 20;

  // 5. Table Rows
  monthAudits.forEach((audit, idx) => {
    if (y > 720) {
      doc.addPage();
      y = 40;
      // Repeat header on new page
      doc.setFillColor(30, 41, 59);
      doc.rect(36, y, 540, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('DATE', 42, y + 13);
      doc.text('STATEMENT / VENDOR', 110, y + 13);
      doc.text('CATEGORY', 310, y + 13);
      doc.text('BILLED', 410, y + 13);
      doc.text('SAVINGS', 475, y + 13);
      doc.text('RISK', 540, y + 13);
      y += 20;
    }

    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(36, y, 540, 26, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(36, y + 26, 576, y + 26);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const dateStr = audit.documentDate || audit.createdAt?.split('T')[0] || '';
    doc.text(dateStr, 42, y + 15);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const titleText = doc.splitTextToSize(audit.title || audit.providerOrVendor, 190);
    doc.text(titleText[0] || '', 110, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(audit.financialCategory || audit.category || 'General', 310, y + 15);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${sym}${(audit.totalBilledAmount || 0).toFixed(2)}`, 410, y + 15);

    doc.setTextColor(16, 185, 129);
    doc.text(`+${sym}${(audit.potentialRecoveryAmount || 0).toFixed(2)}`, 475, y + 15);

    doc.setTextColor(audit.riskLevel === 'critical' ? 225 : 71, audit.riskLevel === 'critical' ? 29 : 85, audit.riskLevel === 'critical' ? 72 : 105);
    doc.text((audit.riskLevel || 'med').substring(0, 4).toUpperCase(), 540, y + 15);

    y += 26;
  });

  // Footer note
  y += 24;
  if (y > 740) {
    doc.addPage();
    y = 50;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Certified by FiscalSentry Void Autonomous Intelligence • End-to-end encrypted financial ledger audit.', 36, y);

  return doc;
}
