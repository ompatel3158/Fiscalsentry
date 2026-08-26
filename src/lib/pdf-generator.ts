import { jsPDF } from 'jspdf';
import { AuditResult, AuditLineItem } from './types';

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

  // 1. Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 612, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('🛡️ FISCALSENTRY | STATUTORY DISPUTE & COMPLIANCE DOSSIER', 36, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AUTONOMOUS FINANCIAL DEFENSE ENGINE • GENERATED ON ' + new Date().toLocaleDateString(), 36, 48);

  // 2. Metadata Box
  let y = 85;
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TO: Patient Financial Services & Billing Dispute Department', 36, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Facility / Provider: ${audit.providerOrVendor}`, 36, y);
  y += 14;
  doc.text(`Account / Reference ID: ${audit.accountNumber || 'MH-8849201-B'}`, 36, y);
  y += 14;
  doc.text(`Date of Service: ${audit.documentDate}`, 36, y);
  y += 14;
  doc.text(`Dispute ID: ${audit.id.toUpperCase()}`, 36, y);

  // 3. Subject Header
  y += 24;
  doc.setFillColor(241, 245, 249);
  doc.rect(36, y, 540, 32, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(36, y, 540, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('SUBJECT: FORMAL NOTICE OF DISPUTED CHARGES & STATUTORY APPEAL', 48, y + 20);

  // 4. Executive Demand Paragraph
  y += 48;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const introText =
    'This letter constitutes formal legal notice under the Federal No Surprises Act (Public Law 116-260, 45 CFR § 149) and CMS National Correct Coding Initiative (NCCI) regulations that the undersigned formally disputes the charges itemized below in the amount of $' +
    audit.potentialRecoveryAmount.toLocaleString() +
    '. A comprehensive multimodal audit reveals statutory violations, unbundled procedure codes, and charges substantially exceeding fair market benchmarks.';
  
  const splitIntro = doc.splitTextToSize(introText, 540);
  doc.text(splitIntro, 36, y);
  y += splitIntro.length * 13 + 12;

  // 5. Line Item Audit Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(36, y, 540, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CODE / ITEM', 42, y + 14);
  doc.text('DESCRIPTION & STATUTORY BASIS', 140, y + 14);
  doc.text('BILLED', 390, y + 14);
  doc.text('BENCHMARK', 455, y + 14);
  doc.text('DISPUTED', 525, y + 14);

  y += 20;

  // Line items
  audit.lineItems.forEach((item: AuditLineItem, idx: number) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(36, y, 540, 28, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(36, y + 28, 576, y + 28);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(item.code || `ITEM-${idx + 1}`, 42, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const desc = item.description.length > 42 ? item.description.substring(0, 40) + '...' : item.description;
    doc.text(desc, 140, y + 12);

    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(item.violationType || item.status.toUpperCase(), 140, y + 22);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`$${item.originalAmount.toFixed(2)}`, 390, y + 12);
    doc.text(`$${item.benchmarkAmount.toFixed(2)}`, 455, y + 12);

    if (item.deltaSavings > 0) {
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`-$${item.deltaSavings.toFixed(2)}`, 525, y + 12);
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Verified', 525, y + 12);
    }

    y += 28;
  });

  // 6. Total Summary Row
  doc.setFillColor(241, 245, 249);
  doc.rect(36, y, 540, 24, 'F');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL DISPUTED RECOVERY DEMAND:', 42, y + 16);
  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.setFontSize(10);
  doc.text(`$${audit.potentialRecoveryAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 520, y + 16);

  // 7. Statutory Citations Block
  y += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('STATUTORY CITATIONS & LEGAL GOVERNANCE', 36, y);
  y += 12;

  audit.citations.forEach((cit) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`• ${cit.statute} — ${cit.applicableSection}`, 42, y);
    y += 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const citSummary = doc.splitTextToSize(cit.summary, 520);
    doc.text(citSummary, 48, y);
    y += citSummary.length * 10 + 4;
  });

  // 8. Demand & Signature Block
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Please freeze all collections activity pursuant to CFPB Debt Collection Rule (12 CFR Part 1006) and provide a revised, itemized zero-balance billing statement within thirty (30) calendar days.',
    36,
    y
  );

  y += 30;
  doc.setDrawColor(148, 163, 184);
  doc.line(36, y, 200, y);
  doc.line(360, y, 520, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Authorized Patient / Advocate Signature', 36, y + 12);
  doc.text('Date of Execution', 360, y + 12);

  return doc;
}

export function generatePurchaseOrderPDF(audit: AuditResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 612, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('📦 OFFICIAL PURCHASE ORDER (PO-2026-9921)', 36, 36);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FISCALSENTRY AUTONOMOUS PROCUREMENT ENGINE', 36, 48);

  let y = 90;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`VENDOR: ${audit.providerOrVendor}`, 36, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Reference RFP: ${audit.accountNumber || 'RFP-2026-088'}`, 36, y);
  y += 14;
  doc.text(`Issue Date: ${audit.documentDate}`, 36, y);
  y += 14;
  doc.text(`Payment Terms: Net-30 | Invoicing: accounts-payable@company.example`, 36, y);

  y += 24;
  doc.setFillColor(16, 185, 129);
  doc.rect(36, y, 540, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('AWARDED ITEMS & TECHNICAL SPECIFICATIONS', 42, y + 16);

  y += 24;
  audit.lineItems.forEach((item, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(36, y, 540, 28, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(36, y + 28, 576, y + 28);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(item.code || `SKU-${idx + 1}`, 42, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.text(item.description, 130, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.text(`$${item.benchmarkAmount.toFixed(2)}`, 490, y + 14);
    y += 28;
  });

  y += 20;
  doc.setFillColor(241, 245, 249);
  doc.rect(36, y, 540, 30, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL CONTRACT VALUE:', 42, y + 20);
  doc.setTextColor(16, 185, 129);
  doc.text(`$${audit.fairBenchmarkAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 480, y + 20);

  return doc;
}
