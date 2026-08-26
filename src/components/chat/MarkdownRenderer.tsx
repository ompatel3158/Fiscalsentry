'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export function MarkdownRenderer({ content, isUser = false }: MarkdownRendererProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap leading-relaxed select-text">{content}</div>;
  }

  // Parse lines for structured Markdown formatting (including tables, headers, dividers, lists, blockquotes, code blocks)
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inTable = false;
  let tableHeaderRow: string[] = [];
  let tableBodyRows: string[][] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 pl-1 select-text">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      const codeStr = codeBlockContent.join('\n');
      elements.push(
        <CodeBlockContainer key={`code-${elements.length}`} code={codeStr} />
      );
      codeBlockContent = [];
      inCodeBlock = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableHeaderRow.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto select-text">
          <table className="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-black/[0.08] dark:border-white/[0.1]">
            <thead className="bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/[0.08] dark:border-white/[0.1]">
              <tr>
                {tableHeaderRow.map((cell, cIdx) => (
                  <th key={`th-${cIdx}`} className="py-2 px-3 font-bold text-[#1d1d1f] dark:text-white">
                    {parseInline(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white/50 dark:bg-[#121215]/50">
              {tableBodyRows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={`td-${rIdx}-${cIdx}`} className="py-2 px-3 text-[#1d1d1f] dark:text-[#f5f5f7]">
                      {parseInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaderRow = [];
      tableBodyRows = [];
      inTable = false;
    }
  };

  const parseInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

      let firstMatch: { type: 'bold' | 'code' | 'italic'; index: number; length: number; content: string } | null = null;

      if (boldMatch && boldMatch.index !== undefined) {
        firstMatch = { type: 'bold', index: boldMatch.index, length: boldMatch[0].length, content: boldMatch[1] };
      }

      if (codeMatch && codeMatch.index !== undefined) {
        if (!firstMatch || codeMatch.index < firstMatch.index) {
          firstMatch = { type: 'code', index: codeMatch.index, length: codeMatch[0].length, content: codeMatch[1] };
        }
      }

      if (italicMatch && italicMatch.index !== undefined) {
        if (!firstMatch || italicMatch.index < firstMatch.index) {
          firstMatch = { type: 'italic', index: italicMatch.index, length: italicMatch[0].length, content: italicMatch[1] };
        }
      }

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }

      if (firstMatch.index > 0) {
        parts.push(remaining.substring(0, firstMatch.index));
      }

      if (firstMatch.type === 'bold') {
        parts.push(
          <strong
            key={`b-${keyIdx++}`}
            className="font-bold text-[#0E2A47] dark:text-[#14C9B7] tracking-tight"
          >
            {firstMatch.content}
          </strong>
        );
      } else if (firstMatch.type === 'code') {
        parts.push(
          <code
            key={`c-${keyIdx++}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold border border-black/5 dark:border-white/10"
          >
            {firstMatch.content}
          </code>
        );
      } else if (firstMatch.type === 'italic') {
        parts.push(
          <em key={`i-${keyIdx++}`} className="italic text-[#86868b] dark:text-[#a1a1a6]">
            {firstMatch.content}
          </em>
        );
      }

      remaining = remaining.substring(firstMatch.index + firstMatch.length);
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for code fence ```
    if (trimmed.startsWith('```')) {
      flushTable();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Horizontal Rule: --- or *** or ___ or -----
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      flushTable();
      elements.push(
        <hr key={`hr-${i}`} className="my-3 border-t border-black/[0.08] dark:border-white/[0.1]" />
      );
      continue;
    }

    // Markdown Table Row: | Col 1 | Col 2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if it's a delimiter line e.g. |---|---| or |:---:|---:|
      const isDelimiter = cells.every((c) => /^:?-+:?$/.test(c));

      if (isDelimiter) {
        inTable = true;
        continue;
      }

      if (!inTable && tableHeaderRow.length === 0) {
        tableHeaderRow = cells;
        inTable = true;
      } else {
        tableBodyRows.push(cells);
      }
      continue;
    } else {
      // If we were in a table and current line is not a table row, flush table
      if (inTable) {
        flushTable();
      }
    }

    // Header 1: # Header
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-base font-extrabold tracking-tight text-[#0E2A47] dark:text-white mt-3 mb-1.5 select-text">
          {parseInline(line.substring(2))}
        </h1>
      );
      continue;
    }

    // Header 2: ## Header
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-bold tracking-tight text-[#0E2A47] dark:text-[#14C9B7] mt-3 mb-1 select-text">
          {parseInline(line.substring(3))}
        </h2>
      );
      continue;
    }

    // Header 3: ### Header
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-2.5 mb-1 select-text">
          {parseInline(line.substring(4))}
        </h3>
      );
      continue;
    }

    // Header 4: #### Header
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-xs font-bold text-[#1d1d1f] dark:text-white mt-2 mb-0.5 select-text">
          {parseInline(line.substring(5))}
        </h4>
      );
      continue;
    }

    // Blockquote: > text
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2 pl-3 py-1 border-l-2 border-[#14C9B7] bg-[#14C9B7]/5 dark:bg-[#14C9B7]/10 rounded-r-lg text-[11px] leading-relaxed text-[#1d1d1f] dark:text-[#f5f5f7] select-text"
        >
          {parseInline(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet list: - item or * item
    const bulletMatch = line.match(/^(\s*)([-*•])\s+(.+)$/);
    if (bulletMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-xs leading-relaxed select-text">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14C9B7] shrink-0 mt-1.5" />
          <span className="flex-1">{parseInline(bulletMatch[3])}</span>
        </li>
      );
      continue;
    }

    // Numbered list: 1. item
    const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      inList = true;
      listItems.push(
        <li key={`num-li-${i}`} className="flex items-start gap-2 text-xs leading-relaxed select-text">
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            {numberMatch[2]}.
          </span>
          <span className="flex-1">{parseInline(numberMatch[3])}</span>
        </li>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      continue;
    }

    // Normal paragraph line
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed select-text">
        {parseInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();
  flushCodeBlock();

  return <div className="space-y-1 select-text">{elements}</div>;
}

function CodeBlockContainer({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl bg-black/90 text-[#f5f5f7] dark:bg-[#121215] border border-white/10 overflow-hidden font-mono text-[11px] select-text relative group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-[10px] text-slate-400">
        <span>Snippet</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}
