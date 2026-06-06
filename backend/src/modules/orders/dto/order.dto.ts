import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentProviderEnum {
  MTN_MOMO     = 'MTN_MOMO',
  ORANGE_MONEY = 'ORANGE_MONEY',
  CASH         = 'CASH',
}

// ─────────────────────────────────────────────────────────────────────────────
// Request DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CheckoutDto {
  @ApiProperty({ example: 'address-uuid', description: 'Saved UserAddress UUID' })
  @IsUUID()
  addressId: string;

  @ApiProperty({ example: 'MTN_MOMO', enum: PaymentProviderEnum })
  @IsEnum(PaymentProviderEnum)
  paymentProvider: PaymentProviderEnum;

  @ApiPropertyOptional({
    example: '690000001',
    description: 'Phone number for mobile money (required for MTN_MOMO / ORANGE_MONEY)',
  })
  @IsOptional()
  @IsString()
  paymentPhone?: string;

  @ApiPropertyOptional({ example: 'Leave at the gate', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;

  @ApiPropertyOptional({ example: 'KIRA20', description: 'Optional promo code' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class ConfirmOrderDto {
  @ApiProperty({ example: 20, description: 'Estimated preparation time in minutes' })
  @IsInt()
  @Min(1)
  @Max(120)
  estimatedPrepTime: number;
}

export class RejectOrderDto {
  @ApiProperty({ example: 'Item ran out of stock', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Changed my mind', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class OrderItemResponseDto {
  @ApiProperty() id:                 string;
  @ApiProperty() menuItemId:         string;
  @ApiProperty() name:               string;
  @ApiProperty() unitPrice:          number;
  @ApiProperty() quantity:           number;
  @ApiProperty() customizationTotal: number;
  @ApiProperty() lineTotal:          number;
  @ApiProperty({ nullable: true }) notes:          string | null;
  @ApiProperty({ nullable: true }) customizations: any;
}

export class OrderPaymentDto {
  @ApiProperty() id:       string;
  @ApiProperty() status:   string;
  @ApiProperty() provider: string;
  @ApiProperty() amount:   number;
  @ApiProperty({ nullable: true }) paidAt: Date | null;
}

export class OrderRestaurantDto {
  @ApiProperty() id:   string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) phone:   string | null;
  @ApiProperty({ nullable: true }) logoUrl: string | null;
}

export class OrderStatusHistoryDto {
  @ApiProperty() status:    string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ nullable: true }) note: string | null;
}

export class OrderResponseDto {
  @ApiProperty() id:                    string;
  @ApiProperty() orderNumber:           string;
  @ApiProperty() status:                string;
  @ApiProperty({ type: () => OrderRestaurantDto }) restaurant: OrderRestaurantDto;
  @ApiProperty({ type: () => [OrderItemResponseDto] }) items: OrderItemResponseDto[];
  @ApiProperty() subtotal:              number;
  @ApiProperty() deliveryFee:           number;
  @ApiProperty() discountAmount:        number;
  @ApiProperty() total:                 number;
  @ApiProperty({ nullable: true }) estimatedPrepTime:     number | null;
  @ApiProperty({ nullable: true }) estimatedDeliveryTime: number | null;
  @ApiProperty() deliveryAddress:       string;
  @ApiProperty({ nullable: true }) deliveryNotes:    string | null;
  @ApiProperty({ nullable: true }) specialInstructions: string | null;
  @ApiProperty({ nullable: true }) cancelReason:    string | null;
  @ApiProperty({ type: () => OrderPaymentDto, nullable: true }) payment: OrderPaymentDto | null;
  @ApiProperty({ type: () => [OrderStatusHistoryDto] }) statusHistory: OrderStatusHistoryDto[];
  @ApiProperty() placedAt:              Date;
  @ApiProperty({ nullable: true }) confirmedAt:   Date | null;
  @ApiProperty({ nullable: true }) preparingAt:   Date | null;
  @ApiProperty({ nullable: true }) readyAt:       Date | null;
  @ApiProperty({ nullable: true }) pickedUpAt:    Date | null;
  @ApiProperty({ nullable: true }) deliveredAt:   Date | null;
  @ApiProperty({ nullable: true }) cancelledAt:   Date | null;
}

export class CheckoutResponseDto {
  @ApiProperty({ type: () => OrderResponseDto })
  order: OrderResponseDto;

  @ApiProperty({ example: 'Order placed successfully. Awaiting restaurant confirmation.' })
  message: string;
}

export class OrderSummaryDto {
  @ApiProperty() id:          string;
  @ApiProperty() orderNumber: string;
  @ApiProperty() status:      string;
  @ApiProperty({ nullable: true }) restaurantName: string | null;
  @ApiProperty() total:       number;
  @ApiProperty() itemCount:   number;
  @ApiProperty() placedAt:    Date;
}

export class PaginatedOrdersDto {
  @ApiProperty({ type: () => [OrderSummaryDto] }) data: OrderSummaryDto[];
  @ApiProperty() total:      number;
  @ApiProperty() page:       number;
  @ApiProperty() limit:      number;
  @ApiProperty() totalPages: number;
}