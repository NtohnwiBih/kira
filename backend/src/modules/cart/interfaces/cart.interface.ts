export interface ICartTotals {
  subtotal:      number;
  discountAmount: number;
  deliveryFee:   number;
  grandTotal:    number;
}
 
export interface ICartCustomization {
  groupId:    string;
  groupName:  string;
  optionId:   string;
  optionName: string;
  priceAdd:   number;
}
 
export interface ICartItemData {
  menuItemId:          string;
  name:                string;          
  unitPrice:           number;          
  quantity:            number;
  customizationTotal:  number;
  lineTotal:           number;
  notes?:              string;
  customizations:      ICartCustomization[];
}
 
export interface IValidatedCustomizations {
  customizations:     ICartCustomization[];
  customizationTotal: number;
}