# 📦 GUIDE COMPLET - INTÉGRATION SMS8.IO (ANDROID)

**Guide exhaustif et reproductible à 100%**  
**Pour votre autre éditeur Cursor**

---

## 🎯 CE QUE CE GUIDE VOUS PERMET DE FAIRE

- ✅ Reproduire À L'IDENTIQUE le système SMS de GS-Pipeline
- ✅ Envoi SMS via votre propre Android (SMS8.io)
- ✅ 11 types de SMS configurables
- ✅ Templates personnalisables depuis l'interface
- ✅ Panneau de contrôle admin complet
- ✅ Historique et statistiques détaillés
- ✅ Nettoyage automatique des numéros

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis et configuration SMS8.io](#1-prérequis-et-configuration-sms8io)
2. [Schéma base de données](#2-schéma-base-de-données)
3. [Fichiers backend à créer](#3-fichiers-backend-à-créer)
4. [Routes backend à créer](#4-routes-backend-à-créer)
5. [Composants React à créer](#5-composants-react-à-créer)
6. [Fichiers à modifier](#6-fichiers-à-modifier)
7. [Variables d'environnement](#7-variables-denvironnement)
8. [Déploiement](#8-déploiement)
9. [Tests](#9-tests)

---

## 1. PRÉREQUIS ET CONFIGURATION SMS8.IO

### 1.1. Stack technique requise

```
Backend:
├── Node.js ≥ 18
├── Express.js
├── Prisma ORM
├── PostgreSQL
├── JWT Authentication
└── Axios

Frontend:
├── React 18+
├── TypeScript
├── Tailwind CSS
├── Lucide React (icônes)
└── React Hot Toast
```

### 1.2. Créer compte SMS8.io

1. **Inscrivez-vous** : https://app.sms8.io/register
2. **Téléchargez l'app mobile** SMS8 sur votre Android
3. **Connectez votre Android** à l'app SMS8
4. **Notez ces informations** (vous en aurez besoin) :

```env
SMS8_API_KEY=votre_api_key_unique
SMS_DEVICE_ID=1234              # ID de votre Android
SMS_SIM_SLOT=0                  # 0 pour SIM 1, 1 pour SIM 2
SMS_SENDER_NUMBER=+[votre numéro complet]
```

**📸 Où trouver ces infos** :
- API Key : Dashboard SMS8 → Settings → API
- Device ID : App mobile → Devices → Votre Android (ex: "5298")
- SIM Slot : App mobile → Device Settings
- Sender Number : Le numéro de la carte SIM dans votre Android

### 1.3. Tester l'API manuellement

Avant de coder, testez que votre Android est bien connecté :

```bash
curl -X POST "https://app.sms8.io/services/send.php" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VOTRE_API_KEY",
    "devices": "VOTRE_DEVICE_ID",
    "type": "sms",
    "sms": [{
      "phone": "+2250701234567",
      "msg": "Test SMS via Android",
      "sim": 0
    }]
  }'
```

**Résultat attendu** :
```json
{
  "messages": [{
    "ID": "123456",
    "status": "Pending",
    "phone": "+2250701234567"
  }]
}
```

✅ Si ça fonctionne, passez à l'étape suivante !

---

## 2. SCHÉMA BASE DE DONNÉES

### 2.1. Modifier `prisma/schema.prisma`

**⚠️ ADAPTEZ** le préfixe téléphone (+225) à votre pays si différent !

**Ajoutez ces éléments** à votre schéma existant :

```prisma
// ==========================================
// 📱 SYSTÈME SMS - SMS8.IO ANDROID
// ==========================================

// Enum pour statuts SMS
enum SmsStatus {
  SENT      // Envoyé avec succès
  FAILED    // Échec d'envoi
  PENDING   // En attente
}

// Enum pour types de SMS (ADAPTEZ À VOS BESOINS)
enum SmsType {
  ORDER_CREATED              // Commande créée
  ORDER_VALIDATED            // Commande validée
  ORDER_DELIVERED            // Commande livrée
  ORDER_CANCELLED            // Commande annulée
  EXPEDITION_CONFIRMED       // Expédition confirmée
  EXPEDITION_EN_ROUTE        // Expédition en route
  EXPRESS_ARRIVED            // Express arrivé
  EXPRESS_PAYMENT_PENDING    // Paiement en attente
  RDV_SCHEDULED              // RDV programmé
  RDV_REMINDER               // Rappel RDV
  NOTIFICATION               // Notification générale
}

// Table logs SMS (historique)
model SmsLog {
  id           Int       @id @default(autoincrement())
  phoneNumber  String    @db.VarChar(20)
  message      String    @db.Text
  status       SmsStatus @default(PENDING)
  type         SmsType?
  providerId   String?   @db.VarChar(255)  // ID du message chez SMS8.io
  errorMessage String?   @db.Text
  sentAt       DateTime  @default(now())
  
  // Relations (ADAPTEZ LES NOMS À VOS MODÈLES)
  userId       Int?
  user         User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  orderId      Int?
  order        Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)
  
  @@index([phoneNumber])
  @@index([status])
  @@index([type])
  @@index([sentAt])
  @@map("sms_logs")
}

// Table templates SMS personnalisables
model SmsTemplate {
  id              Int      @id @default(autoincrement())
  key             String   @unique @db.VarChar(100)     // ORDER_CREATED, etc.
  label           String   @db.VarChar(255)             // "Commande créée"
  description     String   @db.Text                     // Description
  category        String   @db.VarChar(100)             // "Commandes", "RDV", etc.
  icon            String   @db.VarChar(50)              // Icône Lucide
  template        String   @db.Text                     // Template actuel
  defaultTemplate String   @db.Text                     // Template par défaut
  variables       String   @db.Text                     // JSON des variables
  characterCount  Int      @default(0)
  isActive        Boolean  @default(true)
  lastModifiedAt  DateTime @default(now())
  lastModifiedBy  Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("sms_templates")
}

// ==========================================
// MODIFIER VOS MODÈLES EXISTANTS
// ==========================================

// Dans votre modèle User
model User {
  // ... vos champs existants ...
  
  smsLogs SmsLog[]  // 🆕 AJOUTER CETTE LIGNE
}

// Dans votre modèle Order
model Order {
  // ... vos champs existants ...
  
  smsLogs SmsLog[]  // 🆕 AJOUTER CETTE LIGNE
}
```

### 2.2. Créer la migration SQL

**Créez le fichier** : `prisma/migrations/[DATE]_add_sms_system/migration.sql`

Remplacez `[DATE]` par la date actuelle au format `YYYYMMDDHHMMSS` (ex: `20241219143000`)

```sql
-- ==========================================
-- MIGRATION SYSTÈME SMS COMPLET
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

-- 2. Créer table sms_logs
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
  
  CONSTRAINT "sms_logs_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE,
    
  CONSTRAINT "sms_logs_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index pour performance
CREATE INDEX "sms_logs_phoneNumber_idx" ON "sms_logs"("phoneNumber");
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");
CREATE INDEX "sms_logs_type_idx" ON "sms_logs"("type");
CREATE INDEX "sms_logs_sentAt_idx" ON "sms_logs"("sentAt");

-- 3. Créer table sms_templates
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

-- 4. Insérer les 11 templates par défaut
-- ⚠️ MODIFIEZ "VotreApp" par le nom de votre application

-- COMMANDES (4 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('ORDER_CREATED', 'Commande créée', 'Envoyé lors de la création d''une commande', 'Commandes', 'ShoppingCart', 
'Bonjour {prenom}, votre commande {ref} de {produit} est enregistree. Nous vous appellerons bientot. - VotreApp', 
'Bonjour {prenom}, votre commande {ref} de {produit} est enregistree. Nous vous appellerons bientot. - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence de la commande"},{"name":"produit","description":"Nom du produit"}]', 
130),

('ORDER_VALIDATED', 'Commande validée', 'Envoyé lors de la validation', 'Commandes', 'CheckCircle', 
'Bonjour {prenom}, votre commande de {produit} ({montant} FCFA) est validee. Livraison prevue sous 48h. Merci ! - VotreApp', 
'Bonjour {prenom}, votre commande de {produit} ({montant} FCFA) est validee. Livraison prevue sous 48h. Merci ! - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"produit","description":"Nom du produit"},{"name":"montant","description":"Montant total"}]', 
130),

('ORDER_DELIVERED', 'Commande livrée', 'Envoyé à la livraison', 'Commandes', 'Package', 
'Bonjour {prenom}, votre commande {ref} a ete livree. Merci pour votre confiance ! - VotreApp', 
'Bonjour {prenom}, votre commande {ref} a ete livree. Merci pour votre confiance ! - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence de la commande"}]', 
95),

('ORDER_CANCELLED', 'Commande annulée', 'Envoyé à l''annulation', 'Commandes', 'XCircle', 
'Bonjour {prenom}, votre commande {ref} a ete annulee. Pour plus d''infos, contactez-nous. - VotreApp', 
'Bonjour {prenom}, votre commande {ref} a ete annulee. Pour plus d''infos, contactez-nous. - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence de la commande"}]', 
110);

-- EXPÉDITIONS (2 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('EXPEDITION_CONFIRMED', 'Expédition confirmée', 'Colis en préparation', 'Expéditions', 'Truck', 
'Bonjour {prenom}, votre colis (code: {code}) est en preparation. Expedition sous 24h. - VotreApp', 
'Bonjour {prenom}, votre colis (code: {code}) est en preparation. Expedition sous 24h. - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"code","description":"Code de suivi"}]', 
105),

('EXPEDITION_EN_ROUTE', 'Colis en route', 'Colis en livraison', 'Expéditions', 'MapPin', 
'Bonjour {prenom}, votre colis (code: {code}) est en route vers vous. Livraison prevue aujourd''hui. - VotreApp', 
'Bonjour {prenom}, votre colis (code: {code}) est en route vers vous. Livraison prevue aujourd''hui. - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"code","description":"Code de suivi"}]', 
120);

-- EXPRESS (2 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('EXPRESS_ARRIVED', 'Express arrivé', 'Colis arrivé en agence', 'Express', 'Zap', 
'Bonjour {prenom}, votre colis (code: {code}) est arrive a l''agence {agence}. Venez retirer avec 10% du montant. - VotreApp', 
'Bonjour {prenom}, votre colis (code: {code}) est arrive a l''agence {agence}. Venez retirer avec 10% du montant. - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"code","description":"Code express"},{"name":"agence","description":"Nom de l''agence"}]', 
135),

('EXPRESS_PAYMENT_PENDING', 'Attente paiement', 'Rappel paiement express', 'Express', 'DollarSign', 
'Bonjour {prenom}, le solde de {montant} FCFA est en attente. Reglez pour finaliser votre commande. Merci ! - VotreApp', 
'Bonjour {prenom}, le solde de {montant} FCFA est en attente. Reglez pour finaliser votre commande. Merci ! - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"montant","description":"Montant restant"}]', 
120);

-- RDV (2 templates)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('RDV_SCHEDULED', 'RDV programmé', 'Confirmation de rendez-vous', 'Rendez-vous', 'Calendar', 
'Bonjour {prenom}, votre RDV est confirme pour le {date} a {heure}. A bientot ! - VotreApp', 
'Bonjour {prenom}, votre RDV est confirme pour le {date} a {heure}. A bientot ! - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"date","description":"Date du RDV"},{"name":"heure","description":"Heure du RDV"}]', 
100),

('RDV_REMINDER', 'Rappel RDV', 'Rappel avant rendez-vous', 'Rendez-vous', 'Bell', 
'Rappel : Votre RDV est prevu aujourd''hui a {heure}. A tout a l''heure {prenom} ! - VotreApp', 
'Rappel : Votre RDV est prevu aujourd''hui a {heure}. A tout a l''heure {prenom} ! - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"date","description":"Date du RDV"},{"name":"heure","description":"Heure du RDV"}]', 
95);

-- GÉNÉRAL (1 template)
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('NOTIFICATION', 'Notification générale', 'SMS personnalisé', 'Général', 'MessageSquare', 
'Bonjour {prenom}, {message} - VotreApp', 
'Bonjour {prenom}, {message} - VotreApp', 
'[{"name":"prenom","description":"Prénom du destinataire"},{"name":"message","description":"Message personnalisé"}]', 
50);
```

### 2.3. Appliquer la migration

```bash
# Générer et appliquer la migration
npx prisma migrate dev --name add_sms_system

# OU si base existante en production
npx prisma db push

# Générer le client Prisma
npx prisma generate
```

✅ **Vérification** : Ouvrez Prisma Studio pour voir les nouvelles tables
```bash
npx prisma studio
```

Vous devriez voir :
- Table `sms_logs` (vide)
- Table `sms_templates` (avec 11 templates)

---

## 3. FICHIERS BACKEND À CRÉER

### 3.1. `utils/phone.util.js` - Nettoyage téléphone

**Créez** : `utils/phone.util.js`

**⚠️ ADAPTEZ** le préfixe `+225` à votre pays !

```javascript
/**
 * 🔧 Utilitaire de nettoyage des numéros de téléphone
 * 
 * Transforme tous les formats en : +225XXXXXXXXXX
 * 
 * Formats acceptés :
 * - 07 12 34 56 78
 * - 0712345678
 * - 225 07 12 34 56 78
 * - +2250712345678
 * 
 * ADAPTEZ LE PRÉFIXE À VOTRE PAYS :
 * - Côte d'Ivoire : +225
 * - France : +33
 * - Cameroun : +237
 * - etc.
 */

/**
 * Nettoie et formate un numéro de téléphone
 * @param {string} phone - Numéro brut
 * @returns {string} - Numéro formaté
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return phone;
  
  // Enlever espaces, tirets, points, parenthèses
  let cleaned = String(phone)
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();
  
  if (!cleaned) return phone;
  
  // Si commence par +225, ok
  if (cleaned.startsWith('+225')) {
    return cleaned;
  }
  
  // Si commence par 225 (sans +)
  if (cleaned.startsWith('225')) {
    return '+' + cleaned;
  }
  
  // Si commence par 0 (local)
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    return '+225' + cleaned;
  }
  
  // Si 10 chiffres sans 0
  if (/^\d{10}$/.test(cleaned)) {
    return '+2250' + cleaned;
  }
  
  // Si 9 chiffres (sans le 0)
  if (/^\d{9}$/.test(cleaned)) {
    return '+2250' + cleaned;
  }
  
  console.warn(`⚠️  Format non reconnu: ${phone}`);
  return cleaned;
}

/**
 * Valide un numéro
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhoneNumber(phone) {
  if (!phone) return false;
  const cleaned = cleanPhoneNumber(phone);
  // Format : +2250XXXXXXXXX (13 caractères)
  return /^\+2250\d{9}$/.test(cleaned);
}

export default {
  cleanPhoneNumber,
  isValidPhoneNumber
};
```

**📝 NOTE** : Si vous êtes dans un autre pays, changez `+225` et la regex !

---

Voulez-vous que je continue avec :
- ✅ Le service SMS complet (500 lignes)
- ✅ Les 3 routes backend complètes
- ✅ Les 2 composants React complets
- ✅ La configuration et le déploiement

Le fichier complet fera ~5000 lignes. **Confirmez** pour que je continue l'écriture complète !