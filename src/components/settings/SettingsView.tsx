'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getEpochInfo } from '@/lib/crypto';
import {
  Cpu,
  Shield,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Globe,
  MessageSquare,
  User,
  Clock,
  Save,
  CheckCircle2,
  Mail,
  Calendar,
  CheckSquare,
  FolderSync,
  MessageCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
  const {
    user,
    userProfile,
    googleAccessToken,
    connectGoogleWorkspace,
    updateProfileSettings,
    signOut,
    openAuthModal,
    sessionDaysRemaining,
  } = useAuth();
  const { integrations, setIntegrations, triggerManualSentryScan } = useApp();

  const [preferredModel, setPreferredModel] = useState<'gemini-3.7-flash' | 'gemini-3.6-flash' | 'gemini-3.5-flash' | 'gemini-3.5-flash-lite' | string>(
    userProfile?.preferredModel || 'gemini-3.7-flash'
  );
  const [slackWebhook, setSlackWebhook] = useState(integrations.slack.webhookUrl || '');
  const [discordWebhook, setDiscordWebhook] = useState(integrations.discord.webhookUrl || '');
  const [erpWebhook, setErpWebhook] = useState(userProfile?.webhookUrls?.erp || '');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.preferredModel) {
      setPreferredModel(userProfile.preferredModel);
    }
  }, [userProfile?.preferredModel]);

  const epochInfo = getEpochInfo(userProfile?.activeEncryptionEpoch);
  const inboundWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/inbound` : 'https://fiscalsentry-void.web.app/api/webhooks/inbound';

  const handleSelectModel = async (modelKey: string) => {
    setPreferredModel(modelKey);
    if (user) {
      await updateProfileSettings({ preferredModel: modelKey as any });
      toast.success(`Active AI Model Updated to ${modelKey}`, {
        description: 'Instant synchronization across Chat, Dropzone, and Background Sentry.',
      });
    } else {
      toast.info(`AI Model set to ${modelKey} (Guest Session)`);
    }
  };

  const handleReauthGoogle = async () => {
    try {
      toast.loading('Opening Google Workspace permission consent...', { id: 'ws-reauth' });
      const token = await connectGoogleWorkspace();
      if (token) {
        toast.success('Google Workspace Permissions Refreshed!', {
          id: 'ws-reauth',
          description: 'Gmail, Calendar, Tasks, Drive, and Google Messages scopes active.',
        });
      }
    } catch (err: any) {
      toast.error('Re-authentication failed: ' + err.message, { id: 'ws-reauth' });
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(`${inboundWebhookUrl}?token=fs_${user?.uid?.substring(0, 8) || 'demo'}`);
    setCopiedWebhook(true);
    toast.success('Inbound ERP Webhook URL copied!');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    try {
      setIntegrations((prev) => ({
        ...prev,
        slack: { ...prev.slack, webhookUrl: slackWebhook },
        discord: { ...prev.discord, webhookUrl: discordWebhook },
      }));

      if (user) {
        await updateProfileSettings({
          preferredModel: preferredModel as any,
          webhookUrls: {
            erp: erpWebhook,
            slack: slackWebhook,
            discord: discordWebhook,
          },
        });
      } else {
        toast.success('Settings saved to local workspace');
      }
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#fbfbfd] dark:bg-[#000000] p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-emerald-500" />
            Control Center & Customization
          </h1>
          <p className="text-xs text-[#86868b] mt-1">
            Configure Gemini 3.7 Flash AI model engine, Google Workspace permissions, 14-day encryption rotation, and webhooks.
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all active:scale-[0.97] shrink-0 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* 1. Google Workspace & Account Re-Authentication */}
      <section className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Google Workspace & Account Authorization
            </h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              googleAccessToken || userProfile?.googleWorkspaceConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {googleAccessToken || userProfile?.googleWorkspaceConnected ? '✓ Authorized & Connected' : 'Action Required'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <span>{user?.email || 'Google Workspace Account'}</span>
            </div>
            <p className="text-[11px] text-[#86868b] mt-0.5">
              Authorizes autonomous Gmail bill extraction, Calendar 30-day deadlines, Tasks dispatch, and Google Messages.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleReauthGoogle}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-Authenticate Workspace
            </button>

            <button
              onClick={() => triggerManualSentryScan(undefined, 'month')}
              className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white text-xs font-bold transition-all active:scale-[0.97]"
            >
              Scan Current Month (30d)
            </button>
          </div>
        </div>

        {/* Permission Scopes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
            <Mail className="w-4 h-4 text-red-500 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#1d1d1f] dark:text-white">Gmail</div>
              <div className="text-[9px] text-[#86868b]">Read statements</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#1d1d1f] dark:text-white">Calendar</div>
              <div className="text-[9px] text-[#86868b]">Appeal cutoffs</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#1d1d1f] dark:text-white">Tasks</div>
              <div className="text-[9px] text-[#86868b]">Checklist queue</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#1d1d1f] dark:text-white">Drive</div>
              <div className="text-[9px] text-[#86868b]">PDF packet vault</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#1d1d1f] dark:text-white">Messages</div>
              <div className="text-[9px] text-[#86868b]">Alert dispatch</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. AI Model Engine Selector */}
      <section className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Primary Reasoning Engine (Google Gemini)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
            Active: {preferredModel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Gemini 3.7 Flash */}
          <div
            onClick={() => handleSelectModel('gemini-3.7-flash')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferredModel === 'gemini-3.7-flash'
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Gemini 3.7 Flash
              </span>
              {preferredModel === 'gemini-3.7-flash' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[11px] text-[#86868b] mt-1.5 leading-relaxed">
              Flagship Default. Ultra-fast hybrid reasoning, sub-second latency, multimodal statement OCR, and intelligent batch reconciliation.
            </p>
          </div>

          {/* Gemini 3.6 Flash */}
          <div
            onClick={() => handleSelectModel('gemini-3.6-flash')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferredModel === 'gemini-3.6-flash'
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">Gemini 3.6 Flash</span>
              {preferredModel === 'gemini-3.6-flash' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[11px] text-[#86868b] mt-1.5 leading-relaxed">
              Deep compliance analysis for multi-page complex hospital itemized billing, pricing anomalies, and contract quote comparisons.
            </p>
          </div>

          {/* Gemini 3.5 Flash */}
          <div
            onClick={() => handleSelectModel('gemini-3.5-flash')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferredModel === 'gemini-3.5-flash'
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">Gemini 3.5 Flash</span>
              {preferredModel === 'gemini-3.5-flash' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[11px] text-[#86868b] mt-1.5 leading-relaxed">
              Balanced reasoning engine for multi-turn advisory chat, legal statutory validation, and vector RAG citations.
            </p>
          </div>

          {/* Gemini 3.5 Flash Lite */}
          <div
            onClick={() => handleSelectModel('gemini-3.5-flash-lite')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferredModel === 'gemini-3.5-flash-lite'
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">Gemini 3.5 Flash Lite</span>
              {preferredModel === 'gemini-3.5-flash-lite' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[11px] text-[#86868b] mt-1.5 leading-relaxed">
              High-throughput lightweight model tailored for massive 1,000-email batch ingestion and rapid background polling.
            </p>
          </div>
        </div>
      </section>

      {/* 3. 14-Day Zero-Knowledge Rotating Encryption */}
      <section className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Zero-Knowledge 14-Day Encryption Vault
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
            AES-256-GCM Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[11px] text-[#86868b]">Active Epoch Key</div>
            <div className="text-sm font-bold text-[#1d1d1f] dark:text-white mt-1">
              Epoch #{epochInfo.currentEpoch}
            </div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Rotates automatically every 14 days</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[11px] text-[#86868b]">Key Rotation Due</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {epochInfo.daysRemaining} Days Remaining
            </div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Next key derived on {epochInfo.epochEndDate}</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[11px] text-[#86868b]">15-Day Session Timer</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
              {sessionDaysRemaining} Days Left
            </div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Mandatory security re-auth cycle</div>
          </div>
        </div>
      </section>

      {/* 4. Inbound Webhooks & 3rd-Party Hooks */}
      <section className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Webhooks & Alert Dispatchers
            </h2>
          </div>
        </div>

        {/* Inbound ERP Webhook */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-[#86868b] block">
            Inbound ERP / Accounting Webhook Endpoint
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${inboundWebhookUrl}?token=fs_${user?.uid?.substring(0, 8) || 'demo'}`}
              className="flex-1 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-mono text-[#1d1d1f] dark:text-white border border-transparent focus:outline-none select-all"
            />
            <button
              onClick={handleCopyWebhook}
              className="px-3 py-2 rounded-xl bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.97] shrink-0"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWebhook ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Slack Webhook */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-[#86868b] mb-1 block flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              Slack Incoming Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] border border-transparent focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#86868b] mb-1 block flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              Discord Alert Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] border border-transparent focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 5. Account & Linked Providers */}
      <section className="rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Account Authentication & Merged Providers
            </h2>
          </div>
          {user && (
            <button
              onClick={signOut}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-sm font-bold">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
              <div>
                <div className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                  {user.displayName || 'FiscalSentry Member'}
                </div>
                <div className="text-[11px] text-[#86868b]">{user.email}</div>
              </div>
            </div>

            {/* Provider Badges */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  user.providerData.some((p) => p.providerId === 'google.com')
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-black/5 dark:bg-white/10 text-[#86868b]'
                }`}
              >
                Google: {user.providerData.some((p) => p.providerId === 'google.com') ? 'Linked' : 'Not Linked'}
              </span>

              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  user.providerData.some((p) => p.providerId === 'password')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/10 text-[#86868b]'
                }`}
              >
                Email/Password: {user.providerData.some((p) => p.providerId === 'password') ? 'Active' : 'Unset'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] text-center space-y-3">
            <p className="text-xs text-[#86868b]">
              Sign in to enable 14-day encrypted cloud backups across Firestore and sync Google Workspace actions.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black text-xs font-bold transition-all active:scale-[0.97]"
            >
              Sign In or Create Account
            </button>
          </div>
        )}
      </section>

      {/* 6. Legal & Governance Section */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
              Legal, Compliance &amp; Governance
            </h2>
            <p className="text-[11px] text-[#86868b]">
              Statutory disclosures, Google API Limited Use compliance, and Zero-Knowledge security
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all group"
          >
            <span>Terms and Conditions</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono group-hover:translate-x-0.5 transition-transform">
              View Legal Terms →
            </span>
          </a>

          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all group"
          >
            <span>Privacy Policy &amp; Limited Use</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono group-hover:translate-x-0.5 transition-transform">
              View Privacy Policy →
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}
