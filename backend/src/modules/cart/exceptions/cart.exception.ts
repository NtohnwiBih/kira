import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class CartNotFoundException extends NotFoundException {
  constructor() {
    super('Cart not found.');
  }
}

export class CartItemNotFoundException extends NotFoundException {
  constructor() {
    super('Cart item not found.');
  }
}

export class CartEmptyException extends BadRequestException {
  constructor() {
    super('Your cart is empty. Add items before checking out.');
  }
}

export class InvalidCartRestaurantException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error:      'RESTAURANT_MISMATCH',
      message:    'Cart already contains items from another restaurant. Clear your cart first.',
    });
  }
}

export class MenuItemUnavailableException extends BadRequestException {
  constructor(name: string) {
    super(`'${name}' is currently unavailable and cannot be added to your cart.`);
  }
}

export class CartMaxItemsException extends BadRequestException {
  constructor(max: number) {
    super(`Cart cannot exceed ${max} items.`);
  }
}

export class InvalidCustomizationException extends BadRequestException {
  constructor(detail: string) {
    super(`Invalid customization: ${detail}`);
  }
}

export class RequiredCustomizationMissingException extends BadRequestException {
  constructor(groupName: string) {
    super(`Selection required for '${groupName}'.`);
  }
}