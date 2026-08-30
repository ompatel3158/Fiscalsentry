import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  deleteDoc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  signOut as firebaseSignOut,
  User,
  AuthCredential,
} from 'firebase/auth';
import { AuditResult, ChatMessage, ChatSession } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD4N8l5nd6NmMfybZoQXAZq8vB7U2sCt8k',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fiscalsentry-void.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fiscalsentry-void',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fiscalsentry-void.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '754067659868',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:754067659868:web:0e41c6f631c2f9e3b21a99',
};

// Initialize Firebase singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleProvider.setCustomParameters({ prompt: 'select_account', access_type: 'offline' });

/**
 * User Profile in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  providers: string[]; // ['password', 'google.com']
  acceptedTermsAt: string;
  sessionStartedAt: number; // timestamp for 15-day expiration
  activeEncryptionEpoch: number; // 14-day epoch
  preferredModel: 'gemini-3.1-flash-lite' | 'gemini-3.5-flash-lite' | 'gemini-3.6-flash' | string;
  webhookUrls?: {
    erp?: string;
    slack?: string;
    discord?: string;
  };
  googleWorkspaceConnected?: boolean;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenSavedAt?: number;
  lastSyncedTimestamp?: number;
  auditedEmailIds?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates or updates user profile in Firestore
 */
export async function syncUserProfile(user: User, additionalData: Partial<UserProfile> = {}) {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const providers = user.providerData.map((p) => p.providerId);

    if (!userSnap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        providers,
        acceptedTermsAt: new Date().toISOString(),
        sessionStartedAt: Date.now(),
        activeEncryptionEpoch: Math.floor(Date.now() / (14 * 86400000)),
        preferredModel: 'gemini-3.1-flash-lite',
        googleWorkspaceConnected: providers.includes('google.com') || Boolean(additionalData.googleAccessToken),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData,
      };
      await setDoc(userRef, newProfile, { merge: true });
      return newProfile;
    } else {
      const existing = userSnap.data() as UserProfile;
      const updatedProviders = Array.from(new Set([...(existing.providers || []), ...providers]));
      const updates = {
        ...existing,
        providers: updatedProviders,
        updatedAt: new Date().toISOString(),
        googleWorkspaceConnected:
          updatedProviders.includes('google.com') ||
          existing.googleWorkspaceConnected ||
          Boolean(additionalData.googleAccessToken),
        ...additionalData,
      };
      await setDoc(userRef, updates, { merge: true });
      return updates;
    }
  } catch (err) {
    console.error('[Firebase] syncUserProfile error:', err);
    return null;
  }
}

/**
 * Retrieves user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('[Firebase] getUserProfile error:', err);
    return null;
  }
}

/**
 * Saves an audited financial document to user's private Firestore collection
 */
export async function saveUserAuditToFirestore(userId: string, audit: AuditResult): Promise<void> {
  try {
    const auditRef = doc(db, 'users', userId, 'audits', audit.id);
    await setDoc(auditRef, {
      ...audit,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('[Firebase] saveUserAudit error:', err);
  }
}

/**
 * Retrieves all audits for a user from Firestore
 */
export async function getUserAuditsFromFirestore(userId: string): Promise<AuditResult[]> {
  try {
    const auditsRef = collection(db, 'users', userId, 'audits');
    const snap = await getDocs(auditsRef);
    const audits: AuditResult[] = [];
    snap.forEach((doc) => {
      audits.push(doc.data() as AuditResult);
    });
    return audits;
  } catch (err) {
    console.error('[Firebase] getUserAudits error:', err);
    return [];
  }
}

/**
 * Checks sign-in methods for an email to handle collisions
 */
export async function checkSignInMethods(email: string): Promise<string[]> {
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch {
    return [];
  }
}

/**
 * Links a pending credential with the current signed-in user account
 */
export async function linkUserCredentials(currentUser: User, credential: AuthCredential) {
  return await linkWithCredential(currentUser, credential);
}

/**
 * Saves a chat session and its messages to Firestore
 */
export async function saveChatSessionToFirestore(
  userId: string,
  session: ChatSession,
  messages: ChatMessage[]
): Promise<void> {
  try {
    const sessionRef = doc(db, 'users', userId, 'chat_sessions', session.id);
    await setDoc(sessionRef, {
      ...session,
      messages: messages || [],
      syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('[Firebase] saveChatSession error:', err);
  }
}

/**
 * Retrieves all chat sessions and messages for a user from Firestore
 */
export async function getUserChatSessionsFromFirestore(
  userId: string
): Promise<{ sessions: ChatSession[]; messagesMap: Record<string, ChatMessage[]> }> {
  try {
    const sessionsRef = collection(db, 'users', userId, 'chat_sessions');
    const snap = await getDocs(sessionsRef);
    const sessions: ChatSession[] = [];
    const messagesMap: Record<string, ChatMessage[]> = {};

    snap.forEach((doc) => {
      const data = doc.data();
      const { messages, ...sessionData } = data;
      sessions.push(sessionData as ChatSession);
      messagesMap[doc.id] = (messages as ChatMessage[]) || [];
    });

    return { sessions, messagesMap };
  } catch (err) {
    console.error('[Firebase] getUserChatSessions error:', err);
    return { sessions: [], messagesMap: {} };
  }
}

/**
 * Deletes a chat session from Firestore
 */
export async function deleteChatSessionFromFirestore(
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    const sessionRef = doc(db, 'users', userId, 'chat_sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (err) {
    console.error('[Firebase] deleteChatSession error:', err);
  }
}

/**
 * Uploads a document to Firebase Cloud Storage
 */
export async function uploadDocumentToStorage(userId: string, file: Blob | Uint8Array, fileName: string): Promise<string> {
  try {
    const storageRef = ref(storage, `users/${userId}/documents/${Date.now()}_${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('[Firebase Storage] Upload failed:', error);
    return '';
  }
}

