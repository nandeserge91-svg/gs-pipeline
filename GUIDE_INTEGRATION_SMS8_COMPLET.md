# 📋 GUIDE COMPLET - INTÉGRATION SMS8.IO AVEC ANDROID

**Guide autonome pour implémenter un système SMS complet avec SMS8.io**

---

## 🎯 OBJECTIF

Implémenter un système SMS professionnel avec :
- ✅ Envoi automatique de SMS via Android dédié (SMS8.io)
- ✅ 11 types de SMS configurables
- ✅ Templates personnalisables depuis l'interface admin
- ✅ Panneau de contrôle complet
- ✅ Historique et statistiques
- ✅ Nettoyage automatique des numéros de téléphone

---

## 📊 PRÉREQUIS

### Stack technique requise
- ✅ Backend : Node.js + Express
- ✅ ORM : Prisma (PostgreSQL)
- ✅ Frontend : React + TypeScript
- ✅ Authentification : JWT avec rôles (ADMIN, GESTIONNAIRE, etc.)

### Compte SMS8.io requis
- ✅ Compte actif sur https://app.sms8.io/
- ✅ Android connecté avec SIM
- ✅ API Key générée
- ✅ Device ID récupéré

---

## 📂 ARCHITECTURE FINALE

```
Backend/
├── config/
│   └── prisma.js                          (existant)
├── services/
│   └── sms.service.js                     🆕 Service SMS
├── routes/
│   ├── sms.routes.js                      🆕 Routes SMS
│   ├── sms-settings.routes.js             🆕 Routes paramètres
│   ├── sms-templates.routes.js            🆕 Routes templates
│   ├── order.routes.js                    ✏️ Modifier (ajouter SMS)
│   ├── webhook.routes.js                  ✏️ Modifier (ajouter SMS)
│   └── [autres routes métier].routes.js   ✏️ Modifier si SMS nécessaires
├── middlewares/
│   └── auth.middleware.js                 (existant)
├── utils/
│   └── phone.util.js                      🆕 Nettoyage numéros
├── prisma/
│   ├── schema.prisma                      ✏️ Modifier (ajouter tables SMS)
│   └── migrations/
│       └── YYYYMMDD_add_sms/              🆕 Nouvelles migrations
│           └── migration.sql
└── server.js                              ✏️ Modifier (ajouter routes)

Frontend/
├── src/
│   ├── pages/
│   │   └── admin/
│   │       ├── SmsSettings.tsx            🆕 Panneau SMS
│   │       ├── SmsTemplateEditor.tsx      🆕 Éditeur templates
│   │       └── Dashboard.tsx              ✏️ Modifier (ajouter lien)
│   ├── components/
│   │   └── Layout.tsx                     ✏️ Modifier (ajouter menu)
│   └── lib/
│       └── api.ts                         (existant)
```

---

## 🗄️ ÉTAPE 1 : SCHÉMA BASE DE DONNÉES

### 1.1. Modifier `prisma/schema.prisma`

Ajoutez ces éléments à votre schéma existant :

```prisma
// ==========================================
// 📱 SMS8.IO - GESTION SMS
// ==========================================

// Enum pour les statuts SMS
enum SmsStatus {
  SENT
  FAILED
  PENDING
}

// Enum pour les types de SMS (11 types)
enum SmsType {
  ORDER_CREATED              // Commande créée
  ORDER_VALIDATED            // Commande validée
  ORDER_DELIVERED            // Commande livrée
  ORDER_CANCELLED            // Commande annulée
  EXPEDITION_CONFIRMED       // Expédition confirmée
  EXPEDITION_EN_ROUTE        // Expédition en route
  EXPRESS_ARRIVED            // Express arrivé
  EXPRESS_PAYMENT_PENDING    // Attente paiement express
  RDV_SCHEDULED              // RDV programmé
  RDV_REMINDER               // Rappel RDV
  NOTIFICATION               // Notification générale
}

// Table des logs SMS
model SmsLog {
  id          Int       @id @default(autoincrement())
  phoneNumber String    @db.VarChar(20)
  message     String    @db.Text
  status      SmsStatus @default(PENDING)
  type        SmsType?
  providerId  String?   @db.VarChar(255)  // ID du message chez SMS8.io
  errorMessage String?  @db.Text
  sentAt      DateTime  @default(now())
  
  // Relations
  userId      Int?
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  orderId     Int?
  order       Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)
  
  @@index([phoneNumber])
  @@index([status])
  @@index([type])
  @@index([sentAt])
  @@map("sms_logs")
}

// Table des templates SMS personnalisables
model SmsTemplate {
  id              Int      @id @default(autoincrement())
  key             String   @unique @db.VarChar(100)     // Clé unique (ex: ORDER_CREATED)
  label           String   @db.VarChar(255)             // Label affiché
  description     String   @db.Text                     // Description
  category        String   @db.VarChar(100)             // Catégorie (Commandes, RDV, etc.)
  icon            String   @db.VarChar(50)              // Nom icône Lucide React
  template        String   @db.Text                     // Template actuel (personnalisé)
  defaultTemplate String   @db.Text                     // Template par défaut (réinitialisation)
  variables       String   @db.Text                     // JSON des variables disponibles
  characterCount  Int      @default(0)                  // Nombre de caractères
  isActive        Boolean  @default(true)               // Template actif ou non
  lastModifiedAt  DateTime @default(now())              // Dernière modification
  lastModifiedBy  Int?                                  // ID utilisateur
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("sms_templates")
}

// ==========================================
// AJOUTER DANS VOS MODÈLES EXISTANTS
// ==========================================

// Modèle User (ajoutez cette relation)
model User {
  // ... vos champs existants ...
  
  smsLogs SmsLog[]  // 🆕 Ajouter
}

// Modèle Order (ajoutez cette relation)
model Order {
  // ... vos champs existants ...
  
  smsLogs SmsLog[]  // 🆕 Ajouter
}
```

### 1.2. Créer la migration SQL

**Fichier** : `prisma/migrations/YYYYMMDD_add_sms_system/migration.sql`

```sql
-- ==========================================
-- MIGRATION SMS8.IO - SYSTÈME COMPLET
-- ==========================================

-- 1. Créer les enums
CREATE TYPE "SmsStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');
CREATE TYPE "SmsType" AS ENUM (
  'ORDER_CREATED',
  'ORDER_VALIDATED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'EXPEDITION_CONFIRMED',
  'EXPEDITION_EN_ROUTE',
  'EXPRESS_ARRIVED',
  'EXPRESS_PAYMENT_PENDING',
  'RDV_SCHEDULED',
  'RDV_REMINDER',
  'NOTIFICATION'
);

-- 2. Créer la table sms_logs
CREATE TABLE "sms_logs" (
  "id" SERIAL PRIMARY KEY,
  "phoneNumber" VARCHAR(20) NOT NULL,
  "message" TEXT NOT NULL,
  "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
  "type" "SmsType",
  "providerId" VARCHAR(255),
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER,
  "orderId" INTEGER,
  CONSTRAINT "sms_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "sms_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index pour performance
CREATE INDEX "sms_logs_phoneNumber_idx" ON "sms_logs"("phoneNumber");
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");
CREATE INDEX "sms_logs_type_idx" ON "sms_logs"("type");
CREATE INDEX "sms_logs_sentAt_idx" ON "sms_logs"("sentAt");

-- 3. Créer la table sms_templates
CREATE TABLE "sms_templates" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(100) UNIQUE NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "icon" VARCHAR(50) NOT NULL,
  "template" TEXT NOT NULL,
  "defaultTemplate" TEXT NOT NULL,
  "variables" TEXT NOT NULL,
  "characterCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastModifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastModifiedBy" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 4. Insérer les templates par défaut

-- COMMANDES (4 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES
('ORDER_CREATED', 'Commande créée', 'Notification envoyée lors de la création d''une commande', 'Commandes', 'ShoppingCart', 'Bonjour {prenom}, votre commande {ref} de {produit} est enregistree. Nous vous appellerons bientot. - AFGestion', 'Bonjour {prenom}, votre commande {ref} de {produit} est enregistree. Nous vous appellerons bientot. - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence de la commande"},{"name":"produit","description":"Nom du produit"}]', 130),

('ORDER_VALIDATED', 'Commande validée', 'Notification lors de la validation d''une commande', 'Commandes', 'CheckCircle', 'Bonjour {prenom}, votre commande de {produit} ({montant} FCFA) est validee. Livraison prevue sous 48h. Merci ! - AFGestion', 'Bonjour {prenom}, votre commande de {produit} ({montant} FCFA) est validee. Livraison prevue sous 48h. Merci ! - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"produit","description":"Nom du produit"},{"name":"montant","description":"Montant total"}]', 130),

('ORDER_DELIVERED', 'Commande livrée', 'Notification lors de la livraison', 'Commandes', 'Package', 'Bonjour {prenom}, votre commande {ref} a ete livree. Merci pour votre confiance ! - AFGestion', 'Bonjour {prenom}, votre commande {ref} a ete livree. Merci pour votre confiance ! - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence de la commande"}]', 100),

('ORDER_CANCELLED', 'Commande annulée', 'Notification lors de l''annulation', 'Commandes', 'XCircle', 'Bonjour {prenom}, votre commande {ref} a ete annulee. Pour plus d''infos, contactez-nous. - AFGestion', 'Bonjour {prenom}, votre commande {ref} a ete annulee. Pour plus d''infos, contactez-nous. - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence de la commande"}]', 110);

-- EXPÉDITIONS (2 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES
('EXPEDITION_CONFIRMED', 'Expédition confirmée', 'Notification d''expédition confirmée', 'Expéditions', 'Truck', 'Bonjour {prenom}, votre colis (code: {code}) est en preparation. Expedition sous 24h. - AFGestion', 'Bonjour {prenom}, votre colis (code: {code}) est en preparation. Expedition sous 24h. - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"code","description":"Code de suivi"}]', 105),

('EXPEDITION_EN_ROUTE', 'Expédition en route', 'Notification colis en route', 'Expéditions', 'MapPin', 'Bonjour {prenom}, votre colis (code: {code}) est en route vers vous. Livraison prevue aujourd''hui. - AFGestion', 'Bonjour {prenom}, votre colis (code: {code}) est en route vers vous. Livraison prevue aujourd''hui. - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"code","description":"Code de suivi"}]', 120);

-- EXPRESS (2 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES
('EXPRESS_ARRIVED', 'Express arrivé', 'Notification colis arrivé en agence', 'Express', 'Zap', 'Bonjour {prenom}, votre colis (code: {code}) est arrive a l''agence {agence}. Venez retirer avec 10% du montant. - AFGestion', 'Bonjour {prenom}, votre colis (code: {code}) est arrive a l''agence {agence}. Venez retirer avec 10% du montant. - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"code","description":"Code express"},{"name":"agence","description":"Nom de l''agence"}]', 135),

('EXPRESS_PAYMENT_PENDING', 'Attente paiement express', 'Rappel paiement en attente', 'Express', 'DollarSign', 'Bonjour {prenom}, le solde de {montant} FCFA est en attente. Reglez pour finaliser votre commande. Merci ! - AFGestion', 'Bonjour {prenom}, le solde de {montant} FCFA est en attente. Reglez pour finaliser votre commande. Merci ! - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"montant","description":"Montant restant"}]', 120);

-- RDV (2 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES
('RDV_SCHEDULED', 'RDV programmé', 'Confirmation de rendez-vous', 'Rendez-vous', 'Calendar', 'Bonjour {prenom}, votre RDV est confirme pour le {date} a {heure}. A bientot ! - AFGestion', 'Bonjour {prenom}, votre RDV est confirme pour le {date} a {heure}. A bientot ! - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"date","description":"Date du RDV"},{"name":"heure","description":"Heure du RDV"}]', 100),

('RDV_REMINDER', 'Rappel RDV', 'Rappel avant rendez-vous', 'Rendez-vous', 'Bell', 'Rappel : Votre RDV est prevu aujourd''hui a {heure}. A tout a l''heure {prenom} ! - AFGestion', 'Rappel : Votre RDV est prevu aujourd''hui a {heure}. A tout a l''heure {prenom} ! - AFGestion', '[{"name":"prenom","description":"Prénom du client"},{"name":"date","description":"Date du RDV"},{"name":"heure","description":"Heure du RDV"}]', 95);

-- NOTIFICATION GÉNÉRALE (1 template)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES
('NOTIFICATION', 'Notification générale', 'SMS personnalisé', 'Général', 'MessageSquare', 'Bonjour {prenom}, {message} - AFGestion', 'Bonjour {prenom}, {message} - AFGestion', '[{"name":"prenom","description":"Prénom du destinataire"},{"name":"message","description":"Message personnalisé"}]', 50);
```

### 1.3. Appliquer la migration

```bash
# Générer la migration Prisma
npx prisma migrate dev --name add_sms_system

# Ou si la base existe déjà
npx prisma db push
```

---

## 🛠️ ÉTAPE 2 : BACKEND - UTILITAIRES

### 2.1. Créer `utils/phone.util.js`

```javascript
/**
 * 🔧 UTILITAIRE - NETTOYAGE NUMÉROS DE TÉLÉPHONE
 * 
 * Formats acceptés :
 * - 07 12 34 56 78
 * - 0712345678
 * - 225 07 12 34 56 78
 * - 22507 12 34 56 78
 * - +2250712345678
 * 
 * Format de sortie : +2250XXXXXXXXX (Côte d'Ivoire)
 * Adaptez le préfixe pays selon votre contexte
 */

/**
 * Nettoie et formate un numéro de téléphone
 * @param {string} phoneNumber - Numéro brut
 * @returns {string} Numéro formaté avec préfixe international
 */
export function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return phoneNumber;

  // Enlever tous les espaces, tirets, parenthèses, points
  let cleaned = phoneNumber.replace(/[\s\-().]/g, '');

  // Si commence par +, le garder
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Si commence par 225 (code pays Côte d'Ivoire)
  if (cleaned.startsWith('225')) {
    return '+' + cleaned;
  }

  // Si commence par 0 (numéro local)
  if (cleaned.startsWith('0')) {
    // Enlever le 0 et ajouter +225
    return '+225' + cleaned.substring(1);
  }

  // Si ne commence ni par +, ni par 225, ni par 0
  // Considérer comme numéro local sans 0
  return '+225' + cleaned;
}

/**
 * Valide un numéro de téléphone ivoirien
 * @param {string} phoneNumber - Numéro à valider
 * @returns {boolean} true si valide
 */
export function isValidPhoneNumber(phoneNumber) {
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Format attendu : +225 suivi de 10 chiffres
  const regex = /^\+225\d{10}$/;
  return regex.test(cleaned);
}

export default {
  cleanPhoneNumber,
  isValidPhoneNumber
};
```

**Note** : Adaptez le préfixe `+225` à votre pays (ex: `+33` pour France, `+237` pour Cameroun)

---

## 🛠️ ÉTAPE 3 : BACKEND - SERVICE SMS

### 3.1. Créer `services/sms.service.js`

```javascript
/**
 * 🚀 SERVICE SMS8.IO - ANDROID GATEWAY
 * 
 * Service centralisé pour l'envoi de SMS via SMS8.io avec Android dédié
 * 
 * Fonctionnalités :
 * - Envoi SMS via Android (API send.php)
 * - Templates personnalisables (base de données)
 * - Logging complet (sms_logs)
 * - Gestion d'erreurs robuste
 * - Fallback si DB indisponible
 */

import axios from 'axios';
import prisma from '../config/prisma.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

// ==========================================
// CONFIGURATION
// ==========================================

const SMS_CONFIG = {
  enabled: process.env.SMS_ENABLED === 'true',
  apiKey: process.env.SMS8_API_KEY,
  apiUrl: process.env.SMS8_API_URL || 'https://app.sms8.io/services/send.php',
  deviceId: process.env.SMS_DEVICE_ID,
  simSlot: process.env.SMS_SIM_SLOT || '0',
  senderNumber: process.env.SMS_SENDER_NUMBER,
  senderName: process.env.SMS_SENDER_NAME || 'VotreApp'
};

// ==========================================
// FONCTION PRINCIPALE - ENVOI SMS
// ==========================================

/**
 * Envoie un SMS via SMS8.io (Android Gateway)
 * @param {string} phoneNumber - Numéro destinataire
 * @param {string} message - Contenu du message
 * @param {object} options - Options (orderId, userId, type)
 * @returns {Promise<object>} Résultat de l'envoi
 */
export async function sendSMS(phoneNumber, message, options = {}) {
  // Vérification activation globale
  if (!SMS_CONFIG.enabled) {
    console.log('⚠️ SMS désactivés (SMS_ENABLED=false)');
    return { success: false, message: 'SMS désactivés' };
  }

  // Vérification type spécifique (optionnel)
  if (options.type) {
    const typeEnabled = process.env[`SMS_${options.type}`];
    if (typeEnabled === 'false') {
      console.log(`⚠️ SMS ${options.type} désactivé`);
      return { success: false, message: `Type ${options.type} désactivé` };
    }
  }

  // Nettoyage du numéro
  const cleanedPhone = cleanPhoneNumber(phoneNumber);

  try {
    // Préparer les données pour l'API Android
    const requestData = {
      key: SMS_CONFIG.apiKey,
      devices: SMS_CONFIG.deviceId,
      type: 'sms',
      sms: [{
        phone: cleanedPhone,
        msg: message,
        sim: parseInt(SMS_CONFIG.simSlot)
      }]
    };

    console.log('📤 Envoi SMS via Android:', {
      phone: cleanedPhone,
      device: SMS_CONFIG.deviceId,
      sim: SMS_CONFIG.simSlot
    });

    // Appel API SMS8.io
    const response = await axios.post(SMS_CONFIG.apiUrl, requestData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const messageData = response.data?.messages?.[0] || {};
    const success = messageData.status === 'Pending' || messageData.status === 'Sent';

    // Logging en base de données
    try {
      await prisma.smsLog.create({
        data: {
          phoneNumber: cleanedPhone,
          message: message,
          status: success ? 'SENT' : 'FAILED',
          type: options.type || null,
          providerId: messageData.ID ? String(messageData.ID) : null,
          errorMessage: success ? null : JSON.stringify(messageData),
          userId: options.userId || null,
          orderId: options.orderId || null
        }
      });
    } catch (dbError) {
      console.error('⚠️ Erreur log SMS (non bloquant):', dbError.message);
    }

    if (success) {
      console.log(`✅ SMS envoyé via Android ${SMS_CONFIG.deviceId} (SIM ${SMS_CONFIG.simSlot}) : ${cleanedPhone}`);
      return {
        success: true,
        messageId: messageData.ID,
        phone: cleanedPhone
      };
    } else {
      console.error('❌ Échec envoi SMS:', messageData);
      return {
        success: false,
        error: messageData.error || 'Erreur inconnue'
      };
    }

  } catch (error) {
    console.error('❌ Erreur service SMS:', error.message);

    // Logging erreur
    try {
      await prisma.smsLog.create({
        data: {
          phoneNumber: cleanedPhone,
          message: message,
          status: 'FAILED',
          type: options.type || null,
          errorMessage: error.message,
          userId: options.userId || null,
          orderId: options.orderId || null
        }
      });
    } catch (dbError) {
      console.error('⚠️ Erreur log SMS (non bloquant):', dbError.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// ==========================================
// GESTION DES TEMPLATES
// ==========================================

/**
 * Récupère un template depuis la base de données
 * @param {string} templateKey - Clé du template
 * @returns {Promise<object|null>} Template ou null
 */
export async function getTemplate(templateKey) {
  try {
    const template = await prisma.smsTemplate.findUnique({
      where: { key: templateKey }
    });
    return template;
  } catch (error) {
    // Si la table sms_templates n'existe pas encore (migration non exécutée)
    if (error.code === 'P2021') {
      console.warn('⚠️ Table sms_templates non trouvée, utilisation fallback');
      return null;
    }
    console.error('❌ Erreur chargement template:', error.message);
    return null;
  }
}

/**
 * Remplace les variables dans un template
 * @param {string} template - Template avec variables
 * @param {object} variables - Valeurs des variables
 * @returns {string} Message final
 */
function replaceVariables(template, variables) {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

/**
 * Génère un message depuis un template DB
 * @param {string} templateKey - Clé du template
 * @param {object} variables - Variables à remplacer
 * @returns {Promise<string>} Message généré
 */
export async function generateSmsFromTemplate(templateKey, variables) {
  const template = await getTemplate(templateKey);
  
  if (template && template.isActive) {
    return replaceVariables(template.template, variables);
  }
  
  // Fallback : messages par défaut codés en dur
  return generateFallbackMessage(templateKey, variables);
}

/**
 * Messages par défaut si DB indisponible
 * @param {string} templateKey - Clé du template
 * @param {object} variables - Variables
 * @returns {string} Message par défaut
 */
function generateFallbackMessage(templateKey, variables) {
  const fallbacks = {
    ORDER_CREATED: `Bonjour ${variables.prenom}, votre commande ${variables.ref} de ${variables.produit} est enregistree. Nous vous appellerons bientot. - ${SMS_CONFIG.senderName}`,
    ORDER_VALIDATED: `Bonjour ${variables.prenom}, votre commande de ${variables.produit} (${variables.montant} FCFA) est validee. Livraison prevue sous 48h. Merci ! - ${SMS_CONFIG.senderName}`,
    ORDER_DELIVERED: `Bonjour ${variables.prenom}, votre commande ${variables.ref} a ete livree. Merci pour votre confiance ! - ${SMS_CONFIG.senderName}`,
    ORDER_CANCELLED: `Bonjour ${variables.prenom}, votre commande ${variables.ref} a ete annulee. Pour plus d'infos, contactez-nous. - ${SMS_CONFIG.senderName}`,
    EXPEDITION_CONFIRMED: `Bonjour ${variables.prenom}, votre colis (code: ${variables.code}) est en preparation. Expedition sous 24h. - ${SMS_CONFIG.senderName}`,
    EXPEDITION_EN_ROUTE: `Bonjour ${variables.prenom}, votre colis (code: ${variables.code}) est en route vers vous. Livraison prevue aujourd'hui. - ${SMS_CONFIG.senderName}`,
    EXPRESS_ARRIVED: `Bonjour ${variables.prenom}, votre colis (code: ${variables.code}) est arrive a l'agence ${variables.agence}. Venez retirer avec 10% du montant. - ${SMS_CONFIG.senderName}`,
    EXPRESS_PAYMENT_PENDING: `Bonjour ${variables.prenom}, le solde de ${variables.montant} FCFA est en attente. Reglez pour finaliser votre commande. Merci ! - ${SMS_CONFIG.senderName}`,
    RDV_SCHEDULED: `Bonjour ${variables.prenom}, votre RDV est confirme pour le ${variables.date} a ${variables.heure}. A bientot ! - ${SMS_CONFIG.senderName}`,
    RDV_REMINDER: `Rappel : Votre RDV est prevu aujourd'hui a ${variables.heure}. A tout a l'heure ${variables.prenom} ! - ${SMS_CONFIG.senderName}`,
    NOTIFICATION: `Bonjour ${variables.prenom}, ${variables.message} - ${SMS_CONFIG.senderName}`
  };
  
  return fallbacks[templateKey] || `Message : ${JSON.stringify(variables)}`;
}

// ==========================================
// TEMPLATES SMS (Fonctions Helper)
// ==========================================

export const smsTemplates = {
  /**
   * 🆕 Commande créée (NOUVELLE)
   */
  orderCreated: async (clientNom, orderReference, produitNom) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_CREATED', { 
      prenom, 
      ref: orderReference,
      produit: produitNom 
    });
  },

  /**
   * ✅ Commande validée
   */
  orderValidated: async (clientNom, produitNom, montant) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_VALIDATED', { 
      prenom, 
      produit: produitNom, 
      montant 
    });
  },

  /**
   * 📦 Commande livrée
   */
  orderDelivered: async (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_DELIVERED', { 
      prenom, 
      ref: orderReference 
    });
  },

  /**
   * ❌ Commande annulée
   */
  orderCancelled: async (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_CANCELLED', { 
      prenom, 
      ref: orderReference 
    });
  },

  /**
   * 🚚 Expédition confirmée
   */
  expeditionConfirmed: async (clientNom, trackingCode) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPEDITION_CONFIRMED', { 
      prenom, 
      code: trackingCode 
    });
  },

  /**
   * 🚛 Expédition en route
   */
  expeditionEnRoute: async (clientNom, trackingCode) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPEDITION_EN_ROUTE', { 
      prenom, 
      code: trackingCode 
    });
  },

  /**
   * ⚡ Express arrivé en agence
   */
  expressArrived: async (clientNom, agenceName, expressCode) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPRESS_ARRIVED', { 
      prenom, 
      agence: agenceName, 
      code: expressCode 
    });
  },

  /**
   * 💰 Paiement Express en attente
   */
  expressPaymentPending: async (clientNom, montantRestant) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPRESS_PAYMENT_PENDING', { 
      prenom, 
      montant: montantRestant 
    });
  },

  /**
   * 📅 RDV programmé
   */
  rdvScheduled: async (clientNom, rdvDate, rdvTime) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('RDV_SCHEDULED', { 
      prenom, 
      date: rdvDate, 
      heure: rdvTime 
    });
  },

  /**
   * 🔔 Rappel RDV
   */
  rdvReminder: async (clientNom, rdvDate, rdvTime) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('RDV_REMINDER', { 
      prenom, 
      date: rdvDate, 
      heure: rdvTime 
    });
  },

  /**
   * 📣 Notification générale
   */
  notification: async (clientNom, customMessage) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('NOTIFICATION', { 
      prenom, 
      message: customMessage 
    });
  }
};

export default {
  sendSMS,
  smsTemplates,
  getTemplate,
  generateSmsFromTemplate
};
```

---

**Note** : Le guide est très long. Je vais le créer en plusieurs parties. Voulez-vous que je continue avec les routes backend, ou préférez-vous un format plus condensé ?

Pour l'instant, j'ai créé la base avec :
- ✅ Architecture complète
- ✅ Schéma Prisma avec migration SQL
- ✅ Utilitaire de nettoyage de numéros
- ✅ Service SMS complet

Voulez-vous que je continue avec :
1. Les 3 routes backend (sms.routes.js, sms-settings.routes.js, sms-templates.routes.js)
2. L'intégration dans les routes métier existantes
3. Les composants React (SmsSettings.tsx, SmsTemplateEditor.tsx)
4. La configuration finale (env, déploiement)

Ou préférez-vous un format plus condensé avec des fichiers séparés ?