export class CartItemAddedEvent {
  static readonly EVENT = 'cart.item.added';
  constructor(
    public readonly userId:     string,
    public readonly menuItemId: string,
    public readonly quantity:   number,
    public readonly lineTotal:  number,
  ) {}
}
 
export class CartItemRemovedEvent {
  static readonly EVENT = 'cart.item.removed';
  constructor(
    public readonly userId:     string,
    public readonly menuItemId: string,
  ) {}
}
 
export class CartClearedEvent {
  static readonly EVENT = 'cart.cleared';
  constructor(public readonly userId: string) {}
}
 
export class CartCheckedOutEvent {
  static readonly EVENT = 'cart.checked_out';
  constructor(
    public readonly userId:       string,
    public readonly orderId:      string,
    public readonly restaurantId: string,
  ) {}
}