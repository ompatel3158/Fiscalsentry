/**
 * AES-256-GCM 14-Day Rotating Key Cryptography Service
 * Provides client-side and cloud-storage encryption for sensitive financial identifiers,
 * line items, account numbers, and personal data.
 */

const EPOCH_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
const SESSION_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  epoch: number; // 14-day epoch number
  version: string;
}

export interface EpochInfo {
  currentEpoch: number;
  epochStartDate: string;
  epochEndDate: string;
  daysRemaining: number;
}

/**
 * Calculates current 14-day encryption epoch
 */
export function getCurrentEpoch(): number {
  return Math.floor(Date.now() / EPOCH_DURATION_MS);
}

/**
 * Returns epoch details and rotation timeline
 */
export function getEpochInfo(epoch: number = getCurrentEpoch()): EpochInfo {
  const startMs = epoch * EPOCH_DURATION_MS;
  const endMs = startMs + EPOCH_DURATION_MS;
  const now = Date.now();
  const msRemaining = Math.max(0, endMs - now);
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return {
    currentEpoch: epoch,
    epochStartDate: new Date(startMs).toLocaleDateString(),
    epochEndDate: new Date(endMs).toLocaleDateString(),
    daysRemaining,
  };
}

/**
 * Helper to convert Uint8Array to base64
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to convert base64 to Uint8Array with explicit ArrayBuffer
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(len);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a CryptoKey from a user secret + epoch index using PBKDF2 & SHA-256
 */
async function deriveEpochKey(userSecret: string, epoch: number): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKeyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = encoder.encode(`FiscalSentry_Epoch_${epoch}_Salt`);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an object or string with AES-256-GCM using current 14-day epoch key
 */
export async function encryptSensitiveData(
  data: any,
  userSecret: string,
  targetEpoch: number = getCurrentEpoch()
): Promise<EncryptedPayload> {
  if (!userSecret) {
    userSecret = 'FiscalSentry_Default_Secure_Vault_Secret_2026';
  }

  const key = await deriveEpochKey(userSecret, targetEpoch);
  const ivBuffer = new ArrayBuffer(12);
  const iv = new Uint8Array(ivBuffer);
  crypto.getRandomValues(iv);

  const encodedText = new TextEncoder().encode(
    typeof data === 'string' ? data : JSON.stringify(data)
  );

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedText
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    iv: uint8ArrayToBase64(iv),
    epoch: targetEpoch,
    version: 'aes-256-gcm-v1',
  };
}

/**
 * Decrypts an EncryptedPayload using the corresponding 14-day epoch key
 */
export async function decryptSensitiveData<T = any>(
  payload: EncryptedPayload,
  userSecret: string
): Promise<T> {
  if (!userSecret) {
    userSecret = 'FiscalSentry_Default_Secure_Vault_Secret_2026';
  }

  const key = await deriveEpochKey(userSecret, payload.epoch);
  const iv = base64ToUint8Array(payload.iv);
  const ciphertextBytes = base64ToUint8Array(payload.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertextBytes as BufferSource
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);

  try {
    return JSON.parse(decryptedText) as T;
  } catch {
    return decryptedText as unknown as T;
  }
}

/**
 * Validates whether user session is within the 15-day maximum lifetime
 */
export function isSessionValid(sessionLoginTime: number): boolean {
  if (!sessionLoginTime) return false;
  return Date.now() - sessionLoginTime < SESSION_DURATION_MS;
}
