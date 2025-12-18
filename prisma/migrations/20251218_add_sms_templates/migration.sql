-- CreateTable
CREATE TABLE "sms_templates" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "defaultTemplate" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastModifiedAt" TIMESTAMP(3) NOT NULL,
    "lastModifiedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_key_key" ON "sms_templates"("key");

-- CreateIndex
CREATE INDEX "sms_templates_key_idx" ON "sms_templates"("key");

-- CreateIndex
CREATE INDEX "sms_templates_category_idx" ON "sms_templates"("category");

-- Insérer les templates par défaut
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount", "isActive", "lastModifiedAt", "updatedAt") VALUES
('ORDER_CREATED', 'Commande reçue', 'SMS envoyé quand une nouvelle commande est créée', 'Commandes', '📥', 'Bonjour {prenom}, votre commande {ref} est enregistree. Nous vous appellerons bientot. - AFGestion', 'Bonjour {prenom}, votre commande {ref} est enregistree. Nous vous appellerons bientot. - AFGestion', '["prenom", "ref"]', 99, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('ORDER_VALIDATED', 'Commande validée', 'SMS envoyé quand une commande est validée', 'Commandes', '✅', 'Bonjour {prenom}, votre commande {produit} ({montant} F) est confirmee. Livraison prochainement. - AFGestion', 'Bonjour {prenom}, votre commande {produit} ({montant} F) est confirmee. Livraison prochainement. - AFGestion', '["prenom", "produit", "montant"]', 104, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('DELIVERY_ASSIGNED', 'Livreur en route', 'SMS envoyé quand un livreur est assigné', 'Livraison', '🚚', 'Bonjour {prenom}, votre livreur {livreur} ({telephone}) est en route. - AFGestion', 'Bonjour {prenom}, votre livreur {livreur} ({telephone}) est en route. - AFGestion', '["prenom", "livreur", "telephone"]', 81, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('ORDER_DELIVERED', 'Commande livrée', 'SMS envoyé quand une commande est livrée', 'Commandes', '✅', 'Bonjour {prenom}, votre commande {ref} a ete livree avec succes. Merci de votre confiance ! - AFGestion', 'Bonjour {prenom}, votre commande {ref} a ete livree avec succes. Merci de votre confiance ! - AFGestion', '["prenom", "ref"]', 104, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('EXPEDITION_CONFIRMED', 'Expédition confirmée', 'SMS envoyé quand une expédition est confirmée (100%)', 'Expédition', '📦', 'Bonjour {prenom}, votre colis a ete expedie vers {ville}. Code suivi: {code}. - AFGestion', 'Bonjour {prenom}, votre colis a ete expedie vers {ville}. Code suivi: {code}. - AFGestion', '["prenom", "ville", "code"]', 83, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('EXPRESS_ARRIVED', 'Express arrivé', 'SMS envoyé quand un colis EXPRESS arrive en agence', 'Express', '🏢', 'Bonjour {prenom}, votre colis est arrive a {agence}. Code retrait: {code}. A payer: {montant} F. - AFGestion', 'Bonjour {prenom}, votre colis est arrive a {agence}. Code retrait: {code}. A payer: {montant} F. - AFGestion', '["prenom", "agence", "code", "montant"]', 109, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('EXPRESS_REMINDER', 'Rappel retrait Express', 'SMS de rappel si le client tarde à retirer son colis', 'Express', '🏢', 'Bonjour {prenom}, votre colis vous attend a {agence} depuis {jours} jours. Code: {code}. - AFGestion', 'Bonjour {prenom}, votre colis vous attend a {agence} depuis {jours} jours. Code: {code}. - AFGestion', '["prenom", "agence", "jours", "code"]', 98, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('RDV_SCHEDULED', 'RDV programmé', 'SMS envoyé quand un RDV est programmé', 'RDV', '📅', 'Bonjour {prenom}, RDV programme le {date} a {heure}. Merci de rester disponible. - AFGestion', 'Bonjour {prenom}, RDV programme le {date} a {heure}. Merci de rester disponible. - AFGestion', '["prenom", "date", "heure"]', 95, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('RDV_REMINDER', 'Rappel RDV', 'SMS de rappel 1h avant le RDV', 'RDV', '📅', 'Bonjour {prenom}, rappel de votre RDV a {heure}. Nous vous appellerons bientot. - AFGestion', 'Bonjour {prenom}, rappel de votre RDV a {heure}. Nous vous appellerons bientot. - AFGestion', '["prenom", "heure"]', 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('ORDER_CANCELLED', 'Commande annulée', 'SMS envoyé quand une commande est annulée', 'Commandes', '❌', 'Bonjour {prenom}, votre commande {ref} a ete annulee comme demande. - AFGestion', 'Bonjour {prenom}, votre commande {ref} a ete annulee comme demande. - AFGestion', '["prenom", "ref"]', 81, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('PAYMENT_CONFIRMED', 'Paiement confirmé', 'SMS envoyé quand un paiement est confirmé', 'Expédition', '💰', 'Bonjour {prenom}, paiement de {montant} F recu pour la commande {ref}. Merci ! - AFGestion', 'Bonjour {prenom}, paiement de {montant} F recu pour la commande {ref}. Merci ! - AFGestion', '["prenom", "montant", "ref"]', 89, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
