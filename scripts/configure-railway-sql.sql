-- ═══════════════════════════════════════════════════════════════════════════════
-- 🚀 CONFIGURATION COMPLÈTE DES LOCALISATIONS SUR RAILWAY
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- INSTRUCTIONS :
-- 1. Allez sur Railway → Service PostgreSQL → Data → Query
-- 2. Copiez-collez ce script
-- 3. Cliquez sur "Run"
-- 
-- ═══════════════════════════════════════════════════════════════════════════════

-- ÉTAPE 1 : Supprimer les anciennes localisations (si elles existent)
DELETE FROM "store_config";

-- ÉTAPE 2 : Insérer les 2 localisations d'Abidjan
INSERT INTO "store_config" (
  "nom", 
  "adresse", 
  "latitude", 
  "longitude", 
  "rayonTolerance", 
  "heureOuverture", 
  "heureFermeture", 
  "toleranceRetard", 
  "createdAt", 
  "updatedAt"
) VALUES 
(
  'Magasin Principal Abidjan',
  'Abidjan, Côte d''Ivoire',
  5.353021,
  -3.870182,
  75,
  '08:00',
  '18:00',
  15,
  NOW(),
  NOW()
),
(
  'Magasin Secondaire Abidjan',
  'Abidjan, Côte d''Ivoire (Site 2)',
  5.354687,
  -3.872683,
  75,
  '08:00',
  '18:00',
  15,
  NOW(),
  NOW()
);

-- ÉTAPE 3 : Vérifier que l'insertion a fonctionné
SELECT 
  id,
  nom,
  latitude,
  longitude,
  "rayonTolerance" AS rayon,
  "heureOuverture" AS ouverture,
  "heureFermeture" AS fermeture
FROM "store_config"
ORDER BY id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ RÉSULTAT ATTENDU
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Vous devriez voir 2 lignes :
-- 
-- ID | Nom                           | Latitude  | Longitude  | Rayon | Ouverture | Fermeture
-- ---+-------------------------------+-----------+------------+-------+-----------+-----------
--  1 | Magasin Principal Abidjan     | 5.353021  | -3.870182  | 75    | 08:00     | 18:00
--  2 | Magasin Secondaire Abidjan    | 5.354687  | -3.872683  | 75    | 08:00     | 18:00
-- 
-- ═══════════════════════════════════════════════════════════════════════════════
-- 🎉 TERMINÉ !
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Maintenant :
-- 1. Testez le pointage depuis le frontend (https://afgestion.net)
-- 2. Vous devriez pouvoir pointer si vous êtes à moins de 75m d'un des magasins
-- 
-- ═══════════════════════════════════════════════════════════════════════════════

