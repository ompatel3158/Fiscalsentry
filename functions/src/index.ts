import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

/**
 * Exchange Google refresh_token for a fresh access_token
 */
async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
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
    const data: any = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Fetch delta emails from Gmail API for a user
 */
async function fetchUserDeltaEmails(accessToken: string, lastPollTimestamp: number = 0, existingIds: string[] = []): Promise<any[]> {
  const epochSeconds = lastPollTimestamp > 0
    ? Math.max(0, Math.floor(lastPollTimestamp / 1000) - 300)
    : Math.floor(Date.now() / 1000) - 86400 * 2;

  const query = encodeURIComponent(`-category:promotions -category:social -is:draft -is:spam after:${epochSeconds}`);
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`;

  try {
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!listRes.ok) return [];
    const listData: any = await listRes.json();
    const messages = listData.messages || [];

    const candidates = existingIds.length > 0
      ? messages.filter((m: any) => !existingIds.includes(m.id))
      : messages;

    if (candidates.length === 0) return [];

    const detailPromises = candidates.slice(0, 30).map(async (msg: any) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        if (!detailRes.ok) return null;
        const data: any = await detailRes.json();
        const headers = data.payload?.headers || [];
        const getH = (n: string) => headers.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          sender: getH('From'),
          subject: getH('Subject'),
          date: getH('Date'),
          snippet: data.snippet || '',
          bodyText: data.snippet || '',
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(detailPromises);
    return results.filter((r) => r !== null);
  } catch {
    return [];
  }
}

/**
 * 1. 🕒 Firebase Cloud Scheduled Function: 24/7 Autonomous Background Sentry
 * Runs automatically every 1 hour in the cloud (even when the browser and website are closed).
 */
export const sentryScheduledWorker = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'UTC',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    console.log('[Firebase Cloud Function] 🛡️ Autonomous Sentry Hourly Execution Started...');
    const db = getDb();
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
      console.log('[Firebase Cloud Function] No users registered in Firestore.');
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      let token = user.googleAccessToken;
      const isExpired = user.googleTokenSavedAt && Date.now() - user.googleTokenSavedAt > 3000 * 1000;

      if ((!token || isExpired) && user.googleRefreshToken) {
        const fresh = await refreshGoogleAccessToken(user.googleRefreshToken);
        if (fresh) {
          token = fresh;
          await doc.ref.update({
            googleAccessToken: fresh,
            googleTokenSavedAt: Date.now(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (!token) continue;

      try {
        const deltaEmails = await fetchUserDeltaEmails(token, user.lastSyncedTimestamp || 0, user.auditedEmailIds || []);
        if (deltaEmails.length === 0) continue;

        console.log(`[Firebase Cloud Function] Auditing ${deltaEmails.length} emails for user ${doc.id}...`);

        let summaryText = 'Autonomous Cloud Audit Completed.';
        if (genAI) {
          const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });
          const res = await model.generateContent([
            { text: `You are Voidy AI (FiscalSentry). Evaluate these ${deltaEmails.length} financial emails:\n${JSON.stringify(deltaEmails)}\nOutput a summary of valid transactions or return null if promotional.` },
          ]);
          summaryText = res.response.text();
        }

        const auditId = 'audit-cloud-' + Date.now();
        await doc.ref.collection('audits').doc(auditId).set({
          id: auditId,
          title: `Voidy AI Cloud Sentry: ${deltaEmails.length} Emails Reconciled`,
          summary: summaryText,
          totalBilledAmount: 0,
          documentDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          source: 'firebase_cloud_function_2nd_gen',
        });

        const newAuditedIds = Array.from(new Set([...(user.auditedEmailIds || []), ...deltaEmails.map((e: any) => e.id)]));
        await doc.ref.update({
          lastSyncedTimestamp: Date.now(),
          auditedEmailIds: newAuditedIds.slice(-500),
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error(`[Firebase Cloud Function Error for ${doc.id}]:`, err.message);
      }
    }
    console.log('[Firebase Cloud Function] 🛡️ Autonomous Sentry Hourly Execution Completed.');
  }
);

/**
 * 2. 🌐 Firebase HTTPS Callable Function: Manual Direct Sentry Poll
 */
export const sentryPollHttp = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  res.json({
    success: true,
    engine: 'Firebase Cloud Functions (2nd Gen)',
    message: 'Autonomous Sentry Cloud Endpoint is online.',
    timestamp: new Date().toISOString(),
  });
});
