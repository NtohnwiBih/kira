import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class KitchenOrderNotFoundException extends NotFoundException {
  constructor(orderId?: string) {
    super(orderId ? `Order '${orderId}' not found in this kitchen.` : 'Order not found.');
  }
}

export class InvalidKitchenStatusTransitionException extends BadRequestException {
  constructor(from: string, to: string) {
    super(
      `Cannot transition order from '${from}' to '${to}'. ` +
      `Check the allowed kitchen workflow.`,
    );
  }
}

export class OrderNotBelongsToRestaurantException extends ForbiddenException {
  constructor() {
    super('This order does not belong to your restaurant.');
  }
}

export class OrderAlreadyPreparingException extends BadRequestException {
  constructor() {
    super('Order is already being prepared.');
  }
}

export class OrderNotConfirmedException extends BadRequestException {
  constructor() {
    super('Order must be in CONFIRMED status before it can be prepared.');
  }
}

export class OrderNotPreparingException extends BadRequestException {
  constructor() {
    super('Order must be in PREPARING status before it can be marked ready.');
  }
}

export class PrepTimeOutOfRangeException extends BadRequestException {
  constructor(min: number, max: number) {
    super(`Preparation time must be between ${min} and ${max} minutes.`);
  }
}