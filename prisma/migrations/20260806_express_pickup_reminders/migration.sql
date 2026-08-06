CREATE TYPE "ExpressReminderStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED',
  'CANCELLED',
  'SKIPPED'
);

CREATE TYPE "ExpressReminderChannel" AS ENUM ('SMS', 'WHATSAPP');

CREATE TABLE "express_reminders" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "arrivedAt" TIMESTAMP(3) NOT NULL,
  "dayOffset" INTEGER NOT NULL,
  "channel" "ExpressReminderChannel" NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "ExpressReminderStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "smsLogId" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "express_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "express_reminders_orderId_arrivedAt_dayOffset_channel_key"
ON "express_reminders"("orderId", "arrivedAt", "dayOffset", "channel");

CREATE INDEX "express_reminders_status_dueAt_idx"
ON "express_reminders"("status", "dueAt");

CREATE INDEX "express_reminders_orderId_idx"
ON "express_reminders"("orderId");

ALTER TABLE "express_reminders"
ADD CONSTRAINT "express_reminders_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "express_reminders" (
  "orderId", "arrivedAt", "dayOffset", "channel", "dueAt", "updatedAt"
)
SELECT
  orders."id",
  orders."arriveAt",
  offsets."dayOffset",
  channels."channel",
  orders."arriveAt" + (offsets."dayOffset" * INTERVAL '1 day'),
  CURRENT_TIMESTAMP
FROM "orders"
CROSS JOIN (VALUES (1), (2), (3), (5), (7)) AS offsets("dayOffset")
CROSS JOIN (
  VALUES
    ('SMS'::"ExpressReminderChannel"),
    ('WHATSAPP'::"ExpressReminderChannel")
) AS channels("channel")
WHERE orders."status" = 'EXPRESS_ARRIVE'
  AND orders."arriveAt" IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE "sms_templates"
SET
  "template" = CASE
    WHEN "template" = "defaultTemplate"
      THEN 'Bonjour {prenom}, rappel: votre colis vous attend a {agence} depuis {delai}. Code: {code}. Merci de le retirer. - AFGestion'
    ELSE "template"
  END,
  "defaultTemplate" = 'Bonjour {prenom}, rappel: votre colis vous attend a {agence} depuis {delai}. Code: {code}. Merci de le retirer. - AFGestion',
  "description" = 'Rappels de retrait EXPRESS à 24h, 48h, 72h, J+5 et J+7',
  "variables" = '["prenom", "agence", "jours", "delai", "code"]',
  "characterCount" = CASE
    WHEN "template" = "defaultTemplate"
      THEN char_length('Bonjour {prenom}, rappel: votre colis vous attend a {agence} depuis {delai}. Code: {code}. Merci de le retirer. - AFGestion')
    ELSE char_length("template")
  END,
  "lastModifiedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'EXPRESS_REMINDER';
