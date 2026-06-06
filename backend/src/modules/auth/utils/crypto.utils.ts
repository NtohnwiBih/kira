import * as crypto from 'crypto';

/**
 * Generates a cryptographically secure random token and returns:
 * - raw    : hex string (sent to the client / stored in cookie)
 * - hash   : SHA-256 hex digest (stored in the database)
 *
 * Storing only the hash means a database breach doesn't expose usable tokens.
 */
export function generateSecureToken(byteLength = 32): {
  raw: string;
  hash: string;
} {
  const raw  = crypto.randomBytes(byteLength).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Derives the SHA-256 hex digest of an arbitrary string token.
 * Used when looking up a token received from the client against the DB hash.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Timing-safe comparison — prevents timing attacks when comparing tokens.
 * Both inputs are first hashed to equalize lengths before the fixed-time
 * comparison.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  try {
    return crypto.timingSafeEqual(hashA, hashB);
  } catch {
    return false;
  }
}

/**
 * Generates a secure random UUID-like device fingerprint for clients
 * that don't supply their own device ID.
 */
export function generateDeviceId(): string {
  return crypto.randomUUID();
}

/**
 * Generates a cryptographically secure random UUID.
 */
export function generateJti(): string {
  return crypto.randomUUID();
}