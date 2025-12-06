-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockMovementType" ADD VALUE 'RESERVATION_EXPRESS';
ALTER TYPE "StockMovementType" ADD VALUE 'RETRAIT_EXPRESS';
ALTER TYPE "StockMovementType" ADD VALUE 'ANNULATION_EXPRESS';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stockExpress" INTEGER NOT NULL DEFAULT 0;
