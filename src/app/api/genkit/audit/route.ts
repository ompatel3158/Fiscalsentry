import { NextRequest, NextResponse } from 'next/server';
import { sentryAuditFlow } from '@/lib/genkit';
import { ExtractedEmail } from '@/lib/gmail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emails: ExtractedEmail[] = body.emails || [];

    if (!emails || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    console.log(`[Genkit Audit Route] Running sentryAuditFlow with ${emails.length} emails...`);
    const flowResult = await sentryAuditFlow(
      emails.map((e) => ({
        id: e.id,
        threadId: e.threadId,
        sender: e.sender,
        senderEmail: e.senderEmail,
        subject: e.subject,
        date: e.date,
        snippet: e.snippet,
        bodyText: e.bodyText,
      }))
    );

    return NextResponse.json({
      success: true,
      engine: 'Firebase Genkit',
      result: flowResult,
    });
  } catch (error: any) {
    console.error('[Genkit Audit Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Genkit flow execution failed' },
      { status: 500 }
    );
  }
}
