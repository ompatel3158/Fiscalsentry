"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentryPollHttp = exports.sentryScheduledWorker = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
function getDb() {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    return admin.firestore();
}
/**
 * Exchange Google refresh_token for a fresh access_token
 */
async function refreshGoogleAccessToken(refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!refreshToken || !clientId)
        return null;
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
        if (!res.ok)
            return null;
        const data = await res.json();
        return data.access_token || null;
    }
    catch {
        return null;
    }
}
/**
 * Fetch delta emails from Gmail API for a user
 */
async function fetchUserDeltaEmails(accessToken, lastPollTimestamp = 0, existingIds = []) {
    const epochSeconds = lastPollTimestamp > 0
        ? Math.max(0, Math.floor(lastPollTimestamp / 1000) - 300)
        : Math.floor(Date.now() / 1000) - 86400 * 2;
    const query = encodeURIComponent(`-category:promotions -category:social -is:draft -is:spam after:${epochSeconds}`);
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`;
    try {
        const listRes = await fetch(listUrl, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        if (!listRes.ok)
            return [];
        const listData = await listRes.json();
        const messages = listData.messages || [];
        const candidates = existingIds.length > 0
            ? messages.filter((m) => !existingIds.includes(m.id))
            : messages;
        if (candidates.length === 0)
            return [];
        const detailPromises = candidates.slice(0, 30).map(async (msg) => {
            try {
                const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
                    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
                });
                if (!detailRes.ok)
                    return null;
                const data = await detailRes.json();
                const headers = data.payload?.headers || [];
                const getH = (n) => headers.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value || '';
                return {
                    id: msg.id,
                    threadId: msg.threadId,
                    sender: getH('From'),
                    subject: getH('Subject'),
                    date: getH('Date'),
                    snippet: data.snippet || '',
                    bodyText: data.snippet || '',
                };
            }
            catch {
                return null;
            }
        });
        const results = await Promise.all(detailPromises);
        return results.filter((r) => r !== null);
    }
    catch {
        return [];
    }
}
/**
 * 1. 🕒 Firebase Cloud Scheduled Function: 24/7 Autonomous Background Sentry
 * Runs automatically every 1 hour in the cloud (even when the browser and website are closed).
 */
exports.sentryScheduledWorker = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 hours',
    timeZone: 'UTC',
    memory: '512MiB',
    timeoutSeconds: 300,
}, async (event) => {
    console.log('[Firebase Cloud Function] 🛡️ Autonomous Sentry Hourly Execution Started...');
    const db = getDb();
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
        console.log('[Firebase Cloud Function] No users registered in Firestore.');
        return;
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const genAI = apiKey ? new generative_ai_1.GoogleGenerativeAI(apiKey) : null;
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
        if (!token)
            continue;
        try {
            const deltaEmails = await fetchUserDeltaEmails(token, user.lastSyncedTimestamp || 0, user.auditedEmailIds || []);
            if (deltaEmails.length === 0)
                continue;
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
            const newAuditedIds = Array.from(new Set([...(user.auditedEmailIds || []), ...deltaEmails.map((e) => e.id)]));
            await doc.ref.update({
                lastSyncedTimestamp: Date.now(),
                auditedEmailIds: newAuditedIds.slice(-500),
                updatedAt: new Date().toISOString(),
            });
        }
        catch (err) {
            console.error(`[Firebase Cloud Function Error for ${doc.id}]:`, err.message);
        }
    }
    console.log('[Firebase Cloud Function] 🛡️ Autonomous Sentry Hourly Execution Completed.');
});
/**
 * 2. 🌐 Firebase HTTPS Callable Function: Manual Direct Sentry Poll
 */
exports.sentryPollHttp = (0, https_1.onRequest)({ cors: true, invoker: 'public' }, async (req, res) => {
    res.json({
        success: true,
        engine: 'Firebase Cloud Functions (2nd Gen)',
        message: 'Autonomous Sentry Cloud Endpoint is online.',
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=index.js.map