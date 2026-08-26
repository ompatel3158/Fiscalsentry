'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  User,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  ArrowRight,
  FileText,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function ChatArea() {
  const { activeMessages, isStreaming, activeSession, createNewSession } = useChat();
  const { setCurrentView, setActiveAudit, allAudits } = useApp();
  const { userProfile, updateProfileSettings, user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeModel = userProfile?.preferredModel || 'gemini-3.1-flash-lite';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isStreaming]);

  const handleInspectAudit = (auditId: string) => {
    const target = allAudits.find((a) => a.id === auditId);
    if (target) {
      setActiveAudit(target);
      setCurrentView('dashboard');
    }
  };

  const handleModelChange = async (newModel: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fs_preferred_model', newModel);
    }
    await updateProfileSettings({ preferredModel: newModel as any });
    toast.success(`Chat engine updated to ${newModel}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-text">
      {/* Top Chat Header */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Official Symmetry Mark Tile Logo */}
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-[#121215] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-center shrink-0">
            <svg viewBox="0 0 240 240" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(120,120) scale(0.95)">
                <path d="M0,-115 L-80,-65 L-80,25 L0,115 Z" fill="#0E2A47" className="dark:fill-[#123350]" />
                <path d="M0,-115 L80,-65 L80,25 L0,115 Z" fill="#14C9B7" />
                <circle cx="0" cy="0" r="34" fill="#FFFFFF" stroke="#0E2A47" strokeWidth="2" />
                <path d="M0,-14 L14,0 L0,14 L-14,0 Z" fill="#D9A441" />
              </g>
            </svg>
          </div>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#1d1d1f] dark:text-white truncate">
              {activeSession?.title || 'Financial Intelligence Session'}
            </h2>
            <p className="text-[10px] text-[#86868b] truncate hidden sm:block font-mono">
              {activeModel} • RAG Statutory Memory Active • Action Dispatcher
            </p>
          </div>
        </div>

        {/* Right Header Actions: Model Switcher & New Chat */}
        <div className="flex items-center gap-2">
          {/* Active Model Selector */}
          <div className="flex items-center">
            <select
              value={activeModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="text-[11px] bg-black/5 dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer border border-black/[0.06] dark:border-white/[0.08] shadow-2xs"
            >
              <option value="gemini-3.1-flash-lite">⚡ Gemini 3.1 Flash Lite</option>
              <option value="gemini-3.5-flash-lite">⚡ Gemini 3.5 Flash Lite</option>
              <option value="gemini-3.6-flash">🧠 Gemini 3.6 Flash</option>
            </select>
          </div>

          <button
            onClick={() => createNewSession()}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white flex items-center gap-1 transition-all active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 select-text">
        {activeMessages.map((message, idx) => {
          const isUser = message.role === 'user';

          return (
            <motion.div
              key={message.id || idx}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
              className={`flex gap-2 sm:gap-3 max-w-4xl mx-auto w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Symmetry Logo Tile */}
              {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-[#121215] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 240 240" className="w-5 h-5 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(120,120) scale(0.95)">
                      <path d="M0,-115 L-80,-65 L-80,25 L0,115 Z" fill="#0E2A47" className="dark:fill-[#123350]" />
                      <path d="M0,-115 L80,-65 L80,25 L0,115 Z" fill="#14C9B7" />
                      <circle cx="0" cy="0" r="34" fill="#FFFFFF" stroke="#0E2A47" strokeWidth="2" />
                      <path d="M0,-14 L14,0 L0,14 L-14,0 Z" fill="#D9A441" />
                    </g>
                  </svg>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`flex flex-col space-y-2 max-w-[90%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed select-text relative group ${
                  isUser
                    ? 'bg-black text-white rounded-tr-xs shadow-md border border-neutral-800'
                    : 'bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-tl-xs shadow-xs'
                }`}
              >
                {/* Media Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border ${
                          isUser
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white'
                        }`}
                      >
                        <FileText className="w-3 h-3 text-emerald-400" />
                        <span className="max-w-[120px] truncate">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Markdown Content */}
                <div className="prose prose-xs dark:prose-invert max-w-none break-words select-text">
                  <MarkdownRenderer content={message.content} isUser={isUser} />
                </div>

                {/* Generated Audit Target Card */}
                {message.generatedAuditId && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 select-none">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate">
                        Audit Document Generated
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        Line-item violation and dispute actions prepared.
                      </div>
                    </div>
                    <button
                      onClick={() => handleInspectAudit(message.generatedAuditId!)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-all active:scale-[0.97] shrink-0"
                    >
                      <span>Open Audit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* RAG Knowledge Citations */}
                {message.ragSources && message.ragSources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1 select-none">
                    <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      Statutory Citations & Precedents
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {message.ragSources.map((source) => (
                        <div
                          key={source.id}
                          className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono border border-blue-500/20"
                          title={source.snippet}
                        >
                          {source.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Copy Toolbar */}
                <MessageCopyButton content={message.content} isUser={isUser} />
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <User className="w-4 h-4 text-[#86868b]" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Streaming / Reasoning Indicator */}
        {isStreaming && (
          <div className="flex gap-2 sm:gap-3 max-w-4xl mx-auto w-full justify-start select-none">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-[#121215] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-[#86868b] font-medium ml-1">
                {activeModel} reasoning...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function MessageCopyButton({ content, isUser }: { content: string; isUser: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Message text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-center gap-1 mt-1 pt-1.5 border-t select-none ${
        isUser
          ? 'border-white/10 justify-end'
          : 'border-black/[0.04] dark:border-white/[0.06] justify-between'
      }`}
    >
      {!isUser && (
        <span className="text-[9px] text-[#86868b] font-mono">
          FiscalSentry Intelligence
        </span>
      )}
      <button
        onClick={handleCopy}
        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all active:scale-[0.95] ${
          isUser
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Copy message"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}
