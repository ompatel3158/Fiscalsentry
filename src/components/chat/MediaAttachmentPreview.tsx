'use client';

import React from 'react';
import { MediaAttachment } from '@/lib/types';
import { FileText, Image as ImageIcon, Music, FileSpreadsheet, File, X } from 'lucide-react';

export function MediaAttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: MediaAttachment[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;

  const getMediaIcon = (type: MediaAttachment['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-purple-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <File className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs text-xs"
        >
          {getMediaIcon(att.type)}
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
            {att.name}
          </span>
          <button
            onClick={() => onRemove(att.id)}
            className="p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
