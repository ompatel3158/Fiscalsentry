export type DocumentCategory =
  | 'medical_bill'
  | 'vendor_quotes'
  | 'grant_subsidy'
  | 'invoice_receipt'
  | 'contract_legal';

export type TransactionType =
  | 'expense'
  | 'refund'
  | 'hold_lien'
  | 'unblocked_lien'
  | 'subscription'
  | 'transfer'
  | 'income'
  | 'bill';

export type LineItemStatus =
  | 'compliant'
  | 'overcharge'
  | 'unbundled'
  | 'duplicate'
  | 'statutory_violation'
  | 'negotiable'
  | 'rebate_eligible';

export type FinancialCategory =
  | 'utility_bill'
  | 'bank_expense'
  | 'income_salary'
  | 'recurring_subscription'
  | 'credit_card_statement'
  | 'loan_emi'
  | 'insurance'
  | 'investment_ipo'
  | 'other';

export interface SourceEmailReference {
  messageId: string;
  threadId?: string;
  subject: string;
  sender: string;
  senderEmail?: string;
  date: string;
  snippet: string;
  rawExcerpt?: string;
  confidenceScore?: number;
}

export interface UpcomingObligation {
  id: string;
  title: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  dueDate: string; // YYYY-MM-DD
  category: FinancialCategory;
  provider: string;
  isAutoDebit: boolean;
  status: 'upcoming' | 'paid' | 'overdue';
  sourceEmail?: SourceEmailReference;
}

export interface AuditLineItem {
  id: string;
  code?: string; // CPT, ICD-10, SKU, or Line Item Code
  description: string;
  category?: string;
  financialCategory?: FinancialCategory;
  quantity?: number;
  originalAmount: number;
  benchmarkAmount: number; // Fair CMS/Medicare or standard market benchmark
  deltaSavings: number;
  status: LineItemStatus;
  violationType?: string; // e.g., "No Surprises Act Sec. 102", "Unbundling of CPT 99214 & 99215"
  confidenceScore: number; // 0.0 - 1.0
  reasoning: string;
  dueDate?: string;
  sourceEmail?: SourceEmailReference;
}

export interface StatutoryCitation {
  statute: string;
  title: string;
  applicableSection: string;
  summary: string;
}

export interface ActionItemPayload {
  id: string;
  type:
    | 'google_calendar'
    | 'google_tasks'
    | 'google_sheets'
    | 'google_drive'
    | 'google_messages'
    | 'google_chat'
    | 'gmail'
    | 'slack'
    | 'discord'
    | 'custom_webhook'
    | 'pdf_dispute'
    | 'pdf_po'
    | 'pdf_grant';
  title: string;
  description: string;
  targetService: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadlineDate?: string;
  estimatedRecoveryAmount?: number;
  payload: Record<string, any>;
  resultData?: Record<string, any>;
  executedAt?: string;
}

export interface AuditResult {
  id: string;
  title: string;
  category: DocumentCategory;
  financialCategory?: FinancialCategory;
  providerOrVendor: string;
  accountNumber?: string;
  documentDate: string;
  dueDate?: string;
  totalBilledAmount: number;
  fairBenchmarkAmount: number;
  potentialRecoveryAmount: number;
  currency?: string; // 'INR', 'USD', 'EUR', 'GBP', etc.
  currencySymbol?: string; // '₹', '$', '€', '£', etc.
  transactionType?: TransactionType;
  isReconciled?: boolean;
  reconciliationNote?: string;
  actualNetSpend?: number;
  isRecurringSubscription?: boolean;
  isPromotionalOrNonFinancial?: boolean;
  nextRenewalDate?: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  citations: StatutoryCitation[];
  lineItems: AuditLineItem[];
  actions: ActionItemPayload[];
  rawDocumentUrl?: string;
  rawDocumentText?: string;
  emailId?: string;
  emailIds?: string[];
  sourceEmails?: SourceEmailReference[];
  createdAt: string;
  updatedAt: string;
}

export interface SpendingTrendPoint {
  month: string;
  billed: number;
  benchmark: number;
  recovered: number;
  auditCount: number;
}

export interface FiscalYearSummary {
  fiscalYear: string;
  totalBilled: number;
  totalFairBenchmark: number;
  totalRecovered: number;
  totalAudits: number;
  categoryBreakdown: Record<string, { billed: number; recovered: number; count: number }>;
  monthlyTrends: SpendingTrendPoint[];
}

export interface MediaAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'audio' | 'spreadsheet' | 'document' | 'other';
  mimeType: string;
  size: number;
  url?: string;
  base64Data?: string;
  previewUrl?: string;
}

export interface RAGSourceCitation {
  id: string;
  title: string;
  snippet: string;
  sourceType: 'statute' | 'past_invoice' | 'policy' | 'pricing_benchmark' | 'dispute_template';
  score: number;
  documentUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MediaAttachment[];
  toolCalls?: {
    toolName: string;
    args: Record<string, any>;
    result?: Record<string, any>;
  }[];
  ragSources?: RAGSourceCitation[];
  generatedAuditId?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  previewText?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  tags?: string[];
  totalAudited?: number;
  totalSaved?: number;
}

export interface SentryLogEntry {
  id: string;
  timestamp: string;
  source: 'gmail' | 'slack' | 'discord' | 'webhook' | 'manual';
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

export interface SentryConfig {
  isActive: boolean;
  pollingIntervalSeconds: number;
  lastPolledAt?: string;
  monitoredSources: {
    gmail: boolean;
    slack: boolean;
    discord: boolean;
    inboundWebhooks: boolean;
  };
  totalDocumentsProcessed: number;
  totalDisputedAmount: number;
  totalRecoveredAmount: number;
}

export interface IntegrationsConfig {
  firebase: {
    isConfigured: boolean;
    projectId?: string;
    storageBucket?: string;
  };
  googleWorkspace: {
    isConfigured: boolean;
    userEmail?: string;
    services: {
      gmail: boolean;
      calendar: boolean;
      tasks: boolean;
      sheets: boolean;
      drive: boolean;
      messages: boolean;
    };
  };
  slack: {
    isConfigured: boolean;
    webhookUrl?: string;
    channelName?: string;
  };
  discord: {
    isConfigured: boolean;
    webhookUrl?: string;
    channelName?: string;
  };
  customWebhooks: {
    isConfigured: boolean;
    endpoints: {
      id: string;
      name: string;
      url: string;
      authHeader?: string;
      active: boolean;
    }[];
  };
}

/**
 * Universal Currency Formatter
 */
export function formatCurrency(
  amount: number | undefined | null,
  currencySymbol: string = '$',
  currencyCode?: string
): string {
  const val = amount || 0;
  const sym = currencySymbol || '$';
  
  // If Indian Rupee, format with Indian numbering system (e.g. ₹15,000.00)
  if (sym === '₹' || currencyCode === 'INR') {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `${sym}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
