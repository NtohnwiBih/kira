export class KitchenOrderAcceptedEvent {
  static readonly EVENT = 'kitchen.order.accepted';
  constructor(
    public readonly orderId:           string,
    public readonly restaurantId:      string,
    public readonly userId:            string,
    public readonly estimatedPrepTime: number,
  ) {}
}

export class KitchenOrderRejectedEvent {
  static readonly EVENT = 'kitchen.order.rejected';
  constructor(
    public readonly orderId:      string,
    public readonly restaurantId: string,
    public readonly userId:       string,
    public readonly reason:       string,
  ) {}
}

export class KitchenOrderPreparingEvent {
  static readonly EVENT = 'kitchen.order.preparing';
  constructor(
    public readonly orderId:      string,
    public readonly restaurantId: string,
    public readonly userId:       string,
  ) {}
}

export class KitchenOrderReadyEvent {
  static readonly EVENT = 'kitchen.order.ready';
  constructor(
    public readonly orderId:      string,
    public readonly restaurantId: string,
    public readonly userId:       string,
  ) {}
}

export class KitchenPrepTimeUpdatedEvent {
  static readonly EVENT = 'kitchen.prep_time.updated';
  constructor(
    public readonly orderId:           string,
    public readonly restaurantId:      string,
    public readonly estimatedPrepTime: number,
    public readonly userId:            string,
  ) {}
}

export class KitchenStatusChangedEvent {
  static readonly EVENT = 'kitchen.status.changed';
  constructor(
    public readonly restaurantId: string,
    public readonly status:       string,
    public readonly reason:       string | undefined,
    public readonly changedById:  string,
  ) {}
}