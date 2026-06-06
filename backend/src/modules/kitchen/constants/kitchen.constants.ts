export const KITCHEN_CONSTANTS = {
  // Order statuses the kitchen dashboard cares about
  ACTIVE_STATUSES: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as const,

  // How long a restaurant has to accept an order before it auto-rejects (seconds)
  AUTO_REJECT_TIMEOUT_SECS: 300,

  // Redis keys
  REDIS_KEY: {
    KITCHEN_ORDERS:  (restaurantId: string) => `kira:kitchen:orders:${restaurantId}`,
    ORDER_LOCK:      (orderId: string)       => `kira:kitchen:lock:${orderId}`,
    WORKLOAD:        (restaurantId: string)  => `kira:kitchen:workload:${restaurantId}`,
    AVG_PREP_TIME:   (restaurantId: string)  => `kira:kitchen:avg-prep:${restaurantId}`,
  },

  // Prep time bounds (minutes)
  PREP_TIME_MIN: 1,
  PREP_TIME_MAX: 120,

  // Audit actions
  AUDIT_ACTION: {
    ORDER_PREPARING:       'KITCHEN:ORDER_PREPARING',
    ORDER_READY:           'KITCHEN:ORDER_READY',
    PREP_TIME_UPDATED:     'KITCHEN:PREP_TIME_UPDATED',
    STATUS_CHANGED:        'KITCHEN:STATUS_CHANGED',
  } as const,
} as const;