-- 📍 SYSTÈME DE POINTAGE GÉOLOCALISÉ
-- Migration créée le 22/01/2026

-- Création de la table de configuration du magasin
CREATE TABLE "store_config" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Magasin Principal',
    "adresse" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rayonTolerance" INTEGER NOT NULL DEFAULT 50,
    "heureOuverture" TEXT NOT NULL DEFAULT '08:00',
    "heureFermeture" TEXT NOT NULL DEFAULT '18:00',
    "toleranceRetard" INTEGER NOT NULL DEFAULT 15,
    "joursOuvres" TEXT NOT NULL DEFAULT '["lundi","mardi","mercredi","jeudi","vendredi","samedi"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_config_pkey" PRIMARY KEY ("id")
);

-- Création de la table des pointages
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "heureArrivee" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureDepart" TIMESTAMP(3),
    "latitudeArrivee" DOUBLE PRECISION NOT NULL,
    "longitudeArrivee" DOUBLE PRECISION NOT NULL,
    "distanceArrivee" DOUBLE PRECISION NOT NULL,
    "latitudeDepart" DOUBLE PRECISION,
    "longitudeDepart" DOUBLE PRECISION,
    "distanceDepart" DOUBLE PRECISION,
    "validee" BOOLEAN NOT NULL DEFAULT false,
    "validation" TEXT,
    "note" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- Création des index pour optimiser les requêtes
CREATE INDEX "attendances_userId_idx" ON "attendances"("userId");
CREATE INDEX "attendances_date_idx" ON "attendances"("date");
CREATE INDEX "attendances_validee_idx" ON "attendances"("validee");
CREATE INDEX "attendances_validation_idx" ON "attendances"("validation");

-- Création de la contrainte unique (un seul pointage par utilisateur par jour)
CREATE UNIQUE INDEX "attendances_userId_date_key" ON "attendances"("userId", "date");

-- Ajout de la clé étrangère
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insertion d'une configuration par défaut du magasin (Abidjan, Côte d'Ivoire)
-- IMPORTANT: Modifier ces coordonnées avec celles de votre magasin réel
INSERT INTO "store_config" ("nom", "adresse", "latitude", "longitude", "rayonTolerance", "heureOuverture", "heureFermeture", "toleranceRetard", "joursOuvres", "updatedAt")
VALUES (
    'Magasin Principal',
    'Abidjan, Côte d''Ivoire',
    5.3599517,
    -4.0082563,
    50,
    '08:00',
    '18:00',
    15,
    '["lundi","mardi","mercredi","jeudi","vendredi","samedi"]',
    CURRENT_TIMESTAMP
);

