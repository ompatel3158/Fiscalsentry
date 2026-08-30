/**
 * Gmail REST API Service
 * Connects directly to Google Workspace using the user's OAuth access token
 * to fetch and extract genuine payment confirmations, bank transaction alerts, receipts, invoices, statements, and attachments.
 * Filters out marketing offers, promotional solicitations, and spam.
 */

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
  dataBase64?: string;
}

export interface ExtractedEmail {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
  attachments: GmailAttachment[];
  isLikelyFinancialTransaction?: boolean;
  parsedBankHint?: {
    amount?: number;
    currency?: string;
    currencySymbol?: string;
    transactionType?: 'expense' | 'hold_lien' | 'unblocked_lien' | 'refund' | 'transfer' | 'subscription';
    merchant?: string;
  } | null;
}

/**
 * Helper to strip HTML tags and scripts to extract clean, well-formatted text from email HTML bodies
 */
function cleanHtmlText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * High-Precision Promotional & Marketing Email Detector
 * Returns TRUE if the email is purely promotional/marketing/coupon/advertisement rather than a financial transaction.
 */
export function isPromotionalOrMarketingEmail(
  subject: string,
  snippet: string,
  sender: string,
  bodyText: string
): boolean {
  const combined = `${subject} ${snippet} ${sender}`.toLowerCase();

  // Strong transactional signals (these are ALWAYS treated as real transactions, even if they have discount/reward words)
  const isDefiniteTransaction =
    /(?:debited|credited|refunded|payment|paid|transaction alert|upi transaction|upi-ref|imps|neft|rtgs|invoice|receipt|order confirmed|order confirmation|e-statement|account statement|funds blocked|funds unblocked|mandate|card ending in|card ending [0-9]{4}|billing statement|tax invoice|paid to|sent to\b|withdrawn from|deposited to|charged your card|your receipt from|order #|swiggy|zomato|uber|ola|blinkit|zepto|bigbasket|amazon|flipkart|hdfc|icici|sbi|axis|kotak|paytm|phonepe|cred|groww|zerodha|indusind)/i.test(
      combined
    );

  const hasMonetaryAmount = /(?:₹|inr|rs\.?|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?|debited\s*(?:rs|inr|₹|\$)?\s*[\d,]+|credited\s*(?:rs|inr|₹|\$)?\s*[\d,]+|amount of\s*(?:rs|inr|₹|\$)?\s*[\d,]+/i.test(
    `${subject} ${snippet} ${bodyText.substring(0, 1500)}`
  );

  if (isDefiniteTransaction && hasMonetaryAmount) {
    return false;
  }

  // Clear promotional subject patterns without transactional proof
  const isMarketingSubject =
    /(?:promotional offer|special offer|special deal|exclusive offer|discount on your next|coupon code|promo code|flash sale|limited time offer|save up to \d+%|save \d+%|\d+% off today|earn rewards on shopping|unlock rewards|cashback offer|free trial|gift card offer|membership offer|newsletter|don't miss out on savings|last chance to save|sale is live|mega sale|deals of the day|upgrade your membership|shop now|new arrivals|buy 1 get 1|bogo\b)/i.test(
      subject
    );

  if (isMarketingSubject && !hasMonetaryAmount) {
    return true;
  }

  // Promotional sender or snippet patterns without any monetary proof
  const isMarketingBody =
    /(?:use code [a-z0-9]+ to get|apply coupon|unsubscribe from this email|view in browser|promotional email|marketing communication|hurry, offer valid|claim your bonus|exclusive discount|promotional terms apply|this is a promotional message)/i.test(
      `${snippet} ${bodyText.substring(0, 800)}`
    );

  if (isMarketingBody && !hasMonetaryAmount) {
    return true;
  }

  return false;
}

/**
 * Direct Regex Parser for Bank Debit/Credit Alerts, UPI Mandates, and E-commerce Transactions
 */
export function extractBankTransactionFromText(text: string): {
  amount?: number;
  currency?: string;
  currencySymbol?: string;
  transactionType?: 'expense' | 'hold_lien' | 'unblocked_lien' | 'refund' | 'transfer' | 'subscription';
  merchant?: string;
} | null {
  if (!text) return null;

  let currency = 'USD';
  let currencySymbol = '$';
  let amount = 0;
  let transactionType: 'expense' | 'hold_lien' | 'unblocked_lien' | 'refund' | 'transfer' | 'subscription' = 'expense';

  // 1. Currency Detection
  if (/₹|INR|Rs\.?|Rupees|UPI|HDFC|ICICI|SBI|Axis|Kotak|IndusInd|Paytm|PhonePe|Zerodha|Groww|Blinkit|Zepto|Swiggy|Zomato/i.test(text)) {
    currency = 'INR';
    currencySymbol = '₹';
  } else if (/€|EUR|Euro/i.test(text)) {
    currency = 'EUR';
    currencySymbol = '€';
  } else if (/£|GBP|Pound/i.test(text)) {
    currency = 'GBP';
    currencySymbol = '£';
  }

  // 2. Transaction Type Classification
  if (/mandate released|mandate revoked|mandate unblocked|ipo unblocked|lien released|funds unblocked/i.test(text)) {
    transactionType = 'unblocked_lien';
  } else if (/mandate created|mandate requested|ipo application|funds blocked|lien marked/i.test(text)) {
    transactionType = 'hold_lien';
  } else if (/refund|reversed|cashback|credited back/i.test(text)) {
    transactionType = 'refund';
  } else if (/subscription|auto-debit|recurring|renewal|membership renewed/i.test(text)) {
    transactionType = 'subscription';
  } else if (/transfer to|sent to|neft|imps|rtgs|transferred to/i.test(text)) {
    transactionType = 'transfer';
  }

  // 3. Amount Extraction Regex
  // Matches: INR 1,500.00 | Rs. 15000 | ₹1,500 | $150.00 | €45.50 | 1500.00 debited | total: $50.00 | paid Rs 450
  const amountMatch = text.match(
    /(?:INR|Rs\.?|₹|\$|€|£)\s*([\d,]+(?:\.\d{1,2})?)|(?:debited|credited|paid|spent|charged|amount of|charge of|total:?|amount:?)\s*(?:INR|Rs\.?|₹|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );

  if (amountMatch) {
    const rawVal = amountMatch[1] || amountMatch[2];
    if (rawVal) {
      const parsed = parseFloat(rawVal.replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  // 4. Merchant Extraction
  let merchant = '';
  const merchantMatch = text.match(
    /(?:at|to|vpa|merchant:?|info:?|for:?)\s+([A-Za-z0-9\s\.\-_@]{3,35})(?:\s+on|\s+via|\s+ref|\s+dated|\.|\n|,)/i
  );
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim();
  }

  return {
    amount,
    currency,
    currencySymbol,
    transactionType,
    merchant,
  };
}

export type SyncTier = 'delta' | 'month' | 'quarter' | 'year';

/**
 * Tiered Checkpointed Gmail Ingestion Engine
 * Pulls new delta emails, current month, or background 1-year historical ledger
 * Excludes already audited message IDs and marketing promotions.
 */
export async function fetchFinancialEmailsTiered(
  accessToken: string,
  tier: SyncTier = 'delta',
  lastSyncedTimestamp?: number,
  existingAuditedIds: string[] = []
): Promise<ExtractedEmail[]> {
  let lookbackDays = 15;
  let maxResults = 50;
  let customQuery = '';

  if (tier === 'delta') {
    if (lastSyncedTimestamp && lastSyncedTimestamp > 0) {
      const epochSeconds = Math.max(0, Math.floor(lastSyncedTimestamp / 1000) - 300); // 5 min buffer
      customQuery = `-category:promotions -category:social -is:draft -is:spam after:${epochSeconds}`;
    } else {
      customQuery = `-category:promotions -category:social -is:draft -is:spam newer_than:3d`;
    }
    maxResults = 50;
  } else if (tier === 'month') {
    lookbackDays = 31;
    maxResults = 150;
    customQuery = `-category:promotions -category:social -is:draft -is:spam newer_than:31d`;
  } else if (tier === 'quarter') {
    lookbackDays = 90;
    maxResults = 250;
    customQuery = `-category:promotions -category:social -is:draft -is:spam newer_than:90d`;
  } else if (tier === 'year') {
    lookbackDays = 365;
    maxResults = 450;
    customQuery = `-category:promotions -category:social -is:draft -is:spam newer_than:365d`;
  }

  return fetchFinancialEmailsFromGmail(accessToken, maxResults, lookbackDays, customQuery, existingAuditedIds);
}

/**
 * Searches the user's Gmail for all genuine payments, bank alerts, debits, receipts, bills, and financial documents
 * Supports multi-page pagination with nextPageToken and chunked detail extraction.
 */
export async function fetchFinancialEmailsFromGmail(
  accessToken: string,
  maxResults: number = 50,
  daysLookback: number = 15,
  explicitQuery?: string,
  existingAuditedIds: string[] = []
): Promise<ExtractedEmail[]> {
  if (!accessToken) {
    throw new Error('GMAIL_AUTH_EXPIRED');
  }

  const query = encodeURIComponent(
    explicitQuery || `-category:promotions -category:social -is:draft -is:spam newer_than:${daysLookback}d`
  );

  let messages: { id: string; threadId: string }[] = [];
  let pageToken: string | undefined = undefined;

  // 1. Paginated message ID collection
  try {
    while (messages.length < maxResults) {
      const pageSize = Math.min(100, maxResults - messages.length);
      const listUrl: string = pageToken
        ? `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${pageSize}&pageToken=${pageToken}`
        : `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${pageSize}`;

      const listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (listRes.status === 401 || listRes.status === 403) {
        throw new Error('GMAIL_AUTH_EXPIRED');
      }

      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.messages && Array.isArray(listData.messages)) {
          messages = [...messages, ...listData.messages];
        }
        pageToken = listData.nextPageToken;
        if (!pageToken) break;
      } else {
        break;
      }
    }
  } catch (err: any) {
    if (err.message === 'GMAIL_AUTH_EXPIRED') throw err;
  }

  // Fallback: If newer_than returned 0, fetch latest inbox & updates messages
  if (messages.length === 0) {
    try {
      const fallbackQuery = encodeURIComponent(
        `-category:promotions -category:social -is:draft -is:spam`
      );
      const fallbackListRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${fallbackQuery}&maxResults=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (fallbackListRes.status === 401 || fallbackListRes.status === 403) {
        throw new Error('GMAIL_AUTH_EXPIRED');
      }

      if (fallbackListRes.ok) {
        const fallbackData = await fallbackListRes.json();
        messages = fallbackData.messages || [];
      }
    } catch (err: any) {
      if (err.message === 'GMAIL_AUTH_EXPIRED') throw err;
    }
  }

  if (messages.length === 0) {
    return [];
  }

  // 2. Filter out already processed emails if existingAuditedIds provided
  const candidateMessages = existingAuditedIds.length > 0
    ? messages.filter((m) => !existingAuditedIds.includes(m.id))
    : messages;

  if (candidateMessages.length === 0) {
    return [];
  }

  // 3. Parallel chunked extraction (20 concurrent requests per chunk)
  const results: ExtractedEmail[] = [];
  const chunkSize = 20;

  for (let i = 0; i < candidateMessages.length; i += chunkSize) {
    const chunk = candidateMessages.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (msg) => {
      try {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const detailRes = await fetch(detailUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (detailRes.status === 401 || detailRes.status === 403) {
          throw new Error('GMAIL_AUTH_EXPIRED');
        }

        if (!detailRes.ok) return null;
        const data = await detailRes.json();

        // Check message labels: Skip spam and trash
        const labelIds: string[] = data.labelIds || [];
        if (labelIds.includes('SPAM') || labelIds.includes('TRASH')) {
          return null;
        }

        // Extract headers
        const headers = data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const rawSender = getHeader('From') || 'Unknown Sender';
        const senderMatch = rawSender.match(/^(.*?)(?:<(.+?)>)?$/);
        const sender = senderMatch && senderMatch[1].trim() ? senderMatch[1].replace(/["']/g, '').trim() : rawSender;
        const senderEmail = senderMatch && senderMatch[2] ? senderMatch[2].trim() : rawSender;

        const subject = getHeader('Subject') || 'Untitled Statement';
        const date = getHeader('Date') || new Date().toISOString();
        const snippet = data.snippet || '';

        // Extract body text & attachments
        let textAccumulator = '';
        let htmlAccumulator = '';
        const attachments: GmailAttachment[] = [];

        const processPart = (part: any) => {
          if (!part) return;

          if (part.mimeType === 'text/plain' && part.body?.data) {
            try {
              const decoded = Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
              textAccumulator += '\n' + decoded;
            } catch (_) {}
          }

          if (part.mimeType === 'text/html' && part.body?.data) {
            try {
              const decodedHtml = Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
              htmlAccumulator += '\n' + cleanHtmlText(decodedHtml);
            } catch (_) {}
          }

          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || 'application/pdf',
              attachmentId: part.body.attachmentId,
              size: part.body.size || 0,
            });
          }

          if (part.parts && Array.isArray(part.parts)) {
            part.parts.forEach(processPart);
          }
        };

        if (data.payload?.body?.data) {
          try {
            const decoded = Buffer.from(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            if (data.payload.mimeType === 'text/html') {
              htmlAccumulator += cleanHtmlText(decoded);
            } else {
              textAccumulator += decoded;
            }
          } catch (_) {}
        }

        if (data.payload?.parts) {
          data.payload.parts.forEach(processPart);
        }

        const bodyText = (textAccumulator.trim() || htmlAccumulator.trim() || snippet).trim();

        if (isPromotionalOrMarketingEmail(subject, snippet, sender, bodyText)) {
          return null;
        }

        const parsedBankHint = extractBankTransactionFromText(`${subject} ${snippet} ${bodyText}`);

        return {
          id: msg.id,
          threadId: msg.threadId,
          sender,
          senderEmail,
          subject,
          date,
          snippet,
          bodyText,
          attachments,
          parsedBankHint,
          isLikelyFinancialTransaction: true,
        } as ExtractedEmail;
      } catch {
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.forEach((r) => {
      if (r) results.push(r);
    });
  }

  return results;
}
