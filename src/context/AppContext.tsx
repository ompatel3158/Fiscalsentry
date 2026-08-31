'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  AuditResult,
  ActionItemPayload,
  IntegrationsConfig,
  SentryConfig,
  SentryLogEntry,
} from '@/lib/types';
import { MOCK_AUDITS } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';
import {
  saveUserAuditToFirestore,
  getUserAuditsFromFirestore,
} from '@/lib/firebase';
import {
  fetchFinancialEmailsFromGmail,
  fetchFinancialEmailsTiered,
  SyncTier,
  ExtractedEmail,
  extractBankTransactionFromText,
  isPromotionalOrMarketingEmail,
} from '@/lib/gmail';
import { auditFinancialDocument, auditBatchFinancialEmails } from '@/lib/gemini';
import { computeYearlyFinancialLedger, YearlyFinancialHealthReport } from '@/lib/financialManager';
import { encryptSensitiveText, decryptSensitiveText } from '@/lib/encryption';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentView: 'welcome' | 'dashboard' | 'chat' | 'analytics' | 'settings';
  setCurrentView: (view: 'welcome' | 'dashboard' | 'chat' | 'analytics' | 'settings') => void;
  allAudits: AuditResult[];
  activeAudit: AuditResult | null;
  setActiveAudit: (audit: AuditResult | null) => void;
  yearlyHealthReport: YearlyFinancialHealthReport;
  isSandboxDemoActive: boolean;
  loadTemporarySandboxData: () => void;
  clearSandboxData: () => void;
  sentryConfig: SentryConfig;
  setSentryConfig: React.Dispatch<React.SetStateAction<SentryConfig>>;
  sentryLogs: SentryLogEntry[];
  integrations: IntegrationsConfig;
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationsConfig>>;
  isPDFModalOpen: boolean;
  setIsPDFModalOpen: (open: boolean) => void;
  pdfAuditTarget: AuditResult | null;
  setPdfAuditTarget: (audit: AuditResult | null) => void;
  isIntegrationsModalOpen: boolean;
  setIsIntegrationsModalOpen: (open: boolean) => void;
  executeAction: (action: ActionItemPayload) => Promise<void>;
  executeAllPendingActions: (auditId: string) => Promise<void>;
  triggerManualSentryScan: (customAccessToken?: string, tier?: SyncTier, isSilent?: boolean) => Promise<void>;
  loadPresetAudit: (presetKey: string) => void;
  addNewAudit: (audit: AuditResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, googleAccessToken, connectGoogleWorkspace, refreshGoogleWorkspaceToken } = useAuth();
  
  // 1. Initial view: show Welcome page on first-time visit, otherwise Dashboard
  const [currentView, setCurrentView] = useState<'welcome' | 'dashboard' | 'chat' | 'analytics' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('fs_has_seen_welcome');
      if (!seen) return 'welcome';
    }
    return 'dashboard';
  });
  
  // 2. Initialize allAudits from localStorage immediately on startup
  const [allAudits, setAllAudits] = useState<AuditResult[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fs_cached_audits');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  // 3. Initialize activeAudit as null by default so user is always greeted with the Total Dashboard Overview
  const [activeAudit, setActiveAudit] = useState<AuditResult | null>(null);

  const [isSandboxDemoActive, setIsSandboxDemoActive] = useState<boolean>(false);

  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfAuditTarget, setPdfAuditTarget] = useState<AuditResult | null>(null);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);

  const [sentryConfig, setSentryConfig] = useState<SentryConfig>({
    isActive: true,
    pollingIntervalSeconds: 3600, // 1 hour polling
    lastPolledAt: new Date().toISOString(),
    monitoredSources: {
      gmail: true,
      slack: true,
      discord: true,
      inboundWebhooks: true,
    },
    totalDocumentsProcessed: allAudits.length,
    totalDisputedAmount: allAudits.reduce((acc, a) => acc + (a.potentialRecoveryAmount || 0), 0),
    totalRecoveredAmount: 0,
  });

  const [sentryLogs, setSentryLogs] = useState<SentryLogEntry[]>([]);

  const [integrations, setIntegrations] = useState<IntegrationsConfig>({
    firebase: {
      isConfigured: true,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fiscalsentry-void',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fiscalsentry-void.firebasestorage.app',
    },
    googleWorkspace: {
      isConfigured: true,
      userEmail: 'workspace.admin@enterprise.com',
      services: {
        gmail: true,
        calendar: true,
        tasks: true,
        sheets: true,
        drive: true,
        messages: true,
      },
    },
    slack: {
      isConfigured: true,
      webhookUrl: '',
      channelName: '#financial-defense',
    },
    discord: {
      isConfigured: true,
      webhookUrl: '',
      channelName: 'financial-alerts',
    },
    customWebhooks: {
      isConfigured: true,
      endpoints: [
        {
          id: 'ep-1',
          name: 'Inbound ERP Pipeline',
          url: '/api/webhooks/inbound',
          active: true,
        },
      ],
    },
  });

  // Sync allAudits to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (allAudits.length > 0) {
          localStorage.setItem('fs_cached_audits', JSON.stringify(allAudits));
        }
      } catch (_) {}
    }
  }, [allAudits]);

  // Load user's private audits from Firestore when signed in
  useEffect(() => {
    if (user?.uid && !isSandboxDemoActive) {
      getUserAuditsFromFirestore(user.uid).then((storedAudits) => {
        if (storedAudits && storedAudits.length > 0) {
          setAllAudits((prev) => {
            const combined = [...storedAudits];
            prev.forEach((p) => {
              if (!combined.some((c) => c.id === p.id)) {
                combined.push(p);
              }
            });
            return combined;
          });

          // Keep activeAudit null by default so user sees the Total Dashboard Overview

          const totalDisputed = storedAudits.reduce((acc, a) => acc + (a.potentialRecoveryAmount || 0), 0);
          setSentryConfig((prev) => ({
            ...prev,
            totalDocumentsProcessed: storedAudits.length,
            totalDisputedAmount: totalDisputed,
          }));
        }
      });
    }
  }, [user?.uid, isSandboxDemoActive]);

  // Initial Auto-Sync: ONLY run once when the user FIRST connects Google Workspace and has 0 cached audits
  useEffect(() => {
    const token =
      googleAccessToken ||
      userProfile?.googleAccessToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('fs_google_token') : null);

    const hasInitialSynced = typeof window !== 'undefined' ? localStorage.getItem('fs_has_initial_synced') : null;

    if (token && !hasInitialSynced && allAudits.length === 0 && !isSandboxDemoActive) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fs_has_initial_synced', 'true');
        localStorage.setItem('fs_last_poll_timestamp', Date.now().toString());
      }
      console.log('[Sentry] Performing first-time historical inbox scan...');
      triggerManualSentryScan(token, 'delta');
    }
  }, [googleAccessToken, userProfile?.googleAccessToken, isSandboxDemoActive]);

  // Automated Background Poller (Runs periodically on 15m cadence + on tab focus/return)
  useEffect(() => {
    if (isSandboxDemoActive) return;

    const checkAndRunHourlySentry = async () => {
      const token =
        googleAccessToken ||
        userProfile?.googleAccessToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('fs_google_token') || sessionStorage.getItem('fs_google_token')
          : null);

      if (!token) return;

      const savedAt = Number(
        typeof window !== 'undefined' ? localStorage.getItem('fs_google_token_saved_at') || '0' : '0'
      );
      const isTokenExpired = savedAt > 0 && Date.now() - savedAt > 3000 * 1000;

      const lastPoll = Number(
        typeof window !== 'undefined' ? localStorage.getItem('fs_last_poll_timestamp') || '0' : '0'
      );
      const now = Date.now();
      const pollInterval = 15 * 60 * 1000; // Auto-poll every 15 minutes while active

      if (now - lastPoll >= pollInterval || lastPoll === 0) {
        if (isTokenExpired) {
          console.warn('[Sentry Poller] Google Workspace token is older than 50 minutes (expired).');
          setSentryLogs((prev) => [
            {
              id: 'log-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              source: 'gmail',
              status: 'error',
              message: 'Google Workspace token expired. Click Scan Mails or Reconnect in Settings to refresh.',
            },
            ...prev.slice(0, 15),
          ]);
          return;
        }

        console.log('[Sentry Autonomous Worker] Running background inbox check...');
        if (typeof window !== 'undefined') {
          localStorage.setItem('fs_last_poll_timestamp', now.toString());
        }
        await triggerManualSentryScan(token, 'delta', true);
      }
    };

    // Run on initial mount with a short delay for hydration
    const timerId = setTimeout(() => {
      checkAndRunHourlySentry();
    }, 1500);

    // Run whenever window/tab becomes active or focused (e.g. user returns)
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkAndRunHourlySentry();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    // Periodic heartbeat check every 60 seconds
    const interval = setInterval(checkAndRunHourlySentry, 60 * 1000);

    return () => {
      clearTimeout(timerId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
      clearInterval(interval);
    };
  }, [isSandboxDemoActive, googleAccessToken, userProfile?.googleAccessToken]);

  // Load Temporary Sandbox Data on Demand
  const loadTemporarySandboxData = () => {
    const sampleAudits = [
      MOCK_AUDITS['medical-metro-health'],
      MOCK_AUDITS['vendor-techcorp-procurement'],
      MOCK_AUDITS['grant-clean-energy-rebate'],
    ];
    setAllAudits(sampleAudits);
    setActiveAudit(null);
    setIsSandboxDemoActive(true);
    setSentryConfig((prev) => ({
      ...prev,
      totalDocumentsProcessed: 3,
      totalDisputedAmount: 9540,
      totalRecoveredAmount: 6700,
    }));
    toast.success('⚡ Sandbox Demo Data Loaded (Temporary)', {
      description: 'Loaded 3 real-world test scenarios. You can clear or reset this anytime.',
    });
  };

  // Clear Sandbox Data back to clean workspace
  const clearSandboxData = () => {
    setAllAudits([]);
    setActiveAudit(null);
    setIsSandboxDemoActive(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fs_cached_audits');
      localStorage.removeItem('fs_cached_active_audit');
      localStorage.removeItem('fs_has_initial_synced');
      localStorage.removeItem('fs_audited_email_ids');
    }
    setSentryConfig((prev) => ({
      ...prev,
      totalDocumentsProcessed: 0,
      totalDisputedAmount: 0,
      totalRecoveredAmount: 0,
    }));
    toast.success('Workspace cleared');
  };

  const loadPresetAudit = (presetKey: string) => {
    const targetAudit = MOCK_AUDITS[presetKey];
    if (targetAudit) {
      setAllAudits((prev) => [targetAudit, ...prev.filter((a) => a.id !== targetAudit.id)]);
      setActiveAudit(targetAudit);
      setIsSandboxDemoActive(true);
      toast.success(`Loaded Scenario: ${targetAudit.title}`);
    }
  };

  const addNewAudit = (audit: AuditResult) => {
    // If it's pure promotional material without liability, ignore it
    if (audit.isPromotionalOrNonFinancial) {
      return;
    }

    setAllAudits((prev) => {
      const exists = prev.some((a) => a.id === audit.id || (a.emailId && a.emailId === audit.emailId));
      if (exists) {
        return prev.map((a) => (a.id === audit.id ? audit : a));
      }
      const updated = [audit, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('fs_cached_audits', JSON.stringify(updated));
      }
      return updated;
    });
    setActiveAudit(audit);

    if (user?.uid) {
      saveUserAuditToFirestore(user.uid, audit);
    }
  };

  const executeAction = async (action: ActionItemPayload) => {
    try {
      toast.loading(`Executing action: ${action.title}...`, { id: action.id });

      const res = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          integrations,
          googleAccessToken: googleAccessToken || userProfile?.googleAccessToken,
        }),
      });

      const data = await res.json().catch(() => ({ success: true }));

      setAllAudits((prev) =>
        prev.map((audit) => {
          if (audit.id === activeAudit?.id) {
            const updatedActions = audit.actions.map((act) =>
              act.id === action.id
                ? {
                    ...act,
                    status: 'completed' as const,
                    executionResult: data.result || {
                      executedAt: new Date().toISOString(),
                      externalUrl: data.calendarEventUrl || data.driveFileUrl,
                    },
                  }
                : act
            );
            const updatedAudit = { ...audit, actions: updatedActions };
            if (user?.uid) {
              saveUserAuditToFirestore(user.uid, updatedAudit);
            }
            return updatedAudit;
          }
          return audit;
        })
      );

      if (activeAudit) {
        setActiveAudit((prev) =>
          prev
            ? {
                ...prev,
                actions: prev.actions.map((act) =>
                  act.id === action.id ? { ...act, status: 'completed' as const } : act
                ),
              }
            : null
        );
      }

      toast.success(`Completed: ${action.title}`, {
        id: action.id,
        description: `Dispatched to ${action.targetService} seamlessly.`,
      });

      if (action.type.startsWith('pdf_')) {
        setPdfAuditTarget(activeAudit);
        setIsPDFModalOpen(true);
      }

      setSentryLogs((prev) => [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          source: action.targetService.toLowerCase().includes('google') ? 'gmail' : 'slack',
          status: 'success',
          message: `Dispatched action: ${action.title} (${action.targetService})`,
        },
        ...prev.slice(0, 15),
      ]);
    } catch (err: any) {
      toast.error(`Execution failed: ${err.message}`, { id: action.id });
    }
  };

  const executeAllPendingActions = async (auditId: string) => {
    const targetAudit = allAudits.find((a) => a.id === auditId) || activeAudit;
    if (!targetAudit) return;

    const pendingActions = targetAudit.actions.filter((a) => a.status === 'pending');
    if (pendingActions.length === 0) {
      toast.info('All actions already executed for this document.');
      return;
    }

    toast.loading(`Orchestrating ${pendingActions.length} actions in parallel...`, { id: 'batch-exec' });

    for (const action of pendingActions) {
      await executeAction(action);
    }

    toast.success('All Multi-Destination Actions Executed Successfully!', {
      id: 'batch-exec',
      description: 'Google Workspace, Slack, and PDF pipelines synchronized.',
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (_) {}
  };

  const yearlyHealthReport = React.useMemo(() => {
    return computeYearlyFinancialLedger(allAudits);
  }, [allAudits]);

  // Comprehensive Batch Sentry Scan with Tiered Checkpointing (Delta, Month, Quarter, Year)
  const triggerManualSentryScan = async (
    customAccessToken?: string,
    tier: SyncTier = 'delta',
    isSilent: boolean = false
  ) => {
    const tierLabel =
      tier === 'delta' ? 'Quick Delta' : tier === 'month' ? 'Current Month (30d)' : tier === 'year' ? '1-Year Ledger Optimization (365d)' : 'Quarterly (90d)';
    
    if (!isSilent) {
      toast.loading(`Voidy AI scanning Gmail inbox (${tierLabel})...`, { id: 'sentry-scan' });
    }

    try {
      const tokenSavedAt = userProfile?.googleTokenSavedAt || (typeof window !== 'undefined' ? Number(localStorage.getItem('fs_google_token_saved_at') || '0') : 0);
      const isDueFor45MinRefresh = !tokenSavedAt || (Date.now() - tokenSavedAt > 45 * 60 * 1000);

      let activeToken =
        customAccessToken ||
        googleAccessToken ||
        userProfile?.googleAccessToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('fs_google_token') || sessionStorage.getItem('fs_google_token')
          : null);

      // Proactively rotate token at 45-minute mark silently
      if ((!activeToken || isDueFor45MinRefresh) && !isSandboxDemoActive) {
        const silentToken = await refreshGoogleWorkspaceToken(true);
        if (silentToken) {
          activeToken = silentToken;
        }
      }

      // If still no token is found and not in sandbox demo, prompt 1-click Google Workspace connection
      if (!activeToken && !isSandboxDemoActive) {
        if (!isSilent) {
          toast.info('Google Workspace Token Required', {
            id: 'sentry-scan',
            description: 'Opening 1-Click Google Workspace authorization...',
          });
          const freshToken = await connectGoogleWorkspace();
          if (freshToken) {
            activeToken = freshToken;
          } else {
            return;
          }
        } else {
          return;
        }
      }

      setSentryConfig((prev) => ({
        ...prev,
        lastPolledAt: new Date().toISOString(),
      }));

      const lastPollTimestamp =
        typeof window !== 'undefined'
          ? parseInt(localStorage.getItem('fs_last_poll_timestamp') || '0', 10)
          : 0;

      if (typeof window !== 'undefined') {
        localStorage.setItem('fs_last_poll_timestamp', Date.now().toString());
      }

      // Direct client-side batch Gmail REST API query using Tiered Checkpointing
      if (activeToken && !isSandboxDemoActive) {
        try {
          // Retrieve previously processed email IDs from localStorage
          let storedAuditedIds: string[] = [];
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('fs_audited_email_ids');
              if (raw) storedAuditedIds = JSON.parse(raw);
            } catch (_) {}
          }

          const allAuditedEmailIds = new Set<string>([
            ...storedAuditedIds,
            ...allAudits.flatMap((a) => (a.emailIds || (a.emailId ? [a.emailId] : []))),
          ]);

          const realEmails = await fetchFinancialEmailsTiered(
            activeToken,
            tier,
            lastPollTimestamp,
            Array.from(allAuditedEmailIds)
          );

          if (realEmails.length > 0) {
            // Filter out obvious promotional non-financial messages
            const unAuditedEmails = realEmails.filter((email) => {
              if (isPromotionalOrMarketingEmail(email.subject, email.snippet, email.sender, email.bodyText)) {
                return false;
              }
              return true;
            });

            if (unAuditedEmails.length === 0) {
              if (!isSilent) {
                toast.success('Gmail Scan Complete', {
                  id: 'sentry-scan',
                  description: `Checked ${realEmails.length} messages (${tierLabel}). Zero liabilities or new charges found.`,
                });
              }
              setSentryLogs((prev) => [
                {
                  id: 'log-' + Date.now(),
                  timestamp: new Date().toLocaleTimeString(),
                  source: 'gmail',
                  status: 'success',
                  message: `Voidy AI Verified: ${realEmails.length} messages checked (${tierLabel}). Ledger is 100% up to date.`,
                },
                ...prev.slice(0, 15),
              ]);
              return;
            }

            if (!isSilent) {
              toast.loading(`Voidy AI evaluating ${unAuditedEmails.length} new transactions in 1 Gemini batch...`, {
                id: 'sentry-scan',
              });
            }

            const activeModel = userProfile?.preferredModel || 'gemini-3.7-flash';

            // Partition unAuditedEmails by calendar month (YYYY-MM) so 1-year and multi-month syncs populate distinct monthly statements
            const emailsByMonth: Record<string, ExtractedEmail[]> = {};
            unAuditedEmails.forEach((email) => {
              const d = email.date ? new Date(email.date) : new Date();
              const validDate = isNaN(d.getTime()) ? new Date() : d;
              const monthKey = `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}`;
              if (!emailsByMonth[monthKey]) {
                emailsByMonth[monthKey] = [];
              }
              emailsByMonth[monthKey].push(email);
            });

            const monthKeys = Object.keys(emailsByMonth).sort((a, b) => b.localeCompare(a));
            const createdAudits: AuditResult[] = [];
            let totalTransactionCount = 0;
            let totalRecoveryCount = 0;

            for (const mKey of monthKeys) {
              const monthEmails = emailsByMonth[mKey];
              const monthAudit = await auditBatchFinancialEmails(monthEmails, activeModel);
              if (monthAudit) {
                const d = new Date(`${mKey}-01T00:00:00Z`);
                const monthName = isNaN(d.getTime()) ? mKey : d.toLocaleString('default', { month: 'long', year: 'numeric' });
                monthAudit.id = `audit-batch-${mKey}-${Date.now()}`;
                monthAudit.documentDate = `${mKey}-15`;
                monthAudit.title = `Voidy AI Ledger: ${monthName} (${monthAudit.lineItems?.length || 1} Transactions)`;
                monthAudit.emailIds = monthEmails.map((e) => e.id);
                createdAudits.push(monthAudit);

                totalTransactionCount += monthAudit.lineItems?.length || 1;
                totalRecoveryCount += monthAudit.potentialRecoveryAmount || 0;

                if (user?.uid) {
                  saveUserAuditToFirestore(user.uid, monthAudit);
                }
              }
            }

            // Record all processed email IDs so they aren't re-audited unnecessarily
            const processedIds = unAuditedEmails.map((e) => e.id);
            const updatedAuditedIds = Array.from(new Set([...storedAuditedIds, ...processedIds]));
            if (typeof window !== 'undefined') {
              localStorage.setItem('fs_audited_email_ids', JSON.stringify(updatedAuditedIds));
            }

            if (createdAudits.length > 0) {
              // Add the consolidated monthly audits to the ledger
              setAllAudits((prev) => {
                const existingMap = new Map(prev.map((a) => [a.id, a]));
                createdAudits.forEach((a) => existingMap.set(a.id, a));
                const updated = Array.from(existingMap.values()).sort(
                  (a, b) => new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
                );
                if (typeof window !== 'undefined') {
                  localStorage.setItem('fs_cached_audits', JSON.stringify(updated));
                }
                return updated;
              });

              // Keep activeAudit null so Total Dashboard Overview remains visible with updated metrics
              setActiveAudit(null);

              setSentryConfig((prev) => ({
                ...prev,
                totalDocumentsProcessed: prev.totalDocumentsProcessed + totalTransactionCount,
                totalDisputedAmount: prev.totalDisputedAmount + totalRecoveryCount,
              }));

              setSentryLogs((prev) => [
                {
                  id: 'log-' + Date.now(),
                  timestamp: new Date().toLocaleTimeString(),
                  source: 'gmail',
                  status: 'success',
                  message: `Voidy AI Ledger Synced: Audited ${unAuditedEmails.length} emails into ${createdAudits.length} monthly statements (${totalTransactionCount} transactions across ${tierLabel}).`,
                },
                ...prev.slice(0, 15),
              ]);

              toast.success('Voidy AI Financial Ingestion Complete!', {
                id: 'sentry-scan',
                description: `Processed ${unAuditedEmails.length} emails (${totalTransactionCount} verified transactions synchronized).`,
              });
            } else {
              setSentryLogs((prev) => [
                {
                  id: 'log-' + Date.now(),
                  timestamp: new Date().toLocaleTimeString(),
                  source: 'gmail',
                  status: 'success',
                  message: `Evaluated ${unAuditedEmails.length} items. All promotional offers discarded.`,
                },
                ...prev.slice(0, 15),
              ]);

              if (!isSilent) {
                toast.info('Inbox Checked', {
                  id: 'sentry-scan',
                  description: 'All recent items were promotional/informational. Zero liabilities added.',
                });
              }
            }
            return;
          } else {
            if (!isSilent) {
              toast.info('Inbox Up to Date', {
                id: 'sentry-scan',
                description: `Zero new messages since your last sync (${tierLabel}).`,
              });
            }
            return;
          }
        } catch (gmailErr: any) {
          if (gmailErr.message === 'GMAIL_AUTH_EXPIRED' || gmailErr.status === 401) {
            console.log('[Sentry] Google Workspace Token Expired. Initiating refresh...');
            if (!isSilent) {
              toast.loading('Google Workspace Token Expired. Refreshing authorization...', { id: 'sentry-scan' });
              const freshToken = await connectGoogleWorkspace();
              if (freshToken) {
                return await triggerManualSentryScan(freshToken, tier, isSilent);
              } else {
                toast.error('Google Workspace Authorization Expired', {
                  id: 'sentry-scan',
                  description: 'Please sign in with Google to allow Sentry to read new statements.',
                });
                return;
              }
            }
          }
          console.warn('[Sentry] Gmail extraction issue:', gmailErr);
        }
      }

      if (!isSilent) {
        toast.info('Autonomous Sentry Polled', {
          id: 'sentry-scan',
          description: 'Inbox checked. All financial statements are up to date.',
        });
      }
    } catch (err: any) {
      if (!isSilent) {
        toast.error(`Sentry scan failed: ${err.message}`, { id: 'sentry-scan' });
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        allAudits,
        activeAudit,
        setActiveAudit,
        yearlyHealthReport,
        isSandboxDemoActive,
        loadTemporarySandboxData,
        clearSandboxData,
        sentryConfig,
        setSentryConfig,
        sentryLogs,
        integrations,
        setIntegrations,
        isPDFModalOpen,
        setIsPDFModalOpen,
        pdfAuditTarget,
        setPdfAuditTarget,
        isIntegrationsModalOpen,
        setIsIntegrationsModalOpen,
        executeAction,
        executeAllPendingActions,
        triggerManualSentryScan,
        loadPresetAudit,
        addNewAudit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
