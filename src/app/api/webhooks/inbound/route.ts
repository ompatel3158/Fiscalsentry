import { NextRequest, NextResponse } from 'next/server';
import { auditFinancialDocument } from '@/lib/gemini';
import { indexNewDocument } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { source, documentName, documentText, amount, vendor } = payload;

    const docDescription = documentText || `Inbound financial notification from ${source || '3rd-party ERP'}: ${documentName || 'Invoice'} for amount $${amount || '0'} from ${vendor || 'Unknown Provider'}`;
    const audit = await auditFinancialDocument(docDescription);

    indexNewDocument(
      `Inbound ERP Event: ${documentName || 'Document'}`,
      docDescription,
      'past_invoice',
      audit.category
    );

    return NextResponse.json({
      success: true,
      message: 'Inbound document processed and audited by FiscalSentry',
      auditId: audit.id,
      potentialRecovery: audit.potentialRecoveryAmount,
    });
  } catch (err: any) {
    console.error('[Inbound Webhook Error]:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
