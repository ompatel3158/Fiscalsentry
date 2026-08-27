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
    /(?:debited|credited|refunded|payment of|paid in full|transaction alert|upi transaction|upi-ref|imps|neft|rtgs|invoice #|invoice no|receipt for your order|order confirmed|e-statement|account statement|funds blocked|funds unblocked|mandate created|mandate revoked|mandate released|card ending in|card ending [0-9]{4}|billing statement|tax invoice|paid to|sent to\b|withdrawn from a\/c|deposited to a\/c|charged your card|your receipt from|order #)/i.test(
      combined
    );

  if (isDefiniteTransaction) {
    return false;
  }

  // Clear promotional subject patterns
  const isMarketingSubject =
    /(?:promotional offer|special offer|special deal|exclusive offer|discount|coupon|promo code|promo\b|flash sale|limited time offer|save up to|save \d+%|\d+% off|earn rewards|unlock rewards|cashback offer|free trial|gift card offer|membership offer|newsletter|don't miss out|last chance to save|sale is live|mega sale|deals of the day|upgrade your membership|shop now|new arrivals|buy 1 get 1|bogo\b|flat \d+% off|flat rs|flat \$)/i.test(
      subject
    );

  if (isMarketingSubject) {
    return true;
  }

  // Promotional sender or snippet patterns without any monetary proof
  const isMarketingBody =
    /(?:use code [a-z0-9]+ to get|apply coupon|unsubscribe from this email|view in browser|promotional email|marketing communication|hurry, offer valid|claim your bonus|exclusive discount|promotional terms apply|this is a promotional message)/i.test(
      snippet + ' ' + bodyText.substring(0, 800)
    );

  const hasNoMonetaryTransaction = !/(?:₹|inr|rs\.?|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?|debited|credited|paid|charged/i.test(
    bodyText.substring(0, 1500)
  );

  if (isMarketingBody && hasNoMonetaryTransaction) {
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

/**
 * Searches the user's Gmail for all genuine payments, bank alerts, debits, receipts, bills, and financial documents
 * Filters out marketing promotions, coupons, and solicitations.
 */
export async function fetchFinancialEmailsFromGmail(
  accessToken: string,
  maxResults: number = 35,
  daysLookback: number = 15
): Promise<ExtractedEmail[]> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required to fetch Gmail data.');
  }

  // 1. Broad query capturing ALL emails in Primary, Updates, and Notifications (Excluding ONLY promotions, social, and spam)
  const query = encodeURIComponent(
    `-category:promotions -category:social -is:draft -is:spam newer_than:${daysLookback}d`
  );
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${maxResults}`;

  let messages: { id: string; threadId: string }[] = [];

  try {
    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      messages = listData.messages || [];
    }
  } catch (_) {}

  // Fallback: If newer_than returned 0, fetch latest inbox & updates messages without date restriction
  if (messages.length === 0) {
    try {
      const fallbackQuery = encodeURIComponent(
        `-category:promotions -category:social -is:draft -is:spam`
      );
      const fallbackListRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${fallbackQuery}&maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (fallbackListRes.ok) {
        const fallbackData = await fallbackListRes.json();
        messages = fallbackData.messages || [];
      }
    } catch (_) {}
  }

  // Final fallback to latest inbox messages if needed
  if (messages.length === 0) {
    try {
      const inboxListRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (inboxListRes.ok) {
        const inboxData = await inboxListRes.json();
        messages = inboxData.messages || [];
      }
    } catch (_) {}
  }

  if (messages.length === 0) {
    return [];
  }

  // 2. Fetch full message details in parallel
  const emailPromises = messages.slice(0, maxResults).map(async (msg) => {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const detailRes = await fetch(detailUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!detailRes.ok) return null;
      const data = await detailRes.json();

      // Check message labels: Skip if Gmail labeled it as PROMOTIONS or SPAM
      const labelIds: string[] = data.labelIds || [];
      if (labelIds.includes('CATEGORY_PROMOTIONS') || labelIds.includes('SPAM')) {
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

        // Check text part
        if (part.mimeType === 'text/plain' && part.body?.data) {
          try {
            const decoded = Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            textAccumulator += '\n' + decoded;
          } catch (_) {}
        }

        // Check HTML part
        if (part.mimeType === 'text/html' && part.body?.data) {
          try {
            const decodedHtml = Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            htmlAccumulator += '\n' + cleanHtmlText(decodedHtml);
          } catch (_) {}
        }

        // Check attachment part
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

      // Process root single-part body if available
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

      // Process multipart children
      if (data.payload?.parts) {
        data.payload.parts.forEach(processPart);
      }

      // Consolidate body text (prefer plain text, fallback to cleaned HTML, fallback to snippet)
      const bodyText = (textAccumulator.trim() || htmlAccumulator.trim() || snippet).trim();

      // Check anti-promotional heuristics: drop marketing emails
      if (isPromotionalOrMarketingEmail(subject, snippet, sender, bodyText)) {
        return null;
      }

      // If attachments exist, fetch data for the primary attachment
      for (const att of attachments.slice(0, 1)) {
        try {
          const attUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${att.attachmentId}`;
          const attRes = await fetch(attUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          });
          if (attRes.ok) {
            const attData = await attRes.json();
            if (attData.data) {
              att.dataBase64 = attData.data.replace(/-/g, '+').replace(/_/g, '/');
            }
          }
        } catch (_) {}
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

  const results = await Promise.all(emailPromises);
  return results.filter((e): e is ExtractedEmail => e !== null);
}
