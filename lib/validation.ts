/**
 * Input validation and sanitization utilities for auth forms.
 */

/** Strip HTML tags from a string. */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/** Sanitize a display name: strip HTML, trim, limit length. */
export function sanitizeName(name: string): string {
  return stripHtml(name).trim().slice(0, 100);
}

/**
 * Check if a string looks like random gibberish.
 * Returns true if the name is suspicious (e.g., all consonants, no vowels, 20+ chars).
 */
function looksRandom(name: string): boolean {
  const letters = name.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 20) return false;
  const vowels = letters.replace(/[^aeiouAEIOU]/g, '').length;
  const vowelRatio = vowels / letters.length;
  // Natural language has ~35-40% vowels; pure consonant spam has near 0%
  return vowelRatio < 0.1;
}

/** Validate a display name. Returns an error message or null. */
export function validateName(name: string): string | null {
  const cleaned = sanitizeName(name);
  if (!cleaned) return 'Name is required.';
  if (cleaned.length < 2) return 'Name must be at least 2 characters.';
  if (cleaned.length > 100) return 'Name must be 100 characters or fewer.';
  if (looksRandom(cleaned)) return 'Please enter a valid name.';
  return null;
}

/** Validate an email address. Returns an error message or null. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
  if (trimmed.length > 254) return 'Email address is too long.';
  return null;
}

/** Validate a password. Returns an error message or null. */
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

/**
 * Map Appwrite error codes/messages to user-friendly strings.
 * Prevents raw backend errors from leaking to the UI.
 */
export function mapAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  // Rate limiting
  if (lower.includes('too many') || lower.includes('rate limit') || lower.includes('429')) {
    return 'Too many attempts. Please wait a few minutes.';
  }

  // Invalid credentials
  if (
    lower.includes('invalid credentials') ||
    lower.includes('user_invalid_credentials') ||
    lower.includes('unauthorized') ||
    lower.includes('user_not_found')
  ) {
    return 'Incorrect email or password. Please check your credentials or sign up.';
  }

  // Already exists
  if (lower.includes('already exists') || lower.includes('user_already_exists')) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  // Blocked
  if (lower.includes('blocked') || lower.includes('user_blocked')) {
    return 'This account has been blocked. Contact support@smashingwallets.com.';
  }

  // Password too short (Appwrite side)
  if (lower.includes('password') && lower.includes('short')) {
    return 'Password must be at least 8 characters.';
  }

  // Network / connection errors
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch') || lower.includes('econnrefused')) {
    return 'Unable to connect. Check your internet connection.';
  }

  // Generic fallback — never expose raw error
  return 'Something went wrong. Please try again.';
}

/**
 * Simple client-side rate limiter.
 * Tracks failed attempts and returns remaining lockout time.
 */
const attempts: Record<string, { count: number; lockedUntil: number }> = {};

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000; // 30 seconds

export function checkRateLimit(key: string): { blocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const entry = attempts[key];

  if (!entry) {
    return { blocked: false, remainingSeconds: 0 };
  }

  if (entry.lockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  // Reset if lockout expired
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    delete attempts[key];
  }

  return { blocked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  if (!attempts[key]) {
    attempts[key] = { count: 0, lockedUntil: 0 };
  }

  attempts[key].count += 1;

  if (attempts[key].count >= MAX_ATTEMPTS) {
    attempts[key].lockedUntil = now + LOCKOUT_MS;
    attempts[key].count = 0;
  }
}

export function resetRateLimit(key: string): void {
  delete attempts[key];
}
