-- AlterTable
-- Ajout du champ renvoyeAAppelerAt pour prioriser l'affichage des commandes renvoyées vers "À appeler"
ALTER TABLE "orders" ADD COLUMN "renvoyeAAppelerAt" TIMESTAMP(3);

-- Créer un index pour optimiser le tri
CREATE INDEX "orders_renvoyeAAppelerAt_idx" ON "orders"("renvoyeAAppelerAt");
