import { NextRequest, NextResponse } from 'next/server';
import { auditFinancialDocument } from '@/lib/gemini';
import { indexNewDocument } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentText, mediaBase64, mimeType, filename, preferredModel } = body;

    if (!documentText && !mediaBase64) {
      return NextResponse.json({ error: 'No document text or media provided' }, { status: 400 });
    }

    const auditResult = await auditFinancialDocument(
      documentText || filename || 'Financial Statement',
      mediaBase64,
      mimeType || 'application/pdf',
      preferredModel || 'gemini-3.1-flash-lite'
    );

    // Index into RAG knowledge memory
    indexNewDocument(
      auditResult.title,
      `${auditResult.summary}\nProvider: ${auditResult.providerOrVendor}\nTotal Billed: $${auditResult.totalBilledAmount}\nDisputed Amount: $${auditResult.potentialRecoveryAmount}`,
      'past_invoice',
      auditResult.category
    );

    return NextResponse.json({
      success: true,
      audit: auditResult,
    });
  } catch (error: any) {
    console.error('[API /audit] Error:', error);
    return NextResponse.json({ error: error.message || 'Audit processing failed' }, { status: 500 });
  }
}
