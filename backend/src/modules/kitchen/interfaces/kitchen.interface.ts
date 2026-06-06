export interface IKitchenOrder {
  id:                   string;
  orderNumber:          string;
  status:               string;
  estimatedPrepTime:    number | null;
  placedAt:             Date;
  confirmedAt:          Date | null;
  preparingAt:          Date | null;
  specialInstructions:  string | null;
  items:                IKitchenOrderItem[];
  customer: {
    name:  string;
    phone: string | null;
  } | null;
}

export interface IKitchenOrderItem {
  id:             string;
  name:           string;
  quantity:       number;
  unitPrice:      number;
  lineTotal:      number;
  notes:          string | null;
  customizations: any;
}

export interface IKitchenWorkloadSummary {
  restaurantId:    string;
  pending:         number;
  confirmed:       number;
  preparing:       number;
  readyForPickup:  number;
  totalActive:     number;
  avgPrepTimeMin:  number;
}

export interface IKitchenStatusChange {
  orderId:      string;
  restaurantId: string;
  fromStatus:   string;
  toStatus:     string;
  changedById:  string;
  note?:        string;
}