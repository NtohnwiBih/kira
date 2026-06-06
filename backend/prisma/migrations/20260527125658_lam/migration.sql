/*
  Warnings:

  - A unique constraint covering the columns `[userId,deviceId]` on the table `user_sessions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `deviceId` on table `user_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user_sessions" ALTER COLUMN "deviceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_userId_deviceId_key" ON "user_sessions"("userId", "deviceId");
