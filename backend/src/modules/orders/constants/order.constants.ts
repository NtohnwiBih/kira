export const ORDER_CONSTANTS = {
  NUMBER_PREFIX:             'KIRA',
  CANCELLATION_WINDOW_SECS:  120,  

  ALLOWED_TRANSITIONS: {
    PENDING:          ['CONFIRMED', 'CANCELLED'],
    CONFIRMED:        ['PREPARING', 'CANCELLED'],
    PREPARING:        ['READY_FOR_PICKUP', 'CANCELLED'],
    READY_FOR_PICKUP: ['PICKED_UP'],
    PICKED_UP:        ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED:        ['REFUNDED'],
    CANCELLED:        [],
    REFUNDED:         [],
  } as Record<string, string[]>,

  REDIS_KEY: {
    ORDER_CACHE: (id: string) => `kira:order:${id}`,
    ORDER_LOCK:  (id: string) => `kira:order:lock:${id}`,
    CACHE_TTL:   60,
  },

  AUDIT_ACTION: {
    ORDER_CREATED:   'ORDER:CREATED',
    ORDER_CONFIRMED: 'ORDER:CONFIRMED',
    ORDER_PREPARING: 'ORDER:PREPARING',
    ORDER_READY:     'ORDER:READY',
    ORDER_PICKED_UP: 'ORDER:PICKED_UP',
    ORDER_DELIVERED: 'ORDER:DELIVERED',
    ORDER_CANCELLED: 'ORDER:CANCELLED',
    ORDER_REFUNDED:  'ORDER:REFUNDED',
  } as const,
} as const;