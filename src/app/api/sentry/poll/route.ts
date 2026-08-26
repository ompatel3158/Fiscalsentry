import { NextRequest, NextResponse } from 'next/server';
import { fetchFinancialEmailsFromGmail } from '@/lib/gmail';
import { auditFinancialDocument } from '@/lib/gemini';
import { indexNewDocument } from '@/lib/rag';
import { MOCK_AUDITS } from '@/lib/mock-data';

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

  // 1. If real Google OAuth Access Token is provided, fetch REAL Gmail inbox data!
  if (accessToken && !forceSimulation) {
    try {
      console.log('[Sentry Poll] Querying live Gmail API for financial emails...');
      const realEmails = await fetchFinancialEmailsFromGmail(accessToken, 8);

      if (realEmails.length > 0) {
        // Take the most relevant or recent email
        const targetEmail = realEmails[0];
        console.log(`[Sentry Poll] Found real email: "${targetEmail.subject}" from ${targetEmail.sender}`);

        // Run Gemini 3.1 Flash Lite multimodal audit on the real email
        const docText = `
Subject: ${targetEmail.subject}
From: ${targetEmail.sender}
Date: ${targetEmail.date}
Snippet: ${targetEmail.snippet}
Content:
${targetEmail.bodyText.substring(0, 4000)}
`;

        const attachment = targetEmail.attachments[0];
        const realAudit = await auditFinancialDocument(
          docText,
          attachment?.dataBase64,
          attachment?.mimeType || 'application/pdf',
          preferredModel
        );

        // Customize title with real sender/subject if generic
        if (!realAudit.title || realAudit.title.includes('Statement')) {
          realAudit.title = targetEmail.subject.length > 40 ? targetEmail.subject.substring(0, 40) + '...' : targetEmail.subject;
        }
        if (!realAudit.providerOrVendor) {
          realAudit.providerOrVendor = targetEmail.sender.replace(/<.*?>/g, '').trim();
        }

        // Index in RAG memory
        indexNewDocument(
          `Real Gmail: ${targetEmail.subject}`,
          `${realAudit.summary}\nSender: ${targetEmail.sender}\nPotential Recovery: $${realAudit.potentialRecoveryAmount}`,
          'past_invoice'
        );

        return NextResponse.json({
          success: true,
          isRealData: true,
          polledAt: timestamp,
          eventDetected: true,
          totalEmailsChecked: realEmails.length,
          event: {
            source: 'gmail',
            sender: targetEmail.sender,
            subject: targetEmail.subject,
            attachmentName: attachment?.filename || 'Extracted_Email_Body.txt',
            audit: realAudit,
          },
          status: 'ACTIVE_MONITORING',
        });
      } else {
        return NextResponse.json({
          success: true,
          isRealData: true,
          polledAt: timestamp,
          eventDetected: false,
          message: 'Gmail inbox scanned. No new unread financial invoices or billing attachments found.',
          status: 'ACTIVE_MONITORING',
        });
      }
    } catch (err: any) {
      console.error('[Sentry Poll] Gmail API fetch error:', err);
      return NextResponse.json({
        success: false,
        isRealData: false,
        error: err.message,
        message: 'Gmail authentication expired or permissions missing. Please re-connect Google Workspace.',
        requiresGoogleAuth: true,
      }, { status: 401 });
    }
  }

  // 2. If no OAuth token, return simulation or prompt to connect
  return NextResponse.json({
    success: true,
    isRealData: false,
    polledAt: timestamp,
    eventDetected: false,
    requiresGoogleAuth: true,
    message: 'Google Workspace not connected. Connect Google in Settings or Integrations to pull real emails.',
    status: 'STANDBY',
  });
}
