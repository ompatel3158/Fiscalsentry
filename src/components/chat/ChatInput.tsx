'use client';

import React, { useState, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { MediaAttachment } from '@/lib/types';
import { MediaAttachmentPreview } from './MediaAttachmentPreview';
import { UsageProgressRing } from './UsageProgressRing';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function ChatInput() {
  const { sendMessage, isStreaming, rateLimitState, refreshRateLimit } = useChat();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;
    const textToSend = content;
    const filesToSend = [...attachments];

    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(textToSend, filesToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      let mediaType: MediaAttachment['type'] = 'other';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';
      else if (file.type === 'application/pdf') mediaType = 'pdf';
      else if (file.type.includes('spreadsheet') || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        mediaType = 'spreadsheet';
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: MediaAttachment = {
          id: 'att-' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: mediaType,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          base64Data: reader.result as string,
        };

        setAttachments((prev) => [...prev, newAttachment]);
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.info('Voice memo recording started... Click microphone again to attach audio note.');
    } else {
      setIsRecording(false);
      // Simulate attached voice recording note
      const voiceAttachment: MediaAttachment = {
        id: 'voice-' + Date.now(),
        name: `Voice_Memo_Audit_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.wav`,
        type: 'audio',
        mimeType: 'audio/wav',
        size: 48200,
      };
      setAttachments((prev) => [...prev, voiceAttachment]);
      toast.success('Voice audio note attached to chat!');
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* Attached Media Preview */}
      <MediaAttachmentPreview attachments={attachments} onRemove={removeAttachment} />

      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="relative rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle p-2 flex flex-col gap-2">
          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? '🎙️ Listening to voice memo...'
                : 'Ask Voidy AI about your bills, 1-year cash flow, upcoming EMIs, subscriptions, or dispute letters...'
            }
            className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-40 leading-relaxed"
          />

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Attach File / Media Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-[0.97]"
                title="Attach any document, image, audio, or spreadsheet"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Memo Recording Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-xl transition-all active:scale-[0.97] ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title={isRecording ? 'Stop voice recording' : 'Record voice memo note'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <span className="text-[10px] text-slate-400 hidden sm:inline-block ml-1">
                Gemini 3.7 Flash Multimodal + RAG Memory
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Circular Usage Progress Ring */}
              {rateLimitState && (
                <UsageProgressRing
                  charCount={content.length}
                  maxChars={4000}
                  rateLimit={rateLimitState}
                  onRefreshState={refreshRateLimit}
                />
              )}

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={(!content.trim() && attachments.length === 0) || isStreaming || rateLimitState?.isRateLimited}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-[0.97] ${
                  (!content.trim() && attachments.length === 0) || isStreaming || rateLimitState?.isRateLimited
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reasoning...
                  </>
                ) : (
                  <>
                    Send
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
