-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "SmsType" AS ENUM ('NOTIFICATION', 'ORDER_CREATED', 'ORDER_VALIDATED', 'DELIVERY_ASSIGNED', 'ORDER_DELIVERED', 'EXPEDITION', 'EXPRESS_ARRIVED', 'EXPRESS_REMINDER', 'RDV_SCHEDULED', 'RDV_REMINDER', 'ALERT');

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'SMS8',
    "providerId" TEXT,
    "errorMessage" TEXT,
    "orderId" INTEGER,
    "userId" INTEGER,
    "type" "SmsType" NOT NULL DEFAULT 'NOTIFICATION',
    "credits" INTEGER,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_logs_orderId_idx" ON "sms_logs"("orderId");

-- CreateIndex
CREATE INDEX "sms_logs_userId_idx" ON "sms_logs"("userId");

-- CreateIndex
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");

-- CreateIndex
CREATE INDEX "sms_logs_type_idx" ON "sms_logs"("type");

-- CreateIndex
CREATE INDEX "sms_logs_sentAt_idx" ON "sms_logs"("sentAt");

-- CreateIndex
CREATE INDEX "sms_logs_phoneNumber_idx" ON "sms_logs"("phoneNumber");

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
