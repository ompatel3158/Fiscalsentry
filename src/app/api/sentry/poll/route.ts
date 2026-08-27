import { NextRequest, NextResponse } from 'next/server';
import { fetchFinancialEmailsFromGmail } from '@/lib/gmail';
import { auditBatchFinancialEmails } from '@/lib/gemini';
import { indexNewDocument } from '@/lib/rag';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  return handlePoll(tokenFromHeader);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const accessToken = body?.accessToken || tokenFromHeader;
    const preferredModel = body?.preferredModel || 'gemini-3.1-flash-lite';
    const forceSimulation = Boolean(body?.forceSimulation);

    return handlePoll(accessToken, preferredModel, forceSimulation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Polling failed' }, { status: 500 });
  }
}

async function handlePoll(
  accessToken?: string,
  preferredModel: string = 'gemini-3.1-flash-lite',
  forceSimulation: boolean = false
) {
  const timestamp = new Date().toISOString();

  // 1. If real Google OAuth Access Token is provided, fetch REAL Gmail inbox data in 1 batch!
  if (accessToken && !forceSimulation) {
    try {
      console.log('[Sentry Serverless Poll] Querying live Gmail API for candidate emails across Inbox & Updates...');
      const realEmails = await fetchFinancialEmailsFromGmail(accessToken, 25, 2);

      if (realEmails.length > 0) {
        console.log(`[Sentry Serverless Poll] Executing 1-shot batch Gemini audit for ${realEmails.length} emails...`);
        const batchAudit = await auditBatchFinancialEmails(realEmails, preferredModel);

        if (batchAudit) {
          // Index consolidated record in RAG memory
          indexNewDocument(
            `Hourly Sentry Batch: ${batchAudit.title}`,
            `${batchAudit.summary}\nProvider: ${batchAudit.providerOrVendor}\nTotal Billed: ${batchAudit.currencySymbol || '$'}${batchAudit.totalBilledAmount}`,
            'past_invoice'
          );

          return NextResponse.json({
            success: true,
            isRealData: true,
            polledAt: timestamp,
            eventDetected: true,
            totalEmailsEvaluated: realEmails.length,
            batchAudit,
            status: 'ACTIVE_MONITORING',
          });
        }
      }

      return NextResponse.json({
        success: true,
        isRealData: true,
        polledAt: timestamp,
        eventDetected: false,
        totalEmailsEvaluated: realEmails.length,
        message: 'Gmail inbox and updates scanned. Zero financial liabilities found (promotional offers discarded).',
        status: 'ACTIVE_MONITORING',
      });
    } catch (err: any) {
      console.error('[Sentry Poll] Gmail API error:', err);
      return NextResponse.json(
        {
          success: false,
          isRealData: false,
          error: err.message,
          message: 'Gmail authentication expired or permissions missing. Please re-connect Google Workspace.',
          requiresGoogleAuth: true,
        },
        { status: 401 }
      );
    }
  }

  // 2. Standby response if no active token is passed
  return NextResponse.json({
    success: true,
    isRealData: false,
    polledAt: timestamp,
    eventDetected: false,
    requiresGoogleAuth: true,
    message: 'Google Workspace not connected. Connect Google Workspace in Settings to poll real emails.',
    status: 'STANDBY',
  });
}
