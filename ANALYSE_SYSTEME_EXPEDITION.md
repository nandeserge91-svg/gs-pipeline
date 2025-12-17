# 📦 ANALYSE COMPLÈTE DU SYSTÈME D'EXPÉDITION

## 🎯 VUE D'ENSEMBLE

Le système d'expédition gère deux types de livraisons pour les villes éloignées :
- **EXPÉDITION** : Paiement 100% avant envoi
- **EXPRESS** : Paiement 10% avant envoi, 90% au retrait en agence

---

## 🏗️ ARCHITECTURE GÉNÉRALE

### Structure du Projet

```
GS Pipeline/
├── Backend (Node.js + Express + Prisma)
│   ├── routes/
│   │   ├── order.routes.js        → Gestion des commandes et expéditions
│   │   └── delivery.routes.js     → Gestion des livraisons et tournées
│   ├── prisma/
│   │   └── schema.prisma          → Modèle de données
│   └── middlewares/
│       └── auth.middleware.js     → Authentification et autorisations
│
└── Frontend (React + TypeScript + Vite)
    ├── src/
    │   ├── pages/
    │   │   ├── appelant/Orders.tsx       → Interface appelant
    │   │   ├── gestionnaire/Deliveries.tsx → Interface gestionnaire
    │   │   └── livreur/Deliveries.tsx    → Interface livreur
    │   ├── components/modals/
    │   │   ├── ExpeditionModal.tsx       → Modal création expédition
    │   │   └── ExpressModal.tsx          → Modal création express
    │   ├── lib/api.ts                    → Client API
    │   └── types/index.ts                → Types TypeScript
```

---

## 📊 MODÈLE DE DONNÉES

### Table `Order` (Commandes)

**Champs liés aux expéditions :**

```prisma
model Order {
  // Type de livraison
  deliveryType      DeliveryType @default(LOCAL)
  
  // Paiement
  montantPaye       Float?       // Montant déjà payé
  montantRestant    Float?       // Montant restant à payer
  modePaiement      String?      // Orange Money, MTN, Wave, Moov
  referencePayment  String?      // Référence transaction
  
  // Expédition - Suivi
  codeExpedition    String?      // Code de suivi fourni par livreur
  photoRecuExpedition String?    // Photo du reçu (base64 ou URL)
  photoRecuExpeditionUploadedAt DateTime? // Date upload (auto-suppression après 7j)
  expedieAt         DateTime?    // Date d'expédition
  
  // Express - Agence
  agenceRetrait     String?      // Nom agence (Cotonou, Porto-Novo, etc.)
  clientNotifie     Boolean?     // Client notifié de l'arrivée
  notifieAt         DateTime?    // Date de notification
  notifiePar        Int?         // ID appelant qui a notifié
  arriveAt          DateTime?    // Date d'arrivée en agence
  
  // En attente paiement
  enAttentePaiement Boolean @default(false)
  attentePaiementAt DateTime?
}
```

### Énumérations

```prisma
enum DeliveryType {
  LOCAL       // Livraison locale normale
  EXPEDITION  // Paiement 100% avant envoi
  EXPRESS     // Paiement 10% avant, 90% au retrait
}

enum OrderStatus {
  // ... statuts standards ...
  EXPEDITION        // En attente d'expédition
  EXPRESS           // En attente d'envoi vers agence
  EXPRESS_ARRIVE    // Colis arrivé en agence
  EXPRESS_LIVRE     // Express livré après paiement 90%
  ASSIGNEE          // Assigné à un livreur
  LIVREE            // Livrée/Expédiée
}
```

---

## 🔄 WORKFLOWS DÉTAILLÉS

### Workflow 1 : EXPÉDITION (Paiement 100%)

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW EXPÉDITION                       │
└─────────────────────────────────────────────────────────────┘

1️⃣ CLIENT COMMANDE
   └─> Site web → Webhook → Status: NOUVELLE

2️⃣ APPELANT TRAITE
   └─> Appelle le client
   └─> Client confirme + PAIE 100% (Orange Money/MTN/Wave/Moov)
   └─> Appelant clique "📦 EXPÉDITION"
   └─> Modal s'ouvre :
       - Mode paiement (sélection)
       - Référence transaction
       - Note optionnelle
   └─> API: POST /api/orders/:id/expedition
   
   Backend traite :
   ✅ Vérifie paiement 100%
   ✅ Vérifie stock disponible
   ✅ RÉDUIT stock immédiatement (-1)
   ✅ Crée mouvement stock type RESERVATION
   ✅ Change status → EXPEDITION
   ✅ Enregistre deliveryType → EXPEDITION
   ✅ Enregistre montantPaye = montant total
   ✅ Enregistre montantRestant = 0
   ✅ Crée historique

3️⃣ GESTIONNAIRE PRINCIPAL ASSIGNE LIVREUR
   └─> Page "⚡ Expéditions & EXPRESS"
   └─> Onglet "Expéditions"
   └─> Voit commandes avec badge "⏳ Non assigné"
   └─> Clique "Assigner livreur"
   └─> Modal : Sélectionne le livreur dans la liste
   └─> API: POST /api/orders/:id/expedition/assign
   
   Backend traite :
   ✅ Vérifie statut = EXPEDITION
   ✅ Vérifie livreur existe et est actif
   ✅ Assigne le livreur
   ✅ Change status → ASSIGNEE
   ✅ Enregistre delivererId
   ✅ Crée historique

4️⃣ GESTIONNAIRE DE STOCK PRÉPARE COLIS
   └─> Page "⚡ Expéditions & EXPRESS"
   └─> Voit expéditions assignées
   └─> Colonne "Livreur" affiche nom + téléphone
   └─> Badge "✓ Assignée - Préparer le colis"
   └─> Prépare le colis du stock normal
   └─> Remet au livreur assigné

5️⃣ LIVREUR EXPÉDIE
   └─> Dashboard livreur
   └─> Section "🚚 Mes EXPÉDITIONS à livrer"
   └─> Voit ses expéditions assignées
   └─> Prend le colis
   └─> Va à l'agence de transport
   └─> Expédie vers la ville du client
   └─> Clique "Confirmer expédition"
   └─> Modal :
       - Code d'expédition/tracking
       - Photo du reçu (optionnel)
       - Note (optionnel)
   └─> API: POST /api/orders/:id/expedition/livrer
   
   Backend traite :
   ✅ Vérifie statut = EXPEDITION ou ASSIGNEE
   ✅ Vérifie livreur assigné = livreur connecté
   ✅ Change status → LIVREE
   ✅ Enregistre codeExpedition
   ✅ Enregistre photoRecuExpedition (si fournie)
   ✅ Enregistre expedieAt = maintenant
   ⚠️ PAS de changement stock (déjà réduit à l'étape 2)
   ✅ Crée historique

6️⃣ CLIENT REÇOIT COLIS
   └─> Agence de transport livre au client
   └─> Client paie les frais de transport (séparé)
   └─> Client reçoit son colis
```

### Workflow 2 : EXPRESS (Paiement 10% + 90%)

```
┌─────────────────────────────────────────────────────────────┐
│                      WORKFLOW EXPRESS                        │
└─────────────────────────────────────────────────────────────┘

1️⃣ CLIENT COMMANDE
   └─> Site web → Webhook → Status: NOUVELLE

2️⃣ APPELANT TRAITE
   └─> Appelle le client
   └─> Client confirme + PAIE 10% minimum (acompte)
   └─> Appelant clique "⚡ EXPRESS"
   └─> Modal s'ouvre :
       - Montant payé (pré-rempli à 10%, modifiable)
       - Mode paiement
       - Référence transaction
       - Agence de retrait (Cotonou, Porto-Novo, Parakou, etc.)
       - Note optionnelle
   └─> Calcul automatique : montant restant = total - payé
   └─> API: POST /api/orders/:id/express
   
   Backend traite :
   ✅ Vérifie paiement ≥ 10%
   ✅ Vérifie stock normal disponible
   ✅ TRANSFÈRE stock normal → stock EXPRESS
   ✅ Crée mouvement stock type RESERVATION_EXPRESS
   ✅ Change status → EXPRESS
   ✅ Enregistre deliveryType → EXPRESS
   ✅ Enregistre montantPaye (ex: 990 FCFA)
   ✅ Calcule montantRestant (ex: 8910 FCFA)
   ✅ Enregistre agenceRetrait
   ✅ Crée historique

3️⃣ GESTIONNAIRE DE STOCK PRÉPARE
   └─> Page "⚡ Expéditions & EXPRESS"
   └─> Onglet "Express"
   └─> Voit commandes EXPRESS
   └─> Badge "⚡ En attente d'envoi"
   └─> Prépare colis du stock EXPRESS
   └─> Étiquette : Nom client + Agence de retrait
   └─> Expédie vers l'agence

4️⃣ COLIS ARRIVE EN AGENCE
   └─> Admin/Gestionnaire reçoit notification
   └─> Page "⚡ Expéditions & EXPRESS"
   └─> Onglet "Express"
   └─> Clique "Marquer comme arrivé"
   └─> API: PUT /api/orders/:id/express/arrive
   
   Backend traite :
   ✅ Vérifie statut = EXPRESS
   ✅ Change status → EXPRESS_ARRIVE
   ✅ Enregistre arriveAt = maintenant
   ✅ Crée historique

5️⃣ APPELANT NOTIFIE CLIENT
   └─> Page "⚡ Expéditions & EXPRESS"
   └─> Onglet "Express"
   └─> Voit badge "📍 Arrivé en agence"
   └─> Clique "Notifier le client"
   └─> Modal :
       - Message pré-rempli
       - WhatsApp automatique
       - Note optionnelle
   └─> API: POST /api/orders/:id/express/notifier
   
   Backend traite :
   ✅ Change clientNotifie = true
   ✅ Enregistre notifieAt = maintenant
   ✅ Enregistre notifiePar = appelant ID
   ✅ Crée notification dans ExpressNotification

6️⃣ CLIENT VIENT RETIRER
   └─> Client va à l'agence
   └─> Client PAIE les 90% restants
   └─> Admin/Gestionnaire finalise
   └─> Page "⚡ Expéditions & EXPRESS"
   └─> Clique "Finaliser (90%)"
   └─> Modal :
       - Montant restant affiché
       - Mode paiement
       - Référence transaction
       - Note optionnelle
   └─> API: POST /api/orders/:id/express/finaliser
   
   Backend traite :
   ✅ Vérifie statut = EXPRESS_ARRIVE
   ✅ Vérifie montant = montantRestant
   ✅ RÉDUIT stock EXPRESS (-1)
   ✅ Crée mouvement stock type RETRAIT_EXPRESS
   ✅ Change status → EXPRESS_LIVRE
   ✅ Met à jour montantPaye = montant total
   ✅ Met à jour montantRestant = 0
   ✅ Crée historique
```

---

## 🔌 API ENDPOINTS

### Routes Expédition

#### 1. Créer une EXPÉDITION
```http
POST /api/orders/:id/expedition

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
  "order": { ... },
  "message": "Expédition créée avec succès"
}
```

#### 2. Assigner un livreur à une EXPÉDITION
```http
POST /api/orders/:id/expedition/assign

Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, GESTIONNAIRE

Body:
{
  "delivererId": 5
}

Response 200:
{
  "order": { ... },
  "message": "Livreur assigné avec succès"
}
```

#### 3. Confirmer l'expédition (Livreur)
```http
POST /api/orders/:id/expedition/livrer

Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, LIVREUR

Body:
{
  "codeExpedition": "EXP-2024-12345",
  "photoRecuExpedition": "data:image/jpeg;base64,...",
  "note": "Expédié via DHL vers Porto-Novo"
}

Response 200:
{
  "order": { ... },
  "message": "Expédition confirmée"
}
```

### Routes Express

#### 1. Créer un EXPRESS
```http
POST /api/orders/:id/express

Headers:
  Authorization: Bearer <token>

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
  "order": { ... },
  "message": "EXPRESS créé avec succès"
}
```

#### 2. Marquer comme arrivé en agence
```http
PUT /api/orders/:id/express/arrive

Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, GESTIONNAIRE, APPELANT

Response 200:
{
  "order": { ... },
  "message": "Colis marqué comme arrivé"
}
```

#### 3. Notifier le client
```http
POST /api/orders/:id/express/notifier

Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, GESTIONNAIRE, APPELANT

Body:
{
  "note": "Client en voyage, reviendra dans 3 jours"
}

Response 200:
{
  "order": { ... },
  "message": "Client notifié avec succès"
}
```

#### 4. Finaliser EXPRESS (paiement 90%)
```http
POST /api/orders/:id/express/finaliser

Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, GESTIONNAIRE, APPELANT

Body:
{
  "modePaiement": "CASH",
  "referencePayment": "",
  "note": "Client a retiré son colis"
}

Response 200:
{
  "order": { ... },
  "message": "EXPRESS finalisé avec succès"
}
```

### Routes Livraisons

#### 1. Récupérer mes expéditions (Livreur)
```http
GET /api/delivery/my-expeditions?date=2024-12-17&status=ASSIGNEE

Headers:
  Authorization: Bearer <token>

Permissions: LIVREUR

Response 200:
{
  "orders": [
    {
      "id": 123,
      "orderReference": "CMD-12345",
      "clientNom": "Marie Konan",
      "clientTelephone": "96789123",
      "clientVille": "Parakou",
      "deliveryType": "EXPEDITION",
      "status": "ASSIGNEE",
      "montant": 9900,
      "montantPaye": 9900,
      ...
    }
  ]
}
```

#### 2. Récupérer les listes de livraison
```http
GET /api/delivery/lists?delivererId=5

Headers:
  Authorization: Bearer <token>

Permissions: ADMIN, GESTIONNAIRE, GESTIONNAIRE_STOCK, APPELANT

Response 200:
{
  "lists": [
    {
      "id": 10,
      "nom": "Livraison 17/12/2024",
      "date": "2024-12-17",
      "deliverer": {
        "id": 5,
        "nom": "Mensah",
        "prenom": "Kofi",
        "telephone": "91234567"
      },
      "orders": [
        {
          "id": 123,
          "deliveryType": "EXPEDITION",
          "codeExpedition": "EXP-12345",
          "photoRecuExpedition": "https://...",
          ...
        }
      ]
    }
  ]
}
```

---

## 👥 PERMISSIONS PAR RÔLE

### ADMIN (Tous les droits)
- ✅ Voir page "Expéditions & EXPRESS"
- ✅ Créer EXPÉDITION et EXPRESS
- ✅ Assigner livreur à EXPÉDITION
- ✅ Marquer EXPRESS arrivé
- ✅ Notifier clients EXPRESS
- ✅ Finaliser EXPRESS (90%)
- ✅ Confirmer livraison EXPÉDITION

### GESTIONNAIRE (Presque tous les droits)
- ✅ Voir page "Expéditions & EXPRESS"
- ✅ Créer EXPÉDITION et EXPRESS
- ✅ **Assigner livreur à EXPÉDITION** ⭐
- ✅ Marquer EXPRESS arrivé
- ✅ Notifier clients EXPRESS
- ✅ Finaliser EXPRESS (90%)
- ❌ Confirmer livraison (réservé au livreur)

### APPELANT (Droits limités)
- ✅ Voir page "Expéditions & EXPRESS"
- ✅ Créer EXPÉDITION et EXPRESS
- ❌ **Assigner livreur** (réservé au gestionnaire) ⭐
- ✅ Marquer EXPRESS arrivé
- ✅ Notifier clients EXPRESS
- ✅ Finaliser EXPRESS (90%)

### GESTIONNAIRE DE STOCK (Lecture seule)
- ✅ Voir page "Expéditions & EXPRESS"
- ✅ Voir nom du livreur assigné
- ❌ Aucune action (lecture seule)

### LIVREUR (Ses expéditions uniquement)
- ❌ Pas d'accès à "Expéditions & EXPRESS"
- ✅ Voir ses expéditions dans son dashboard
- ✅ Confirmer expédition/livraison

---

## 🎨 INTERFACES UTILISATEUR

### Page Appelant : "À appeler" (Orders.tsx)

**Localisation** : `frontend/src/pages/appelant/Orders.tsx`

**Modal de traitement :**
```
┌─────────────────────────────────────────┐
│ Traiter l'appel                         │
├─────────────────────────────────────────┤
│ [✓ Commande validée (Livraison locale)] │
│                                          │
│ Pour les villes éloignées :             │
│ [📦 EXPÉDITION (Paiement 100%)]         │
│ [⚡ EXPRESS (Paiement 10%)]             │
│                                          │
│ [📵 Client injoignable]                 │
│ [✕ Commande annulée]                    │
│ [⏳ En attente de paiement]             │
│ [📅 Programmer un RDV]                  │
└─────────────────────────────────────────┘
```

**Modal EXPÉDITION :**
```
┌─────────────────────────────────────────┐
│ 📦 Créer une EXPÉDITION                 │
├─────────────────────────────────────────┤
│ Client : Marie Konan                    │
│ Ville : Parakou                         │
│ Produit : Gaine Minceur x1              │
│ Montant TOTAL : 9 900 FCFA              │
│                                          │
│ ⚠️ Paiement 100% requis                │
│                                          │
│ Mode de paiement *                      │
│ [v] Orange Money                        │
│     MTN Money                           │
│     Moov Money                          │
│     Wave                                │
│                                          │
│ Référence transaction *                 │
│ [TXN-12345678____________]              │
│                                          │
│ Note (optionnel)                        │
│ [_________________________]             │
│                                          │
│ [Annuler]        [Créer EXPÉDITION]    │
└─────────────────────────────────────────┘
```

**Modal EXPRESS :**
```
┌─────────────────────────────────────────┐
│ ⚡ Créer un EXPRESS                     │
├─────────────────────────────────────────┤
│ Client : Jean Dupont                    │
│ Ville : Porto-Novo                      │
│ Produit : Crème x2                      │
│ Montant TOTAL : 8 500 FCFA              │
│                                          │
│ Montant payé (minimum 10%) *            │
│ [850_____] FCFA                         │
│                                          │
│ → Reste à payer : 7 650 FCFA            │
│                                          │
│ Mode de paiement *                      │
│ [v] MTN Money                           │
│                                          │
│ Référence transaction *                 │
│ [MTN-98765432____________]              │
│                                          │
│ Agence de retrait *                     │
│ [v] Cotonou - Agence Principale         │
│     Porto-Novo - Centre                 │
│     Parakou - Nord                      │
│                                          │
│ Note (optionnel)                        │
│ [_________________________]             │
│                                          │
│ [Annuler]           [Créer EXPRESS]    │
└─────────────────────────────────────────┘
```

### Page Gestionnaire : "Expéditions & EXPRESS" (Deliveries.tsx)

**Localisation** : `frontend/src/pages/gestionnaire/Deliveries.tsx`

**Onglets :**
- Expéditions (deliveryType = EXPEDITION)
- Express (deliveryType = EXPRESS)

**Tableau Expéditions :**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🚚 Expéditions en cours (3)                                         │
│ Commandes avec paiement 100% effectué                               │
├──────────────────────────────────────────────────────────────────────┤
│ Référence  │ Client     │ Ville      │ Produit  │ Livreur │ Actions │
├──────────────────────────────────────────────────────────────────────┤
│ CMD-12345  │ Jean D.    │ Porto-Novo │ Gaine x1 │ Non     │ [Assig] │
│            │ 97123456   │            │ 9900 F   │ assigné │         │
├──────────────────────────────────────────────────────────────────────┤
│ CMD-12346  │ Marie K.   │ Parakou    │ Crème x2 │ ✓ Kofi  │ ✓ Ass.  │
│            │ 96789123   │            │ 8500 F   │ 91234567│         │
└──────────────────────────────────────────────────────────────────────┘
```

**Modal Assignation :**
```
┌─────────────────────────────────────────┐
│ Assigner un livreur                     │
├─────────────────────────────────────────┤
│ 📦 Référence : CMD-12345                │
│ 👤 Client : Jean Dupont                 │
│ 📍 Ville : Porto-Novo                   │
│ 📦 Produit : Gaine Minceur x1           │
│                                          │
│ Sélectionner un livreur *               │
│ [v] Choisir un livreur...               │
│     Kofi Mensah - 91234567              │
│     Ama Tété - 96456789                 │
│     Yao Koffi - 97654321                │
│                                          │
│ [Annuler]              [Assigner]       │
└─────────────────────────────────────────┘
```

### Page Livreur : Dashboard (Deliveries.tsx)

**Localisation** : `frontend/src/pages/livreur/Deliveries.tsx`

**Section Expéditions :**
```
┌─────────────────────────────────────────────────┐
│ 🚚 Mes EXPÉDITIONS à livrer (2)                 │
├─────────────────────────────────────────────────┤
│ CMD-12345                                       │
│ Client : Marie Konan - 96789123                │
│ Ville : Parakou                                 │
│ Produit : Gaine Minceur x1                      │
│ Montant : 9900 FCFA (✅ Déjà payé)             │
│                                                  │
│ [Confirmer expédition]                          │
└─────────────────────────────────────────────────┘
```

**Modal Confirmation :**
```
┌─────────────────────────────────────────┐
│ Confirmer l'expédition                  │
├─────────────────────────────────────────┤
│ Client : Marie Konan                    │
│ Ville : Parakou                         │
│ Montant : 9900 FCFA (Déjà payé ✅)     │
│                                          │
│ Code d'expédition *                     │
│ [EXP-2024-12345__________]              │
│                                          │
│ Photo du reçu (optionnel)               │
│ [📸 Prendre une photo]                  │
│                                          │
│ Note (optionnel)                        │
│ [_________________________]             │
│                                          │
│ [Annuler]        [Confirmer]           │
└─────────────────────────────────────────┘
```

---

## 💾 GESTION DU STOCK

### Principe Clé

**Stock Normal** : Stock disponible pour vente
**Stock EXPRESS** : Stock réservé pour commandes EXPRESS (10% payé)

### Règles de Gestion

#### EXPÉDITION
```
Création EXPÉDITION :
  ✅ Stock normal -1 (IMMÉDIAT)
  ✅ Mouvement : RESERVATION
  ✅ Raison : Paiement 100% effectué

Confirmation livraison :
  ⚠️ PAS de changement stock (déjà réduit)
```

#### EXPRESS
```
Création EXPRESS :
  ✅ Stock normal -1
  ✅ Stock EXPRESS +1
  ✅ Mouvement : RESERVATION_EXPRESS
  ✅ Raison : Transfert vers stock EXPRESS (10% payé)

Finalisation (paiement 90%) :
  ✅ Stock EXPRESS -1
  ✅ Mouvement : RETRAIT_EXPRESS
  ✅ Raison : Client a retiré son colis

Annulation avant retrait :
  ✅ Stock EXPRESS -1
  ✅ Stock normal +1
  ✅ Mouvement : ANNULATION_EXPRESS
  ✅ Raison : Client n'est pas venu retirer
```

### Mouvements de Stock

```prisma
enum StockMovementType {
  RESERVATION          // Expédition créée (paiement 100%)
  RESERVATION_EXPRESS  // Express créé (transfert vers stock EXPRESS)
  RETRAIT_EXPRESS      // Express finalisé (client a retiré)
  ANNULATION_EXPRESS   // Express annulé (retour au stock normal)
  RETOUR               // Retour de colis non livré
  CORRECTION           // Correction manuelle
}
```

---

## 🔒 SÉCURITÉ ET VALIDATIONS

### Backend

**Middleware d'authentification** : `authenticate()`
- Vérifie le token JWT
- Injecte `req.user` avec les infos utilisateur

**Middleware d'autorisation** : `authorize(...roles)`
- Vérifie que le rôle de l'utilisateur est dans la liste autorisée
- Exemple : `authorize('ADMIN', 'GESTIONNAIRE')`

### Validations Métier

**Création EXPÉDITION :**
- ✅ Commande doit être VALIDEE ou A_APPELER
- ✅ Montant payé = 100%
- ✅ Stock disponible > 0
- ✅ Mode paiement valide
- ✅ Référence transaction fournie

**Création EXPRESS :**
- ✅ Commande doit être VALIDEE ou A_APPELER
- ✅ Montant payé ≥ 10%
- ✅ Stock normal disponible > 0
- ✅ Agence de retrait fournie
- ✅ Mode paiement valide

**Assignation Livreur :**
- ✅ Statut = EXPEDITION
- ✅ Livreur existe et actif
- ✅ Rôle = LIVREUR
- ✅ Seuls ADMIN et GESTIONNAIRE peuvent assigner

**Confirmation Expédition :**
- ✅ Statut = EXPEDITION ou ASSIGNEE
- ✅ Livreur assigné = livreur connecté
- ✅ Code expédition fourni (recommandé)

---

## 📈 STATISTIQUES ET RAPPORTS

### Données Trackées

**Par Commande :**
- Date de création
- Date de validation
- Date d'expédition (expedieAt)
- Date d'arrivée (arriveAt pour EXPRESS)
- Livreur assigné
- Montant total
- Montant payé / restant

**Par Livreur :**
- Nombre d'expéditions assignées
- Nombre d'expéditions confirmées
- Taux de réussite

**Par Produit :**
- Stock normal
- Stock EXPRESS
- Mouvements de stock

---

## 🔄 CAS D'USAGE SPÉCIAUX

### Cas 1 : Client change d'avis après paiement EXPÉDITION

```
1. Appelant crée EXPÉDITION → Stock -1
2. Client annule avant expédition
3. Admin/Gestionnaire supprime la commande
   └─> Route : DELETE /api/orders/:id
   └─> Backend :
       ✅ Restaure stock +1
       ✅ Crée mouvement RETOUR
       ✅ Supprime la commande
```

### Cas 2 : Client ne vient pas retirer EXPRESS

```
1. Appelant crée EXPRESS → Stock normal -1, Stock EXPRESS +1
2. Colis arrive en agence
3. Appelant notifie le client
4. Client ne vient pas retirer après 30 jours
5. Admin annule l'EXPRESS
   └─> API : DELETE /api/orders/:id ou changement statut
   └─> Backend :
       ✅ Stock EXPRESS -1
       ✅ Stock normal +1
       ✅ Crée mouvement ANNULATION_EXPRESS
```

### Cas 3 : Livreur perd le colis

```
1. Expédition assignée au livreur
2. Livreur perd le colis
3. Gestionnaire crée mouvement de stock manuel
   └─> Type : PERTE
   └─> Quantité : -1 (si pas encore déduit)
   └─> Motif : "Colis perdu par livreur Kofi"
```

### Cas 4 : Photo du reçu expirée (> 7 jours)

```
Backend (automatic cleanup) :
  ✅ Chaque requête vers /api/delivery/lists
  ✅ Vérifie photoRecuExpeditionUploadedAt
  ✅ Si > 7 jours : supprime la photo
  ✅ Met photoRecuExpedition = null

Frontend :
  ✅ Fonction isPhotoExpired() vérifie la date
  ✅ Affiche "Photo expirée" si > 7 jours
```

---

## 🔧 CONFIGURATION ET DÉPLOIEMENT

### Variables d'Environnement

**Backend (.env) :**
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="votre_secret_jwt_securise"
WEBHOOK_API_KEY="cle_api_webhook"
PORT=5000
NODE_ENV=production
```

**Frontend (.env) :**
```env
VITE_API_URL=https://gs-pipeline-app-production.up.railway.app
```

### Déploiement

**Backend (Railway) :**
- Build Command : `npm install && npx prisma generate && npx prisma migrate deploy`
- Start Command : `node server.js`
- Port : 5000

**Frontend (Vercel) :**
- Build Command : `npm run build`
- Output Directory : `dist`
- Framework : Vite

---

## 📝 POINTS D'ATTENTION

### ⚠️ Problèmes Potentiels

1. **Stock négatif**
   - Cause : Plusieurs commandes simultanées
   - Solution : Transactions Prisma + vérification stock

2. **Photo trop lourde**
   - Cause : Base64 de grande taille
   - Solution : Compression côté frontend + limite 2MB

3. **Livreur non assigné**
   - Cause : Appelant crée EXPÉDITION sans assignation
   - Solution : Workflow obligatoire gestionnaire → assignation

4. **Client ne paie pas les 90% EXPRESS**
   - Cause : Client change d'avis
   - Solution : Procédure d'annulation après 30 jours

### ✅ Bonnes Pratiques

1. **Toujours vérifier le stock avant création EXPÉDITION/EXPRESS**
2. **Assigner un livreur avant remise du colis**
3. **Demander code d'expédition au livreur**
4. **Notifier rapidement le client pour EXPRESS**
5. **Suivre les mouvements de stock régulièrement**

---

## 📚 RESSOURCES COMPLÉMENTAIRES

### Documentation Existante

- `WORKFLOW_EXPEDITION_COMPLET.md` - Workflow détaillé
- `GUIDE_ASSIGNATION_LIVREUR_EXPEDITION.md` - Guide assignation
- `PERMISSIONS_EXPEDITIONS_EXPRESS.md` - Détail des permissions
- `RECAP_FINAL_EXPEDITION_EXPRESS.md` - Récapitulatif implémentation

### Code Source

**Backend :**
- `routes/order.routes.js` - Routes commandes et expéditions
- `routes/delivery.routes.js` - Routes livraisons
- `prisma/schema.prisma` - Modèle de données

**Frontend :**
- `src/pages/appelant/Orders.tsx` - Interface appelant
- `src/pages/gestionnaire/Deliveries.tsx` - Interface gestionnaire
- `src/pages/livreur/Deliveries.tsx` - Interface livreur
- `src/components/modals/ExpeditionModal.tsx` - Modal expédition
- `src/components/modals/ExpressModal.tsx` - Modal express

---

## 🎯 CONCLUSION

Le système d'expédition est **complet et fonctionnel**, offrant :

✅ **2 modes de livraison** pour villes éloignées (EXPÉDITION et EXPRESS)
✅ **Gestion automatique du stock** (réduction immédiate, transfert EXPRESS)
✅ **Workflow clair** pour chaque rôle (Appelant, Gestionnaire, Livreur)
✅ **Permissions granulaires** par rôle
✅ **Traçabilité complète** (codes, photos, historique)
✅ **Notifications WhatsApp** automatiques
✅ **Sécurité** (authentification JWT, validations métier)

Le système est **prêt pour la production** et **évolutif** pour de futures améliorations.

---

*Document créé le 17 décembre 2024*
*Version 1.0 - Analyse complète du système d'expédition*
