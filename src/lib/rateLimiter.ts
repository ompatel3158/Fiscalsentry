export interface VoidyRateLimit {
  maxRequests: number;
  usedRequests: number;
  remainingRequests: number;
  windowStartMs: number;
  windowDurationMs: number;
  resetAtMs: number;
  isRateLimited: boolean;
  maxCharsPerMessage: number;
}

const STORAGE_KEY = 'fs_voidy_rate_limit_v2';
const DEFAULT_MAX_REQUESTS = 25; // 25 queries per 1-hour window
const WINDOW_DURATION_MS = 60 * 60 * 1000; // 1 Hour (3,600,000 ms)
const MAX_CHARS_PER_MESSAGE = 4000;

export function getVoidyRateLimitState(): VoidyRateLimit {
  if (typeof window === 'undefined') {
    return {
      maxRequests: DEFAULT_MAX_REQUESTS,
      usedRequests: 0,
      remainingRequests: DEFAULT_MAX_REQUESTS,
      windowStartMs: Date.now(),
      windowDurationMs: WINDOW_DURATION_MS,
      resetAtMs: Date.now() + WINDOW_DURATION_MS,
      isRateLimited: false,
      maxCharsPerMessage: MAX_CHARS_PER_MESSAGE,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (raw) {
      const parsed = JSON.parse(raw);
      // Check if current window has expired
      if (now - parsed.windowStartMs < parsed.windowDurationMs) {
        const remaining = Math.max(0, parsed.maxRequests - parsed.usedRequests);
        return {
          maxRequests: parsed.maxRequests || DEFAULT_MAX_REQUESTS,
          usedRequests: parsed.usedRequests || 0,
          remainingRequests: remaining,
          windowStartMs: parsed.windowStartMs,
          windowDurationMs: parsed.windowDurationMs || WINDOW_DURATION_MS,
          resetAtMs: parsed.windowStartMs + (parsed.windowDurationMs || WINDOW_DURATION_MS),
          isRateLimited: remaining <= 0,
          maxCharsPerMessage: MAX_CHARS_PER_MESSAGE,
        };
      }
    }
  } catch (_) {}

  // Initialize brand new rate limit window
  const now = Date.now();
  const newState: VoidyRateLimit = {
    maxRequests: DEFAULT_MAX_REQUESTS,
    usedRequests: 0,
    remainingRequests: DEFAULT_MAX_REQUESTS,
    windowStartMs: now,
    windowDurationMs: WINDOW_DURATION_MS,
    resetAtMs: now + WINDOW_DURATION_MS,
    isRateLimited: false,
    maxCharsPerMessage: MAX_CHARS_PER_MESSAGE,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (_) {}

  return newState;
}

export function consumeVoidyRequest(): { allowed: boolean; state: VoidyRateLimit; message?: string } {
  const current = getVoidyRateLimitState();
  const now = Date.now();

  if (current.isRateLimited) {
    const remainingMs = Math.max(0, current.resetAtMs - now);
    const formatted = formatCooldown(remainingMs);
    return {
      allowed: false,
      state: current,
      message: `Voidy AI rate limit reached (${current.maxRequests}/${current.maxRequests} hourly queries used). Cooldown resets in ${formatted}.`,
    };
  }

  const updatedUsed = current.usedRequests + 1;
  const updatedRemaining = Math.max(0, current.maxRequests - updatedUsed);
  const updatedState: VoidyRateLimit = {
    ...current,
    usedRequests: updatedUsed,
    remainingRequests: updatedRemaining,
    isRateLimited: updatedRemaining <= 0,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  } catch (_) {}

  return {
    allowed: true,
    state: updatedState,
  };
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
