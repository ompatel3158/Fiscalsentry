import { NextRequest, NextResponse } from 'next/server';
import { fetchFinancialEmailsTiered } from '@/lib/gmail';
import { auditBatchFinancialEmails } from '@/lib/gemini';
import { indexNewDocument } from '@/lib/rag';
import { db, saveUserAuditToFirestore, UserProfile } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Helper to exchange an offline refresh_token for a fresh Google access_token
 */
async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!refreshToken || !clientId) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');

  // Verify CRON_SECRET if configured
  if (cronSecret && cronHeader !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // If not a cron secret, check if it's a direct user bearer token
    const userToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    return handlePoll(userToken);
  }

  const tokenFromHeader = authHeader?.startsWith('Bearer ') && authHeader !== `Bearer ${cronSecret}`
    ? authHeader.substring(7)
    : undefined;

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

  // 1. Single User Direct Poll (when a specific access token is passed)
  if (accessToken && !forceSimulation) {
    try {
      console.log('[Sentry Direct Poll] Querying live Gmail API for delta emails...');
      const realEmails = await fetchFinancialEmailsTiered(accessToken, 'delta');

      if (realEmails.length > 0) {
        console.log(`[Sentry Direct Poll] Executing batch Gemini audit for ${realEmails.length} emails...`);
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
        message: 'Gmail inbox scanned. Zero new liabilities found.',
        status: 'ACTIVE_MONITORING',
      });
    } catch (err: any) {
      console.error('[Sentry Direct Poll] Gmail API error:', err);
      return NextResponse.json(
        {
          success: false,
          isRealData: false,
          error: err.message,
          message: 'Gmail authentication expired or permissions missing.',
          requiresGoogleAuth: true,
        },
        { status: 401 }
      );
    }
  }

  // 2. Autonomous Multi-User Background Scan (24/7 Serverless Cron)
  try {
    console.log('[Sentry Multi-User Poller] Fetching all registered users from Firestore...');
    const usersSnap = await getDocs(collection(db, 'users'));
    const userDocs = usersSnap.docs.map((d) => d.data() as UserProfile);

    const connectedUsers = userDocs.filter(
      (u) => (u.googleAccessToken || u.googleRefreshToken) && (u.googleWorkspaceConnected || u.providers?.includes('google.com'))
    );

    if (connectedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        polledAt: timestamp,
        mode: 'multi_user_cron',
        totalUsersFound: userDocs.length,
        connectedUsersCount: 0,
        message: 'No users with active Google Workspace tokens found in Firestore.',
        status: 'STANDBY',
      });
    }

    const auditResults: any[] = [];

    for (const user of connectedUsers) {
      try {
        let activeToken = user.googleAccessToken;
        const tokenSavedAt = user.googleTokenSavedAt || 0;
        const isExpired = tokenSavedAt > 0 && Date.now() - tokenSavedAt > 3000 * 1000;

        // Auto-refresh token if expired and refresh_token is present
        if ((!activeToken || isExpired) && user.googleRefreshToken) {
          const freshToken = await refreshGoogleAccessToken(user.googleRefreshToken);
          if (freshToken) {
            activeToken = freshToken;
            try {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                googleAccessToken: freshToken,
                googleTokenSavedAt: Date.now(),
                updatedAt: new Date().toISOString(),
              });
            } catch (_) {}
          }
        }

        if (!activeToken) {
          auditResults.push({
            userId: user.uid,
            email: user.email,
            status: 'AUTH_EXPIRED',
          });
          continue;
        }

        const userEmails = await fetchFinancialEmailsTiered(
          activeToken,
          'delta',
          user.lastSyncedTimestamp || 0,
          user.auditedEmailIds || []
        );

        if (userEmails && userEmails.length > 0) {
          const batchAudit = await auditBatchFinancialEmails(
            userEmails,
            user.preferredModel || 'gemini-3.1-flash-lite'
          );

          if (batchAudit) {
            await saveUserAuditToFirestore(user.uid, batchAudit);

            // Update user's last synced checkpoint & audited email IDs in Firestore
            try {
              const userRef = doc(db, 'users', user.uid);
              const newAuditedIds = Array.from(new Set([...(user.auditedEmailIds || []), ...userEmails.map((e) => e.id)]));
              await updateDoc(userRef, {
                lastSyncedTimestamp: Date.now(),
                auditedEmailIds: newAuditedIds.slice(-500), // maintain rolling last 500
                updatedAt: new Date().toISOString(),
              });
            } catch (_) {}

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
          status: 'ERROR',
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
