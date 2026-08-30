import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

/**
 * Initialize Firebase Genkit with Google AI Plugin
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    }),
  ],
});

/**
 * Zod Schemas for Type-Safe Structured Genkit Output
 */
export const LineItemSchema = z.object({
  id: z.string(),
  sourceEmailId: z.string().optional(),
  code: z.string(),
  description: z.string(),
  financialCategory: z.enum([
    'utility_bill',
    'bank_expense',
    'income_salary',
    'recurring_subscription',
    'credit_card_statement',
    'loan_emi',
    'insurance',
    'investment_ipo',
  ]),
  originalAmount: z.number(),
  benchmarkAmount: z.number(),
  deltaSavings: z.number(),
  dueDate: z.string().optional(),
  status: z.enum([
    'compliant',
    'overcharge',
    'unbundled',
    'duplicate',
    'statutory_violation',
    'negotiable',
    'rebate_eligible',
  ]),
  violationType: z.string().optional(),
  confidenceScore: z.number().default(0.95),
  reasoning: z.string(),
});

export const ActionItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'google_calendar',
    'google_tasks',
    'google_sheets',
    'google_drive',
    'gmail',
    'slack',
    'discord',
    'pdf_dispute',
    'pdf_po',
  ]),
  title: z.string(),
  description: z.string(),
  targetService: z.string(),
  status: z.enum(['pending', 'completed', 'failed']).default('pending'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  deadlineDate: z.string().optional(),
  estimatedRecoveryAmount: z.number().default(0),
  payload: z.record(z.any()).optional(),
});

export const SentryBatchAuditSchema = z.object({
  hasFinancialTransactions: z.boolean(),
  title: z.string().default('Voidy AI Financial Batch Audit'),
  category: z.enum(['invoice_receipt', 'medical_bill', 'vendor_quotes', 'grant_subsidy']).default('invoice_receipt'),
  financialCategory: z.enum([
    'utility_bill',
    'bank_expense',
    'income_salary',
    'recurring_subscription',
    'credit_card_statement',
    'loan_emi',
    'insurance',
    'investment_ipo',
  ]).default('bank_expense'),
  providerOrVendor: z.string().default('Multi-Vendor'),
  accountNumber: z.string().optional(),
  documentDate: z.string().default(new Date().toISOString().split('T')[0]),
  dueDate: z.string().optional(),
  totalBilledAmount: z.number().default(0),
  fairBenchmarkAmount: z.number().default(0),
  potentialRecoveryAmount: z.number().default(0),
  currency: z.string().default('USD'),
  currencySymbol: z.string().default('$'),
  transactionType: z.enum(['expense', 'refund', 'hold_lien', 'unblocked_lien', 'subscription', 'transfer', 'income', 'bill']).default('expense'),
  actualNetSpend: z.number().default(0),
  isRecurringSubscription: z.boolean().default(false),
  nextRenewalDate: z.string().optional(),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']).default('low'),
  summary: z.string().default(''),
  citations: z.array(z.object({
    statute: z.string(),
    title: z.string(),
    applicableSection: z.string(),
    summary: z.string(),
  })).default([]),
  lineItems: z.array(LineItemSchema).default([]),
  actions: z.array(ActionItemSchema).default([]),
});

/**
 * Genkit Flow: Sentry Financial Batch Email Audit Flow
 * Evaluates candidate emails with structured output validation
 */
export const sentryAuditFlow = ai.defineFlow(
  {
    name: 'sentryAuditFlow',
    inputSchema: z.array(
      z.object({
        id: z.string(),
        threadId: z.string(),
        sender: z.string(),
        senderEmail: z.string(),
        subject: z.string(),
        date: z.string(),
        snippet: z.string(),
        bodyText: z.string(),
      })
    ),
    outputSchema: SentryBatchAuditSchema,
  },
  async (emails) => {
    if (!emails || emails.length === 0) {
      return {
        hasFinancialTransactions: false,
        title: 'Empty Batch',
        category: 'invoice_receipt' as const,
        financialCategory: 'bank_expense' as const,
        providerOrVendor: 'None',
        documentDate: new Date().toISOString().split('T')[0],
        totalBilledAmount: 0,
        fairBenchmarkAmount: 0,
        potentialRecoveryAmount: 0,
        currency: 'USD',
        currencySymbol: '$',
        transactionType: 'expense' as const,
        actualNetSpend: 0,
        isRecurringSubscription: false,
        riskLevel: 'low' as const,
        summary: 'No emails provided in batch.',
        citations: [],
        lineItems: [],
        actions: [],
      };
    }

    const emailContent = emails
      .map(
        (e, idx) => `
[EMAIL #${idx + 1}]
ID: ${e.id}
Subject: ${e.subject}
From: ${e.sender} (${e.senderEmail})
Date: ${e.date}
Snippet: ${e.snippet}
Body Preview:
${e.bodyText.substring(0, 800)}
---`
      )
      .join('\n');

    const prompt = `
You are Voidy AI (FiscalSentry), an autonomous financial intelligence & paperwork defense sentry.
Evaluate these ${emails.length} emails from the user's Gmail.

OBJECTIVES:
1. Identify all genuine financial transactions: Utility bills, bank debits, credit card alerts, salary credits, subscriptions, IPO holds/unblocks, and receipts.
2. Discard all promotional newsletters, spam, and non-financial messages.
3. If no real financial transactions exist, return hasFinancialTransactions: false.
4. If real transactions exist, construct lineItems with precise amounts, dates, vendors, and confidence scores.

EMAILS TO AUDIT:
${emailContent}
`;

    const { output } = await ai.generate({
      model: gemini15Flash,
      prompt,
      output: {
        schema: SentryBatchAuditSchema,
      },
    });

    return (
      output || {
        hasFinancialTransactions: false,
        title: 'Audit Complete',
        category: 'invoice_receipt' as const,
        financialCategory: 'bank_expense' as const,
        providerOrVendor: 'Multi-Vendor',
        documentDate: new Date().toISOString().split('T')[0],
        totalBilledAmount: 0,
        fairBenchmarkAmount: 0,
        potentialRecoveryAmount: 0,
        currency: 'USD',
        currencySymbol: '$',
        transactionType: 'expense' as const,
        actualNetSpend: 0,
        isRecurringSubscription: false,
        riskLevel: 'low' as const,
        summary: 'Batch processed with zero liabilities.',
        citations: [],
        lineItems: [],
        actions: [],
      }
    );
  }
);

/**
 * Genkit Flow: Voidy AI Conversational Financial Flow
 */
export const voidyChatFlow = ai.defineFlow(
  {
    name: 'voidyChatFlow',
    inputSchema: z.object({
      userPrompt: z.string(),
      financialLedgerSummary: z.string().optional(),
      activeAuditsCount: z.number().default(0),
    }),
    outputSchema: z.object({
      response: z.string(),
      suggestedActions: z.array(z.string()).default([]),
    }),
  },
  async ({ userPrompt, financialLedgerSummary, activeAuditsCount }) => {
    const prompt = `
You are Voidy AI, the user's Autonomous Executive CFO and Personal Financial Manager.
You have complete visibility into their financial ledger and paperwork defense records.

CURRENT FINANCIAL LEDGER DATA:
${financialLedgerSummary || 'No recent statements synchronized yet.'}
Active Audits on File: ${activeAuditsCount}

USER QUESTION:
"${userPrompt}"

Instructions:
- Provide exact numerical math, calculated totals, and month-over-month comparisons when asked.
- Be concise, analytical, and authoritative.
- Format numerical tables and currency symbols cleanly (₹ for INR, $ for USD).
- Provide 2-3 short suggested follow-up questions or actions.
`;

    const { output } = await ai.generate({
      model: gemini15Flash,
      prompt,
      output: {
        schema: z.object({
          response: z.string(),
          suggestedActions: z.array(z.string()),
        }),
      },
    });

    return output || {
      response: 'Voidy AI financial manager processed your inquiry.',
      suggestedActions: ['View 1-Year Ledger', 'Scan Gmail Delta'],
    };
  }
);
