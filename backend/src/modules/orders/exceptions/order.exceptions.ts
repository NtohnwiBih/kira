import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class OrderNotFoundException extends NotFoundException {
  constructor(id?: string) {
    super(id ? `Order '${id}' not found.` : 'Order not found.');
  }
}

export class InvalidOrderStatusTransitionException extends BadRequestException {
  constructor(from: string, to: string) {
    super(
      `Cannot transition order from '${from}' to '${to}'. ` +
      `This transition is not allowed.`,
    );
  }
}

export class OrderCancellationWindowExpiredException extends BadRequestException {
  constructor() {
    super(
      'The cancellation window has expired. ' +
      'Please contact support to cancel this order.',
    );
  }
}

export class OrderNotOwnedByUserException extends ForbiddenException {
  constructor() {
    super('You do not have permission to access this order.');
  }
}

export class RestaurantClosedException extends UnprocessableEntityException {
  constructor() {
    super('This restaurant is currently not accepting orders. Please try again later.');
  }
}

export class RestaurantInactiveException extends UnprocessableEntityException {
  constructor() {
    super('This restaurant is not available at the moment.');
  }
}

export class CheckoutFailedException extends UnprocessableEntityException {
  constructor(detail?: string) {
    super(detail ?? 'Checkout failed. Please try again.');
  }
}

export class MinimumOrderAmountException extends BadRequestException {
  constructor(minimum: number, currency = 'XAF') {
    super(
      `Order total does not meet the minimum order amount of ${minimum.toLocaleString()} ${currency}.`,
    );
  }
}