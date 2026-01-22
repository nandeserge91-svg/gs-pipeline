-- 📏 Mise à Jour du Rayon de Tolérance à 75 mètres
-- 
-- Exécuter depuis Railway PostgreSQL Query ou depuis psql
--
-- Date: 2026-01-22

-- Mettre à jour TOUTES les localisations à 75m
UPDATE "store_config"
SET "rayonTolerance" = 75,
    "updatedAt" = NOW();

-- Vérifier la mise à jour
SELECT 
  id,
  nom,
  "rayonTolerance" AS "rayon_metres",
  latitude,
  longitude,
  "heureOuverture",
  "heureFermeture"
FROM "store_config"
ORDER BY id;

