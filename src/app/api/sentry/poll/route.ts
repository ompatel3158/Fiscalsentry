import { NextRequest, NextResponse } from 'next/server';
import { fetchFinancialEmailsFromGmail } from '@/lib/gmail';
import { auditBatchFinancialEmails } from '@/lib/gemini';
import { indexNewDocument } from '@/lib/rag';
import { db, saveUserAuditToFirestore, UserProfile } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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

  // 1. Single User Direct Poll (when a specific access token is passed by client)
  if (accessToken && !forceSimulation) {
    try {
      console.log('[Sentry Direct Poll] Querying live Gmail API for candidate emails across Inbox & Updates...');
      const realEmails = await fetchFinancialEmailsFromGmail(accessToken, 35, 2);

      if (realEmails.length > 0) {
        console.log(`[Sentry Direct Poll] Executing 1-shot batch Gemini audit for ${realEmails.length} emails...`);
        const batchAudit = await auditBatchFinancialEmails(realEmails, preferredModel);

        if (batchAudit) {
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
      console.error('[Sentry Direct Poll] Gmail API error:', err);
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

  // 2. Autonomous Multi-User Background Scan (Cron triggered by GitHub Actions or Cloud Scheduler)
  try {
    console.log('[Sentry Multi-User Poller] Fetching all connected users from Firestore...');
    const usersSnap = await getDocs(collection(db, 'users'));
    const userDocs = usersSnap.docs.map((d) => d.data() as UserProfile);

    const connectedUsers = userDocs.filter(
      (u) => u.googleAccessToken && (u.googleWorkspaceConnected || u.providers?.includes('google.com'))
    );

    if (connectedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        polledAt: timestamp,
        mode: 'multi_user_cron',
        totalUsersFound: userDocs.length,
        connectedUsersCount: 0,
        message: 'No users with active Google Workspace tokens found in Firestore. Waiting for user connection.',
        status: 'STANDBY',
      });
    }

    const auditResults: any[] = [];

    for (const user of connectedUsers) {
      try {
        const userEmails = await fetchFinancialEmailsFromGmail(user.googleAccessToken!, 35, 2);
        if (userEmails && userEmails.length > 0) {
          const batchAudit = await auditBatchFinancialEmails(
            userEmails,
            user.preferredModel || 'gemini-3.1-flash-lite'
          );
          if (batchAudit) {
            await saveUserAuditToFirestore(user.uid, batchAudit);
            auditResults.push({
              userId: user.uid,
              email: user.email,
              status: 'AUDIT_CREATED',
              title: batchAudit.title,
              totalBilled: batchAudit.totalBilledAmount,
              disputed: batchAudit.potentialRecoveryAmount,
            });
          } else {
            auditResults.push({
              userId: user.uid,
              email: user.email,
              status: 'CLEAN_NO_LIABILITIES',
            });
          }
        } else {
          auditResults.push({
            userId: user.uid,
            email: user.email,
            status: 'NO_NEW_EMAILS',
          });
        }
      } catch (userErr: any) {
        auditResults.push({
          userId: user.uid,
          email: user.email,
          status: 'AUTH_EXPIRED',
          error: userErr.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      polledAt: timestamp,
      mode: 'multi_user_cron',
      totalUsersFound: userDocs.length,
      connectedUsersProcessed: connectedUsers.length,
      results: auditResults,
      status: 'AUTONOMOUS_RUN_COMPLETE',
    });
  } catch (dbErr: any) {
    console.error('[Sentry Multi-User Poll] Firestore query error:', dbErr);
    return NextResponse.json(
      {
        success: false,
        polledAt: timestamp,
        error: dbErr.message,
        status: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
}
