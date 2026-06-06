-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExtendedOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_FAILED', 'PAYMENT_SUCCESS', 'PENDING_RESTAURANT_CONFIRMATION', 'ACCEPTED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ExtendedPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('WAITING_ASSIGNMENT', 'DRIVER_ASSIGNED', 'PICKED_UP', 'ON_ROUTE', 'DELIVERED');

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "promoCode" TEXT,
    "discountAmount" DECIMAL(10,2),
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "customizationTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item_customizations" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "priceAdd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_item_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerRef" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "status" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhooks" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failReason" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_tracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'WAITING_ASSIGNMENT',
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "estimatedMinutes" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "actualMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_location_history" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "carts"("userId");

-- CreateIndex
CREATE INDEX "carts_userId_idx" ON "carts"("userId");

-- CreateIndex
CREATE INDEX "carts_restaurantId_idx" ON "carts"("restaurantId");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- CreateIndex
CREATE INDEX "cart_items_menuItemId_idx" ON "cart_items"("menuItemId");

-- CreateIndex
CREATE INDEX "cart_item_customizations_cartItemId_idx" ON "cart_item_customizations"("cartItemId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_providerRef_key" ON "payment_transactions"("providerRef");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentId_idx" ON "payment_transactions"("paymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_providerRef_idx" ON "payment_transactions"("providerRef");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_webhooks_provider_idx" ON "payment_webhooks"("provider");

-- CreateIndex
CREATE INDEX "payment_webhooks_isProcessed_idx" ON "payment_webhooks"("isProcessed");

-- CreateIndex
CREATE INDEX "payment_attempts_paymentId_idx" ON "payment_attempts"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_tracking_orderId_key" ON "delivery_tracking"("orderId");

-- CreateIndex
CREATE INDEX "delivery_tracking_orderId_idx" ON "delivery_tracking"("orderId");

-- CreateIndex
CREATE INDEX "delivery_tracking_driverId_idx" ON "delivery_tracking"("driverId");

-- CreateIndex
CREATE INDEX "delivery_tracking_status_idx" ON "delivery_tracking"("status");

-- CreateIndex
CREATE INDEX "delivery_location_history_trackingId_idx" ON "delivery_location_history"("trackingId");

-- CreateIndex
CREATE INDEX "delivery_location_history_recordedAt_idx" ON "delivery_location_history"("recordedAt");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item_customizations" ADD CONSTRAINT "cart_item_customizations_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "delivery_drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_location_history" ADD CONSTRAINT "delivery_location_history_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "delivery_tracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
