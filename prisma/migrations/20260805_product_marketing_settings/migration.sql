-- Chaque produit dispose désormais de sa propre activation et de ses propres textes J+3/J+5/J+7.
ALTER TABLE "products"
ADD COLUMN "marketingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketingTemplateJ3" TEXT NOT NULL DEFAULT 'Bonjour {prenom}, {produit} est toujours disponible. Voir l''offre : {lien} - AFGestion',
ADD COLUMN "marketingTemplateJ5" TEXT NOT NULL DEFAULT 'Bonjour {prenom}, profitez toujours de {produit}. Commandez ici : {lien} - AFGestion',
ADD COLUMN "marketingTemplateJ7" TEXT NOT NULL DEFAULT 'Bonjour {prenom}, derniere relance pour {produit}. Offre ici : {lien} - AFGestion';

-- Conserver les textes globaux existants comme copie initiale, puis chaque produit évoluera indépendamment.
UPDATE "products"
SET
  "marketingEnabled" = "marketingFunnelUrl" IS NOT NULL,
  "marketingTemplateJ3" = COALESCE(
    (SELECT "template" FROM "sms_templates" WHERE "key" = 'MARKETING_RELANCE_J3' LIMIT 1),
    "marketingTemplateJ3"
  ),
  "marketingTemplateJ5" = COALESCE(
    (SELECT "template" FROM "sms_templates" WHERE "key" = 'MARKETING_RELANCE_J5' LIMIT 1),
    "marketingTemplateJ5"
  ),
  "marketingTemplateJ7" = COALESCE(
    (SELECT "template" FROM "sms_templates" WHERE "key" = 'MARKETING_RELANCE_J7' LIMIT 1),
    "marketingTemplateJ7"
  );
