-- Toutes les relances EXPRESS sont envoyées à 08:30, heure d'Abidjan (UTC).
-- Les messages déjà envoyés restent inchangés ; seules les échéances restantes sont recalées.
UPDATE "express_reminders"
SET
  "dueAt" = date_trunc('day', "arrivedAt")
    + ("dayOffset" * INTERVAL '1 day')
    + INTERVAL '8 hours 30 minutes',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('PENDING', 'PROCESSING', 'FAILED');

UPDATE "sms_templates"
SET
  "description" = 'Rappels de retrait EXPRESS envoyés à 8h30 à J+1, J+2, J+3, J+5 et J+7',
  "lastModifiedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'EXPRESS_REMINDER';
