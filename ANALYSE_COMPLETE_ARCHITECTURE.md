# 📊 ANALYSE COMPLÈTE - ARCHITECTURE ET SYSTÈME D'EXPÉDITION
## Projet GS Pipeline - Back-office E-commerce

---

## 🎯 RÉSUMÉ EXÉCUTIF

**GS Pipeline** est une application web complète de gestion de pipeline de commandes e-commerce déployée sur:
- **Backend**: Railway (Node.js + Express + PostgreSQL + Prisma)
- **Frontend**: Vercel (React + TypeScript + Vite + TailwindCSS)
- **Repository**: GitHub

### Fonctionnalités Principales
1. ✅ Réception automatique des commandes via webhook
2. ✅ Gestion des appels clients et validation
3. ✅ **Système d'expédition avancé** (EXPEDITION & EXPRESS)
4. ✅ Assignation intelligente aux livreurs
5. ✅ Gestion automatique du stock
6. ✅ Statistiques et rapports détaillés
7. ✅ Système SMS intégré

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE SYSTÈME                    │
└─────────────────────────────────────────────────────────────┘

                          INTERNET
                             │
            ┌────────────────┼────────────────┐
            │                │                │
       ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
       │  MAKE   │     │  USERS  │     │ LIVREURS│
       │ Webhook │     │ Browser │     │  Mobile │
       └────┬────┘     └────┬────┘     └────┬────┘
            │               │               │
            │         ┌─────▼─────┐        │
            └────────►│  VERCEL   │◄───────┘
                      │ Frontend  │
                      │ (React)   │
                      └─────┬─────┘
                            │ HTTPS/REST
                      ┌─────▼─────┐
                      │  RAILWAY  │
                      │  Backend  │
                      │ (Express) │
                      └─────┬─────┘
                            │
                      ┌─────▼─────┐
                      │PostgreSQL │
                      │ Database  │
                      └───────────┘
```

### Stack Technique

**Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.7
- **Auth**: JWT (jsonwebtoken)
- **Security**: bcryptjs
- **Validation**: express-validator
- **CORS**: cors middleware
- **Hosting**: Railway

**Frontend**
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State**: Zustand + React Query
- **Routing**: React Router
- **HTTP Client**: Axios
- **Hosting**: Vercel

---

## 📁 STRUCTURE DU PROJET

```
c:\Users\MSI\Desktop\GS cursor\
│
├── Backend (Racine du projet)
│   ├── server.js                    # Point d'entrée principal
│   ├── package.json                 # Dépendances backend
│   ├── .env                         # Variables d'environnement
│   │
│   ├── config/
│   │   └── prisma.js                # Configuration Prisma Client
│   │
│   ├── prisma/
│   │   ├── schema.prisma            # Schéma de données
│   │   ├── seed.js                  # Données de test
│   │   └── migrations/              # Migrations SQL
│   │
│   ├── routes/                      # Routes API
│   │   ├── auth.routes.js           # Authentification
│   │   ├── user.routes.js           # Gestion utilisateurs
│   │   ├── order.routes.js          # ⭐ Commandes + Expéditions
│   │   ├── express.routes.js        # ⭐ EXPRESS en agence
│   │   ├── delivery.routes.js       # Livraisons et tournées
│   │   ├── stock.routes.js          # Gestion stock
│   │   ├── product.routes.js        # Produits
│   │   ├── stats.routes.js          # Statistiques
│   │   ├── sms.routes.js            # SMS
│   │   └── webhook.routes.js        # Webhook Make
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js       # Auth JWT + Permissions
│   │
│   ├── services/
│   │   └── sms.service.js           # Service SMS8
│   │
│   ├── jobs/
│   │   └── cleanupPhotos.js         # Nettoyage auto photos
│   │
│   └── utils/
│       └── phone.util.js            # Utilitaires téléphone
│
├── frontend/                        # Application React
│   ├── package.json                 # Dépendances frontend
│   ├── vite.config.ts              # Config Vite
│   ├── tailwind.config.js          # Config Tailwind
│   │
│   └── src/
│       ├── main.tsx                 # Point d'entrée React
│       ├── App.tsx                  # App principale
│       │
│       ├── pages/                   # Pages par rôle
│       │   ├── Login.tsx
│       │   ├── admin/               # Pages Admin
│       │   │   ├── Dashboard.tsx
│       │   │   ├── ExpeditionsExpress.tsx  # ⭐ Gestion Expéditions
│       │   │   ├── Orders.tsx
│       │   │   ├── Stats.tsx
│       │   │   └── Users.tsx
│       │   │
│       │   ├── appelant/            # Pages Appelant
│       │   │   ├── Orders.tsx       # ⭐ Création EXPEDITION/EXPRESS
│       │   │   ├── Dashboard.tsx
│       │   │   └── RDV.tsx
│       │   │
│       │   ├── gestionnaire/        # Pages Gestionnaire
│       │   │   ├── Deliveries.tsx
│       │   │   ├── ExpressAgence.tsx
│       │   │   └── ValidatedOrders.tsx
│       │   │
│       │   ├── livreur/             # Pages Livreur
│       │   │   ├── Deliveries.tsx
│       │   │   ├── Expeditions.tsx  # ⭐ Confirmer expédition
│       │   │   └── Dashboard.tsx
│       │   │
│       │   └── stock/               # Pages Gestionnaire Stock
│       │       ├── Products.tsx
│       │       ├── Movements.tsx
│       │       └── Tournees.tsx
│       │
│       ├── components/
│       │   ├── Layout.tsx           # Layout principal + Menu
│       │   └── modals/
│       │       ├── ExpeditionModal.tsx  # ⭐ Modal EXPEDITION
│       │       └── ExpressModal.tsx     # ⭐ Modal EXPRESS
│       │
│       ├── lib/
│       │   └── api.ts               # Client API (axios)
│       │
│       ├── types/
│       │   └── index.ts             # Types TypeScript
│       │
│       ├── store/
│       │   └── authStore.ts         # State authentification
│       │
│       └── utils/
│           └── statusHelpers.ts     # Helpers statuts + badges
│
└── Documentation/                   # 200+ fichiers MD
    ├── README.md                    # Guide principal
    ├── WORKFLOW_EXPEDITION_COMPLET.md
    ├── ANALYSE_SYSTEME_EXPEDITION.md
    └── ... (guides variés)
```

---

## 👥 SYSTÈME DE RÔLES ET PERMISSIONS

### 5 Rôles Utilisateurs

```typescript
enum UserRole {
  ADMIN               // Accès complet
  GESTIONNAIRE        // Gestion commandes validées + assignation
  GESTIONNAIRE_STOCK  // Gestion stock et tournées (lecture seule expéditions)
  APPELANT            // Appels clients + Création EXPEDITION/EXPRESS
  LIVREUR             // Livraisons assignées
}
```

### Matrice des Permissions

| Fonctionnalité | ADMIN | GESTIONNAIRE | APPELANT | GESTIONNAIRE_STOCK | LIVREUR |
|----------------|-------|--------------|----------|-------------------|---------|
| **Voir toutes les commandes** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Créer EXPÉDITION/EXPRESS** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assigner livreur EXPÉDITION** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Voir expéditions assignées** | ✅ | ✅ | ✅ | ✅ | ✅ (ses expéditions) |
| **Confirmer expédition** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Marquer EXPRESS arrivé** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Finaliser EXPRESS (90%)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Gérer stock** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Gérer utilisateurs** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📊 MODÈLE DE DONNÉES (PRISMA)

### Entités Principales

#### 1. **User** - Utilisateurs
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Hashé avec bcrypt
  nom       String
  prenom    String
  telephone String?
  role      UserRole
  actif     Boolean  @default(true)
  
  // Relations
  ordersAsCaller   Order[] @relation("CallerOrders")
  ordersAsDeliverer Order[] @relation("DelivererOrders")
}
```

#### 2. **Order** - Commandes (Schéma complet)
```prisma
model Order {
  id              Int         @id @default(autoincrement())
  orderReference  String      @unique @default(uuid())
  
  // 📍 Informations client
  clientNom       String
  clientTelephone String
  clientVille     String
  clientCommune   String?
  clientAdresse   String?
  
  // 📦 Informations produit
  produitNom      String
  productId       Int?
  product         Product?
  quantite        Int         @default(1)
  montant         Float
  
  // 🚚 SYSTÈME EXPÉDITION (Nouveaux champs)
  deliveryType    DeliveryType @default(LOCAL)
  
  // 💰 Gestion paiements
  montantPaye     Float?      // Montant déjà payé
  montantRestant  Float?      // Montant restant
  modePaiement    String?     // Orange/MTN/Moov/Wave
  referencePayment String?    // Référence transaction
  
  // 📦 EXPÉDITION - Suivi
  codeExpedition  String?     // Code de suivi
  photoRecuExpedition String? // Photo reçu (base64)
  photoRecuExpeditionUploadedAt DateTime?
  expedieAt       DateTime?   // Date expédition
  
  // ⚡ EXPRESS - Agence
  agenceRetrait   String?     // Agence de retrait
  clientNotifie   Boolean?    @default(false)
  notifieAt       DateTime?
  notifiePar      Int?
  arriveAt        DateTime?   // Date arrivée en agence
  
  // 📊 Statut et workflow
  status          OrderStatus @default(NOUVELLE)
  
  // 👤 Assignations
  callerId        Int?
  caller          User?
  calledAt        DateTime?
  
  delivererId     Int?
  deliverer       User?
  deliveryDate    DateTime?
  
  // 📝 Notes
  noteAppelant    String?
  noteLivreur     String?
  noteGestionnaire String?
  
  // 🕐 Dates
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  validatedAt     DateTime?
  deliveredAt     DateTime?
}
```

#### 3. **Product** - Produits
```prisma
model Product {
  id           Int      @id @default(autoincrement())
  code         String   @unique
  nom          String
  description  String?
  prixUnitaire Float
  prix1        Float?   // Prix pour 1 unité
  prix2        Float?   // Prix pour 2 unités
  prix3        Float?   // Prix pour 3+ unités
  stockActuel  Int      @default(0)  // Stock normal
  stockExpress Int      @default(0)  // Stock EXPRESS réservé
  stockAlerte  Int      @default(10)
  actif        Boolean  @default(true)
}
```

### Énumérations Critiques

```prisma
enum DeliveryType {
  LOCAL       // Livraison locale normale
  EXPEDITION  // Paiement 100% avant envoi
  EXPRESS     // Paiement 10% avant, 90% au retrait
}

enum OrderStatus {
  NOUVELLE          // Reçue depuis le site
  A_APPELER         // En attente d'appel
  VALIDEE           // Client a validé
  ANNULEE           // Client a annulé
  INJOIGNABLE       // Client non joignable
  ASSIGNEE          // Assignée à un livreur
  LIVREE            // Livrée avec succès
  REFUSEE           // Refusée à la livraison
  ANNULEE_LIVRAISON // Annulée pendant livraison
  RETOURNE          // Retourné par livreur
  
  // ⭐ NOUVEAUX STATUTS EXPÉDITION
  EXPEDITION        // Paiement 100% - En attente d'envoi
  EXPRESS           // Paiement 10% - En attente d'envoi vers agence
  EXPRESS_ARRIVE    // Colis arrivé en agence
  EXPRESS_LIVRE     // Express livré après paiement 90%
}

enum StockMovementType {
  APPROVISIONNEMENT     // Ajout stock manuel
  LIVRAISON            // Sortie stock (livraison)
  RETOUR               // Retour colis non livré
  CORRECTION           // Correction manuelle
  PERTE                // Perte/casse
  
  // ⭐ NOUVEAUX TYPES EXPÉDITION
  RESERVATION          // Réservation stock EXPEDITION (100% payé)
  RESERVATION_EXPRESS  // Transfert stock normal → EXPRESS (10% payé)
  RETRAIT_EXPRESS      // Sortie stock EXPRESS (client a retiré)
  ANNULATION_EXPRESS   // Annulation EXPRESS, retour stock normal
}
```

---

## 🔄 WORKFLOW COMPLET - SYSTÈME D'EXPÉDITION

### Vue d'ensemble
Le système gère **3 types de livraison**:
1. **LOCAL**: Livraison locale normale (existant)
2. **EXPÉDITION**: Paiement 100% avant envoi vers ville éloignée
3. **EXPRESS**: Paiement 10% avant envoi, 90% au retrait en agence

---

### 📦 WORKFLOW 1: EXPÉDITION (Paiement 100%)

```
┌─────────────────────────────────────────────────────────┐
│         WORKFLOW EXPÉDITION - VUE DÉTAILLÉE             │
└─────────────────────────────────────────────────────────┘

PHASE 1: CRÉATION PAR APPELANT
────────────────────────────────
1. Client commande sur site → Status: NOUVELLE
2. Appelant appelle client
3. Client confirme + PAIE 100% par Mobile Money
4. Appelant dans interface:
   └─> Clique bouton "📦 EXPÉDITION (Paiement 100%)"
   └─> Modal ExpeditionModal s'ouvre
   └─> Saisit:
       - Mode paiement (Orange/MTN/Moov/Wave)
       - Référence transaction
       - Note optionnelle
   └─> Clique "Confirmer EXPÉDITION"

   ⚙️ API: POST /api/orders/:id/expedition
   
   Backend traite (order.routes.js):
   ✅ Vérifie montantPaye = montant total (100%)
   ✅ Vérifie stock disponible > 0
   ✅ RÉDUIT IMMÉDIATEMENT stock normal (-1)
   ✅ Crée mouvement stock type RESERVATION
   ✅ Change status → EXPEDITION
   ✅ Change deliveryType → EXPEDITION
   ✅ Enregistre montantPaye, modePaiement, referencePayment
   ✅ Met montantRestant = 0
   ✅ Met validatedAt = maintenant
   ✅ Crée historique StatusHistory
   
   Résultat:
   ✅ Commande visible avec badge "Expédition" (bleu)
   ✅ Stock réduit immédiatement

───────────────────────────────────────────────────────────

PHASE 2: ASSIGNATION LIVREUR (Gestionnaire Principal)
────────────────────────────────────────────────────────
1. Gestionnaire va dans "⚡ Expéditions & EXPRESS"
2. Onglet "Expéditions"
3. Voit tableau:
   ┌───────────────────────────────────────────────┐
   │ CMD-123 │ Client │ Ville │ Non assigné │[Assigner]│
   └───────────────────────────────────────────────┘
4. Clique "Assigner livreur"
5. Modal s'ouvre avec liste des livreurs actifs
6. Sélectionne un livreur (ex: Kofi Mensah)
7. Confirme

   ⚙️ API: POST /api/orders/:id/expedition/assign
   Body: { "delivererId": 5 }
   
   Backend traite:
   ✅ Vérifie status = EXPEDITION
   ✅ Vérifie livreur existe et actif
   ✅ Change status → ASSIGNEE
   ✅ Assigne delivererId
   ✅ Crée historique
   
   Résultat:
   ✅ Badge devient "✓ Assignée" (vert)
   ✅ Nom + téléphone du livreur affichés

───────────────────────────────────────────────────────────

PHASE 3: PRÉPARATION COLIS (Gestionnaire Stock)
────────────────────────────────────────────────
1. Gestionnaire Stock ouvre "⚡ Expéditions & EXPRESS"
2. Voit expéditions assignées:
   ┌────────────────────────────────────────────────┐
   │ CMD-123 │ Client │ Ville │ ✓ Kofi 91234567 │✓│
   └────────────────────────────────────────────────┘
3. Prépare le colis du STOCK NORMAL
4. Étiquette:
   ┌──────────────────────┐
   │ CMD-123              │
   │ Client: Marie K.     │
   │ Ville: Parakou       │
   │ Livreur: Kofi        │
   │ Tél: 91234567        │
   └──────────────────────┘
5. Contacte Kofi pour récupération
6. Remet le colis à Kofi

   ⚠️ Aucune action dans le système
   ⚠️ Stock déjà réduit à la Phase 1

───────────────────────────────────────────────────────────

PHASE 4: EXPÉDITION (Livreur)
──────────────────────────────
1. Livreur (Kofi) ouvre son dashboard
2. Section "🚚 Mes EXPÉDITIONS à livrer"
3. Voit ses expéditions assignées:
   ┌─────────────────────────────────┐
   │ CMD-123                         │
   │ Client: Marie K. - 96789123     │
   │ Ville: Parakou                  │
   │ Produit: Gaine x1               │
   │ Montant: 9900 F (✅ Déjà payé) │
   │ [Confirmer expédition]          │
   └─────────────────────────────────┘
4. Va à l'agence de transport (DHL, SOBETRAM, etc.)
5. Expédie le colis
6. Reçoit un code de suivi + reçu
7. Dans l'app, clique "Confirmer expédition"
8. Modal s'ouvre:
   - Code d'expédition (texte)
   - Photo du reçu (optionnel)
   - Note (optionnel)
9. Confirme

   ⚙️ API: POST /api/orders/:id/expedition/livrer
   Body: {
     "codeExpedition": "EXP-2024-12345",
     "photoRecuExpedition": "data:image/jpeg;base64,...",
     "note": "Expédié via DHL"
   }
   
   Backend traite:
   ✅ Vérifie status = EXPEDITION ou ASSIGNEE
   ✅ Vérifie delivererId = livreur connecté
   ✅ Change status → LIVREE
   ✅ Enregistre codeExpedition
   ✅ Enregistre photoRecuExpedition (si fournie)
   ✅ Enregistre expedieAt = maintenant
   ⚠️ PAS de changement stock (déjà réduit Phase 1)
   ✅ Crée historique
   
   Résultat:
   ✅ Commande marquée "Livrée/Expédiée"
   ✅ Client recevra le colis dans sa ville
```

---

### ⚡ WORKFLOW 2: EXPRESS (Paiement 10% + 90%)

```
┌─────────────────────────────────────────────────────────┐
│           WORKFLOW EXPRESS - VUE DÉTAILLÉE              │
└─────────────────────────────────────────────────────────┘

PHASE 1: CRÉATION PAR APPELANT
────────────────────────────────
1. Client commande sur site → Status: NOUVELLE
2. Appelant appelle client
3. Client confirme + PAIE 10% minimum par Mobile Money
4. Appelant dans interface:
   └─> Clique bouton "⚡ EXPRESS (Paiement 10%)"
   └─> Modal ExpressModal s'ouvre
   └─> Saisit:
       - Montant payé (pré-rempli à 10%, modifiable)
         Ex: Commande 9900 F → 990 F pré-rempli
       - Mode paiement
       - Référence transaction
       - Agence de retrait (Cotonou/Porto-Novo/Parakou...)
       - Note optionnelle
   └─> Affiche calcul automatique:
       "Reste à payer: 8910 FCFA"
   └─> Clique "Confirmer EXPRESS"

   ⚙️ API: POST /api/orders/:id/express
   Body: {
     "montantPaye": 990,
     "modePaiement": "MTN_MONEY",
     "referencePayment": "MTN-98765",
     "agenceRetrait": "Cotonou - Agence Principale",
     "note": "Client paiera le reste au retrait"
   }
   
   Backend traite:
   ✅ Vérifie montantPaye ≥ 10% du total
   ✅ Vérifie stock normal disponible > 0
   ✅ TRANSFÈRE stock:
      - Stock normal -1
      - Stock EXPRESS +1
   ✅ Crée mouvement type RESERVATION_EXPRESS
   ✅ Change status → EXPRESS
   ✅ Change deliveryType → EXPRESS
   ✅ Enregistre montantPaye (990 F)
   ✅ Calcule montantRestant (8910 F)
   ✅ Enregistre agenceRetrait
   ✅ Crée historique
   
   Résultat:
   ✅ Commande visible avec badge "Express" (orange)
   ✅ Stock normal réduit, stock EXPRESS augmenté

───────────────────────────────────────────────────────────

PHASE 2: PRÉPARATION & ENVOI (Gestionnaire Stock)
──────────────────────────────────────────────────
1. Gestionnaire Stock ouvre "⚡ Expéditions & EXPRESS"
2. Onglet "Express"
3. Voit commandes EXPRESS:
   ┌─────────────────────────────────────────────────┐
   │ CMD-124 │ Client │ Agence Cotonou │ [⚡ En att.]│
   │         │        │ 10% payé       │ d'envoi    │
   └─────────────────────────────────────────────────┘
4. Prépare colis du STOCK EXPRESS
5. Étiquette:
   ┌──────────────────────────┐
   │ EXPRESS - CMD-124        │
   │ Client: Jean D.          │
   │ Tél: 97123456            │
   │ Agence: COTONOU          │
   │ ⚠️ 90% à payer au retrait│
   └──────────────────────────┘
6. Expédie vers l'agence partenaire

───────────────────────────────────────────────────────────

PHASE 3: ARRIVÉE EN AGENCE (Admin/Gestionnaire)
────────────────────────────────────────────────
1. Agence informe: "Colis CMD-124 reçu"
2. Admin/Gestionnaire va dans "⚡ Expéditions & EXPRESS"
3. Onglet "Express"
4. Clique "Marquer comme arrivé"

   ⚙️ API: PUT /api/orders/:id/express/arrive
   
   Backend traite:
   ✅ Vérifie status = EXPRESS
   ✅ Change status → EXPRESS_ARRIVE
   ✅ Enregistre arriveAt = maintenant
   ✅ Crée historique
   
   Résultat:
   ✅ Badge devient "📍 Arrivé en agence" (cyan)

───────────────────────────────────────────────────────────

PHASE 4: NOTIFICATION CLIENT (Appelant)
────────────────────────────────────────
1. Appelant voit commandes EXPRESS_ARRIVE
2. Clique "Notifier le client"
3. Modal:
   - Message pré-rempli
   - Bouton WhatsApp automatique
   - Note optionnelle
4. Appelle/envoie message au client:
   "Bonjour Jean, votre colis CMD-124 est arrivé à 
    l'agence de Cotonou. Vous pouvez venir le retirer
    en payant les 8910 FCFA restants."

   ⚙️ API: POST /api/orders/:id/express/notifier
   Body: { "note": "Client confirmé, viendra demain" }
   
   Backend traite:
   ✅ Change clientNotifie = true
   ✅ Enregistre notifieAt = maintenant
   ✅ Enregistre notifiePar = appelant ID
   ✅ Crée ExpressNotification
   ✅ Ajoute note dans noteAppelant
   
   Résultat:
   ✅ Badge "✓ Client notifié" (vert)
   ✅ Historique des notifications visible

───────────────────────────────────────────────────────────

PHASE 5: RETRAIT PAR CLIENT (Admin/Gestionnaire)
────────────────────────────────────────────────
1. Client vient à l'agence
2. Client PAIE les 90% restants (8910 F)
3. Agence informe l'admin
4. Admin/Gestionnaire va dans "⚡ Expéditions & EXPRESS"
5. Clique "Finaliser (90%)"
6. Modal:
   - Affiche montant restant: 8910 FCFA
   - Mode paiement
   - Référence transaction
   - Note optionnelle
7. Confirme

   ⚙️ API: POST /api/orders/:id/express/finaliser
   Body: {
     "modePaiement": "CASH",
     "referencePayment": "",
     "note": "Client a retiré son colis"
   }
   
   Backend traite (Transaction Prisma):
   ✅ Vérifie status = EXPRESS_ARRIVE
   ✅ Vérifie montantRestant
   ✅ RÉDUIT stock EXPRESS (-1)
   ✅ Crée mouvement type RETRAIT_EXPRESS
   ✅ Change status → EXPRESS_LIVRE
   ✅ Met à jour montantPaye = montant total
   ✅ Met montantRestant = 0
   ✅ Enregistre deliveredAt = maintenant
   ✅ Crée historique
   
   Résultat:
   ✅ Commande marquée "Express livré" (teal)
   ✅ Stock EXPRESS réduit
   ✅ Transaction complète
```

---

## 🎯 GESTION AUTOMATIQUE DU STOCK

### Principe Clé

**Stock Normal**: Stock disponible pour vente  
**Stock EXPRESS**: Stock réservé pour commandes EXPRESS (10% payé, en attente retrait)

### Règles de Gestion

#### Scénario EXPÉDITION
```
Création EXPÉDITION (Phase 1):
  ✅ Stock normal -1 (IMMÉDIAT)
  ✅ Mouvement: RESERVATION
  ✅ Raison: "Réservation stock pour EXPÉDITION CMD-123 - Client a payé 100%"

Assignation livreur (Phase 2):
  ⚠️ PAS de changement stock

Confirmation expédition (Phase 4):
  ⚠️ PAS de changement stock (déjà réduit Phase 1)
```

#### Scénario EXPRESS
```
Création EXPRESS (Phase 1):
  ✅ Stock normal -1
  ✅ Stock EXPRESS +1
  ✅ Mouvement: RESERVATION_EXPRESS
  ✅ Raison: "Transfert vers stock EXPRESS - CMD-124 - Client a payé 10%"

Arrivée en agence (Phase 3):
  ⚠️ PAS de changement stock

Finalisation (Phase 5):
  ✅ Stock EXPRESS -1
  ✅ Mouvement: RETRAIT_EXPRESS
  ✅ Raison: "Retrait EXPRESS par client - CMD-124"
```

#### Scénario ANNULATION EXPRESS
```
Si client ne vient PAS retirer:
  ✅ Stock EXPRESS -1
  ✅ Stock normal +1
  ✅ Mouvement: ANNULATION_EXPRESS
  ✅ Raison: "Client n'est pas venu retirer - CMD-124"
```

### Exemple Concret

```
État initial:
  Stock normal: 50 unités
  Stock EXPRESS: 0

Action 1: Création EXPÉDITION (CMD-123)
  → Stock normal: 49
  → Stock EXPRESS: 0

Action 2: Création EXPRESS (CMD-124)
  → Stock normal: 48
  → Stock EXPRESS: 1

Action 3: Finalisation EXPRESS (CMD-124)
  → Stock normal: 48
  → Stock EXPRESS: 0

Résultat:
  Stock normal: 48 ✅
  2 commandes complètes (1 EXPEDITION + 1 EXPRESS)
```

---

## 🔌 API ENDPOINTS - EXPÉDITION

### Routes EXPÉDITION

#### POST /api/orders/:id/expedition
**Créer une EXPÉDITION**

```typescript
Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, GESTIONNAIRE, APPELANT

Body:
{
  "modePaiement": "ORANGE_MONEY",
  "referencePayment": "TXN-12345678",
  "note": "Client a payé 9900 FCFA"
}

Response 200:
{
  "order": { 
    id: 123,
    status: "EXPEDITION",
    deliveryType: "EXPEDITION",
    montantPaye: 9900,
    montantRestant: 0,
    ...
  },
  "message": "Expédition créée avec succès"
}
```

#### POST /api/orders/:id/expedition/assign
**Assigner un livreur à une EXPÉDITION**

```typescript
Permissions: ADMIN, GESTIONNAIRE

Body:
{
  "delivererId": 5
}

Response 200:
{
  "order": { 
    id: 123,
    status: "ASSIGNEE",
    delivererId: 5,
    ...
  },
  "message": "Livreur assigné avec succès"
}
```

#### POST /api/orders/:id/expedition/livrer
**Confirmer l'expédition (Livreur)**

```typescript
Permissions: ADMIN, LIVREUR

Body:
{
  "codeExpedition": "EXP-2024-12345",
  "photoRecuExpedition": "data:image/jpeg;base64,...",
  "note": "Expédié via DHL vers Porto-Novo"
}

Response 200:
{
  "order": { 
    id: 123,
    status: "LIVREE",
    codeExpedition: "EXP-2024-12345",
    expedieAt: "2024-12-17T10:30:00Z",
    ...
  },
  "message": "Expédition confirmée"
}
```

### Routes EXPRESS

#### POST /api/orders/:id/express
**Créer un EXPRESS**

```typescript
Permissions: ADMIN, GESTIONNAIRE, APPELANT

Body:
{
  "montantPaye": 990,
  "modePaiement": "MTN_MONEY",
  "referencePayment": "MTN-98765432",
  "agenceRetrait": "Cotonou - Agence Principale",
  "note": "Client paiera le reste au retrait"
}

Response 200:
{
  "order": { 
    id: 124,
    status: "EXPRESS",
    deliveryType: "EXPRESS",
    montantPaye: 990,
    montantRestant: 8910,
    agenceRetrait: "Cotonou - Agence Principale",
    ...
  },
  "message": "EXPRESS créé avec succès"
}
```

#### PUT /api/orders/:id/express/arrive
**Marquer comme arrivé en agence**

```typescript
Permissions: ADMIN, GESTIONNAIRE, APPELANT

Response 200:
{
  "order": { 
    id: 124,
    status: "EXPRESS_ARRIVE",
    arriveAt: "2024-12-17T14:00:00Z",
    ...
  },
  "message": "Colis marqué comme arrivé"
}
```

#### POST /api/orders/:id/express/notifier
**Notifier le client**

```typescript
Permissions: ADMIN, GESTIONNAIRE, APPELANT

Body:
{
  "note": "Client en voyage, reviendra dans 3 jours"
}

Response 200:
{
  "order": { 
    id: 124,
    clientNotifie: true,
    notifieAt: "2024-12-17T15:00:00Z",
    notifiePar: 3,
    ...
  },
  "message": "Client notifié avec succès"
}
```

#### POST /api/orders/:id/express/finaliser
**Finaliser EXPRESS (paiement 90%)**

```typescript
Permissions: ADMIN, GESTIONNAIRE, APPELANT

Body:
{
  "modePaiement": "CASH",
  "referencePayment": "",
  "note": "Client a retiré son colis"
}

Response 200:
{
  "order": { 
    id: 124,
    status: "EXPRESS_LIVRE",
    montantPaye: 9900,
    montantRestant: 0,
    deliveredAt: "2024-12-17T16:00:00Z",
    ...
  },
  "message": "EXPRESS finalisé avec succès"
}
```

---

## 🎨 INTERFACES UTILISATEUR

### Page Appelant: "À appeler"
**Localisation**: `frontend/src/pages/appelant/Orders.tsx`

**Boutons de traitement** (dans modal):
```tsx
[✓ Commande validée (Livraison locale)]

Pour les villes éloignées:
[📦 EXPÉDITION (Paiement 100%)]  → Ouvre ExpeditionModal
[⚡ EXPRESS (Paiement 10%)]      → Ouvre ExpressModal

[📵 Client injoignable]
[✕ Commande annulée]
[⏳ En attente de paiement]
[📅 Programmer un RDV]
```

### Page Gestionnaire: "Expéditions & EXPRESS"
**Localisation**: `frontend/src/pages/admin/ExpeditionsExpress.tsx`

**Onglets**:
1. **Expéditions**: Toutes les EXPÉDITIONS (non assignées + assignées)
2. **Express**: Commandes EXPRESS en attente d'envoi
3. **Express Arrivé**: Colis arrivés en agence
4. **Historique**: EXPRESS livrés

**Fonctionnalités**:
- ✅ Filtres: Recherche, Ville, Produit, Agence, Livreur, Dates
- ✅ Assignation livreur (ADMIN/GESTIONNAIRE uniquement)
- ✅ Marquage EXPRESS arrivé
- ✅ Notification client
- ✅ Finalisation EXPRESS
- ✅ Auto-refresh toutes les 30 secondes

### Page Livreur: "Mes expéditions"
**Localisation**: `frontend/src/pages/livreur/Expeditions.tsx`

**Affichage**:
- Liste des expéditions assignées au livreur
- Bouton "Confirmer expédition" pour chaque commande
- Modal avec code expédition + photo reçu

---

## 🔒 SÉCURITÉ ET AUTHENTIFICATION

### JWT Authentication

**Middleware**: `authenticate()` dans `auth.middleware.js`

```javascript
// Extrait et vérifie le token JWT
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
```

### Authorization Middleware

**Middleware**: `authorize(...roles)`

```javascript
// Vérifie que le rôle de l'utilisateur est autorisé
authorize('ADMIN', 'GESTIONNAIRE');
```

### Exemple d'utilisation dans routes

```javascript
router.post('/:id/expedition/assign', 
  authenticate,                          // Vérifie JWT
  authorize('ADMIN', 'GESTIONNAIRE'),   // Vérifie rôle
  async (req, res) => { ... }
);
```

---

## 📈 DÉPLOIEMENT ET INFRASTRUCTURE

### Environnement de Production

**Backend (Railway)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=secret_tres_securise
WEBHOOK_API_KEY=cle_api_webhook
PORT=5000
NODE_ENV=production
CORS_ORIGINS=https://obgestion.com
```

**Frontend (Vercel)**
```env
VITE_API_URL=https://gs-pipeline-app-production.up.railway.app
```

### Commandes de Déploiement

**Backend**:
```bash
# Build
npm install
npx prisma generate
npx prisma migrate deploy

# Start
node server.js
```

**Frontend**:
```bash
# Build
npm install
npm run build

# Output: dist/
```

---

## 📊 STATISTIQUES ET MONITORING

### Données Trackées

**Par Commande**:
- Date de création
- Date de validation
- Date d'expédition
- Date d'arrivée (EXPRESS)
- Livreur assigné
- Montants payés

**Par Livreur**:
- Nombre d'expéditions
- Taux de réussite
- Montant livré

**Par Produit**:
- Stock normal
- Stock EXPRESS
- Mouvements

---

## 🎯 CONCLUSION

### Points Forts du Système

✅ **Architecture Modulaire**: Backend/Frontend séparés  
✅ **Gestion Automatique du Stock**: Réduction immédiate pour EXPEDITION  
✅ **Workflow Clair**: Chaque rôle a sa responsabilité  
✅ **Permissions Granulaires**: Sécurité par rôle  
✅ **Traçabilité Complète**: Historique, photos, codes  
✅ **Scalable**: Peut gérer des milliers de commandes  

### Technologies Éprouvées

✅ **Backend**: Node.js + Express + Prisma + PostgreSQL  
✅ **Frontend**: React + TypeScript + Vite + TailwindCSS  
✅ **Cloud**: Railway + Vercel  
✅ **Sécurité**: JWT + bcrypt + Permissions  

---

**Le système est COMPLET, FONCTIONNEL et PRÊT pour la production.**

---

*Document créé le 21 décembre 2024*  
*Analyse complète de l'architecture et du système d'expédition*


