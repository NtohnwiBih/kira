import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';

// ── Restaurant ───────────────────────────────────────────────────────────────

export class RestaurantNotFoundException extends NotFoundException {
  constructor(id?: string) {
    super(id ? `Restaurant '${id}' was not found.` : 'Restaurant not found.');
  }
}

export class RestaurantSlugConflictException extends ConflictException {
  constructor(slug: string) {
    super(`The slug '${slug}' is already taken. Please choose a different restaurant name.`);
  }
}

export class RestaurantNotVerifiedException extends ForbiddenException {
  constructor() {
    super('This restaurant has not been verified yet. Please contact support.');
  }
}

export class RestaurantSuspendedException extends ForbiddenException {
  constructor() {
    super('This restaurant has been suspended. Please contact support.');
  }
}

export class RestaurantOwnershipException extends ForbiddenException {
  constructor() {
    super('You do not have permission to manage this restaurant.');
  }
}

export class OnboardingIncompleteException extends UnprocessableEntityException {
  constructor(pendingStep: string) {
    super(`Onboarding is not complete. Please finish the '${pendingStep}' step first.`);
  }
}

// ── Manager ──────────────────────────────────────────────────────────────────

export class ManagerNotFoundException extends NotFoundException {
  constructor() {
    super('Restaurant manager not found.');
  }
}

export class ManagerAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`A manager with email '${email}' already exists for this restaurant.`);
  }
}

export class ManagerLimitExceededException extends BadRequestException {
  constructor(max: number) {
    super(`This restaurant has reached the maximum limit of ${max} managers.`);
  }
}

export class InsufficientManagerPermissionsException extends ForbiddenException {
  constructor(permission: string) {
    super(`Your manager role does not include '${permission}' permission.`);
  }
}

export class ManagerSuspendedException extends ForbiddenException {
  constructor() {
    super('Your manager account has been suspended. Please contact the restaurant owner.');
  }
}

export class CannotSelfSuspendException extends BadRequestException {
  constructor() {
    super('You cannot suspend your own manager account.');
  }
}

// ── Payment ──────────────────────────────────────────────────────────────────

export class PaymentMethodNotFoundException extends NotFoundException {
  constructor() {
    super('Payment method not found.');
  }
}

export class DuplicatePaymentNumberException extends ConflictException {
  constructor(provider: string) {
    super(`This ${provider} number is already registered for this restaurant.`);
  }
}

export class PrimaryPaymentMethodException extends BadRequestException {
  constructor() {
    super('Cannot remove the primary payment method. Set another method as primary first.');
  }
}

// ── Menu ─────────────────────────────────────────────────────────────────────

export class MenuNotFoundException extends NotFoundException {
  constructor() {
    super('Menu not found.');
  }
}

export class MenuLimitExceededException extends BadRequestException {
  constructor(max: number) {
    super(`This restaurant has reached the maximum of ${max} menus.`);
  }
}

export class DailyMenuAlreadyExistsException extends ConflictException {
  constructor(date: string) {
    super(`A daily menu already exists for ${date}. Update the existing one instead.`);
  }
}

export class MenuItemNotFoundException extends NotFoundException {
  constructor() {
    super('Menu item not found.');
  }
}

export class MenuCategoryNotFoundException extends NotFoundException {
  constructor() {
    super('Menu category not found.');
  }
}

export class ItemOutOfStockException extends BadRequestException {
  constructor(name: string) {
    super(`'${name}' is currently out of stock.`);
  }
}

export class InvalidPriceRangeException extends BadRequestException {
  constructor(min: number, max: number) {
    super(`Item price must be between ${min} and ${max} XAF.`);
  }
}

// ── Opening hours ─────────────────────────────────────────────────────────────

export class InvalidOpeningHoursException extends BadRequestException {
  constructor(detail: string) {
    super(`Invalid opening hours: ${detail}`);
  }
}

export class OpeningHoursConflictException extends ConflictException {
  constructor(day: string) {
    super(`Opening hours for ${day} overlap with an existing shift.`);
  }
}

// ── Customization ─────────────────────────────────────────────────────────────

export class CustomizationGroupNotFoundException extends NotFoundException {
  constructor() {
    super('Customization group not found.');
  }
}

export class CustomizationGroupLimitException extends BadRequestException {
  constructor(max: number) {
    super(`Menu items support a maximum of ${max} customization groups.`);
  }
}