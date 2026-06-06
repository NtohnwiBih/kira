export const CART_CONSTANTS = {
  MAX_ITEMS_PER_CART:     50,
  MAX_QUANTITY_PER_ITEM:  20,
  CART_EXPIRY_HOURS:      24,
 
  REDIS_KEY: {
    CART:        (userId: string)  => `kira:cart:${userId}`,
    CART_LOCK:   (userId: string)  => `kira:cart:lock:${userId}`,
    CART_TTL:    86_400,            
  },
 
  AUDIT_ACTION: {
    ITEM_ADDED:   'CART:ITEM_ADDED',
    ITEM_UPDATED: 'CART:ITEM_UPDATED',
    ITEM_REMOVED: 'CART:ITEM_REMOVED',
    CART_CLEARED: 'CART:CLEARED',
  } as const,
} as const;