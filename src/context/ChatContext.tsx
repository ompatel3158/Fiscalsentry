'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage, MediaAttachment, ChatSession } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { generateChatResponse } from '@/lib/gemini';
import { retrieveRelevantKnowledge, indexAuditDocument } from '@/lib/rag';
import {
  saveChatSessionToFirestore,
  getUserChatSessionsFromFirestore,
  deleteChatSessionFromFirestore,
} from '@/lib/firebase';
import { VoidyRateLimit, getVoidyRateLimitState, consumeVoidyRequest } from '@/lib/rateLimiter';
import { toast } from 'sonner';

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string;
  activeSession?: ChatSession;
  messages: ChatMessage[];
  activeMessages: ChatMessage[];
  isStreaming: boolean;
  rateLimitState: VoidyRateLimit;
  refreshRateLimit: () => void;
  createNewSession: () => string;
  switchSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  deleteSession: (sessionId: string) => void;
  togglePinSession: (sessionId: string) => void;
  sendMessage: (content: string, attachments?: MediaAttachment[]) => Promise<void>;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_SESSION_ID = 'session-default-01';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { activeAudit, addNewAudit, allAudits } = useApp();
  const { userProfile, user } = useAuth();

  // Index user's actual audited documents into RAG knowledge memory dynamically
  useEffect(() => {
    if (allAudits && allAudits.length > 0) {
      allAudits.forEach((a) => indexAuditDocument(a));
    }
  }, [allAudits]);

  // 1. Initialize sessions from localStorage or default
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fs_chat_sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [
      {
        id: DEFAULT_SESSION_ID,
        title: 'New Consultation',
        previewText: 'Ready to audit bills, quotes, and compliance paperwork...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
      },
    ];
  });

  // 2. Initialize activeSessionId from localStorage or default
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fs_active_session_id');
      if (saved) return saved;
    }
    return DEFAULT_SESSION_ID;
  });

  // 3. Initialize messagesMap from localStorage or default
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fs_chat_messages_map');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
        }
      } catch (_) {}
    }
    return {
      [DEFAULT_SESSION_ID]: [
        {
          id: 'msg-init-1',
          role: 'assistant',
          content:
            '🛡️ **FiscalSentry Agent Connected**\n\nI am your autonomous financial defense and paperwork reasoning engine powered by **Gemini 3.7 Flash**. You can ask me questions about medical bill errors, vendor RFP comparisons, clean energy grants, or upload any document/image for instant multimodal auditing.',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });

  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Rate Limit State
  const [rateLimitState, setRateLimitState] = useState<VoidyRateLimit>(() => getVoidyRateLimitState());

  const refreshRateLimit = () => {
    setRateLimitState(getVoidyRateLimitState());
  };

  // Reset state on global logout event
  useEffect(() => {
    const handleLogout = () => {
      const defaultSessions: ChatSession[] = [
        {
          id: DEFAULT_SESSION_ID,
          title: 'New Consultation',
          previewText: 'Ready to audit bills, quotes, and compliance paperwork...',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinned: false,
        },
      ];
      const defaultMap: Record<string, ChatMessage[]> = {
        [DEFAULT_SESSION_ID]: [
          {
            id: 'msg-init-1',
            role: 'assistant',
            content:
              '🛡️ **FiscalSentry Agent Connected**\n\nI am your autonomous financial defense and paperwork reasoning engine powered by **Gemini 3.7 Flash**. You can ask me questions about medical bill errors, vendor RFP comparisons, clean energy grants, or upload any document/image for instant multimodal auditing.',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      setSessions(defaultSessions);
      setActiveSessionId(DEFAULT_SESSION_ID);
      setMessagesMap(defaultMap);
      setIsStreaming(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('fs:auth:logout', handleLogout);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('fs:auth:logout', handleLogout);
      }
    };
  }, []);

  // Sync to localStorage whenever sessions or messagesMap change (scoped by user.uid)
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.uid && sessions.length > 0) {
      try {
        localStorage.setItem(`fs_chat_sessions_${user.uid}`, JSON.stringify(sessions));
        localStorage.setItem(`fs_chat_messages_map_${user.uid}`, JSON.stringify(messagesMap));
      } catch (err) {
        console.warn('[ChatContext] Failed to cache to localStorage', err);
      }
    }
  }, [sessions, messagesMap, user?.uid]);

  // Load chat history reliably when user signs in
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Instantly hydrate from user-scoped local cache
    if (typeof window !== 'undefined') {
      try {
        const cachedSessions = localStorage.getItem(`fs_chat_sessions_${user.uid}`);
        const cachedMap = localStorage.getItem(`fs_chat_messages_map_${user.uid}`);
        if (cachedSessions && cachedMap) {
          const parsedS = JSON.parse(cachedSessions);
          const parsedM = JSON.parse(cachedMap);
          if (Array.isArray(parsedS) && parsedS.length > 0) {
            setSessions(parsedS);
            setMessagesMap(parsedM);
            setActiveSessionId(parsedS[0].id);
          }
        }
      } catch (_) {}
    }

    // 2. Fetch latest from Firestore & update state
    getUserChatSessionsFromFirestore(user.uid).then(({ sessions: firestoreSessions, messagesMap: firestoreMap }) => {
      if (firestoreSessions && firestoreSessions.length > 0) {
        // Sort sessions by most recently updated
        const sorted = [...firestoreSessions].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setSessions(sorted);
        setMessagesMap((prev) => ({
          ...prev,
          ...firestoreMap,
        }));
        setActiveSessionId(sorted[0].id);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fs_chat_sessions_${user.uid}`, JSON.stringify(sorted));
            localStorage.setItem(`fs_chat_messages_map_${user.uid}`, JSON.stringify(firestoreMap));
          } catch (_) {}
        }
      }
    });
  }, [user?.uid]);

  const createNewSession = (): string => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Consultation',
      previewText: 'Ready to audit bills, quotes, and compliance paperwork...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
    };

    const initialMessages: ChatMessage[] = [
      {
        id: 'msg-init-' + newId,
        role: 'assistant',
        content:
          '🛡️ **FiscalSentry Agent Connected**\n\nI am your autonomous financial defense and paperwork reasoning engine powered by **Gemini 3.7 Flash**. You can ask me questions about medical bill errors, vendor RFP comparisons, clean energy grants, or upload any document/image for instant multimodal auditing.',
        createdAt: new Date().toISOString(),
      },
    ];

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessagesMap((prev) => ({
      ...prev,
      [newId]: initialMessages,
    }));

    if (user?.uid) {
      saveChatSessionToFirestore(user.uid, newSession, initialMessages);
    }

    return newId;
  };

  const switchSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: new Date().toISOString() } : s
    );
    setSessions(updated);

    const target = updated.find((s) => s.id === sessionId);
    if (user?.uid && target) {
      saveChatSessionToFirestore(user.uid, target, messagesMap[sessionId] || []);
    }

    toast.success('Chat renamed');
  };

  const deleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      toast.error('Cannot delete the last remaining chat session.');
      return;
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);

    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });

    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }

    if (user?.uid) {
      deleteChatSessionFromFirestore(user.uid, sessionId);
    }

    toast.success('Chat session deleted');
  };

  const togglePinSession = (sessionId: string) => {
    const updated = sessions.map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s));
    setSessions(updated);

    const target = updated.find((s) => s.id === sessionId);
    if (user?.uid && target) {
      saveChatSessionToFirestore(user.uid, target, messagesMap[sessionId] || []);
    }
  };

  const sendMessage = async (content: string, attachments?: MediaAttachment[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Check Voidy AI rate limits
    const rateCheck = consumeVoidyRequest();
    setRateLimitState(rateCheck.state);

    const userMessageId = 'msg-u-' + Date.now();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: content.trim(),
      attachments,
      createdAt: new Date().toISOString(),
    };

    const currentHistory = [...(messagesMap[activeSessionId] || []), userMessage];

    // Update UI immediately with user message
    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: currentHistory,
    }));

    if (!rateCheck.allowed) {
      toast.error(rateCheck.message || 'Voidy AI 5-hour query limit reached.');
      const rateLimitNotice: ChatMessage = {
        id: 'msg-rl-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Voidy AI Quota Cooldown Active**\n\nYou have used all **${rateCheck.state.maxRequests}/${rateCheck.state.maxRequests}** queries for this 5-hour window. Your rate limit will automatically reset.\n\n*Tip: You can still review existing audited statements and run local document calculations.*`,
        createdAt: new Date().toISOString(),
      };
      setMessagesMap((prev) => ({
        ...prev,
        [activeSessionId]: [...currentHistory, rateLimitNotice],
      }));
      return;
    }

    setIsStreaming(true);

    try {
      const preferredModel = userProfile?.preferredModel || 'gemini-3.7-flash';
      let responseText = '';
      let ragSources = undefined;
      let generatedAudit = undefined;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentHistory,
            activeAudit,
            attachments,
            preferredModel,
          }),
        });

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          responseText = data.text;
          ragSources = data.ragSources;
          generatedAudit = data.auditGenerated;
        } else {
          throw new Error('Fallback to client chat response');
        }
      } catch (_) {
        const relevantDocs = retrieveRelevantKnowledge(content);
        const chatRes = await generateChatResponse(
          currentHistory,
          relevantDocs,
          activeAudit || undefined,
          preferredModel
        );
        responseText = chatRes.text;
        generatedAudit = chatRes.auditGenerated;
        ragSources = relevantDocs;
      }

      const assistantMessage: ChatMessage = {
        id: 'msg-a-' + Date.now(),
        role: 'assistant',
        content: responseText,
        ragSources,
        generatedAuditId: generatedAudit?.id,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...currentHistory, assistantMessage];

      setMessagesMap((prev) => ({
        ...prev,
        [activeSessionId]: finalMessages,
      }));

      // Update or create session object with latest preview and timestamp
      const existingSession = sessions.find((s) => s.id === activeSessionId);
      const isFirstMessage = currentHistory.filter((m) => m.role === 'user').length <= 1;
      const smartTitle = isFirstMessage
        ? (content.length > 28 ? content.substring(0, 28) + '...' : content || 'Financial Consultation')
        : (existingSession?.title || 'Financial Consultation');

      const sessionToSave: ChatSession = {
        id: activeSessionId,
        title: smartTitle,
        previewText: responseText.substring(0, 60) + '...',
        createdAt: existingSession?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: existingSession?.isPinned || false,
      };

      setSessions((prev) => {
        const exists = prev.some((s) => s.id === activeSessionId);
        if (exists) {
          return prev.map((s) => (s.id === activeSessionId ? sessionToSave : s));
        }
        return [sessionToSave, ...prev];
      });

      // Persist to Firestore and local cache
      if (user?.uid) {
        saveChatSessionToFirestore(user.uid, sessionToSave, finalMessages);
      }

      if (generatedAudit) {
        addNewAudit(generatedAudit);
      }
    } catch (err: any) {
      toast.error('Failed to generate response: ' + err.message);
      const errorMessage: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **AI Communication Error**: ${err.message}`,
        createdAt: new Date().toISOString(),
      };
      setMessagesMap((prev) => ({
        ...prev,
        [activeSessionId]: [...currentHistory, errorMessage],
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const clearHistory = () => {
    const resetMessages: ChatMessage[] = [
      {
        id: 'msg-init-reset-' + Date.now(),
        role: 'assistant',
        content: 'Conversation history reset. How can FiscalSentry protect your finances today?',
        createdAt: new Date().toISOString(),
      },
    ];

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: resetMessages,
    }));

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (user?.uid && currentSession) {
      saveChatSessionToFirestore(user.uid, currentSession, resetMessages);
    }

    toast.info('Chat history cleared');
  };

  const currentActiveMessages = messagesMap[activeSessionId] || [];
  const currentActiveSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession: currentActiveSession,
        messages: currentActiveMessages,
        activeMessages: currentActiveMessages,
        isStreaming,
        rateLimitState,
        refreshRateLimit,
        createNewSession,
        switchSession,
        renameSession,
        deleteSession,
        togglePinSession,
        sendMessage,
        clearHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}
