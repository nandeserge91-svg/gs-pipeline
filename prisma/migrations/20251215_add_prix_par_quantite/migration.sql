-- AlterTable
ALTER TABLE "products" ADD COLUMN "prix1" DOUBLE PRECISION,
ADD COLUMN "prix2" DOUBLE PRECISION,
ADD COLUMN "prix3" DOUBLE PRECISION;

-- Initialiser prix1 avec prixUnitaire existant pour compatibilité
UPDATE "products" SET "prix1" = "prixUnitaire" WHERE "prix1" IS NULL;
