'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ChatSidebar({ isMobile = false, onCloseMobile }: { isMobile?: boolean; onCloseMobile?: () => void }) {
  const {
    sessions,
    activeSessionId,
    createNewSession,
    switchSession,
    renameSession,
    deleteSession,
    togglePinSession,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    renameSession(id, editingTitle);
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <aside className="w-72 sm:w-80 h-full border-r border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-2xl p-3 flex flex-col shrink-0">
      {/* 1. Top Header: Search Input & Close Button */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#86868b]" />
          <input
            type="text"
            placeholder="Search conversation memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none border border-transparent focus:border-black/10 dark:focus:border-white/20 transition-all"
          />
        </div>

        {/* Close button on top of history tab */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors active:scale-[0.97] shrink-0"
            title="Close sessions panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. New Chat Button (Below Search) */}
      <button
        onClick={() => {
          createNewSession();
          if (onCloseMobile) onCloseMobile();
        }}
        className="w-full py-2 px-3 rounded-xl bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.97] mb-2.5"
      >
        <Plus className="w-3.5 h-3.5" />
        New Audit Session
      </button>

      {/* 3. Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] px-1 py-1">
          Chat History ({sortedSessions.length})
        </div>

        {sortedSessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isEditing = editingSessionId === session.id;

          return (
            <motion.div
              key={session.id}
              onClick={() => {
                if (!isEditing) {
                  switchSession(session.id);
                  if (onCloseMobile) onCloseMobile();
                }
              }}
              whileHover={{ scale: 0.99 }}
              whileTap={{ scale: 0.97 }}
              className={`p-2.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                isActive
                  ? 'bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20 shadow-2xs'
                  : 'bg-transparent border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 px-2 py-0.5 text-xs bg-white dark:bg-[#121215] border border-emerald-500 rounded text-[#1d1d1f] dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={(e) => handleSaveRename(session.id, e)}
                    className="p-1 text-emerald-600 rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancelRename}
                    className="p-1 text-[#86868b] rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                    <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white truncate">
                      {session.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinSession(session.id);
                      }}
                      className={`p-1 rounded ${session.isPinned ? 'text-amber-500' : 'text-[#86868b]'}`}
                    >
                      <Pin className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => handleStartRename(session.id, session.title, e)}
                      className="p-1 rounded text-[#86868b]"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 rounded text-rose-500"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {session.previewText && (
                <p className="text-[11px] text-[#86868b] truncate pl-5 mt-0.5">
                  {session.previewText}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
}
