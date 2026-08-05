-- Relances marketing J+3, J+5 et J+7 pour les commandes annulées par un appelant.
ALTER TABLE "orders" ADD COLUMN "marketingCancelledAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "marketingFunnelUrl" TEXT;

CREATE INDEX "orders_status_marketingCancelledAt_idx"
ON "orders"("status", "marketingCancelledAt");

ALTER TYPE "SmsType" ADD VALUE IF NOT EXISTS 'MARKETING_RELANCE_J3';
ALTER TYPE "SmsType" ADD VALUE IF NOT EXISTS 'MARKETING_RELANCE_J5';
ALTER TYPE "SmsType" ADD VALUE IF NOT EXISTS 'MARKETING_RELANCE_J7';

CREATE TYPE "MarketingReminderStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED',
  'CANCELLED',
  'SKIPPED'
);

CREATE TABLE "marketing_reminders" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "cancellationAt" TIMESTAMP(3) NOT NULL,
  "dayOffset" INTEGER NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "MarketingReminderStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "smsLogId" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "marketing_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_reminders_orderId_cancellationAt_dayOffset_key"
ON "marketing_reminders"("orderId", "cancellationAt", "dayOffset");

CREATE INDEX "marketing_reminders_status_dueAt_idx"
ON "marketing_reminders"("status", "dueAt");

CREATE INDEX "marketing_reminders_orderId_idx"
ON "marketing_reminders"("orderId");

ALTER TABLE "marketing_reminders"
ADD CONSTRAINT "marketing_reminders_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "sms_templates" (
  "key", "label", "description", "category", "icon", "template",
  "defaultTemplate", "variables", "characterCount", "isActive",
  "lastModifiedAt", "createdAt", "updatedAt"
) VALUES
(
  'MARKETING_RELANCE_J3',
  'Relance marketing J+3',
  'SMS envoyé 3 jours après l’annulation d’une commande par un appelant',
  'Marketing',
  '📣',
  'Bonjour {prenom}, {produit} est toujours disponible. Voir l''offre : {lien} - AFGestion',
  'Bonjour {prenom}, {produit} est toujours disponible. Voir l''offre : {lien} - AFGestion',
  '["prenom", "produit", "lien"]',
  char_length('Bonjour {prenom}, {produit} est toujours disponible. Voir l''offre : {lien} - AFGestion'),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'MARKETING_RELANCE_J5',
  'Relance marketing J+5',
  'SMS envoyé 5 jours après l’annulation d’une commande par un appelant',
  'Marketing',
  '📣',
  'Bonjour {prenom}, profitez toujours de {produit}. Commandez ici : {lien} - AFGestion',
  'Bonjour {prenom}, profitez toujours de {produit}. Commandez ici : {lien} - AFGestion',
  '["prenom", "produit", "lien"]',
  char_length('Bonjour {prenom}, profitez toujours de {produit}. Commandez ici : {lien} - AFGestion'),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'MARKETING_RELANCE_J7',
  'Relance marketing J+7',
  'Dernier SMS envoyé 7 jours après l’annulation d’une commande par un appelant',
  'Marketing',
  '📣',
  'Bonjour {prenom}, derniere relance pour {produit}. Offre ici : {lien} - AFGestion',
  'Bonjour {prenom}, derniere relance pour {produit}. Offre ici : {lien} - AFGestion',
  '["prenom", "produit", "lien"]',
  char_length('Bonjour {prenom}, derniere relance pour {produit}. Offre ici : {lien} - AFGestion'),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
