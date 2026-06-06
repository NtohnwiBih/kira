export interface IOrderItemSnapshot {
  menuItemId:          string;
  name:                string;
  unitPrice:           number;
  quantity:            number;
  customizations:      any;
  customizationTotal:  number;
  lineTotal:           number;
  notes:               string | null;
}

export interface IOrderPricing {
  subtotal:       number;
  deliveryFee:    number;
  discountAmount: number;
  total:          number;
}

export interface IOrderStatusTransition {
  orderId:     string;
  fromStatus:  string;
  toStatus:    string;
  changedById: string;
  note?:       string;
}