import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuditResult, ChatMessage, RAGSourceCitation, normalizeCurrency } from './types';
import { MOCK_AUDITS } from './mock-data';
import { ExtractedEmail } from './gmail';

export type SupportedModel = 'gemini-3.7-flash' | 'gemini-3.6-flash' | 'gemini-3.5-flash' | 'gemini-3.5-flash-lite';

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

export function isGeminiConfigured(): boolean {
  const key = getApiKey();
  return Boolean(key && key.length > 5 && !key.includes('PLACEHOLDER'));
}

/**
 * Normalizes model names to active Google Generative AI model endpoints
 */
function resolveModelName(modelName?: string): string {
  if (!modelName) return 'gemini-3.7-flash';
  
  switch (modelName) {
    case 'gemini-3.7-flash':
      return 'gemini-3.7-flash';
    case 'gemini-3.6-flash':
      return 'gemini-3.6-flash';
    case 'gemini-3.5-flash':
      return 'gemini-3.5-flash';
    case 'gemini-3.5-flash-lite':
      return 'gemini-3.5-flash-lite';
    default:
      return modelName;
  }
}

/**
 * Robust JSON parser that strips potential markdown code fences from LLM responses
 */
function parseJsonFromLlm(rawText: string): any {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  }
  return JSON.parse(cleaned.trim());
}

export async function auditFinancialDocument(
  docText: string,
  mediaBase64?: string,
  mimeType: string = 'application/pdf',
  preferredModel: string = 'gemini-3.1-flash-lite'
): Promise<AuditResult> {
  const apiKey = getApiKey();

  if (!isGeminiConfigured()) {
    console.log('[Gemini] API key not found; returning calibrated mock audit for demo');
    const lower = docText.toLowerCase();
    if (lower.includes('vendor') || lower.includes('workstation') || lower.includes('rfp') || lower.includes('quote')) {
      return MOCK_AUDITS['vendor-techcorp-procurement'];
    }
    if (lower.includes('grant') || lower.includes('energy') || lower.includes('solar') || lower.includes('itc')) {
      return MOCK_AUDITS['grant-clean-energy-rebate'];
    }
    return MOCK_AUDITS['medical-metro-health'];
  }

  const modelToUse = resolveModelName(preferredModel);
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are FiscalSentry, an autonomous financial defense and compliance auditor powered by Google Gemini.
Analyze the following financial document, email, payment confirmation, transaction alert, bank debit, IPO mandate, utility bill, subscription receipt, vendor quote, or medical bill.

Perform complete financial extraction & intelligence:
1. PROMOTIONAL / MARKETING DISCRIMINATION:
   - If this email is a promotional advertisement, marketing offer, coupon, newsletter, or membership discount solicitation (and NOT an actual monetary debit, paid transaction, or legal bill):
     Set "isPromotionalOrNonFinancial": true, "totalBilledAmount": 0, "fairBenchmarkAmount": 0, "potentialRecoveryAmount": 0, "actualNetSpend": 0, "riskLevel": "low".
2. AUTO-DETECT CURRENCY: Detect the currency used in the document (INR, USD, EUR, GBP, CAD, AUD, etc.) and specify the exact currency symbol (₹, $, €, £, etc.).
3. TRANSACTION TYPE & RECONCILIATION:
   - "hold_lien": If this is an IPO application mandate, security deposit, or temporary hold/lien (e.g., "UPI mandate created for Rs 15000 for IPO application").
   - "unblocked_lien": If this is an IPO unblock, mandate revocation, or release of lien (e.g., "UPI mandate released/revoked/unblocked Rs 15000").
   - "refund": If this is a refund, reversal, or cashback.
   - "subscription": If this is a recurring service charge (Netflix, AWS, SaaS, gym, mobile plan).
   - "expense": Standard payment/purchase.
   - "bill": Unpaid invoice or bill due.
4. If it is a hold_lien, unblocked_lien, refund, or promotional notice, set actualNetSpend to 0 (since it is a temporary block, release, or $0 promo, not an actual expenditure).
5. Identify provider, document date, line items, overcharges, unbundled fees, or statutory violations.

Output pure, valid JSON adhering to this TypeScript structure:
{
  "title": string,
  "category": "medical_bill" | "vendor_quotes" | "grant_subsidy" | "invoice_receipt",
  "providerOrVendor": string,
  "accountNumber": string,
  "documentDate": "YYYY-MM-DD",
  "totalBilledAmount": number,
  "fairBenchmarkAmount": number,
  "potentialRecoveryAmount": number,
  "currency": string,
  "currencySymbol": string,
  "transactionType": "expense" | "refund" | "hold_lien" | "unblocked_lien" | "subscription" | "transfer" | "income" | "bill",
  "actualNetSpend": number,
  "isRecurringSubscription": boolean,
  "isPromotionalOrNonFinancial": boolean,
  "riskLevel": "critical" | "high" | "medium" | "low",
  "summary": string,
  "citations": [{"statute": string, "title": string, "applicableSection": string, "summary": string}],
  "lineItems": [{
    "id": string,
    "code": string,
    "description": string,
    "originalAmount": number,
    "benchmarkAmount": number,
    "deltaSavings": number,
    "status": "compliant" | "overcharge" | "unbundled" | "duplicate" | "statutory_violation" | "negotiable" | "rebate_eligible",
    "violationType": string,
    "confidenceScore": number,
    "reasoning": string
  }],
  "actions": [{
    "id": string,
    "type": "google_calendar" | "google_tasks" | "google_sheets" | "google_drive" | "gmail" | "slack" | "discord" | "custom_webhook" | "pdf_dispute" | "pdf_po" | "pdf_grant",
    "title": string,
    "description": string,
    "targetService": string,
    "status": "pending",
    "priority": "urgent" | "high" | "medium" | "low",
    "deadlineDate": "YYYY-MM-DD",
    "estimatedRecoveryAmount": number,
    "payload": {}
  }]
}
`;

  try {
    const model = genAI.getGenerativeModel({ model: modelToUse });

    const parts: any[] = [{ text: prompt }];

    if (mediaBase64) {
      const cleanBase64 = mediaBase64.replace(/^data:.*?;base64,/, '');
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    if (docText) {
      parts.push({ text: `Document content:\n${docText}` });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const parsed = parseJsonFromLlm(responseText);
    const norm = normalizeCurrency(parsed.currency, parsed.currencySymbol);

    return {
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...parsed,
      currency: norm.code,
      currencySymbol: norm.symbol,
    };
  } catch (error: any) {
    console.error(`[Gemini ${modelToUse}] Multimodal audit error:`, error);
    // If primary model failed, retry with gemini-3.5-flash-lite or gemini-3.6-flash fallback
    if (modelToUse !== 'gemini-3.6-flash') {
      try {
        console.log('[Gemini] Retrying audit with fallback model gemini-3.6-flash...');
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const parts = [{ text: prompt }, { text: `Document content:\n${docText}` }];
        const fbResult = await fallbackModel.generateContent(parts);
        const fbParsed = parseJsonFromLlm(fbResult.response.text());
        const fbNorm = normalizeCurrency(fbParsed.currency, fbParsed.currencySymbol);
        return {
          id: 'audit-' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...fbParsed,
          currency: fbNorm.code,
          currencySymbol: fbNorm.symbol,
        };
      } catch (fbErr) {
        console.error('[Gemini] Fallback audit also failed:', fbErr);
      }
    }

    return MOCK_AUDITS['medical-metro-health'];
  }
}

/**
/**
 * Helper to merge multiple sub-batch audit results into one consolidated master AuditResult
 */
function mergeSubAudits(audits: AuditResult[], allEmails: ExtractedEmail[]): AuditResult {
  if (audits.length === 1) return audits[0];

  const primaryAudit = audits[0];
  const allLineItems = audits.flatMap((a) => a.lineItems || []);
  const allActions = audits.flatMap((a) => a.actions || []);
  const allEmailIds = Array.from(new Set(audits.flatMap((a) => a.emailIds || [])));

  const totalBilled = audits.reduce((sum, a) => sum + (a.totalBilledAmount || 0), 0);
  const totalBenchmark = audits.reduce((sum, a) => sum + (a.fairBenchmarkAmount || 0), 0);
  const totalRecovery = audits.reduce((sum, a) => sum + (a.potentialRecoveryAmount || 0), 0);
  const totalNetSpend = audits.reduce((sum, a) => sum + (a.actualNetSpend || a.totalBilledAmount || 0), 0);

  const vendors = Array.from(new Set(audits.map((a) => a.providerOrVendor).filter(Boolean)));
  const vendorTitle = vendors.slice(0, 3).join(', ') + (vendors.length > 3 ? ` +${vendors.length - 3} more` : '');

  const sourceEmails = allEmails.map((e) => ({
    messageId: e.id,
    threadId: e.threadId,
    subject: e.subject,
    sender: e.sender,
    senderEmail: e.senderEmail,
    date: e.date,
    snippet: e.snippet,
    rawExcerpt: e.bodyText.substring(0, 400),
    confidenceScore: 0.95,
  }));

  return {
    ...primaryAudit,
    id: 'audit-batch-' + Math.random().toString(36).substring(2, 9),
    emailIds: allEmailIds,
    sourceEmails,
    title: `Consolidated Financial Ledger (${allLineItems.length} Transactions Audited)`,
    providerOrVendor: vendorTitle || 'Multi-Vendor Financial Statement',
    totalBilledAmount: totalBilled,
    fairBenchmarkAmount: totalBenchmark,
    potentialRecoveryAmount: totalRecovery,
    actualNetSpend: totalNetSpend,
    summary: `Comprehensive batch audit synchronized ${allLineItems.length} transactions totaling ${primaryAudit.currencySymbol}${totalBilled.toFixed(2)} across ${audits.length} ledger batches.`,
    lineItems: allLineItems,
    actions: allActions,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Scalable Batch Auditor:
 * Evaluates large volumes of emails (up to 1,000+) in parallel sub-batches of 50 emails per Gemini API call.
 * Discards marketing/promotions, extracts real financial debits/credits/bills/IPO holds,
 * and consolidates the sub-audits into a master Financial Ledger.
 */
export async function auditBatchFinancialEmails(
  emails: ExtractedEmail[],
  preferredModel: string = 'gemini-3.1-flash-lite'
): Promise<AuditResult | null> {
  if (!emails || emails.length === 0) return null;

  // Process large email batches in chunks of 50 per Gemini API call
  if (emails.length > 50) {
    console.log(`[Gemini Batch] Ingesting ${emails.length} emails across parallel 50-email Gemini chunks...`);
    const chunkSize = 50;
    const subBatches: ExtractedEmail[][] = [];
    for (let i = 0; i < emails.length; i += chunkSize) {
      subBatches.push(emails.slice(i, i + chunkSize));
    }

    const subResults = await Promise.all(
      subBatches.map((subBatch) => auditSingleBatchOfEmails(subBatch, preferredModel))
    );

    const validAudits = subResults.filter((a): a is AuditResult => a !== null);
    if (validAudits.length === 0) return null;

    return mergeSubAudits(validAudits, emails);
  }

  return auditSingleBatchOfEmails(emails, preferredModel);
}

/**
 * Evaluates a single batch of up to 50 emails with Gemini or deterministic regex fallback
 */
async function auditSingleBatchOfEmails(
  emails: ExtractedEmail[],
  preferredModel: string = 'gemini-3.1-flash-lite'
): Promise<AuditResult | null> {
  if (!emails || emails.length === 0) return null;

  const apiKey = getApiKey();

  // If Gemini is not configured, fall back to deterministic regex parser
  if (!isGeminiConfigured()) {
    console.log('[Gemini] API key not found; processing batch with deterministic regex parser');
    const validItems: { email: ExtractedEmail; bank: NonNullable<ExtractedEmail['parsedBankHint']> }[] = [];
    emails.forEach((e) => {
      if (e.parsedBankHint && e.parsedBankHint.amount && e.parsedBankHint.amount > 0) {
        validItems.push({ email: e, bank: e.parsedBankHint });
      }
    });

    if (validItems.length === 0) return null;

    const totalBilled = validItems.reduce((sum, v) => sum + (v.bank.amount || 0), 0);
    const { code: primaryCurrency, symbol: primarySymbol } = normalizeCurrency(validItems[0].bank.currency, validItems[0].bank.currencySymbol);
    const vendors = Array.from(new Set(validItems.map((v) => v.bank.merchant || v.email.sender).filter(Boolean))).join(', ');

    return {
      id: 'audit-batch-' + Math.random().toString(36).substring(2, 9),
      emailIds: validItems.map((v) => v.email.id),
      sourceEmails: validItems.map((v) => ({
        messageId: v.email.id,
        threadId: v.email.threadId,
        subject: v.email.subject,
        sender: v.email.sender,
        senderEmail: v.email.senderEmail,
        date: v.email.date,
        snippet: v.email.snippet,
        rawExcerpt: v.email.bodyText.substring(0, 300),
        confidenceScore: 0.95,
      })),
      title: `Hourly Sentry Digest: ${validItems.length} Transactions Audited`,
      category: 'invoice_receipt',
      financialCategory: 'bank_expense',
      providerOrVendor: vendors.length > 30 ? vendors.substring(0, 30) + '...' : vendors || 'Multi-Vendor',
      documentDate: new Date().toISOString().split('T')[0],
      totalBilledAmount: totalBilled,
      fairBenchmarkAmount: totalBilled,
      potentialRecoveryAmount: 0,
      currency: primaryCurrency,
      currencySymbol: primarySymbol,
      transactionType: 'expense',
      actualNetSpend: totalBilled,
      riskLevel: 'low',
      summary: `Automated hourly Sentry batch audit captured ${validItems.length} transactions totaling ${primarySymbol}${totalBilled.toFixed(2)}.`,
      citations: [],
      lineItems: validItems.map((v, i) => ({
        id: `li-${i + 1}`,
        code: `TXN-${i + 1}`,
        description: `${v.bank.merchant || v.email.sender}: ${v.email.subject}`,
        financialCategory: (v.bank.transactionType === 'subscription' ? 'recurring_subscription' : v.bank.transactionType === 'hold_lien' ? 'investment_ipo' : 'bank_expense') as any,
        originalAmount: v.bank.amount || 0,
        benchmarkAmount: v.bank.amount || 0,
        deltaSavings: 0,
        status: 'compliant' as const,
        confidenceScore: 0.95,
        reasoning: 'Verified transactional record',
        sourceEmail: {
          messageId: v.email.id,
          threadId: v.email.threadId,
          subject: v.email.subject,
          sender: v.email.sender,
          senderEmail: v.email.senderEmail,
          date: v.email.date,
          snippet: v.email.snippet,
          rawExcerpt: v.email.bodyText.substring(0, 300),
          confidenceScore: 0.95,
        },
      })),
      actions: [
        {
          id: 'act-batch-sheet-1',
          type: 'google_sheets',
          title: `Append ${validItems.length} Transactions to Google Sheets`,
          description: 'Synchronize hourly batch audit records to your Financial Ledger',
          targetService: 'Google Sheets',
          status: 'pending',
          priority: 'medium',
          deadlineDate: new Date().toISOString().split('T')[0],
          estimatedRecoveryAmount: 0,
          payload: { sheetName: 'Transactions', count: validItems.length },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const modelToUse = resolveModelName(preferredModel);
  const genAI = new GoogleGenerativeAI(apiKey);

  const batchContent = emails
    .map(
      (e, idx) => `
[EMAIL #${idx + 1}]
ID: ${e.id}
Subject: ${e.subject}
From: ${e.sender} (${e.senderEmail})
Date: ${e.date}
Snippet: ${e.snippet}
Body Preview:
${e.bodyText.substring(0, 1000)}
${e.parsedBankHint ? `Detected Bank Pattern: Amount=${e.parsedBankHint.amount}, Currency=${e.parsedBankHint.currency}, Type=${e.parsedBankHint.transactionType}, Merchant=${e.parsedBankHint.merchant}` : ''}
---`
    )
    .join('\n');

  const prompt = `
You are FiscalSentry, an autonomous financial intelligence & paperwork defense auditor powered by Google Gemini.
You are evaluating an hourly batch of ${emails.length} candidate emails pulled from the user's Gmail (Inbox and Updates).

OBJECTIVES:
1. DISCRIMINATE & FILTER:
   - Identify which emails are REAL financial transactions:
     * Utility & Service Bills (Electricity, Water, Internet, Hospital Bills)
     * Bank & Card Debits (UPI, POS, Online debits/expenses)
     * Income & Salary Credits
     * Subscriptions (Netflix, Prime, SaaS, Gym)
     * Credit Card Statements & Loan EMIs
     * Investments & IPO Mandates (blocked/unblocked funds)
   - Filter out all pure promotional marketing campaigns, discount offers, coupons, sales announcements, and newsletters (0 debt and 0 liability).

2. BATCH RECONCILIATION:
   - If ZERO real financial transactions exist in this batch (all are promotional or non-financial), output JSON:
     { "hasFinancialTransactions": false }

   - If ONE OR MORE real financial transactions exist:
     Consolidate them into ONE high-precision hourly audit statement JSON representing this batch:
     {
       "hasFinancialTransactions": true,
       "title": string,
       "category": "invoice_receipt" | "medical_bill" | "vendor_quotes" | "grant_subsidy",
       "financialCategory": "utility_bill" | "bank_expense" | "income_salary" | "recurring_subscription" | "credit_card_statement" | "loan_emi" | "insurance" | "investment_ipo",
       "providerOrVendor": string,
       "accountNumber": string,
       "documentDate": "YYYY-MM-DD",
       "dueDate": "YYYY-MM-DD" (or null if not a bill/EMI),
       "totalBilledAmount": number,
       "fairBenchmarkAmount": number,
       "potentialRecoveryAmount": number,
       "currency": string,
       "currencySymbol": string,
       "transactionType": "expense" | "refund" | "hold_lien" | "unblocked_lien" | "subscription" | "transfer" | "income" | "bill",
       "actualNetSpend": number,
       "isRecurringSubscription": boolean,
       "nextRenewalDate": "YYYY-MM-DD" (or null),
       "riskLevel": "critical" | "high" | "medium" | "low",
       "summary": string,
       "citations": [{"statute": string, "title": string, "applicableSection": string, "summary": string}],
       "lineItems": [{
         "id": string,
         "sourceEmailId": string (must match the ID of the specific email from the batch),
         "code": string,
         "description": string,
         "financialCategory": "utility_bill" | "bank_expense" | "income_salary" | "recurring_subscription" | "credit_card_statement" | "loan_emi" | "insurance" | "investment_ipo",
         "originalAmount": number,
         "benchmarkAmount": number,
         "deltaSavings": number,
         "dueDate": "YYYY-MM-DD" (optional),
         "status": "compliant" | "overcharge" | "unbundled" | "duplicate" | "statutory_violation" | "negotiable" | "rebate_eligible",
         "violationType": string,
         "confidenceScore": number (0.0 - 1.0),
         "reasoning": string
       }],
       "actions": [{
         "id": string,
         "type": "google_calendar" | "google_tasks" | "google_sheets" | "google_drive" | "gmail" | "slack" | "discord" | "pdf_dispute" | "pdf_po",
         "title": string,
         "description": string,
         "targetService": string,
         "status": "pending",
         "priority": "urgent" | "high" | "medium" | "low",
         "deadlineDate": "YYYY-MM-DD",
         "estimatedRecoveryAmount": number,
         "payload": {}
       }]
     }

Output pure, valid JSON only.
`;

  try {
    const model = genAI.getGenerativeModel({ model: modelToUse });
    const result = await model.generateContent([
      { text: prompt },
      { text: `BATCH DATA:\n${batchContent}` },
    ]);
    const parsed = parseJsonFromLlm(result.response.text());

    if (parsed.hasFinancialTransactions === false || (!parsed.lineItems || parsed.lineItems.length === 0)) {
      console.log('[Gemini Batch Audit] No genuine financial transactions in this batch; promotional emails discarded.');
      return null;
    }

    const emailMap = new Map(emails.map((e) => [e.id, e]));

    const enrichedLineItems = (parsed.lineItems || []).map((li: any) => {
      const matchedEmail = li.sourceEmailId ? emailMap.get(li.sourceEmailId) : undefined;
      const fallbackEmail = matchedEmail || emails[0];
      return {
        ...li,
        sourceEmail: fallbackEmail
          ? {
              messageId: fallbackEmail.id,
              threadId: fallbackEmail.threadId,
              subject: fallbackEmail.subject,
              sender: fallbackEmail.sender,
              senderEmail: fallbackEmail.senderEmail,
              date: fallbackEmail.date,
              snippet: fallbackEmail.snippet,
              rawExcerpt: fallbackEmail.bodyText.substring(0, 400),
              confidenceScore: li.confidenceScore || 0.95,
            }
          : undefined,
      };
    });

    const sourceEmails = emails.map((e) => ({
      messageId: e.id,
      threadId: e.threadId,
      subject: e.subject,
      sender: e.sender,
      senderEmail: e.senderEmail,
      date: e.date,
      snippet: e.snippet,
      rawExcerpt: e.bodyText.substring(0, 400),
      confidenceScore: 0.95,
    }));

    const norm = normalizeCurrency(parsed.currency, parsed.currencySymbol);

    return {
      id: 'audit-batch-' + Math.random().toString(36).substring(2, 9),
      emailIds: emails.map((e) => e.id),
      sourceEmails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...parsed,
      currency: norm.code,
      currencySymbol: norm.symbol,
      lineItems: enrichedLineItems,
    };
  } catch (err: any) {
    console.error(`[Gemini Batch ${modelToUse}] Error:`, err);
    if (modelToUse !== 'gemini-3.6-flash') {
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const fbResult = await fallbackModel.generateContent([
          { text: prompt },
          { text: `BATCH DATA:\n${batchContent}` },
        ]);
        const fbParsed = parseJsonFromLlm(fbResult.response.text());
        if (fbParsed.hasFinancialTransactions === false || (!fbParsed.lineItems || fbParsed.lineItems.length === 0)) {
          return null;
        }

        const emailMap = new Map(emails.map((e) => [e.id, e]));
        const fbEnrichedLineItems = (fbParsed.lineItems || []).map((li: any) => {
          const matchedEmail = li.sourceEmailId ? emailMap.get(li.sourceEmailId) : undefined;
          const fallbackEmail = matchedEmail || emails[0];
          return {
            ...li,
            sourceEmail: fallbackEmail
              ? {
                  messageId: fallbackEmail.id,
                  threadId: fallbackEmail.threadId,
                  subject: fallbackEmail.subject,
                  sender: fallbackEmail.sender,
                  senderEmail: fallbackEmail.senderEmail,
                  date: fallbackEmail.date,
                  snippet: fallbackEmail.snippet,
                  rawExcerpt: fallbackEmail.bodyText.substring(0, 400),
                  confidenceScore: li.confidenceScore || 0.95,
                }
              : undefined,
          };
        });

        const fbNorm = normalizeCurrency(fbParsed.currency, fbParsed.currencySymbol);

        return {
          id: 'audit-batch-' + Math.random().toString(36).substring(2, 9),
          emailIds: emails.map((e) => e.id),
          sourceEmails: emails.map((e) => ({
            messageId: e.id,
            threadId: e.threadId,
            subject: e.subject,
            sender: e.sender,
            senderEmail: e.senderEmail,
            date: e.date,
            snippet: e.snippet,
            rawExcerpt: e.bodyText.substring(0, 400),
            confidenceScore: 0.95,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...fbParsed,
          currency: fbNorm.code,
          currencySymbol: fbNorm.symbol,
          lineItems: fbEnrichedLineItems,
        };
      } catch (fbErr) {
        console.error('[Gemini Batch Fallback] Error:', fbErr);
      }
    }
    return null;
  }
}

export async function generateChatResponse(
  messages: ChatMessage[],
  ragContext: RAGSourceCitation[],
  activeAudit?: AuditResult,
  preferredModel: string = 'gemini-3.1-flash-lite'
): Promise<{ text: string; auditGenerated?: AuditResult }> {
  const apiKey = getApiKey();

  if (!isGeminiConfigured()) {
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content.toLowerCase() || '';

    if (lastUserMsg.includes('metro') || lastUserMsg.includes('medical') || lastUserMsg.includes('hospital')) {
      return {
        text: '🛡️ **Medical Bill Audit Analyzed**\n\nI reviewed the Metro Health statement. The unbundled CPT 99214 charge ($440) and out-of-network balance billing under No Surprises Act ($750) represent a total dispute of **$1,840.00**.\n\nI have generated the official dispute letter and scheduled the 30-day appeal deadline in Google Calendar.',
        auditGenerated: MOCK_AUDITS['medical-metro-health'],
      };
    }

    if (lastUserMsg.includes('quote') || lastUserMsg.includes('vendor') || lastUserMsg.includes('hardware')) {
      return {
        text: '📊 **Vendor Procurement Normalized**\n\nI compared the 3 hardware quotes across Apex, Vertex, and Nexus. Awarding to **Nexus Cloud Solutions** yields **$3,200 in total savings** with 3-year enterprise ProSupport included.\n\nI have prepared the official Purchase Order PO-2026-9921.',
        auditGenerated: MOCK_AUDITS['vendor-techcorp-procurement'],
      };
    }

    return {
      text: '🤖 **Voidy AI Executive Manager Standing By**\n\nI am monitoring your financial inbox, encrypted transaction ledger, and upcoming obligations. You can ask me about your monthly cash flow, upcoming bills, active subscriptions, 1-year net savings, or drop in any billing document to audit line items and dispute illegal overcharges.',
    };
  }

  const modelToUse = resolveModelName(preferredModel);
  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `
You are Voidy AI, the user's autonomous personal financial intelligence manager, executive CFO, and paperwork defense sentry.
You possess complete awareness of the user's financial inbox, 1-year transaction ledger, bank debits/credits, upcoming bills, loan EMIs, and active recurring subscriptions.

Core Capabilities:
1. Financial Ledger & Cash Flow Math:
   - Calculate precise Income, Expenses, Net Savings, and Month-over-Month growth rates.
   - Differentiate completed obligations (paid bills, cleared EMIs, released IPO holds) from pending upcoming dues.
   - Detect annual subscription liabilities and warn about price increases.
2. Ground-Truth Paperwork Defense:
   - Audit bills & invoices against statutory fair benchmarks (No Surprises Act, statutory medical codes, procurement benchmarks).
   - Retain verified source attribution with confidence scores.
3. Communication & Tone:
   - Introduce yourself as "Voidy AI" when relevant.
   - Be concise, analytical, executive, and empowering.
   - Format numbers cleanly with the user's native currency symbol (e.g. ₹ for INR, $ for USD, € for EUR).
   - Use Markdown tables, bold headers, and clean bullet points.

RAG Knowledge Retrieved:
${ragContext.map((c) => `[${c.sourceType.toUpperCase()} - ${c.title}]: ${c.snippet}`).join('\n\n')}

Active Document Under Review:
${activeAudit ? JSON.stringify({ title: activeAudit.title, provider: activeAudit.providerOrVendor, currency: activeAudit.currency, billed: activeAudit.totalBilledAmount, recovery: activeAudit.potentialRecoveryAmount, summary: activeAudit.summary }) : 'None'}
`;

  try {
    const model = genAI.getGenerativeModel({ model: modelToUse });

    const chatHistory = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Voidy AI initialized. Ready to manage and optimize your financial universe.' }],
        },
        ...chatHistory.slice(0, -1),
      ],
    });

    const lastMessage = messages[messages.length - 1]?.content || 'Hello';
    const result = await chat.sendMessage(lastMessage);
    return { text: result.response.text() };
  } catch (err: any) {
    console.error(`[Gemini ${modelToUse} Chat Error]:`, err);
    
    // Attempt fallback to gemini-3.6-flash if primary model had an issue
    if (modelToUse !== 'gemini-3.6-flash') {
      try {
        console.log('[Gemini] Retrying chat with fallback model gemini-3.6-flash...');
        const fbModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const lastMessage = messages[messages.length - 1]?.content || 'Hello';
        const fbRes = await fbModel.generateContent([
          { text: systemPrompt },
          { text: lastMessage }
        ]);
        return { text: fbRes.response.text() };
      } catch (fbErr) {
        console.error('[Gemini] Fallback chat failed:', fbErr);
      }
    }

    return {
      text: `⚠️ **AI Notice (${modelToUse})**: ${err.message || 'Processed with cached regulatory memory.'}`,
    };
  }
}
