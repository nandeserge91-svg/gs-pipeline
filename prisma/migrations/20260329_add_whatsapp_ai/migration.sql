-- CreateEnum
CREATE TYPE "WhatsAppSender" AS ENUM ('CLIENT', 'BOT', 'AGENT');

-- CreateEnum
CREATE TYPE "WhatsAppIntent" AS ENUM ('UNKNOWN', 'PRODUCT_INFO', 'CUSTOMER_SERVICE', 'AFTER_SALES', 'ORDER');

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "clientName" TEXT,
    "currentIntent" "WhatsAppIntent" NOT NULL DEFAULT 'UNKNOWN',
    "state" JSONB,
    "handedToHuman" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "sender" "WhatsAppSender" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_phoneNumber_key" ON "whatsapp_conversations"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_phoneNumber_idx" ON "whatsapp_conversations"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_currentIntent_idx" ON "whatsapp_conversations"("currentIntent");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_lastMessageAt_idx" ON "whatsapp_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversationId_idx" ON "whatsapp_messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_createdAt_idx" ON "whatsapp_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
