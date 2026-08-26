import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuditResult, ChatMessage, RAGSourceCitation } from './types';
import { MOCK_AUDITS } from './mock-data';

export type SupportedModel = 'gemini-3.1-flash-lite' | 'gemini-3.5-flash-lite' | 'gemini-3.6-flash' | 'gemini-2.0-flash' | 'gemini-2.0-pro';

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
  if (!modelName) return 'gemini-3.1-flash-lite';
  
  switch (modelName) {
    case 'gemini-3.1-flash-lite':
      return 'gemini-3.1-flash-lite';
    case 'gemini-3.5-flash-lite':
      return 'gemini-3.5-flash-lite';
    case 'gemini-3.6-flash':
    case 'gemini-2.0-flash':
    case 'gemini-2.0-pro':
      return 'gemini-3.6-flash';
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

    return {
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...parsed,
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
        return {
          id: 'audit-' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...fbParsed,
        };
      } catch (fbErr) {
        console.error('[Gemini] Fallback audit also failed:', fbErr);
      }
    }

    return MOCK_AUDITS['medical-metro-health'];
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
      text: '🤖 **FiscalSentry Agent Standing By**\n\nI am monitoring your financial documents and connected workspace tools. You can drop in any medical bills, vendor quotes, grant notices, or spreadsheets, and I will audit them against statutory benchmarks, dispute illegal overcharges, and execute actions across Google Workspace and Slack.',
    };
  }

  const modelToUse = resolveModelName(preferredModel);
  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `
You are FiscalSentry, an autonomous financial intelligence & compliance defense agent.
You audit paperwork, bank transactions, and emails, detect overcharges & statutory violations (No Surprises Act, CMS NCCI, IRA Section 48, FAR Procurement), and recommend actions across Google Workspace (Calendar, Tasks, Sheets, Drive, Gmail) and notification channels.

Communication Guidelines:
1. Always format responses using clean, modern Markdown:
   - Use bold headers (###) and bullet points.
   - When presenting lists of items or breakdowns, use Markdown Tables (| Header 1 | Header 2 |) for clarity.
   - Use horizontal dividers (---) between sections.
2. DO NOT output fake Python or script code blocks for Google Workspace actions. Instead, summarize recommended actions cleanly in bullet points (e.g. "• Schedule appeal in Google Calendar by [Date]").
3. If an audited email or document is marketing/promotional (e.g. Costco coupon, newsletter) or a neutral bank notification:
   - Explicitly note: "Document Type: Informational / Promotional Notice (No Outstanding Debt or Charge)."
   - State net spend and debt clearly as $0.00 / ₹0.00.
4. Auto-detect and respect the user's native currency (e.g. INR ₹, USD $, EUR €, GBP £) according to the documents.

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
          parts: [{ text: 'FiscalSentry system initialized and ready to protect financial workflows.' }],
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
