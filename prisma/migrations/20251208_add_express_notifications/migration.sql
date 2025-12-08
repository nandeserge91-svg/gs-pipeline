-- CreateTable
CREATE TABLE "express_notifications" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "note" TEXT,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "express_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "express_notifications_orderId_idx" ON "express_notifications"("orderId");

-- CreateIndex
CREATE INDEX "express_notifications_userId_idx" ON "express_notifications"("userId");

-- AddForeignKey
ALTER TABLE "express_notifications" ADD CONSTRAINT "express_notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "express_notifications" ADD CONSTRAINT "express_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

