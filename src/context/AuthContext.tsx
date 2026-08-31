'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  syncUserProfile,
  getUserProfile,
  UserProfile,
  linkUserCredentials,
  checkSignInMethods,
} from '@/lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  AuthCredential,
} from 'firebase/auth';
import { isSessionValid, getCurrentEpoch } from '@/lib/crypto';
import { toast } from 'sonner';

interface PendingCredential {
  email: string;
  credential: AuthCredential;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  googleAccessToken: string | null;
  googleTokenSavedAt: number | null;
  isGoogleTokenExpired: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'link';
  pendingCredential: PendingCredential | null;
  sessionDaysRemaining: number;
  openAuthModal: (mode?: 'login' | 'signup' | 'link') => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<string | null>;
  connectGoogleWorkspace: () => Promise<string | null>;
  refreshGoogleWorkspaceToken: (isSilent?: boolean) => Promise<string | null>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string, acceptedTerms: boolean) => Promise<void>;
  linkAccounts: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileSettings: (settings: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleTokenSavedAt, setGoogleTokenSavedAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'link'>('login');
  const [pendingCredential, setPendingCredential] = useState<PendingCredential | null>(null);
  const [sessionDaysRemaining, setSessionDaysRemaining] = useState<number>(15);

  // Restore token and saved timestamp from localStorage / sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken =
        localStorage.getItem('fs_google_token') || sessionStorage.getItem('fs_google_token');
      const storedSavedAt = Number(localStorage.getItem('fs_google_token_saved_at') || '0');
      if (storedToken) {
        setGoogleAccessToken(storedToken);
      }
      if (storedSavedAt) {
        setGoogleTokenSavedAt(storedSavedAt);
      }
    }
  }, []);

  const isGoogleTokenExpired = React.useMemo(() => {
    if (!googleAccessToken) return true;
    if (!googleTokenSavedAt) return false;
    // Valid for 55 minutes (3300s) before needing renewal
    return Date.now() - googleTokenSavedAt > 3300 * 1000;
  }, [googleAccessToken, googleTokenSavedAt]);

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingCredential(null);
  };

  // Monitor Auth State & 15-Day Session Validity & Profile Retrieval
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch or create profile from Firestore
        let profile = await getUserProfile(currentUser.uid);
        const now = Date.now();

        if (!profile) {
          const initialToken =
            (typeof window !== 'undefined'
              ? localStorage.getItem('fs_google_token') || sessionStorage.getItem('fs_google_token')
              : null) || undefined;

          profile =
            (await syncUserProfile(currentUser, {
              googleAccessToken: initialToken,
            })) || null;
        } else {
          // Check 15-day session duration
          if (!isSessionValid(profile.sessionStartedAt)) {
            toast.warning('Session Expired (15-Day Limit)', {
              description: 'For your financial security, please re-authenticate to continue.',
            });
            await fbSignOut(auth);
            setUser(null);
            setUserProfile(null);
            setGoogleAccessToken(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('fs_google_token');
              sessionStorage.removeItem('fs_google_token');
            }
            setIsAuthModalOpen(true);
            setIsLoading(false);
            return;
          }

          // Calculate remaining days
          const msPassed = now - profile.sessionStartedAt;
          const daysLeft = Math.max(1, Math.ceil((15 * 86400000 - msPassed) / 86400000));
          setSessionDaysRemaining(daysLeft);

          // Update linked providers if changed safely
          const activeProviders = currentUser.providerData?.map((p) => p.providerId) || [];
          const profileProviders = Array.isArray(profile?.providers) ? profile.providers : [];
          if (activeProviders.length !== profileProviders.length) {
            profile.providers = activeProviders;
            await syncUserProfile(currentUser);
          }

          // Restore Google Access Token & Saved Timestamp from Firestore if available
          if (profile.googleAccessToken) {
            setGoogleAccessToken(profile.googleAccessToken);
            if (profile.googleTokenSavedAt) {
              setGoogleTokenSavedAt(profile.googleTokenSavedAt);
              if (typeof window !== 'undefined') {
                localStorage.setItem('fs_google_token_saved_at', profile.googleTokenSavedAt.toString());
              }
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('fs_google_token', profile.googleAccessToken);
              sessionStorage.setItem('fs_google_token', profile.googleAccessToken);
            }
          }
        }

        setUserProfile(profile);
        if (authModalMode !== 'link') {
          closeAuthModal();
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authModalMode]);

  const openAuthModal = (mode: 'login' | 'signup' | 'link' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Google 1-Click Sign In & Scope Authorization
  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setUser(result.user);
        closeAuthModal();

        // Extract OAuth Access Token from credential
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || null;

        const now = Date.now();
        if (token) {
          setGoogleAccessToken(token);
          setGoogleTokenSavedAt(now);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fs_google_token', token);
            sessionStorage.setItem('fs_google_token', token);
            localStorage.setItem('fs_google_token_saved_at', now.toString());
          }
        }

        // Persist token and profile to Firestore
        const synced = await syncUserProfile(result.user, {
          googleWorkspaceConnected: true,
          googleAccessToken: token || undefined,
          googleTokenSavedAt: now,
        });
        if (synced) setUserProfile(synced);

        toast.success(`Welcome, ${result.user.displayName || 'Member'}!`, {
          description: 'Google Workspace connected with Gmail and Calendar permissions saved.',
        });

        return token;
      }
      return null;
    } catch (err: any) {
      console.error('[Google Sign-In Error]:', err);

      // Handle dual login collision: account exists with email/pass but user clicked Google
      if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email;
        const pendingCred = GoogleAuthProvider.credentialFromError(err);

        if (email && pendingCred) {
          setPendingCredential({ email, credential: pendingCred });
          setAuthModalMode('link');
          setIsAuthModalOpen(true);
          toast.info('Existing Account Detected', {
            description: `An account for ${email} already exists. Please verify your password to merge both sign-in methods.`,
          });
          return null;
        }
      }
      toast.error('Google Sign-In failed', { description: err.message });
      return null;
    }
  };

  // Silent 45-Minute Token Refresher via Cloud Functions
  const refreshGoogleWorkspaceToken = async (isSilent: boolean = false): Promise<string | null> => {
    const rToken =
      userProfile?.googleRefreshToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('fs_google_refresh_token') : null);

    if (rToken) {
      try {
        const cloudFnUrl = 'https://sentrypollhttp-af4rmeacda-uc.a.run.app';
        const res = await fetch(cloudFnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'refresh-token',
            refreshToken: rToken,
            uid: user?.uid,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.accessToken) {
            const now = Date.now();
            setGoogleAccessToken(data.accessToken);
            setGoogleTokenSavedAt(now);
            if (typeof window !== 'undefined') {
              localStorage.setItem('fs_google_token', data.accessToken);
              sessionStorage.setItem('fs_google_token', data.accessToken);
              localStorage.setItem('fs_google_token_saved_at', now.toString());
            }
            if (user) {
              await syncUserProfile(user, {
                googleAccessToken: data.accessToken,
                googleTokenSavedAt: now,
              });
            }
            if (!isSilent) {
              toast.success('Google Workspace Token Refreshed (45-min cycle)');
            }
            return data.accessToken;
          }
        }
      } catch (err) {
        console.warn('[Silent Token Refresh Error]:', err);
      }
    }

    // If silent refresh is not available and non-silent request, re-authenticate via Google popup
    if (!isSilent) {
      return await signInWithGoogle();
    }
    return null;
  };

  // Automated 45-Minute Silent Token Rotation Timer & Tab Focus Watcher
  useEffect(() => {
    if (!user) return;

    const perform45MinRefresh = async () => {
      const savedAt = googleTokenSavedAt || Number(localStorage.getItem('fs_google_token_saved_at') || '0');
      const now = Date.now();
      // Rotate before 45 minutes (2,700,000 ms) so the user never hits the 1-hour expiration
      if (savedAt && now - savedAt >= 45 * 60 * 1000) {
        console.log('[Auth] 45 minutes elapsed, silently refreshing Google Workspace token...');
        await refreshGoogleWorkspaceToken(true);
      }
    };

    perform45MinRefresh();

    const interval = setInterval(perform45MinRefresh, 2 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        perform45MinRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, googleTokenSavedAt, userProfile?.googleRefreshToken]);

  // Explicit helper to connect or refresh Google Workspace OAuth
  const connectGoogleWorkspace = async (): Promise<string | null> => {
    // Try silent refresh first before opening popup
    const silent = await refreshGoogleWorkspaceToken(true);
    if (silent) return silent;
    return await signInWithGoogle();
  };

  // Email & Password Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        setUser(result.user);
        closeAuthModal();
        const synced = await syncUserProfile(result.user, { sessionStartedAt: Date.now() });
        if (synced) setUserProfile(synced);
      }
      toast.success('Signed in successfully');
    } catch (err: any) {
      toast.error('Sign-in failed', { description: err.message });
      throw err;
    }
  };

  // Sign Up with Email + Mandatory Terms & Privacy Policy Check
  const signUpWithEmail = async (name: string, email: string, pass: string, acceptedTerms: boolean) => {
    if (!acceptedTerms) {
      toast.error('Terms Agreement Required', {
        description: 'You must agree to the Terms of Service & Privacy Policy to create an account.',
      });
      return;
    }

    try {
      const methods = await checkSignInMethods(email);
      if (methods.includes('google.com')) {
        toast.info('Google Account Detected', {
          description: `An account for ${email} was created via Google. Please sign in with Google or link credentials.`,
        });
        return;
      }

      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        setUser(result.user);
        closeAuthModal();
        const synced = await syncUserProfile(result.user, {
          displayName: name || email.split('@')[0],
          acceptedTermsAt: new Date().toISOString(),
        });
        if (synced) setUserProfile(synced);
      }
      toast.success(`Account created! Welcome to FiscalSentry.`);
    } catch (err: any) {
      toast.error('Sign-up failed', { description: err.message });
      throw err;
    }
  };

  // Merge & Link existing email-password account with Google credential
  const linkAccounts = async (password: string) => {
    if (!pendingCredential) return;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, pendingCredential.email, password);
      await linkUserCredentials(userCredential.user, pendingCredential.credential);

      const token = (pendingCredential.credential as any)?.accessToken || null;
      if (token) {
        setGoogleAccessToken(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fs_google_token', token);
          sessionStorage.setItem('fs_google_token', token);
        }
      }

      const updatedProfile = await syncUserProfile(userCredential.user, {
        googleWorkspaceConnected: true,
        googleAccessToken: token || undefined,
      });
      if (updatedProfile) setUserProfile(updatedProfile);
      closeAuthModal();

      toast.success('Accounts Merged & Linked!', {
        description: 'You can now sign in with either Google or Email/Password under one single account.',
      });
    } catch (err: any) {
      toast.error('Account linking failed', { description: err.message });
      throw err;
    }
  };

  // Sign Out
  const signOut = async () => {
    const currentUid = user?.uid;
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setGoogleAccessToken(null);
    setGoogleTokenSavedAt(null);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fs_google_token');
        localStorage.removeItem('fs_google_token_saved_at');
        sessionStorage.removeItem('fs_google_token');
        localStorage.removeItem('fs_cached_audits');
        localStorage.removeItem('fs_chat_sessions');
        localStorage.removeItem('fs_chat_messages_map');
        localStorage.removeItem('fs_active_session_id');
        localStorage.removeItem('fs_has_initial_synced');
        localStorage.removeItem('fs_last_poll_timestamp');
        localStorage.removeItem('fs_voidy_rate_limit_v5h');

        // Dispatch logout event across the app so in-memory state is wiped immediately
        window.dispatchEvent(new Event('fs:auth:logout'));
      } catch (_) {}
    }
    toast.info('Signed out of FiscalSentry', {
      description: 'Your session has been securely ended.',
    });
  };

  // Update Profile Settings in Firestore & LocalStorage
  const updateProfileSettings = async (settings: Partial<UserProfile>) => {
    if (settings.preferredModel && typeof window !== 'undefined') {
      localStorage.setItem('fs_preferred_model', settings.preferredModel);
    }
    if (!user) {
      setUserProfile((prev) => (prev ? { ...prev, ...settings } : ({ preferredModel: settings.preferredModel } as any)));
      toast.success('Settings updated');
      return;
    }
    const updated = await syncUserProfile(user, settings);
    if (updated) setUserProfile(updated);
    toast.success('Settings updated successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        googleAccessToken,
        googleTokenSavedAt,
        isGoogleTokenExpired,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        pendingCredential,
        sessionDaysRemaining,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        connectGoogleWorkspace,
        refreshGoogleWorkspaceToken,
        signInWithEmail,
        signUpWithEmail,
        linkAccounts,
        signOut,
        updateProfileSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
