export const AUTH_CONSTANTS = {
  // ── Token lifetimes ────────────────────────────────────────────────────────
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  ACCESS_TOKEN_EXPIRES_MS: 15 * 60 * 1000,           

  REFRESH_TOKEN_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_MS: 7 * 24 * 60 * 60 * 1000,

  EMAIL_VERIFICATION_EXPIRES_MS: 24 * 60 * 60 * 1000, 
  PASSWORD_RESET_EXPIRES_MS: 60 * 60 * 1000,         

  // ── Brute-force / account locking ─────────────────────────────────────────
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION_MS: 30 * 60 * 1000,  
  MAX_PASSWORD_RESET_ATTEMPTS: 3,

  // ── Rate limiting (requests per window) ───────────────────────────────────
  RATE_LIMIT_LOGIN_TTL: 60,        
  RATE_LIMIT_LOGIN_LIMIT: 10,

  RATE_LIMIT_REGISTER_TTL: 3600, 
  RATE_LIMIT_REGISTER_LIMIT: 5,

  RATE_LIMIT_FORGOT_PASSWORD_TTL: 3600,
  RATE_LIMIT_FORGOT_PASSWORD_LIMIT: 3,

  RATE_LIMIT_RESEND_VERIFICATION_TTL: 3600,
  RATE_LIMIT_RESEND_VERIFICATION_LIMIT: 3,

  // ── Redis key prefixes ────────────────────────────────────────────────────
  REDIS_PREFIX: {
    BLACKLISTED_TOKEN:   'kira:auth:blacklist:',     
    REFRESH_TOKEN:       'kira:auth:refresh:',       
    SESSION:             'kira:auth:session:',        
    USER_SESSIONS:       'kira:auth:user-sessions:', 
    RATE_LIMIT:          'kira:auth:rate-limit:',     
    FAILED_LOGINS:       'kira:auth:failed-logins:',  
    EMAIL_VERIFY:        'kira:auth:email-verify:',   
    PASSWORD_RESET:      'kira:auth:pw-reset:',      
    TOTP_PENDING:        'kira:auth:totp-pending:',  
  } as const,

  // ── Token byte lengths ────────────────────────────────────────────────────
  VERIFICATION_TOKEN_BYTES: 32,
  PASSWORD_RESET_TOKEN_BYTES: 32,
  REFRESH_TOKEN_BYTES: 48,

  // ── Argon2 hashing config ─────────────────────────────────────────────────
  ARGON2_OPTIONS: {
    memoryCost: 65536,   
    timeCost: 3,
    parallelism: 4,
  },

  // ── JWT algo ──────────────────────────────────────────────────────────────
  JWT_ALGORITHM: 'RS256' as const,

  // ── Password policy (mirror in DTO validators) ────────────────────────────
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // ── 2FA ───────────────────────────────────────────────────────────────────
  TOTP_WINDOW: 1,          
  TOTP_STEP: 30,    
  TOTP_DIGITS: 6,
  TOTP_PENDING_TTL_S: 300, 

  // ── Session ───────────────────────────────────────────────────────────────
  MAX_SESSIONS_PER_USER: 10,

  // ── Cookie names ─────────────────────────────────────────────────────────
  COOKIE_REFRESH_TOKEN: 'kira_refresh_token',
  COOKIE_ACCESS_TOKEN:  'kira_access_token',

  // ── Audit actions ─────────────────────────────────────────────────────────
  AUDIT_ACTION: {
    REGISTER:                'AUTH:REGISTER',
    LOGIN:                   'AUTH:LOGIN',
    LOGIN_FAILED:            'AUTH:LOGIN_FAILED',
    LOGOUT:                  'AUTH:LOGOUT',
    TOKEN_REFRESHED:         'AUTH:TOKEN_REFRESHED',
    PASSWORD_CHANGE:         'AUTH:PASSWORD_CHANGE',
    PASSWORD_RESET_REQUEST:  'AUTH:PASSWORD_RESET_REQUEST',
    PASSWORD_RESET:          'AUTH:PASSWORD_RESET',
    EMAIL_VERIFIED:          'AUTH:EMAIL_VERIFIED',
    ACCOUNT_LOCKED:          'AUTH:ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED:        'AUTH:ACCOUNT_UNLOCKED',
    SESSION_REVOKED:         'AUTH:SESSION_REVOKED',
    TWO_FA_ENABLED:          'AUTH:2FA_ENABLED',
    TWO_FA_DISABLED:         'AUTH:2FA_DISABLED',
    SUSPICIOUS_LOGIN:        'AUTH:SUSPICIOUS_LOGIN',
  } as const,
} as const;

// Export individual groups for convenience
export const REDIS_KEYS  = AUTH_CONSTANTS.REDIS_PREFIX;
export const AUDIT_ACTIONS = AUTH_CONSTANTS.AUDIT_ACTION;
export const ARGON2_OPTIONS = AUTH_CONSTANTS.ARGON2_OPTIONS;