/*
  Warnings:

  - You are about to drop the column `name` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `preparedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `openingHours` on the `restaurants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[restaurantId,menuType,activeDate]` on the table `menus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,deviceId]` on the table `user_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemType` to the `menu_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemType` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menuId` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `menus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `menus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotal` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('OPEN', 'CLOSED', 'BUSY', 'PAUSED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RestaurantManagerRole" AS ENUM ('RESTAURANT_SUPER_ADMIN', 'RESTAURANT_MANAGER', 'KITCHEN_MANAGER', 'CASHIER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('CONSTANT', 'DAILY');

-- CreateEnum
CREATE TYPE "MenuItemType" AS ENUM ('FOOD', 'DRINK');

-- CreateEnum
CREATE TYPE "SpicyLevel" AS ENUM ('NONE', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT');

-- CreateEnum
CREATE TYPE "DrinkTemperature" AS ENUM ('COLD', 'HOT', 'AMBIENT');

-- CreateEnum
CREATE TYPE "DrinkContainer" AS ENUM ('BOTTLE', 'CAN', 'CUP', 'GLASS');

-- CreateEnum
CREATE TYPE "RestaurantPaymentProvider" AS ENUM ('MOMO', 'OM');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'ONLINE', 'ON_DELIVERY', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'BICYCLE', 'CAR', 'FOOT');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('RESTAURANT', 'MENU_ITEM', 'DELIVERY_DRIVER');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE_OFF', 'FIXED_AMOUNT_OFF', 'FREE_ITEM', 'FREE_DELIVERY', 'BUY_X_GET_Y');

-- CreateEnum
CREATE TYPE "PromotionScope" AS ENUM ('ENTIRE_ORDER', 'SPECIFIC_ITEMS', 'SPECIFIC_CATEGORIES');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';

-- AlterTable
ALTER TABLE "menu_categories" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "itemType" "MenuItemType" NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "aiMetadata" JSONB,
ADD COLUMN     "allergens" TEXT[],
ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "compareAtPrice" DECIMAL(10,2),
ADD COLUMN     "dietaryLabels" TEXT[],
ADD COLUMN     "drinkContainer" "DrinkContainer",
ADD COLUMN     "drinkTemp" "DrinkTemperature",
ADD COLUMN     "imageStorageKey" TEXT,
ADD COLUMN     "itemType" "MenuItemType" NOT NULL,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "lowStockThreshold" INTEGER DEFAULT 5,
ADD COLUMN     "menuId" TEXT NOT NULL,
ADD COLUMN     "sizes" JSONB,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "spicyLevel" "SpicyLevel" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "stockQuantity" INTEGER,
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume" INTEGER,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "name",
ADD COLUMN     "activeDate" DATE,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "menuType" "MenuType" NOT NULL DEFAULT 'CONSTANT',
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "customizationTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customizations" JSONB,
ADD COLUMN     "lineTotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "preparedAt",
ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "deliveryNotes" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "driverEarnings" DECIMAL(10,2),
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "estimatedDeliveryTime" INTEGER,
ADD COLUMN     "estimatedPrepTime" INTEGER,
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "preparingAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "openingHours",
ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'CM',
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "cuisineTypes" TEXT[],
ADD COLUMN     "currentWaitTime" INTEGER,
ADD COLUMN     "defaultPrepTime" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "deliveryFee" DECIMAL(10,2),
ADD COLUMN     "deliveryRadius" DOUBLE PRECISION,
ADD COLUMN     "freeDeliveryAbove" DECIMAL(10,2),
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "minimumOrderAmount" DECIMAL(10,2),
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pausedUntil" TIMESTAMP(3),
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" "RestaurantStatus" NOT NULL DEFAULT 'CLOSED',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "isActive" SET DEFAULT true;

-- CreateTable
CREATE TABLE "restaurant_managers" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RestaurantManagerRole" NOT NULL DEFAULT 'RESTAURANT_MANAGER',
    "inviteEmail" TEXT,
    "inviteToken" TEXT,
    "inviteExpiry" TIMESTAMP(3),
    "inviteAcceptedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendedById" TEXT,
    "suspendReason" TEXT,
    "permissions" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "restaurant_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_payment_methods" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "provider" "RestaurantPaymentProvider" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumberHash" TEXT NOT NULL,
    "accountNumberEnc" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "restaurant_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_opening_hours" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "shiftIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_special_hours" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT,
    "opensAt" TEXT,
    "closesAt" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_special_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_availability_log" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" "RestaurantStatus" NOT NULL,
    "previousStatus" "RestaurantStatus",
    "reason" TEXT,
    "changedById" TEXT,
    "autoResumeAt" TIMESTAMP(3),
    "waitTimeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_availability_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_media_assets" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_media_assets" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_menu_availability" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "stockQty" INTEGER,
    "priceOverride" DECIMAL(10,2),
    "specialNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_menu_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_customization_groups" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_customization_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_customization_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceAdd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "calories" INTEGER,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_customization_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_drivers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'MOTORCYCLE',
    "vehiclePlate" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "delivery_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "restaurantId" TEXT,
    "menuItemId" TEXT,
    "driverId" TEXT,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "ownerReply" TEXT,
    "ownerRepliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "type" "PromotionType" NOT NULL,
    "scope" "PromotionScope" NOT NULL DEFAULT 'ENTIRE_ORDER',
    "value" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_items" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_menu_item_tags" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "flavorProfile" TEXT[],
    "mealTime" TEXT[],
    "pairsWith" TEXT[],
    "popularityScore" DOUBLE PRECISION,
    "allergens" TEXT[],
    "budgetTier" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_menu_item_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_notification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_managers_inviteToken_key" ON "restaurant_managers"("inviteToken");

-- CreateIndex
CREATE INDEX "restaurant_managers_restaurantId_idx" ON "restaurant_managers"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_managers_userId_idx" ON "restaurant_managers"("userId");

-- CreateIndex
CREATE INDEX "restaurant_managers_inviteToken_idx" ON "restaurant_managers"("inviteToken");

-- CreateIndex
CREATE INDEX "restaurant_managers_inviteEmail_idx" ON "restaurant_managers"("inviteEmail");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_managers_restaurantId_userId_key" ON "restaurant_managers"("restaurantId", "userId");

-- CreateIndex
CREATE INDEX "restaurant_payment_methods_restaurantId_idx" ON "restaurant_payment_methods"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_payment_methods_provider_idx" ON "restaurant_payment_methods"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_payment_methods_restaurantId_provider_accountNum_key" ON "restaurant_payment_methods"("restaurantId", "provider", "accountNumberHash");

-- CreateIndex
CREATE INDEX "restaurant_opening_hours_restaurantId_idx" ON "restaurant_opening_hours"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_opening_hours_restaurantId_dayOfWeek_shiftIndex_key" ON "restaurant_opening_hours"("restaurantId", "dayOfWeek", "shiftIndex");

-- CreateIndex
CREATE INDEX "restaurant_special_hours_restaurantId_idx" ON "restaurant_special_hours"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_special_hours_date_idx" ON "restaurant_special_hours"("date");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_special_hours_restaurantId_date_key" ON "restaurant_special_hours"("restaurantId", "date");

-- CreateIndex
CREATE INDEX "restaurant_availability_log_restaurantId_idx" ON "restaurant_availability_log"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_availability_log_status_idx" ON "restaurant_availability_log"("status");

-- CreateIndex
CREATE INDEX "restaurant_availability_log_createdAt_idx" ON "restaurant_availability_log"("createdAt");

-- CreateIndex
CREATE INDEX "restaurant_media_assets_restaurantId_idx" ON "restaurant_media_assets"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_media_assets_type_idx" ON "restaurant_media_assets"("type");

-- CreateIndex
CREATE INDEX "menu_item_media_assets_menuItemId_idx" ON "menu_item_media_assets"("menuItemId");

-- CreateIndex
CREATE INDEX "daily_menu_availability_date_idx" ON "daily_menu_availability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_menu_availability_menuItemId_date_key" ON "daily_menu_availability"("menuItemId", "date");

-- CreateIndex
CREATE INDEX "item_customization_groups_menuItemId_idx" ON "item_customization_groups"("menuItemId");

-- CreateIndex
CREATE INDEX "item_customization_options_groupId_idx" ON "item_customization_options"("groupId");

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_idx" ON "order_status_history"("orderId");

-- CreateIndex
CREATE INDEX "order_status_history_createdAt_idx" ON "order_status_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_drivers_userId_key" ON "delivery_drivers"("userId");

-- CreateIndex
CREATE INDEX "delivery_drivers_status_idx" ON "delivery_drivers"("status");

-- CreateIndex
CREATE INDEX "delivery_drivers_isVerified_idx" ON "delivery_drivers"("isVerified");

-- CreateIndex
CREATE INDEX "delivery_drivers_currentLat_currentLng_idx" ON "delivery_drivers"("currentLat", "currentLng");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_key" ON "reviews"("orderId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_restaurantId_idx" ON "reviews"("restaurantId");

-- CreateIndex
CREATE INDEX "reviews_menuItemId_idx" ON "reviews"("menuItemId");

-- CreateIndex
CREATE INDEX "reviews_driverId_idx" ON "reviews"("driverId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_targetType_idx" ON "reviews"("targetType");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_restaurantId_idx" ON "promotions"("restaurantId");

-- CreateIndex
CREATE INDEX "promotions_code_idx" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_isActive_idx" ON "promotions"("isActive");

-- CreateIndex
CREATE INDEX "promotions_startsAt_expiresAt_idx" ON "promotions"("startsAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_items_promotionId_menuItemId_key" ON "promotion_items"("promotionId", "menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_menu_item_tags_menuItemId_key" ON "ai_menu_item_tags"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_tokens_token_key" ON "push_notification_tokens"("token");

-- CreateIndex
CREATE INDEX "push_notification_tokens_userId_idx" ON "push_notification_tokens"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "email_verifications_expiresAt_idx" ON "email_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "menu_categories_menuId_idx" ON "menu_categories"("menuId");

-- CreateIndex
CREATE INDEX "menu_categories_itemType_idx" ON "menu_categories"("itemType");

-- CreateIndex
CREATE INDEX "menu_items_menuId_idx" ON "menu_items"("menuId");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "menu_items_itemType_idx" ON "menu_items"("itemType");

-- CreateIndex
CREATE INDEX "menu_items_isAvailable_idx" ON "menu_items"("isAvailable");

-- CreateIndex
CREATE INDEX "menu_items_price_idx" ON "menu_items"("price");

-- CreateIndex
CREATE INDEX "menu_items_totalOrders_idx" ON "menu_items"("totalOrders");

-- CreateIndex
CREATE INDEX "menus_restaurantId_idx" ON "menus"("restaurantId");

-- CreateIndex
CREATE INDEX "menus_menuType_idx" ON "menus"("menuType");

-- CreateIndex
CREATE INDEX "menus_activeDate_idx" ON "menus"("activeDate");

-- CreateIndex
CREATE INDEX "menus_isActive_idx" ON "menus"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "menus_restaurantId_menuType_activeDate_key" ON "menus"("restaurantId", "menuType", "activeDate");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_menuItemId_idx" ON "order_items"("menuItemId");

-- CreateIndex
CREATE INDEX "orders_driverId_idx" ON "orders"("driverId");

-- CreateIndex
CREATE INDEX "orders_placedAt_idx" ON "orders"("placedAt");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_provider_idx" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "payments_providerRef_idx" ON "payments"("providerRef");

-- CreateIndex
CREATE INDEX "refresh_tokens_isRevoked_idx" ON "refresh_tokens"("isRevoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "restaurants_ownerId_idx" ON "restaurants"("ownerId");

-- CreateIndex
CREATE INDEX "restaurants_city_idx" ON "restaurants"("city");

-- CreateIndex
CREATE INDEX "restaurants_status_idx" ON "restaurants"("status");

-- CreateIndex
CREATE INDEX "restaurants_verificationStatus_idx" ON "restaurants"("verificationStatus");

-- CreateIndex
CREATE INDEX "restaurants_isActive_idx" ON "restaurants"("isActive");

-- CreateIndex
CREATE INDEX "restaurants_lat_lng_idx" ON "restaurants"("lat", "lng");

-- CreateIndex
CREATE INDEX "user_sessions_isActive_idx" ON "user_sessions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_userId_deviceId_key" ON "user_sessions"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- AddForeignKey
ALTER TABLE "restaurant_managers" ADD CONSTRAINT "restaurant_managers_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_managers" ADD CONSTRAINT "restaurant_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payment_methods" ADD CONSTRAINT "restaurant_payment_methods_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_opening_hours" ADD CONSTRAINT "restaurant_opening_hours_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_special_hours" ADD CONSTRAINT "restaurant_special_hours_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_availability_log" ADD CONSTRAINT "restaurant_availability_log_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_media_assets" ADD CONSTRAINT "restaurant_media_assets_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_media_assets" ADD CONSTRAINT "menu_item_media_assets_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_menu_availability" ADD CONSTRAINT "daily_menu_availability_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_customization_groups" ADD CONSTRAINT "item_customization_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_customization_options" ADD CONSTRAINT "item_customization_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "item_customization_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "delivery_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_drivers" ADD CONSTRAINT "delivery_drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "delivery_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_items" ADD CONSTRAINT "promotion_items_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_items" ADD CONSTRAINT "promotion_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_notification_tokens" ADD CONSTRAINT "push_notification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
