-- 📍 CONFIGURATION AUTOMATIQUE DU MAGASIN - ABIDJAN
-- Coordonnées GPS : 5°21'10.9"N 3°52'12.7"W
-- Lieu : Abidjan, Côte d'Ivoire

-- Supprimer l'ancienne configuration si elle existe
DELETE FROM "store_config";

-- Insérer la nouvelle configuration avec les coordonnées d'Abidjan
INSERT INTO "store_config" (
    "nom",
    "adresse",
    "latitude",
    "longitude",
    "rayonTolerance",
    "heureOuverture",
    "heureFermeture",
    "toleranceRetard",
    "joursOuvres",
    "updatedAt"
) VALUES (
    'GS Pipeline - Abidjan',
    'Abidjan, Côte d''Ivoire',
    5.353021,
    -3.870182,
    50,
    '08:00',
    '18:00',
    15,
    '["lundi","mardi","mercredi","jeudi","vendredi","samedi"]',
    CURRENT_TIMESTAMP
);

-- Vérifier l'insertion
SELECT 
    id,
    nom,
    adresse,
    latitude,
    longitude,
    "rayonTolerance",
    "heureOuverture",
    "heureFermeture"
FROM "store_config";

