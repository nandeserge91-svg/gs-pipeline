-- 🚀 OPTIMISATION PERFORMANCE - INDEXES POUR "À APPELER"
-- 
-- Ces indexes accélèrent drastiquement les requêtes sur :
-- - status (NOUVELLE, A_APPELER)
-- - deliveryType (EXPEDITION, EXPRESS)
-- - createdAt (tri des commandes)
-- - callerId (filtre par appelant)
-- - delivererId (filtre par livreur)

-- Index sur le statut (très utilisé pour filtrer)
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "orders"("status");

-- Index sur le type de livraison
CREATE INDEX IF NOT EXISTS "idx_order_delivery_type" ON "orders"("deliveryType");

-- Index sur la date de création (utilisé pour le tri)
CREATE INDEX IF NOT EXISTS "idx_order_created_at" ON "orders"("createdAt" DESC);

-- Index sur l'appelant (pour filtrer les commandes d'un appelant)
CREATE INDEX IF NOT EXISTS "idx_order_caller_id" ON "orders"("callerId");

-- Index sur le livreur (pour filtrer les commandes d'un livreur)
CREATE INDEX IF NOT EXISTS "idx_order_deliverer_id" ON "orders"("delivererId");

-- Index composé pour la requête "À APPELER" (APPELANT)
-- Combine status + deliveryType pour accélérer la requête principale
CREATE INDEX IF NOT EXISTS "idx_order_appelant_filter" 
ON "orders"("status", "deliveryType", "createdAt" DESC);

-- Index sur la ville (recherche par ville)
CREATE INDEX IF NOT EXISTS "idx_order_ville" ON "orders"("clientVille");

-- Index sur le téléphone (recherche par téléphone)
CREATE INDEX IF NOT EXISTS "idx_order_telephone" ON "orders"("clientTelephone");

-- Index sur la référence (recherche par référence)
CREATE INDEX IF NOT EXISTS "idx_order_reference" ON "orders"("orderReference");

-- Index sur renvoyeAAppelerAt (pour les commandes prioritaires)
CREATE INDEX IF NOT EXISTS "idx_order_renvoye_at" ON "orders"("renvoyeAAppelerAt" DESC NULLS LAST);

