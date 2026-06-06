export const RESTAURANT_CONSTANTS = {

  // ── Slug ────────────────────────────────────────────────────────────────
  SLUG_MAX_RETRIES:          5,    

  // ── Prep time ────────────────────────────────────────────────────────────
  PREP_TIME_MIN_MINUTES:     5,
  PREP_TIME_MAX_MINUTES:     120,
  PREP_TIME_DEFAULT_MINUTES: 20,

  // ── Pricing ──────────────────────────────────────────────────────────────
  ITEM_PRICE_MIN:            0,
  ITEM_PRICE_MAX:            500_000, 
  DELIVERY_RADIUS_MAX_KM:    50,
  MIN_ORDER_AMOUNT_MAX:      100_000,

  // ── Staff ─────────────────────────────────────────────────────────────────
  MAX_MANAGERS_PER_RESTAURANT: 20,
  INVITE_TOKEN_EXPIRES_HOURS:  48,

  // ── Menu ─────────────────────────────────────────────────────────────────
  MAX_MENUS_PER_RESTAURANT:     10,
  MAX_CATEGORIES_PER_MENU:      30,
  MAX_ITEMS_PER_CATEGORY:       100,
  MAX_CUSTOMIZATION_GROUPS:     10,
  MAX_CUSTOMIZATION_OPTIONS:    20,

  // ── Stock ─────────────────────────────────────────────────────────────────
  STOCK_LOW_THRESHOLD:          5,

  // ── Auto-pause ────────────────────────────────────────────────────────────
  BUSY_MODE_DEFAULT_MINUTES:    30,
  PAUSE_MAX_HOURS:              24,

  // ── Rate limiting ─────────────────────────────────────────────────────────
  RATE_LIMIT_CREATE_TTL:   3600,
  RATE_LIMIT_CREATE_LIMIT: 5,
  RATE_LIMIT_UPDATE_TTL:   60,
  RATE_LIMIT_UPDATE_LIMIT: 30,

  // ── Redis key prefixes ────────────────────────────────────────────────────
  REDIS_PREFIX: {
    RESTAURANT_STATUS:   'kira:restaurant:status:',  
    MENU_CACHE:          'kira:restaurant:menu:',     
    AVAILABILITY_LOCK:   'kira:restaurant:avail-lock:',
    MANAGER_INVITE:      'kira:restaurant:invite:',    
    PREP_TIME_OVERRIDE:  'kira:restaurant:prep:',     
  } as const,

  // ── Onboarding steps ──────────────────────────────────────────────────────
  ONBOARDING_STEPS: {
    PROFILE:         0,  
    CONTACT:         1,  
    LOCATION:        2,  
    OPENING_HOURS:   3,  
    MENU:            4,  
    PAYMENT:         5,  
  } as const,

  ONBOARDING_TOTAL_STEPS: 6,

  // ── Audit actions ─────────────────────────────────────────────────────────
  AUDIT_ACTION: {
    RESTAURANT_CREATED:       'RESTAURANT:CREATED',
    RESTAURANT_UPDATED:       'RESTAURANT:UPDATED',
    RESTAURANT_VERIFIED:      'RESTAURANT:VERIFIED',
    RESTAURANT_SUSPENDED:     'RESTAURANT:SUSPENDED',
    MANAGER_INVITED:          'RESTAURANT:MANAGER_INVITED',
    MANAGER_ACTIVATED:        'RESTAURANT:MANAGER_ACTIVATED',
    MANAGER_SUSPENDED:        'RESTAURANT:MANAGER_SUSPENDED',
    PAYMENT_METHOD_ADDED:     'RESTAURANT:PAYMENT_ADDED',
    PAYMENT_METHOD_REMOVED:   'RESTAURANT:PAYMENT_REMOVED',
    MENU_CREATED:             'RESTAURANT:MENU_CREATED',
    MENU_ITEM_CREATED:        'RESTAURANT:ITEM_CREATED',
    MENU_ITEM_UPDATED:        'RESTAURANT:ITEM_UPDATED',
    AVAILABILITY_CHANGED:     'RESTAURANT:AVAILABILITY_CHANGED',
    HOURS_UPDATED:            'RESTAURANT:HOURS_UPDATED',
  } as const,

  // ── Supported cuisine types ───────────────────────────────────────────────
  CUISINE_TYPES: [
    'african', 'cameroonian', 'fast-food', 'pizza', 'burgers',
    'chicken', 'seafood', 'vegetarian', 'vegan', 'desserts',
    'beverages', 'breakfast', 'asian', 'french', 'italian',
  ] as const,

  // ── Payment providers display names ───────────────────────────────────────
  PAYMENT_PROVIDER_NAMES: {
    MOMO: 'MTN Mobile Money',
    OM:   'Orange Money',
  } as const,

} as const;

export const REDIS_RESTAURANT_KEYS = RESTAURANT_CONSTANTS.REDIS_PREFIX;
export const RESTAURANT_AUDIT      = RESTAURANT_CONSTANTS.AUDIT_ACTION;
export const ONBOARDING_STEP       = RESTAURANT_CONSTANTS.ONBOARDING_STEPS;