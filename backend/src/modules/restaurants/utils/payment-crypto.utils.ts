import * as crypto from 'crypto';
 
const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12; // bytes — GCM recommended
 
/**
 * Encrypts a payment account number using AES-256-GCM.
 * The key must be a 32-byte hex string from env (PAYMENT_ENCRYPTION_KEY).
 *
 * Returns a colon-delimited string:  iv:authTag:ciphertext (all hex)
 */
export function encryptAccountNumber(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv  = crypto.randomBytes(IV_LENGTH);
 
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
 
  return [iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':');
}
 
/**
 * Decrypts a stored payment account number.
 * Only called inside the service when processing a payment — never in list responses.
 */
export function decryptAccountNumber(stored: string, keyHex: string): string {
  const [ivHex, tagHex, ctHex] = stored.split(':');
  const key     = Buffer.from(keyHex, 'hex');
  const iv      = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const ct      = Buffer.from(ctHex, 'hex');
 
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);
 
  return decipher.update(ct).toString('utf8') + decipher.final('utf8');
}
 
/**
 * Returns SHA-256 hex hash of an account number for uniqueness checks.
 * Stored alongside the encrypted value so we can detect duplicates
 * without ever decrypting all rows.
 */
export function hashAccountNumber(number: string): string {
  return crypto.createHash('sha256').update(number).digest('hex');
}
 
/**
 * Masks a phone number — returns last 3 digits only: "****001"
 */
export function maskAccountNumber(number: string): string {
  return `****${number.slice(-3)}`;
}