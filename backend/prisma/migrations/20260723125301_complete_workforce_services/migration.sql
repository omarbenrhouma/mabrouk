-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SHIFT_PUBLISHED', 'SHIFT_UPDATED', 'REQUEST_CREATED', 'REQUEST_REVIEWED', 'ATTENDANCE_ANOMALY');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "breakEndedAt" TIMESTAMP(3),
ADD COLUMN     "breakStartedAt" TIMESTAMP(3),
ADD COLUMN     "varianceMins" INTEGER;

-- AlterTable
ALTER TABLE "ChangeRequest" ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "EmployeeProfile" ADD COLUMN     "availability" JSONB,
ADD COLUMN     "jobTitle" TEXT NOT NULL DEFAULT 'Vendeur';

-- AlterTable
ALTER TABLE "ScheduleShift" ADD COLUMN     "position" TEXT NOT NULL DEFAULT 'Vente';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "ChangeRequest_shiftId_idx" ON "ChangeRequest"("shiftId");

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "ScheduleShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
