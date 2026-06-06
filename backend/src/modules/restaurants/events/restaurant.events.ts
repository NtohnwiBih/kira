export class RestaurantCreatedEvent {
  static readonly EVENT = 'restaurant.created';
  constructor(
    public readonly restaurantId:   string,
    public readonly ownerId:        string,
    public readonly restaurantName: string,
    public readonly city:           string,
  ) {}
}
 
export class RestaurantVerifiedEvent {
  static readonly EVENT = 'restaurant.verified';
  constructor(
    public readonly restaurantId: string,
    public readonly ownerId:      string,
    public readonly verifiedById: string,
  ) {}
}
 
export class RestaurantSuspendedEvent {
  static readonly EVENT = 'restaurant.suspended';
  constructor(
    public readonly restaurantId: string,
    public readonly ownerId:      string,
    public readonly reason:       string,
    public readonly suspendedById: string,
  ) {}
}
 
export class AvailabilityChangedEvent {
  static readonly EVENT = 'restaurant.availability.changed';
  constructor(
    public readonly restaurantId: string,
    public readonly newStatus:    string,
    public readonly oldStatus:    string,
    public readonly changedById:  string,
    public readonly reason?:      string,
  ) {}
}
 
export class ManagerInvitedEvent {
  static readonly EVENT = 'restaurant.manager.invited';
  constructor(
    public readonly restaurantId:   string,
    public readonly restaurantName: string,
    public readonly inviteEmail:    string,
    public readonly role:           string,
    public readonly inviteToken:    string,
    public readonly invitedById:    string,
  ) {}
}
 
export class ManagerActivatedEvent {
  static readonly EVENT = 'restaurant.manager.activated';
  constructor(
    public readonly restaurantId: string,
    public readonly managerId:    string,
    public readonly userId:       string,
  ) {}
}
 
export class ManagerSuspendedEvent {
  static readonly EVENT = 'restaurant.manager.suspended';
  constructor(
    public readonly restaurantId: string,
    public readonly managerId:    string,
    public readonly suspendedById: string,
    public readonly reason?:      string,
  ) {}
}
 
export class MenuItemCreatedEvent {
  static readonly EVENT = 'restaurant.menu.item.created';
  constructor(
    public readonly restaurantId: string,
    public readonly menuItemId:   string,
    public readonly name:         string,
    public readonly price:        number,
  ) {}
}
 
export class MenuItemAvailabilityChangedEvent {
  static readonly EVENT = 'restaurant.menu.item.availability';
  constructor(
    public readonly restaurantId: string,
    public readonly menuItemId:   string,
    public readonly isAvailable:  boolean,
  ) {}
}
 
export class LowStockAlertEvent {
  static readonly EVENT = 'restaurant.menu.item.low_stock';
  constructor(
    public readonly restaurantId: string,
    public readonly menuItemId:   string,
    public readonly itemName:     string,
    public readonly remaining:    number,
  ) {}
}
 
export class OnboardingStepCompletedEvent {
  static readonly EVENT = 'restaurant.onboarding.step';
  constructor(
    public readonly restaurantId:  string,
    public readonly ownerId:       string,
    public readonly stepCompleted: string,
    public readonly nextStep:      string | null,
    public readonly isComplete:    boolean,
  ) {}
}