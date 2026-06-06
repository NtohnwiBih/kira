import {
  IsString, IsEmail, IsOptional, IsNumber, IsBoolean, IsArray,
  IsEnum, MinLength, MaxLength, Min, Max, Matches, IsUUID,
  ValidateNested, IsDateString, ArrayMinSize, ArrayMaxSize,
  IsInt, IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  RestaurantStatus, MenuType, MenuItemType, PaymentProvider,
  SpicyLevel, DrinkTemperature, DrinkContainer, DayOfWeek,
  RestaurantManagerRole, VerificationStatus,
} from 'generated/prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// RESTAURANT
// ─────────────────────────────────────────────────────────────────────────────

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Chez Mama Africa', description: 'Restaurant display name (3–100 chars)' })
  @IsString() @MinLength(3) @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ example: 'Authentic Cameroonian cuisine in the heart of Yaoundé.' })
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '+237690000001', description: 'Cameroon phone number (MTN or Orange)' })
  @IsString()
  @Matches(/^(\+237|237)?[6-9]\d{8}$/, { message: 'Please provide a valid Cameroon phone number.' })
  phone: string;

  @ApiProperty({ example: 'contact@chezmamaafrika.cm' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Rue Nachtigal, Centre-ville' })
  @IsString() @MinLength(5) @MaxLength(255)
  address: string;

  @ApiProperty({ example: 'Yaoundé', description: 'City of operation' })
  @IsString() @MinLength(2) @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 3.8667, description: 'GPS latitude' })
  @IsOptional() @IsNumber()
  @Min(-90) @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: 11.5167, description: 'GPS longitude' })
  @IsOptional() @IsNumber()
  @Min(-180) @Max(180)
  lng?: number;

  @ApiProperty({
    example: ['cameroonian', 'african'],
    description: 'Cuisine types from the supported list',
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  cuisineTypes: string[];

  @ApiPropertyOptional({ example: 20, description: 'Default preparation time in minutes (5–120)', minimum: 5, maximum: 120 })
  @IsOptional() @IsInt()
  @Min(5) @Max(120)
  defaultPrepTime?: number;

  @ApiPropertyOptional({ example: 10, description: 'Delivery radius in km', maximum: 50 })
  @IsOptional() @IsNumber()
  @Min(0.5) @Max(50)
  deliveryRadius?: number;

  @ApiPropertyOptional({ example: 500, description: 'Minimum order amount in XAF' })
  @IsOptional() @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;
}

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  @ApiPropertyOptional({ example: ['fast-food', 'burgers'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['ndolé', 'poulet dg', 'eru'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  keywords?: string[];
}

export class RestaurantResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Chez Mama Africa' })
  name: string;

  @ApiProperty({ example: 'chez-mama-africa' })
  slug: string;

  @ApiProperty({ example: 'Authentic Cameroonian cuisine.' })
  description?: string;

  @ApiProperty({ example: 'https://cdn.kira.app/restaurants/logo.jpg', nullable: true })
  logoUrl?: string;

  @ApiProperty({ example: 'https://cdn.kira.app/restaurants/cover.jpg', nullable: true })
  coverUrl?: string;

  @ApiProperty({ example: '+237690000001' })
  phone: string;

  @ApiProperty({ example: 'contact@restaurant.cm' })
  email: string;

  @ApiProperty({ example: 'Rue Nachtigal' })
  address: string;

  @ApiProperty({ example: 'Yaoundé' })
  city: string;

  @ApiProperty({ example: 3.8667, nullable: true })
  lat?: number;

  @ApiProperty({ example: 11.5167, nullable: true })
  lng?: number;

  @ApiProperty({ example: ['cameroonian', 'african'], isArray: true })
  cuisineTypes: string[];

  @ApiProperty({ example: 20 })
  defaultPrepTime: number;

  @ApiProperty({ example: 'OPEN', enum: RestaurantStatus })
  status: RestaurantStatus;

  @ApiProperty({ example: 'PENDING', enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiProperty({ example: 3, description: 'Current onboarding step (0–5)' })
  onboardingStep: number;

  @ApiProperty({ example: false })
  onboardingCompleted: boolean;

  @ApiProperty({ example: '2025-11-01T09:00:00.000Z' })
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY
// ─────────────────────────────────────────────────────────────────────────────

export class ChangeAvailabilityDto {
  @ApiProperty({ example: 'OPEN', enum: RestaurantStatus, description: 'New availability status' })
  @IsEnum(RestaurantStatus)
  status: RestaurantStatus;

  @ApiPropertyOptional({ example: 'Kitchen equipment issue — back in 30 min.' })
  @IsOptional() @IsString() @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    example: '2025-11-01T14:30:00.000Z',
    description: 'ISO datetime — system auto-resumes PAUSED/BUSY status at this time',
  })
  @IsOptional() @IsDateString()
  autoResumeAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGERS
// ─────────────────────────────────────────────────────────────────────────────

export class InviteManagerDto {
  @ApiProperty({ example: 'manager@restaurant.cm' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'KITCHEN_MANAGER', enum: RestaurantManagerRole })
  @IsEnum(RestaurantManagerRole)
  role: RestaurantManagerRole;

  @ApiPropertyOptional({ description: 'Override default permissions for this role' })
  @IsOptional()
  customPermissions?: Record<string, boolean>;
}

export class UpdateManagerRoleDto {
  @ApiProperty({ example: 'RESTAURANT_MANAGER', enum: RestaurantManagerRole })
  @IsEnum(RestaurantManagerRole)
  role: RestaurantManagerRole;
}

export class SuspendManagerDto {
  @ApiPropertyOptional({ example: 'Policy violation — access revoked pending review.' })
  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class ManagerResponseDto {
  @ApiProperty({ example: 'b1febc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  id: string;

  @ApiProperty({ example: 'KITCHEN_MANAGER', enum: RestaurantManagerRole })
  role: RestaurantManagerRole;

  @ApiProperty({ example: 'manager@restaurant.cm' })
  email: string;

  @ApiProperty({ example: 'Jean Mbarga' })
  name?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isSuspended: boolean;

  @ApiProperty()
  permissions: Record<string, boolean>;

  @ApiProperty({ example: '2025-11-01T09:00:00.000Z' })
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT METHODS
// ─────────────────────────────────────────────────────────────────────────────

export class AddPaymentMethodDto {
  @ApiProperty({ example: 'MOMO', enum: PaymentProvider, description: 'MTN Mobile Money or Orange Money' })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({ example: 'MBARGA Jean-Claude' })
  @IsString() @MinLength(3) @MaxLength(100)
  accountName: string;

  @ApiProperty({ example: '690000001', description: '9-digit Cameroon mobile number without country code' })
  @IsString()
  @Matches(/^[6-9]\d{8}$/, { message: 'Please provide a valid 9-digit Cameroon mobile number.' })
  accountNumber: string;

  @ApiPropertyOptional({ example: true, description: 'Set as the primary number for this provider' })
  @IsOptional() @IsBoolean()
  isPrimary?: boolean;
}

export class PaymentMethodResponseDto {
  @ApiProperty({ example: 'c2febc99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  id: string;

  @ApiProperty({ example: 'MOMO', enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiProperty({ example: 'MTN Mobile Money' })
  providerName: string;

  @ApiProperty({ example: 'MBARGA Jean-Claude' })
  accountName: string;

  @ApiProperty({ example: '****001', description: 'Masked account number — last 3 digits only' })
  maskedNumber: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isVerified: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────────────────────────────────────

export class CreateMenuDto {
  @ApiProperty({ example: 'Lunch Menu', description: 'Menu display title' })
  @IsString() @MinLength(2) @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ example: 'Our classic midday selection.' })
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'CONSTANT', enum: MenuType })
  @IsEnum(MenuType)
  menuType: MenuType;

  @ApiPropertyOptional({
    example: '2025-11-05',
    description: 'Required for DAILY menus — ISO date string (YYYY-MM-DD)',
  })
  @IsOptional() @IsDateString()
  activeDate?: string;
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class MenuResponseDto {
  @ApiProperty({ example: 'd3febc99-9c0b-4ef8-bb6d-6bb9bd380a44' })
  id: string;

  @ApiProperty({ example: 'Lunch Menu' })
  title: string;

  @ApiProperty({ example: 'CONSTANT', enum: MenuType })
  menuType: MenuType;

  @ApiProperty({ example: null, nullable: true })
  activeDate?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-11-01T09:00:00.000Z' })
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU CATEGORY
// ─────────────────────────────────────────────────────────────────────────────

export class CreateMenuCategoryDto {
  @ApiProperty({ example: 'Main Dishes' })
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Our hearty main course selection.' })
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'FOOD', enum: MenuItemType })
  @IsEnum(MenuItemType)
  itemType: MenuItemType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateMenuCategoryDto extends PartialType(CreateMenuCategoryDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU ITEM
// ─────────────────────────────────────────────────────────────────────────────

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Ndolé avec Plantains', description: 'Item display name' })
  @IsString() @MinLength(2) @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Slow-cooked bitter leaves with groundnut paste and shrimps.' })
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 2500, description: 'Price in XAF (0–500 000)' })
  @IsNumber() @Min(0) @Max(500_000)
  price: number;

  @ApiProperty({ example: 'FOOD', enum: MenuItemType })
  @IsEnum(MenuItemType)
  itemType: MenuItemType;

  @ApiProperty({ example: 'e4febc99-9c0b-4ef8-bb6d-6bb9bd380a55', description: 'Category UUID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 20, description: 'Item-specific prep time in minutes', minimum: 1, maximum: 120 })
  @IsOptional() @IsInt() @Min(1) @Max(120)
  preparationTime?: number;

  @ApiPropertyOptional({ example: 650, description: 'Approximate calories' })
  @IsOptional() @IsInt() @Min(0) @Max(10_000)
  calories?: number;

  @ApiPropertyOptional({ example: 'MEDIUM', enum: SpicyLevel })
  @IsOptional() @IsEnum(SpicyLevel)
  spicyLevel?: SpicyLevel;

  @ApiPropertyOptional({ example: 10, description: 'Initial stock quantity — null means unlimited' })
  @IsOptional() @IsInt() @Min(0)
  stockQuantity?: number;

  // Drink-specific
  @ApiPropertyOptional({ example: 'COLD', enum: DrinkTemperature, description: 'For DRINK items only' })
  @IsOptional() @IsEnum(DrinkTemperature)
  drinkTemp?: DrinkTemperature;

  @ApiPropertyOptional({ example: 'BOTTLE', enum: DrinkContainer })
  @IsOptional() @IsEnum(DrinkContainer)
  drinkContainer?: DrinkContainer;

  @ApiPropertyOptional({ example: 330, description: 'Volume in ml (for drinks)' })
  @IsOptional() @IsInt() @Min(1)
  volume?: number;

  // AI fields
  @ApiPropertyOptional({ example: ['vegan', 'gluten-free'], isArray: true, type: String })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['ndolé', 'bitter leaves', 'groundnut'], isArray: true, type: String })
  @IsOptional() @IsArray() @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ example: ['halal', 'vegetarian'], isArray: true, type: String })
  @IsOptional() @IsArray() @IsString({ each: true })
  dietaryLabels?: string[];
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateStockDto {
  @ApiProperty({ example: 15, description: 'New stock quantity — set to null for unlimited' })
  @IsOptional() @IsInt() @Min(0)
  stockQuantity?: number | null;
}

export class MenuItemResponseDto {
  @ApiProperty({ example: 'f5febc99-9c0b-4ef8-bb6d-6bb9bd380a66' })
  id: string;

  @ApiProperty({ example: 'Ndolé avec Plantains' })
  name: string;

  @ApiProperty({ example: 'Slow-cooked bitter leaves...' })
  description?: string;

  @ApiProperty({ example: 'https://cdn.kira.app/items/ndole.jpg', nullable: true })
  imageUrl?: string;

  @ApiProperty({ example: 2500 })
  price: number;

  @ApiProperty({ example: 'FOOD', enum: MenuItemType })
  itemType: MenuItemType;

  @ApiProperty({ example: 20 })
  preparationTime: number;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ example: 10, nullable: true })
  stockQuantity?: number;

  @ApiProperty({ example: 'MEDIUM', enum: SpicyLevel })
  spicyLevel: SpicyLevel;

  @ApiProperty({ example: ['vegan'], isArray: true })
  tags: string[];

  @ApiProperty({ example: ['halal'], isArray: true })
  dietaryLabels: string[];

  @ApiProperty({ description: 'Customization groups attached to this item', isArray: true })
  customizationGroups?: CustomizationGroupResponseDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export class CreateCustomizationGroupDto {
  @ApiProperty({ example: 'Choose your side', description: 'Group label shown to the customer' })
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Pick one side dish.' })
  @IsOptional() @IsString() @MaxLength(255)
  description?: string;

  @ApiProperty({ example: true, description: 'Customer must make a selection in this group' })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({ example: 1, description: 'Minimum number of options the customer must pick', minimum: 0 })
  @IsInt() @Min(0)
  minSelect: number;

  @ApiProperty({ example: 1, description: 'Maximum number of options the customer can pick', minimum: 1 })
  @IsInt() @Min(1) @Max(20)
  maxSelect: number;

  @ApiProperty({
    example: [
      { name: 'Plantains', priceAdd: 0, isDefault: true },
      { name: 'French Fries', priceAdd: 200, isDefault: false },
      { name: 'Mixed Vegetables', priceAdd: 0, isDefault: false },
    ],
    type: 'array',
    description: 'Options that belong to this group',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomizationOptionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  options: CreateCustomizationOptionDto[];
}

export class CreateCustomizationOptionDto {
  @ApiProperty({ example: 'Plantains' })
  @IsString() @MinLength(1) @MaxLength(100)
  name: string;

  @ApiProperty({ example: 0, description: 'Additional price in XAF (0 = no extra charge)' })
  @IsNumber() @Min(0) @Max(50_000)
  priceAdd: number;

  @ApiPropertyOptional({ example: true, description: 'Pre-selected by default' })
  @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 180, description: 'Additional calories for this option' })
  @IsOptional() @IsInt() @Min(0)
  calories?: number;
}

export class UpdateCustomizationGroupDto extends PartialType(OmitType(CreateCustomizationGroupDto, ['options'])) {
  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CustomizationGroupResponseDto {
  @ApiProperty({ example: 'g6febc99-9c0b-4ef8-bb6d-6bb9bd380a77' })
  id: string;

  @ApiProperty({ example: 'Choose your side' })
  name: string;

  @ApiProperty({ example: true })
  isRequired: boolean;

  @ApiProperty({ example: 1 })
  minSelect: number;

  @ApiProperty({ example: 1 })
  maxSelect: number;

  @ApiProperty({ isArray: true })
  options: CustomizationOptionResponseDto[];
}

export class CustomizationOptionResponseDto {
  @ApiProperty({ example: 'h7febc99-9c0b-4ef8-bb6d-6bb9bd380a88' })
  id: string;

  @ApiProperty({ example: 'Plantains' })
  name: string;

  @ApiProperty({ example: 0 })
  priceAdd: number;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENING HOURS
// ─────────────────────────────────────────────────────────────────────────────

export class SetOpeningHourDto {
  @ApiProperty({ example: 'MONDAY', enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '08:00', description: '24-hour time string HH:MM' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'opensAt must be in HH:MM format.' })
  opensAt: string;

  @ApiProperty({ example: '22:00', description: '24-hour time string HH:MM' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'closesAt must be in HH:MM format.' })
  closesAt: string;

  @ApiPropertyOptional({ example: false, description: 'Mark this day as closed (opensAt/closesAt ignored)' })
  @IsOptional() @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Shift index — 0 for first shift, 1 for second (split hours)' })
  @IsOptional() @IsInt() @Min(0) @Max(1)
  shiftIndex?: number;
}

export class BulkSetOpeningHoursDto {
  @ApiProperty({ isArray: true, type: () => SetOpeningHourDto })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetOpeningHourDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(14) // max 2 shifts × 7 days
  hours: SetOpeningHourDto[];
}

export class OpeningHourResponseDto {
  @ApiProperty({ example: 'MONDAY', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '08:00' })
  opensAt: string;

  @ApiProperty({ example: '22:00' })
  closesAt: string;

  @ApiProperty({ example: false })
  isClosed: boolean;

  @ApiProperty({ example: 0 })
  shiftIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY AVAILABILITY
// ─────────────────────────────────────────────────────────────────────────────

export class SetDailyAvailabilityDto {
  @ApiProperty({ example: '2025-11-05', description: 'ISO date YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({ example: 20, description: 'Stock override for this day' })
  @IsOptional() @IsInt() @Min(0)
  stockQty?: number;

  @ApiPropertyOptional({ example: 'Limited quantity today — order early!' })
  @IsOptional() @IsString() @MaxLength(255)
  specialNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED / PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional() @IsInt() @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  data: T[];
}

export class FindManyRestaurantsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Yaoundé' })
  @IsOptional()
  @IsString()
  city?: string;
}