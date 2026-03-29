-- CreateTable
CREATE TABLE "whatsapp_product_knowledge" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "keyBenefits" TEXT,
    "usageTips" TEXT,
    "objectionHandling" JSONB,
    "faq" JSONB,
    "closingScript" TEXT,
    "missingInfoEscalation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_product_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_product_knowledge_productId_key" ON "whatsapp_product_knowledge"("productId");

-- CreateIndex
CREATE INDEX "whatsapp_product_knowledge_productId_idx" ON "whatsapp_product_knowledge"("productId");

-- AddForeignKey
ALTER TABLE "whatsapp_product_knowledge"
ADD CONSTRAINT "whatsapp_product_knowledge_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
