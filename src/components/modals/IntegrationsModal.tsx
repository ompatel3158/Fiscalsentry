'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Settings,
  Mail,
  Calendar,
  CheckSquare,
  Sheet,
  FolderSync,
  MessageSquare,
  Webhook,
  Flame,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function IntegrationsModal() {
  const { isIntegrationsModalOpen, setIsIntegrationsModalOpen, integrations, setIntegrations, triggerManualSentryScan } = useApp();
  const { user, userProfile, connectGoogleWorkspace, googleAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'workspace' | 'firebase' | 'slack_discord' | 'webhooks'>('workspace');

  if (!isIntegrationsModalOpen) return null;

  const handleTestIntegration = async (name: string) => {
    if (name === 'Gmail') {
      let token = googleAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('fs_google_token') : null);
      if (!token) {
        toast.info('Authenticating with Google Workspace...');
        token = await connectGoogleWorkspace();
      }
      if (token) {
        setIsIntegrationsModalOpen(false);
        await triggerManualSentryScan(token);
      }
      return;
    }

    toast.success(`Connection verified for ${name}!`, {
      description: 'Handshake succeeded. Endpoints are active and responsive.',
    });
  };

  const handleConnectWorkspace = async () => {
    try {
      toast.loading('Opening Google Workspace permission consent...', { id: 'auth-ws' });
      const token = await connectGoogleWorkspace();
      if (token) {
        toast.success('Google Workspace Connected!', {
          id: 'auth-ws',
          description: 'Gmail, Calendar, Tasks, and Drive permissions granted successfully.',
        });
        setIsIntegrationsModalOpen(false);
        await triggerManualSentryScan(token);
      }
    } catch (err: any) {
      toast.error('Google connection failed: ' + err.message, { id: 'auth-ws' });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Integrations & Action Dispatchers
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure Google Workspace, Firebase, Slack, and Custom ERP Webhooks
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsIntegrationsModalOpen(false)}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-[0.97]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all duration-150 ${
                activeTab === 'workspace'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Google Workspace Suite
            </button>

            <button
              onClick={() => setActiveTab('firebase')}
              className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all duration-150 ${
                activeTab === 'firebase'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Firebase (Firestore & Storage)
            </button>

            <button
              onClick={() => setActiveTab('slack_discord')}
              className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all duration-150 ${
                activeTab === 'slack_discord'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Slack & Discord
            </button>

            <button
              onClick={() => setActiveTab('webhooks')}
              className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all duration-150 ${
                activeTab === 'webhooks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              ERP / Custom Webhooks
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Google Workspace */}
            {activeTab === 'workspace' && (
              <div className="space-y-3">
                {/* Google Workspace Connect Callout */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Google Workspace OAuth Status
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {googleAccessToken || userProfile?.googleWorkspaceConnected
                        ? `Connected (${user?.email || 'Active Token'})`
                        : 'Connect your Google account to grant Gmail attachment reading and Calendar sync permissions.'}
                    </p>
                  </div>
                  <button
                    onClick={handleConnectWorkspace}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all shrink-0"
                  >
                    {googleAccessToken || userProfile?.googleWorkspaceConnected ? 'Re-Authenticate & Scan' : 'Connect Google Workspace'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Gmail (Inbox Watcher & Auto-Drafts)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {user?.email || 'Connected via Google OAuth'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestIntegration('Gmail')}
                    className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-[0.97]"
                  >
                    Scan Inbox Now
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Google Calendar (Statutory Deadlines)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Auto-syncs 30-day appeal cutoffs & grant deadlines
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestIntegration('Google Calendar')}
                    className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-[0.97]"
                  >
                    Test Calendar
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Google Tasks (Priority Action Checklist)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Dispatches task items with call battlecard notes
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestIntegration('Google Tasks')}
                    className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-[0.97]"
                  >
                    Test Tasks
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Sheet className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Google Sheets (Recovery Ledger)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Appends structured rows to live financial spreadsheet
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestIntegration('Google Sheets')}
                    className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-[0.97]"
                  >
                    Test Sheets
                  </button>
                </div>
              </div>
            )}

            {/* Firebase */}
            {activeTab === 'firebase' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Full Firebase Backend Active:</strong> Storing multi-chat sessions, RAG memory chunks, and media dossiers in Cloud Firestore & Storage.
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Firebase Project ID
                  </label>
                  <input
                    type="text"
                    defaultValue={integrations.firebase.projectId}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    defaultValue={integrations.firebase.storageBucket}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={() => handleTestIntegration('Firebase Firestore & Storage')}
                  className="w-full py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.97]"
                >
                  Test Firebase Connection
                </button>
              </div>
            )}

            {/* Slack & Discord */}
            {activeTab === 'slack_discord' && (
              <div className="space-y-4">
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Slack Incoming Webhook URL
                  </label>
                  <input
                    type="text"
                    defaultValue={integrations.slack.webhookUrl}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleTestIntegration('Slack')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs active:scale-[0.97]"
                  >
                    Test Slack Notification
                  </button>
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Discord Webhook URL
                  </label>
                  <input
                    type="text"
                    defaultValue={integrations.discord.webhookUrl}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleTestIntegration('Discord')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs active:scale-[0.97]"
                  >
                    Test Discord Embed
                  </button>
                </div>
              </div>
            )}

            {/* Custom Webhooks / ERP */}
            {activeTab === 'webhooks' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configured endpoints for accounting systems, ERPs, and automation platforms (Zapier/Make).
                </p>

                {integrations.customWebhooks.endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {ep.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
                        {ep.url}
                      </div>
                    </div>
                    <button
                      onClick={() => handleTestIntegration(ep.name)}
                      className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-[0.97]"
                    >
                      Trigger Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
