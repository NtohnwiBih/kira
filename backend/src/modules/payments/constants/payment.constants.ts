export const PAYMENT_CONSTANTS = {
  MAX_RETRY_ATTEMPTS:       3,
  POLL_INTERVAL_MS:         5_000,
  PAYMENT_TIMEOUT_MINS:     10,
  MOMO_API_VERSION:         'v1_0',
  MOMO_BASE_URL_SANDBOX:    'https://sandbox.momodeveloper.mtn.com',
  MOMO_BASE_URL_PROD:       'https://momodeveloper.mtn.com',
  OM_BASE_URL_SANDBOX:      'https://api.orange.com/orange-money-webpay/dev/v1',
  OM_BASE_URL_PROD:         'https://api.orange.com/orange-money-webpay/cm/v1',
  IDEMPOTENCY_KEY_PREFIX:   'kira:payment:idem:',
  RETRY_BACKOFF_MS:         [0, 10_000, 30_000], 
};