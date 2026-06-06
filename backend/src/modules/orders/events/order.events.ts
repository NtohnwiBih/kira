export class OrderCreatedEvent {
  static readonly EVENT = 'order.created';
  constructor(
    public readonly orderId:      string,
    public readonly userId:       string,
    public readonly restaurantId: string,
    public readonly orderNumber:  string,
    public readonly total:        number,
  ) {}
}

export class OrderConfirmedEvent {
  static readonly EVENT = 'order.confirmed';
  constructor(
    public readonly orderId:          string,
    public readonly userId:           string,
    public readonly restaurantId:     string,
    public readonly estimatedPrepTime: number,
  ) {}
}

export class OrderPreparingEvent {
  static readonly EVENT = 'order.preparing';
  constructor(
    public readonly orderId:      string,
    public readonly restaurantId: string,
  ) {}
}

export class OrderReadyEvent {
  static readonly EVENT = 'order.ready';
  constructor(
    public readonly orderId:      string,
    public readonly restaurantId: string,
    public readonly userId:       string,
  ) {}
}

export class OrderPickedUpEvent {
  static readonly EVENT = 'order.picked_up';
  constructor(
    public readonly orderId:  string,
    public readonly driverId: string,
    public readonly userId:   string,
  ) {}
}

export class OrderDeliveredEvent {
  static readonly EVENT = 'order.delivered';
  constructor(
    public readonly orderId:  string,
    public readonly userId:   string,
    public readonly driverId: string,
  ) {}
}

export class OrderCancelledEvent {
  static readonly EVENT = 'order.cancelled';
  constructor(
    public readonly orderId:      string,
    public readonly userId:       string,
    public readonly restaurantId: string,
    public readonly reason?:      string,
    public readonly cancelledBy?: string,
  ) {}
}

export class OrderRefundedEvent {
  static readonly EVENT = 'order.refunded';
  constructor(
    public readonly orderId:   string,
    public readonly userId:    string,
    public readonly paymentId: string,
    public readonly amount:    number,
  ) {}
}