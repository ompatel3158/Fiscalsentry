import { RAGSourceCitation, DocumentCategory, AuditResult } from './types';
import { INITIAL_RAG_KNOWLEDGE } from './mock-data';

interface KnowledgeChunk extends RAGSourceCitation {
  keywords: string[];
  category?: DocumentCategory;
}

let activeKnowledgeBase: KnowledgeChunk[] = [
  ...INITIAL_RAG_KNOWLEDGE.map((k) => ({
    ...k,
    keywords: extractKeywords(k.title + ' ' + k.snippet),
  })),
];

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

/**
 * Dynamically indexes user audited documents into the RAG memory
 */
export function indexAuditDocument(audit: AuditResult): void {
  if (!audit) return;
  const existing = activeKnowledgeBase.find((k) => k.id === 'rag-audit-' + audit.id);
  if (existing) return;

  const title = `Statement: ${audit.title} (${audit.providerOrVendor})`;
  const snippet = `${audit.title} from ${audit.providerOrVendor}. Billed: ${audit.currencySymbol || '$'}${audit.totalBilledAmount}. Disputed: ${audit.currencySymbol || '$'}${audit.potentialRecoveryAmount}. Summary: ${audit.summary || ''}`;
  
  const newChunk: KnowledgeChunk = {
    id: 'rag-audit-' + audit.id,
    title,
    snippet,
    sourceType: 'past_invoice',
    score: 0.95,
    keywords: extractKeywords(title + ' ' + snippet),
    category: audit.category,
  };

  activeKnowledgeBase.unshift(newChunk);
}

/**
 * Retrieves relevant knowledge chunks ONLY when there is genuine semantic overlap.
 * Returns an empty array if the user message is casual or does not match any statutory rule or document.
 */
export function retrieveRelevantKnowledge(
  queryText: string,
  category?: DocumentCategory,
  topK: number = 3
): RAGSourceCitation[] {
  if (!queryText || !queryText.trim()) {
    return [];
  }

  const queryTokens = extractKeywords(queryText);
  if (queryTokens.length === 0) {
    return [];
  }

  // Calculate actual match counts
  const matches: { item: KnowledgeChunk; matchCount: number; score: number }[] = [];

  activeKnowledgeBase.forEach((item) => {
    let matchCount = 0;
    queryTokens.forEach((token) => {
      if (item.keywords.includes(token)) {
        matchCount += 2;
      } else if (item.snippet.toLowerCase().includes(token)) {
        matchCount += 1;
      }
    });

    // Category boost only if there is already at least 1 keyword match
    if (matchCount > 0 && category && item.category === category) {
      matchCount += 2;
    }

    if (matchCount >= 2) {
      const score = Math.min(0.99, 0.6 + (matchCount / (queryTokens.length * 2 + 2)) * 0.4);
      matches.push({
        item,
        matchCount,
        score: Number(score.toFixed(2)),
      });
    }
  });

  if (matches.length === 0) {
    return [];
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, topK).map((m) => ({
    ...m.item,
    score: m.score,
  }));
}

export function indexNewDocument(
  title: string,
  content: string,
  sourceType: RAGSourceCitation['sourceType'],
  category?: DocumentCategory
): RAGSourceCitation {
  const id = 'rag-user-' + Math.random().toString(36).substring(2, 9);
  const snippet = content.length > 300 ? content.substring(0, 300) + '...' : content;
  const newChunk: KnowledgeChunk = {
    id,
    title,
    snippet,
    sourceType,
    score: 0.95,
    keywords: extractKeywords(title + ' ' + content),
    category,
  };

  activeKnowledgeBase.unshift(newChunk);
  return newChunk;
}
