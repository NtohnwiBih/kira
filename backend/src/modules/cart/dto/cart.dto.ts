import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─────────────────────────────────────────────────────────────────────────────
// Request DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CartCustomizationInputDto {
  @ApiProperty({ example: 'group-uuid', description: 'ItemCustomizationGroup UUID' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 'option-uuid', description: 'ItemCustomizationOption UUID' })
  @IsUUID()
  optionId: string;
}

export class AddCartItemDto {
  @ApiProperty({ example: 'menu-item-uuid' })
  @IsUUID()
  menuItemId: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @ApiPropertyOptional({
    type: [CartCustomizationInputDto],
    description: 'Selected customization options. Required groups must be included.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartCustomizationInputDto)
  customizations?: CartCustomizationInputDto[];

  @ApiPropertyOptional({ example: 'No onions please', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @ApiPropertyOptional({ example: 'Extra spicy', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CartCustomizationResponseDto {
  @ApiProperty() groupId:    string;
  @ApiProperty() groupName:  string;
  @ApiProperty() optionId:   string;
  @ApiProperty() optionName: string;
  @ApiProperty() priceAdd:   number;
}

export class CartItemResponseDto {
  @ApiProperty() id:                 string;
  @ApiProperty() menuItemId:         string;
  @ApiProperty() name:               string;
  @ApiProperty({ nullable: true }) imageUrl: string | null;
  @ApiProperty() unitPrice:          number;
  @ApiProperty() quantity:           number;
  @ApiProperty() customizationTotal: number;
  @ApiProperty() lineTotal:          number;
  @ApiProperty({ nullable: true }) notes: string | null;
  @ApiProperty({ type: () => [CartCustomizationResponseDto] })
  customizations: CartCustomizationResponseDto[];
}

export class CartRestaurantDto {
  @ApiProperty() id:   string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) logoUrl:    string | null;
  @ApiProperty({ nullable: true }) deliveryFee: number | null;
  @ApiProperty({ nullable: true }) minimumOrderAmount: number | null;
}

export class CartTotalsDto {
  @ApiProperty({ description: 'Sum of all line totals' })
  subtotal: number;

  @ApiProperty({ description: 'Promo code discount applied' })
  discountAmount: number;

  @ApiProperty({ description: 'Restaurant delivery fee' })
  deliveryFee: number;

  @ApiProperty({ description: 'subtotal + deliveryFee - discountAmount' })
  grandTotal: number;
}

export class CartResponseDto {
  @ApiProperty() id: string;

  @ApiProperty({ nullable: true, type: () => CartRestaurantDto })
  restaurant: CartRestaurantDto | null;

  @ApiProperty({ type: () => [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ description: 'Total number of individual units across all items' })
  itemCount: number;

  @ApiProperty({ type: () => CartTotalsDto })
  totals: CartTotalsDto;

  @ApiProperty({ nullable: true })
  promoCode: string | null;

  @ApiProperty()
  updatedAt: Date;
}