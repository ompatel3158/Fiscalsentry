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
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'link';
  pendingCredential: PendingCredential | null;
  sessionDaysRemaining: number;
  openAuthModal: (mode?: 'login' | 'signup' | 'link') => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<string | null>;
  connectGoogleWorkspace: () => Promise<string | null>;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'link'>('login');
  const [pendingCredential, setPendingCredential] = useState<PendingCredential | null>(null);
  const [sessionDaysRemaining, setSessionDaysRemaining] = useState<number>(15);

  // Restore token from localStorage / sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken =
        localStorage.getItem('fs_google_token') || sessionStorage.getItem('fs_google_token');
      if (storedToken) {
        setGoogleAccessToken(storedToken);
      }
    }
  }, []);

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

          // Update linked providers if changed
          const activeProviders = currentUser.providerData.map((p) => p.providerId);
          if (activeProviders.length !== profile.providers.length) {
            profile.providers = activeProviders;
            await syncUserProfile(currentUser);
          }

          // Restore Google Access Token from Firestore if available
          if (profile.googleAccessToken) {
            setGoogleAccessToken(profile.googleAccessToken);
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

        if (token) {
          setGoogleAccessToken(token);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fs_google_token', token);
            sessionStorage.setItem('fs_google_token', token);
          }
        }

        // Persist token and profile to Firestore
        const synced = await syncUserProfile(result.user, {
          googleWorkspaceConnected: true,
          googleAccessToken: token || undefined,
          googleTokenSavedAt: Date.now(),
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

  // Explicit helper to connect or refresh Google Workspace OAuth
  const connectGoogleWorkspace = async (): Promise<string | null> => {
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
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setGoogleAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fs_google_token');
      sessionStorage.removeItem('fs_google_token');
    }
    toast.info('Signed out of FiscalSentry');
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
        isLoading,
        isAuthModalOpen,
        authModalMode,
        pendingCredential,
        sessionDaysRemaining,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        connectGoogleWorkspace,
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
