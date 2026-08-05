-- Mettre à jour le message par défaut sans écraser un template personnalisé.
UPDATE "sms_templates"
SET
  "template" = CASE
    WHEN "template" = "defaultTemplate" THEN 'Bonjour {prenom}, votre colis a ete confie au livreur {livreur}. Il est en route vers vous. Contact: {telephone}. - AFGestion'
    ELSE "template"
  END,
  "defaultTemplate" = 'Bonjour {prenom}, votre colis a ete confie au livreur {livreur}. Il est en route vers vous. Contact: {telephone}. - AFGestion',
  "description" = 'SMS envoyé au client quand son colis est assigné à un livreur',
  "variables" = '["prenom", "livreur", "telephone"]',
  "characterCount" = CASE
    WHEN "template" = "defaultTemplate" THEN char_length('Bonjour {prenom}, votre colis a ete confie au livreur {livreur}. Il est en route vers vous. Contact: {telephone}. - AFGestion')
    ELSE char_length("template")
  END,
  "lastModifiedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'DELIVERY_ASSIGNED';
