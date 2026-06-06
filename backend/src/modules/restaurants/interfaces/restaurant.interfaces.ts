import {
  RestaurantStatus,
  RestaurantManagerRole,
  MenuType,
  MenuItemType,
  PaymentProvider,
  SpicyLevel,
  DayOfWeek,
  VerificationStatus,
} from 'generated/prisma/client';

// ── Restaurant ───────────────────────────────────────────────────────────────

export interface IRestaurant {
  id:                 string;
  name:               string;
  slug:               string;
  description?:       string;
  logoUrl?:           string;
  coverUrl?:          string;
  phone:              string;
  email:              string;
  address:            string;
  city:               string;
  lat?:               number;
  lng?:               number;
  cuisineTypes:       string[];
  defaultPrepTime:    number;
  deliveryRadius?:    number;
  status:             RestaurantStatus;
  verificationStatus: VerificationStatus;
  isVerified:         boolean;
  isActive:           boolean;
  onboardingCompleted: boolean;
  onboardingStep:     number;
  ownerId:            string;
  tags:               string[];
  keywords:           string[];
  createdAt:          Date;
  updatedAt:          Date;
}

export interface IOnboardingStatus {
  currentStep:      number;
  totalSteps:       number;
  completedSteps:   string[];
  pendingSteps:     string[];
  isComplete:       boolean;
  percentComplete:  number;
}

// ── Manager ──────────────────────────────────────────────────────────────────

export interface IRestaurantManager {
  id:           string;
  restaurantId: string;
  userId:       string;
  role:         RestaurantManagerRole;
  isActive:     boolean;
  isSuspended:  boolean;
  permissions:  IManagerPermissions;
  createdAt:    Date;
}

export interface IManagerPermissions {
  canEditMenu:             boolean;
  canManageOrders:         boolean;
  canViewReports:          boolean;
  canManageStaff:          boolean;
  canManagePayments:       boolean;
  canChangeAvailability:   boolean;
  customPermissions?:      Record<string, boolean>;
}

export const DEFAULT_PERMISSIONS: Record<RestaurantManagerRole, IManagerPermissions> = {
  RESTAURANT_SUPER_ADMIN: {
    canEditMenu:           true,
    canManageOrders:       true,
    canViewReports:        true,
    canManageStaff:        true,
    canManagePayments:     true,
    canChangeAvailability: true,
  },
  RESTAURANT_MANAGER: {
    canEditMenu:           true,
    canManageOrders:       true,
    canViewReports:        true,
    canManageStaff:        false,
    canManagePayments:     false,
    canChangeAvailability: true,
  },
  KITCHEN_MANAGER: {
    canEditMenu:           true,
    canManageOrders:       true,
    canViewReports:        false,
    canManageStaff:        false,
    canManagePayments:     false,
    canChangeAvailability: true,
  },
  CASHIER: {
    canEditMenu:           false,
    canManageOrders:       true,
    canViewReports:        false,
    canManageStaff:        false,
    canManagePayments:     false,
    canChangeAvailability: false,
  },
};

// ── Menu ─────────────────────────────────────────────────────────────────────

export interface IMenu {
  id:          string;
  restaurantId: string;
  title:       string;
  description?: string;
  menuType:    MenuType;
  activeDate?: Date;
  isActive:    boolean;
  sortOrder:   number;
  categories?: IMenuCategory[];
}

export interface IMenuCategory {
  id:          string;
  menuId:      string;
  name:        string;
  description?: string;
  imageUrl?:   string;
  itemType:    MenuItemType;
  sortOrder:   number;
  items?:      IMenuItem[];
}

export interface IMenuItem {
  id:              string;
  menuId:          string;
  categoryId:      string;
  name:            string;
  description?:    string;
  imageUrl?:       string;
  price:           number;
  itemType:        MenuItemType;
  preparationTime: number;
  calories?:       number;
  isAvailable:     boolean;
  stockQuantity?:  number;
  spicyLevel:      SpicyLevel;
  tags:            string[];
  keywords:        string[];
  dietaryLabels:   string[];
  aiMetadata?:     Record<string, unknown>;
  customizationGroups?: ICustomizationGroup[];
}

export interface ICustomizationGroup {
  id:          string;
  menuItemId:  string;
  name:        string;
  description?: string;
  isRequired:  boolean;
  minSelect:   number;
  maxSelect:   number;
  sortOrder:   number;
  options:     ICustomizationOption[];
}

export interface ICustomizationOption {
  id:          string;
  groupId:     string;
  name:        string;
  priceAdd:    number;
  isDefault:   boolean;
  isAvailable: boolean;
  calories?:   number;
}

// ── Opening hours ────────────────────────────────────────────────────────────

export interface IOpeningHour {
  dayOfWeek:  DayOfWeek;
  opensAt:    string; // "HH:MM"
  closesAt:   string; // "HH:MM"
  isClosed:   boolean;
  shiftIndex: number;
}

export interface IOpeningHoursWeek {
  [key: string]: IOpeningHour[];
}

// ── Availability ─────────────────────────────────────────────────────────────

export interface IAvailabilityChange {
  restaurantId: string;
  status:       RestaurantStatus;
  reason?:      string;
  changedById:  string;
  autoResumeAt?: Date;
}

// ── Payment ──────────────────────────────────────────────────────────────────

export interface IPaymentMethod {
  id:            string;
  restaurantId:  string;
  provider:      PaymentProvider;
  accountName:   string;
  maskedNumber:  string; 
  isPrimary:     boolean;
  isActive:      boolean;
  isVerified:    boolean;
}

// ── AI metadata ──────────────────────────────────────────────────────────────

export interface IAiMenuItemMetadata {
  flavorProfile?:     string[];   
  pairsWith?:         string[];   
  popularityScore?:   number;     
  recommendedFor?:    string[];   
  allergens?:         string[];   
  estimatedCalories?: number;
}