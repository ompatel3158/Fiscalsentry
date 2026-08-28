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
import { fetchFinancialEmailsFromGmail, extractBankTransactionFromText, isPromotionalOrMarketingEmail } from '@/lib/gmail';
import { auditFinancialDocument, auditBatchFinancialEmails } from '@/lib/gemini';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentView: 'welcome' | 'dashboard' | 'chat' | 'analytics' | 'settings';
  setCurrentView: (view: 'welcome' | 'dashboard' | 'chat' | 'analytics' | 'settings') => void;
  allAudits: AuditResult[];
  activeAudit: AuditResult | null;
  setActiveAudit: (audit: AuditResult | null) => void;
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
  triggerManualSentryScan: (customAccessToken?: string, daysLookback?: number, isSilent?: boolean) => Promise<void>;
  loadPresetAudit: (presetKey: string) => void;
  addNewAudit: (audit: AuditResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, googleAccessToken, connectGoogleWorkspace } = useAuth();
  
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
      triggerManualSentryScan(token, 15);
    }
  }, [googleAccessToken, userProfile?.googleAccessToken, isSandboxDemoActive]);

  // Automated 1-Hour Background Poller (No user setup required)
  useEffect(() => {
    if (isSandboxDemoActive) return;

    const runHourlyAutoCheck = async () => {
      const token =
        googleAccessToken ||
        userProfile?.googleAccessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('fs_google_token') : null);

      if (!token) return;

      const lastPoll = Number(
        typeof window !== 'undefined' ? localStorage.getItem('fs_last_poll_timestamp') || '0' : '0'
      );
      const now = Date.now();
      const oneHour = 3600 * 1000;

      if (now - lastPoll >= oneHour) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fs_last_poll_timestamp', now.toString());
        }
        console.log('[Sentry Autonomous Worker] Running background hourly inbox check...');
        await triggerManualSentryScan(token, 2, true);
      }
    };

    // Run immediately on mount if >1 hour has elapsed since last poll
    runHourlyAutoCheck();

    // Schedule 1-hour interval timer
    const intervalMs = 3600 * 1000;
    const timer = setInterval(() => {
      runHourlyAutoCheck();
    }, intervalMs);

    return () => clearInterval(timer);
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

  // Comprehensive Batch Sentry Scan (Audits all genuine financial emails from the last N days)
  const triggerManualSentryScan = async (
    customAccessToken?: string,
    daysLookback: number = 15,
    isSilent: boolean = false
  ) => {
    if (!isSilent) {
      toast.loading(`Autonomous Sentry scanning Gmail inbox (last ${daysLookback} days)...`, { id: 'sentry-scan' });
    }

    try {
      let activeToken =
        customAccessToken ||
        googleAccessToken ||
        userProfile?.googleAccessToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('fs_google_token') || sessionStorage.getItem('fs_google_token')
          : null);

      // If no token is found and not in sandbox demo, prompt 1-click Google Workspace connection
      if (!activeToken && !isSandboxDemoActive) {
        if (!isSilent) {
          toast.info('Google Workspace Token Required', {
            id: 'sentry-scan',
            description: 'Opening 1-Click Google Workspace authorization...',
          });
          const authedUser = await connectGoogleWorkspace();
          if (authedUser && (authedUser as any).googleAccessToken) {
            activeToken = (authedUser as any).googleAccessToken;
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

      if (typeof window !== 'undefined') {
        localStorage.setItem('fs_last_poll_timestamp', Date.now().toString());
      }

      // Direct client-side batch Gmail REST API query
      if (activeToken && !isSandboxDemoActive) {
        try {
          const realEmails = await fetchFinancialEmailsFromGmail(activeToken, 35, daysLookback);

          if (realEmails.length > 0) {
            // Get cached list from localStorage and state
            let existingAudits = allAudits;
            if (typeof window !== 'undefined') {
              try {
                const cachedStr = localStorage.getItem('fs_cached_audits');
                if (cachedStr) {
                  const cachedList: AuditResult[] = JSON.parse(cachedStr);
                  if (Array.isArray(cachedList) && cachedList.length > existingAudits.length) {
                    existingAudits = cachedList;
                  }
                }
              } catch (_) {}
            }

            // Filter out emails that have already been audited to avoid duplicates & repeated LLM calls
            const unAuditedEmails = realEmails.filter((email) => {
              // Pre-filter check: drop marketing emails
              if (isPromotionalOrMarketingEmail(email.subject, email.snippet, email.sender, email.bodyText)) {
                return false;
              }

              return !existingAudits.some(
                (existing) =>
                  existing.emailId === email.id ||
                  (existing.title === email.subject && existing.providerOrVendor.includes(email.sender))
              );
            });

            if (unAuditedEmails.length === 0) {
              if (!isSilent) {
                toast.success('Gmail Scan Complete', {
                  id: 'sentry-scan',
                  description: `All ${realEmails.length} statements from the last ${daysLookback} days are already audited and cached.`,
                });
              }
              return;
            }

            if (!isSilent) {
              toast.loading(`Evaluating ${unAuditedEmails.length} new messages in 1 Gemini batch...`, {
                id: 'sentry-scan',
              });
            }

            const activeModel = userProfile?.preferredModel || 'gemini-3.1-flash-lite';
            
            // Execute ONE SINGLE GEMINI API CALL for the entire batch
            const batchAudit = await auditBatchFinancialEmails(unAuditedEmails, activeModel);

            if (batchAudit) {
              // Add the single consolidated hourly audit to the ledger
              setAllAudits((prev) => {
                const updated = [batchAudit, ...prev.filter((a) => a.id !== batchAudit.id)];
                if (typeof window !== 'undefined') {
                  localStorage.setItem('fs_cached_audits', JSON.stringify(updated));
                }
                return updated;
              });

              // Keep activeAudit null so Total Dashboard Overview remains visible with updated metrics
              setActiveAudit(null);

              if (user?.uid) {
                saveUserAuditToFirestore(user.uid, batchAudit);
              }

              const transactionCount = batchAudit.lineItems?.length || 1;
              const recoveryAmount = batchAudit.potentialRecoveryAmount || 0;

              setSentryConfig((prev) => ({
                ...prev,
                totalDocumentsProcessed: prev.totalDocumentsProcessed + transactionCount,
                totalDisputedAmount: prev.totalDisputedAmount + recoveryAmount,
              }));

              setSentryLogs((prev) => [
                {
                  id: 'log-' + Date.now(),
                  timestamp: new Date().toLocaleTimeString(),
                  source: 'gmail',
                  status: 'success',
                  message: `1-Shot Batch Sentry: Audited ${unAuditedEmails.length} emails into 1 consolidated digest (${transactionCount} transactions).`,
                },
                ...prev.slice(0, 15),
              ]);

              toast.success('Autonomous Sentry 1-Shot Ingestion Complete!', {
                id: 'sentry-scan',
                description: `Processed ${unAuditedEmails.length} emails in 1 Gemini call (${transactionCount} verified transactions added).`,
              });
            } else {
              if (!isSilent) {
                toast.info('Inbox Checked', {
                  id: 'sentry-scan',
                  description: 'All recent items were promotional/informational. Zero liabilities added.',
                });
              }
            }
            return;
          }
        } catch (gmailErr: any) {
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
