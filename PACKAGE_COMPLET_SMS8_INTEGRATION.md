# 📦 PACKAGE COMPLET - INTÉGRATION SMS8.IO AVEC ANDROID

**Guide 100% autonome et reproductible**

---

## 🎯 OBJECTIF

Implémenter un système SMS professionnel identique à celui de GS-Pipeline avec :
- ✅ Envoi automatique via Android dédié (SMS8.io)
- ✅ 11 types de SMS configurables
- ✅ Templates personnalisables depuis l'interface
- ✅ Panneau de contrôle complet
- ✅ Historique et statistiques
- ✅ Nettoyage automatique des numéros

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Configuration SMS8.io](#configuration-sms8io)
3. [Backend - Fichiers à créer](#backend---fichiers-à-créer)
4. [Backend - Fichiers à modifier](#backend---fichiers-à-modifier)
5. [Frontend - Composants à créer](#frontend---composants-à-créer)
6. [Frontend - Fichiers à modifier](#frontend---fichiers-à-modifier)
7. [Variables d'environnement](#variables-denvironnement)
8. [Déploiement](#déploiement)
9. [Tests et validation](#tests-et-validation)

---

## 📌 PRÉREQUIS

### Stack technique minimale requise

```
Backend:
- Node.js ≥ 18
- Express.js
- Prisma ORM avec PostgreSQL
- JWT Authentication avec rôles
- Axios

Frontend:
- React 18+
- TypeScript
- React Router
- Axios ou similaire
- Tailwind CSS (optionnel pour le style)
- Lucide React (icônes)
```

### Structure projet requise

```
Votre-Projet/
├── Backend/
│   ├── config/
│   │   └── prisma.js         ← Config Prisma existante
│   ├── middlewares/
│   │   └── auth.middleware.js ← Middleware auth existant
│   ├── routes/               ← Vos routes métier
│   ├── services/             ← Vos services
│   ├── prisma/
│   │   └── schema.prisma     ← Schéma Prisma
│   └── server.js            ← Point d'entrée
│
└── Frontend/
    ├── src/
    │   ├── pages/
    │   │   └── admin/       ← Pages admin
    │   ├── components/      ← Composants réutilisables
    │   └── lib/
    │       └── api.ts       ← Client API
    └── package.json
```

---

## ⚙️ CONFIGURATION SMS8.IO

### Étape 1 : Créer un compte SMS8.io

1. Inscrivez-vous sur https://app.sms8.io/
2. Connectez votre Android via l'app mobile SMS8
3. Notez ces informations critiques :

```
✅ API Key         : VOTRE_API_KEY_UNIQUE
✅ API URL         : https://app.sms8.io/services/send.php
✅ Device ID       : VOTRE_DEVICE_ID (ex: 5298)
✅ SIM Slot        : 0 (SIM 1) ou 1 (SIM 2)
✅ Sender Number   : +[code pays][numéro] (ex: +2250595871746)
✅ Sender Name     : NomDeVotreApp (ex: AFGestion)
```

### Étape 2 : Tester l'API manuellement

```bash
curl -X POST https://app.sms8.io/services/send.php \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VOTRE_API_KEY",
    "devices": "VOTRE_DEVICE_ID",
    "type": "sms",
    "sms": [{
      "phone": "+2250701234567",
      "msg": "Test SMS via API",
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

---

## 🗄️ BACKEND - MODIFICATIONS DATABASE

### Fichier 1 : `prisma/schema.prisma` - AJOUTER

Ajoutez ces éléments à votre schéma existant :

```prisma
// ==========================================
// 📱 SMS8.IO - SYSTÈME SMS COMPLET
// ==========================================

// Enum statuts SMS
enum SmsStatus {
  SENT
  FAILED
  PENDING
}

// Enum types SMS (adaptez selon vos besoins)
enum SmsType {
  ORDER_CREATED              // Commande créée
  ORDER_VALIDATED            // Commande validée
  ORDER_DELIVERED            // Commande livrée
  ORDER_CANCELLED            // Commande annulée
  EXPEDITION_CONFIRMED       // Expédition confirmée
  EXPEDITION_EN_ROUTE        // Expédition en route
  EXPRESS_ARRIVED            // Express arrivé
  EXPRESS_PAYMENT_PENDING    // Attente paiement
  RDV_SCHEDULED              // RDV programmé
  RDV_REMINDER               // Rappel RDV
  NOTIFICATION               // Notification générale
}

// Table logs SMS
model SmsLog {
  id           Int       @id @default(autoincrement())
  phoneNumber  String    @db.VarChar(20)
  message      String    @db.Text
  status       SmsStatus @default(PENDING)
  type         SmsType?
  providerId   String?   @db.VarChar(255)
  errorMessage String?   @db.Text
  sentAt       DateTime  @default(now())
  
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
  key             String   @unique @db.VarChar(100)
  label           String   @db.VarChar(255)
  description     String   @db.Text
  category        String   @db.VarChar(100)
  icon            String   @db.VarChar(50)
  template        String   @db.Text
  defaultTemplate String   @db.Text
  variables       String   @db.Text
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

// Dans votre modèle User (ajoutez cette ligne)
model User {
  // ... vos champs existants ...
  
  smsLogs SmsLog[]  // 🆕 AJOUTER
}

// Dans votre modèle Order (ajoutez cette ligne)
model Order {
  // ... vos champs existants ...
  
  smsLogs SmsLog[]  // 🆕 AJOUTER
}
```

### Fichier 2 : Migration SQL à créer

**Créez** : `prisma/migrations/[DATE]_add_sms_system/migration.sql`

Remplacez `[DATE]` par la date actuelle au format `YYYYMMDDHHMMSS`

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

-- 4. Insérer les templates par défaut (ADAPTEZ LE NOM "AFGestion")

-- COMMANDES
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('ORDER_CREATED', 'Commande créée', 'Envoyé lors de la création', 'Commandes', 'ShoppingCart', 
'Bonjour {prenom}, votre commande {ref} de {produit} est enregistree. Nous vous appellerons bientot. - VotreApp', 
'Bonjour {prenom}, votre commande {ref} de {produit} est enregistree. Nous vous appellerons bientot. - VotreApp', 
'[{"name":"prenom","description":"Prénom du client"},{"name":"ref","description":"Référence"},{"name":"produit","description":"Nom du produit"}]', 
130),

('ORDER_VALIDATED', 'Commande validée', 'Envoyé lors de la validation', 'Commandes', 'CheckCircle', 
'Bonjour {prenom}, votre commande de {produit} ({montant} FCFA) est validee. Livraison prevue sous 48h. - VotreApp', 
'Bonjour {prenom}, votre commande de {produit} ({montant} FCFA) est validee. Livraison prevue sous 48h. - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"produit","description":"Produit"},{"name":"montant","description":"Montant"}]', 
130),

('ORDER_DELIVERED', 'Commande livrée', 'Envoyé à la livraison', 'Commandes', 'Package', 
'Bonjour {prenom}, votre commande {ref} a ete livree. Merci ! - VotreApp', 
'Bonjour {prenom}, votre commande {ref} a ete livree. Merci ! - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"ref","description":"Référence"}]', 
80),

('ORDER_CANCELLED', 'Commande annulée', 'Envoyé à l''annulation', 'Commandes', 'XCircle', 
'Bonjour {prenom}, votre commande {ref} a ete annulee. Contactez-nous. - VotreApp', 
'Bonjour {prenom}, votre commande {ref} a ete annulee. Contactez-nous. - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"ref","description":"Référence"}]', 
90);

-- EXPÉDITIONS
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('EXPEDITION_CONFIRMED', 'Expédition confirmée', 'Colis en préparation', 'Expéditions', 'Truck', 
'Bonjour {prenom}, votre colis (code: {code}) est en preparation. Expedition sous 24h. - VotreApp', 
'Bonjour {prenom}, votre colis (code: {code}) est en preparation. Expedition sous 24h. - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"code","description":"Code suivi"}]', 
105),

('EXPEDITION_EN_ROUTE', 'Colis en route', 'Colis en livraison', 'Expéditions', 'MapPin', 
'Bonjour {prenom}, votre colis (code: {code}) est en route. Livraison prevue aujourd''hui. - VotreApp', 
'Bonjour {prenom}, votre colis (code: {code}) est en route. Livraison prevue aujourd''hui. - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"code","description":"Code suivi"}]', 
110);

-- EXPRESS
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('EXPRESS_ARRIVED', 'Express arrivé', 'Colis en agence', 'Express', 'Zap', 
'Bonjour {prenom}, votre colis (code: {code}) est arrive a l''agence {agence}. Venez retirer avec 10%. - VotreApp', 
'Bonjour {prenom}, votre colis (code: {code}) est arrive a l''agence {agence}. Venez retirer avec 10%. - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"code","description":"Code"},{"name":"agence","description":"Agence"}]', 
125),

('EXPRESS_PAYMENT_PENDING', 'Attente paiement', 'Rappel paiement', 'Express', 'DollarSign', 
'Bonjour {prenom}, le solde de {montant} FCFA est en attente. Reglez pour finaliser. - VotreApp', 
'Bonjour {prenom}, le solde de {montant} FCFA est en attente. Reglez pour finaliser. - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"montant","description":"Montant"}]', 
100);

-- RDV
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('RDV_SCHEDULED', 'RDV programmé', 'Confirmation RDV', 'Rendez-vous', 'Calendar', 
'Bonjour {prenom}, votre RDV est confirme pour le {date} a {heure}. A bientot ! - VotreApp', 
'Bonjour {prenom}, votre RDV est confirme pour le {date} a {heure}. A bientot ! - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"date","description":"Date"},{"name":"heure","description":"Heure"}]', 
90),

('RDV_REMINDER', 'Rappel RDV', 'Rappel avant RDV', 'Rendez-vous', 'Bell', 
'Rappel : Votre RDV est prevu aujourd''hui a {heure}. A tout a l''heure {prenom} ! - VotreApp', 
'Rappel : Votre RDV est prevu aujourd''hui a {heure}. A tout a l''heure {prenom} ! - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"heure","description":"Heure"}]', 
90);

-- GÉNÉRAL
INSERT INTO "sms_templates" ("key", "label", "description", "category", "icon", "template", "defaultTemplate", "variables", "characterCount") VALUES

('NOTIFICATION', 'Notification générale', 'SMS personnalisé', 'Général', 'MessageSquare', 
'Bonjour {prenom}, {message} - VotreApp', 
'Bonjour {prenom}, {message} - VotreApp', 
'[{"name":"prenom","description":"Prénom"},{"name":"message","description":"Message"}]', 
40);
```

**⚠️ IMPORTANT** : Remplacez `"VotreApp"` par le nom de votre application dans tous les templates !

### Appliquer la migration

```bash
# Générer la migration
npx prisma migrate dev --name add_sms_system

# OU si base existante
npx prisma db push

# Générer le client Prisma
npx prisma generate
```

---

Voulez-vous que je continue avec :
1. ✅ Tous les fichiers backend à créer (utils, services, routes) ?
2. ✅ Tous les composants React à créer ?
3. ✅ Les modifications à apporter aux fichiers existants ?
4. ✅ La configuration complète (variables d'environnement) ?
5. ✅ Le guide de déploiement étape par étape ?

Ce sera un guide de **2000+ lignes** très détaillé. Confirmez pour que je continue, ou dites-moi si vous préférez un format différent (plusieurs fichiers séparés par exemple).