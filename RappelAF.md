# 📋 RAPPEL AF - SYSTÈME DE GESTION E-COMMERCE
**Document de Référence Complet pour IA**  
*Dernière mise à jour : 18 Décembre 2024*

---

## 🎯 CONTEXTE GLOBAL

### Nom du Projet
**GS PIPELINE** - Application de gestion e-commerce complète

### Client / Utilisateur
- **Utilisateur** : MSI
- **Environnement** : Windows 10.0.26200, PowerShell
- **Workspace** : `c:\Users\MSI\Desktop\GS cursor`

### Infrastructure de Déploiement
- **GitHub** : Repository principal pour versioning
- **Railway** : Hébergement backend + PostgreSQL
  - URL Backend : https://gs-pipeline-production.up.railway.app
  - Base de données : PostgreSQL hébergée sur Railway
- **Vercel** : Hébergement frontend
  - URL Frontend : https://gs-pipeline-alpha.vercel.app
  - Domaine custom : https://afgestion.net

---

## 🏗️ ARCHITECTURE SYSTÈME

### Vue d'ensemble
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                    │
│  React + TypeScript + Vite + Tailwind CSS               │
│  https://afgestion.net                                  │
└────────────────────────┬────────────────────────────────┘
                         ↓
                    (HTTPS API)
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Railway)                     │
│  Node.js + Express + Prisma ORM                         │
│  https://gs-pipeline-production.up.railway.app          │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│            BASE DE DONNÉES (Railway)                    │
│  PostgreSQL 14                                          │
│  12 tables + système de gestion complet                │
└─────────────────────────────────────────────────────────┘
                         ↑
                         │
┌────────────────────────┴────────────────────────────────┐
│              INTÉGRATIONS EXTERNES                      │
│  • Google Sheet (Bee Venom) → Webhook                   │
│  • Make.com → Webhook annulations                       │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 STACK TECHNIQUE DÉTAILLÉE

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | ≥18.x | Runtime |
| **Express** | ^4.18.2 | Framework web |
| **Prisma** | 5.7.0 | ORM base de données |
| **PostgreSQL** | 14 | Base de données |
| **JWT** | jsonwebtoken ^9.0.2 | Authentification |
| **bcryptjs** | ^2.4.3 | Hashage mots de passe |
| **node-cron** | ^4.2.1 | Tâches planifiées |
| **express-validator** | ^7.0.1 | Validation données |
| **cors** | ^2.8.5 | Gestion CORS |
| **dotenv** | ^16.3.1 | Variables d'environnement |

**Scripts disponibles** :
```json
"dev": "nodemon server.js"
"start": "node server.js"
"prisma:migrate": "prisma migrate dev"
"prisma:deploy": "prisma migrate deploy"
"prisma:seed": "node prisma/seed.js"
```

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | ^18.2.0 | Framework UI |
| **TypeScript** | ^5.2.2 | Langage |
| **Vite** | ^5.0.8 | Build tool |
| **Tailwind CSS** | ^3.3.6 | Styling |
| **React Router** | ^6.20.1 | Routing |
| **Axios** | ^1.6.2 | HTTP client |
| **Zustand** | ^4.4.7 | State management |
| **React Query** | @tanstack/react-query ^5.14.2 | Data fetching |
| **date-fns** | ^3.0.6 | Gestion dates |
| **Recharts** | ^2.15.4 | Graphiques |
| **lucide-react** | ^0.294.0 | Icônes |
| **react-hot-toast** | ^2.4.1 | Notifications |

**Scripts disponibles** :
```json
"dev": "vite"
"build": "vite build"
"preview": "vite preview"
```

---

## 📊 BASE DE DONNÉES - SCHÉMA PRISMA

### 12 Tables Principales

#### 1. **User** - Utilisateurs du système
```prisma
id, email, password, nom, prenom, telephone, role, actif
Roles: ADMIN, GESTIONNAIRE, GESTIONNAIRE_STOCK, APPELANT, LIVREUR
```

#### 2. **Order** - Commandes (Table centrale)
```prisma
id, orderReference, clientNom, clientTelephone, clientVille, clientCommune, clientAdresse
produitNom, produitPage, productId, quantite, montant
deliveryType: LOCAL, EXPEDITION, EXPRESS
montantPaye, montantRestant, modePaiement, referencePayment
status: OrderStatus (16 statuts)
callerId, delivererId, deliveryListId
noteAppelant, noteLivreur, noteGestionnaire
codeExpedition, photoRecuExpedition
rdvProgramme, rdvDate, rdvNote
```

**16 Statuts de commande** :
```
NOUVELLE          → Reçue depuis le site
A_APPELER         → En attente d'appel
VALIDEE           → Client a validé
ANNULEE           → Client a annulé
INJOIGNABLE       → Client non joignable
ASSIGNEE          → Assignée à livreur
LIVREE            → Livrée avec succès
REFUSEE           → Refusée à livraison
ANNULEE_LIVRAISON → Annulée pendant livraison
RETOURNE          → Retourné par livreur
EXPEDITION        → Paiement 100% - Envoi autre ville
EXPRESS           → Paiement 10% - Retrait en agence
EXPRESS_ARRIVE    → Arrivé en agence
EXPRESS_LIVRE     → Express livré après paiement 90%
```

#### 3. **Product** - Catalogue produits
```prisma
id, code, nom, description
prixUnitaire, prix1, prix2, prix3 (variantes de prix)
stockActuel, stockExpress, stockAlerte
```

#### 4. **StatusHistory** - Historique changements statuts
```prisma
id, orderId, oldStatus, newStatus, changedBy, comment
```

#### 5. **DeliveryList** - Listes de livraison journalières
```prisma
id, nom, date, delivererId, zone
```

#### 6. **CallStatistic** - Statistiques d'appels (appelants)
```prisma
id, userId, date
totalAppels, totalValides, totalAnnules, totalInjoignables
```

#### 7. **DeliveryStatistic** - Statistiques de livraison (livreurs)
```prisma
id, userId, date
totalLivraisons, totalRefusees, totalAnnulees, montantLivre
```

#### 8. **ExpressNotification** - Notifications EXPRESS en agence
```prisma
id, orderId, userId, note, notifiedAt
```

#### 9. **StockMovement** - Mouvements de stock
```prisma
id, productId, type, quantite, stockAvant, stockApres
orderId, tourneeId, effectuePar, motif
Types: APPROVISIONNEMENT, LIVRAISON, RETOUR, CORRECTION, PERTE, 
       RESERVATION, RESERVATION_EXPRESS, RETRAIT_EXPRESS, ANNULATION_EXPRESS
```

#### 10. **TourneeStock** - Gestion tournées côté stock
```prisma
id, deliveryListId
colisRemis, colisLivres, colisRetour
ecart, ecartMotif
```

---

## 🚀 ROUTES API (Backend)

### Structure des Routes
```
/api
├── /auth                 → Authentification (login, register)
├── /users                → Gestion utilisateurs (CRUD)
├── /orders               → Gestion commandes (CRUD + filtres)
├── /delivery             → Gestion livraisons
├── /express              → Gestion EXPRESS (arrive, retrait)
├── /rdv                  → Gestion RDV programmés
├── /stats                → Statistiques globales
├── /products             → Gestion produits
├── /stock                → Gestion stock
├── /accounting           → Comptabilité
└── /webhook              → Webhooks externes (Make, Google Sheets)
```

### Routes Principales

**Authentification** (`/api/auth`)
- `POST /login` - Connexion utilisateur
- `POST /register` - Inscription (admin only)
- `GET /me` - Profil utilisateur connecté

**Commandes** (`/api/orders`)
- `GET /` - Liste commandes (filtres : status, ville, produit, dates, callerId, delivererId, deliveryType, search)
- `POST /` - Créer commande
- `GET /:id` - Détails commande
- `PUT /:id` - Modifier commande
- `DELETE /:id` - Supprimer commande
- `PUT /:id/status` - Changer statut
- `PUT /:id/assign-caller` - Assigner appelant
- `PUT /:id/assign-deliverer` - Assigner livreur
- `PUT /:id/note` - Ajouter note

**EXPRESS** (`/api/express`)
- `PUT /:id/arrive` - Marquer EXPRESS arrivé en agence (avec code + photo)
- `PUT /:id/notifier` - Notifier client
- `PUT /:id/retrait` - Marquer retiré par client

**Webhook** (`/api/webhook`)
- `POST /make` - Recevoir commandes depuis Make.com
- `POST /google-sheet` - Recevoir commandes depuis Google Sheets
- `GET /test` - Test webhook (avec X-API-KEY)
- `GET /products` - Liste produits disponibles

---

## 🎭 RÔLES UTILISATEURS ET PERMISSIONS

### 5 Rôles du Système

#### 1. **ADMIN** 👑
**Accès total** : Tous les modules
- Gestion utilisateurs (CRUD)
- Toutes les commandes
- Tous les statuts
- Gestion produits/stock
- Statistiques globales
- Configuration système

#### 2. **GESTIONNAIRE** 📊
**Gestion opérationnelle**
- Vue toutes commandes
- Assignation livreurs
- Gestion tournées
- Gestion EXPRESS en agence
- Statistiques
- **Pas de gestion utilisateurs**

#### 3. **GESTIONNAIRE_STOCK** 📦
**Gestion stock et produits**
- Vue toutes commandes
- Gestion produits (CRUD)
- Gestion stock (mouvements, inventaire)
- Gestion tournées stock (remise/retour colis)
- Statistiques stock

#### 4. **APPELANT** 📞
**Traitement appels clients**
- Commandes NOUVELLE et A_APPELER uniquement
- Toutes les EXPÉDITIONS et EXPRESS (pour suivi)
- Création/modification commandes
- Programmation RDV
- Statistiques personnelles
- **Voit uniquement ses commandes traitées**

#### 5. **LIVREUR** 🚚
**Livraisons**
- Uniquement ses commandes assignées
- Marquer livré/refusé/retourné
- Confirmer expédition (code + photo)
- Marquer EXPRESS arrivé
- Statistiques personnelles

---

## 📱 MODULES FRONTEND

### Structure des Pages par Rôle

#### Admin (`/pages/admin/`)
- `Dashboard.tsx` - Tableau de bord général
- `Overview.tsx` - Vue d'ensemble
- `Orders.tsx` - Toutes les commandes
- `ExpeditionsExpress.tsx` - Gestion EXPEDITION/EXPRESS
- `Users.tsx` - Gestion utilisateurs
- `Stats.tsx` - Statistiques globales
- `Accounting.tsx` - Comptabilité

#### Gestionnaire (`/pages/gestionnaire/`)
- `Dashboard.tsx` - Tableau de bord
- `Overview.tsx` - Vue d'ensemble
- `ValidatedOrders.tsx` - Commandes validées
- `Deliveries.tsx` - Gestion livraisons
- `ExpressAgence.tsx` - EXPRESS en agence (avec affichage code)
- `Stats.tsx` - Statistiques

#### Appelant (`/pages/appelant/`)
- `Dashboard.tsx` - Tableau de bord
- `Overview.tsx` - Vue d'ensemble
- `Orders.tsx` - Commandes à appeler (NOUVELLE, A_APPELER, + EXPEDITION/EXPRESS)
- `MyProcessedOrders.tsx` - Mes commandes traitées
- `RDV.tsx` - RDV programmés
- `PerformanceAppelants.tsx` - Performance appelants
- `Stats.tsx` - Statistiques personnelles

#### Livreur (`/pages/livreur/`)
- `Dashboard.tsx` - Tableau de bord
- `Overview.tsx` - Vue d'ensemble
- `Deliveries.tsx` - Mes livraisons
- `Expeditions.tsx` - Mes expéditions (avec bouton "Confirmer l'expédition")
- `Stats.tsx` - Statistiques personnelles

#### Gestionnaire Stock (`/pages/stock/`)
- `Dashboard.tsx` - Tableau de bord
- `Overview.tsx` - Vue d'ensemble
- `Products.tsx` - Gestion produits
- `Movements.tsx` - Mouvements de stock
- `Tournees.tsx` - Gestion tournées stock

#### Commun (`/pages/common/`)
- `CallerSupervision.tsx` - Supervision appelants
- `ClientDatabase.tsx` - Base de données clients

---

## 🔄 WORKFLOWS MÉTIER PRINCIPAUX

### 1️⃣ Workflow COMMANDE LOCALE (Normal)
```
1. Client remplit formulaire → Webhook Make/Google Sheet
2. Commande créée → Status: NOUVELLE
3. Appelant voit dans "À appeler"
4. Appelant appelle client
   ├─> Client valide → Status: VALIDEE
   ├─> Client annule → Status: ANNULEE
   ├─> Pas de réponse → Status: INJOIGNABLE ou RDV programmé
5. Gestionnaire assigne livreur → Status: ASSIGNEE
6. Livreur livre
   ├─> Succès → Status: LIVREE
   ├─> Refus → Status: REFUSEE
   ├─> Client absent → Status: RETOURNE
7. Stock décrémenté automatiquement (si LIVREE)
```

### 2️⃣ Workflow EXPÉDITION (Paiement 100%)
```
1. Appelant crée commande → deliveryType: EXPEDITION
2. Client paie 100% → montantPaye = montant total
3. Status: EXPEDITION
4. Gestionnaire assigne livreur
5. Livreur va dans "Mes Expéditions"
6. Livreur clique "Confirmer l'expédition"
   ├─> Saisit code expédition (obligatoire)
   ├─> Upload photo reçu (optionnel, max 5 MB)
   └─> Confirme
7. Status: LIVREE
8. Stock décrémenté
9. ✅ Terminé
```

### 3️⃣ Workflow EXPRESS (Paiement 10% + 90%)
```
1. Appelant crée commande → deliveryType: EXPRESS
2. Client paie 10% → montantPaye = 10%, montantRestant = 90%
3. Status: EXPRESS
4. Gestionnaire assigne livreur
5. Livreur va dans "Mes Expéditions"
6. Livreur clique "Confirmer l'expédition"
   ├─> Saisit code expédition (obligatoire)
   ├─> Upload photo reçu (optionnel)
   ├─> Indique agence de retrait
   └─> Confirme
7. Status: EXPRESS_ARRIVE
8. Stock normal → Stock EXPRESS (réservé)
9. Gestionnaire voit dans "EXPRESS - En agence"
   └─> Code visible dans badge bleu
10. Gestionnaire notifie client
    └─> Code visible dans modal
11. Client vient récupérer + paie 90%
12. Gestionnaire clique "Client a retiré"
13. Status: EXPRESS_LIVRE
14. Stock EXPRESS → décrémenté
15. ✅ Terminé
```

### 4️⃣ Workflow RDV (Rendez-vous programmé)
```
1. Appelant appelle → Client occupé/voyage
2. Appelant clique "Programmer RDV"
3. Sélectionne date/heure + note
4. rdvProgramme = true, rdvDate = date choisie
5. RDV apparaît dans page "RDV" de l'appelant
6. À la date du RDV → Appelant rappelle
7. Après traitement → rdvRappele = true
8. Workflow normal continue
```

---

## 🔧 FONCTIONNALITÉS IMPORTANTES

### Gestion de Stock Automatique
- **Décrémentation automatique** lors de commande LIVREE
- **Réservation EXPRESS** : stock normal → stock EXPRESS
- **Retour stock** : si commande REFUSEE, ANNULEE, RETOURNE
- **Mouvements tracés** : table StockMovement avec historique complet
- **Alertes stock bas** : notification si stock < stockAlerte

### Système de Recherche
- **Recherche globale** dans commandes (nom, téléphone, référence)
- **Filtres multiples** : status, ville, produit, dates, livreur, appelant, deliveryType
- **Pagination** : limit/page pour grandes listes

### Photos Base64
- **Upload photos** : conversion en base64 (max 5 MB)
- **Stockage** : directement en base de données
- **Suppression auto** : après 7 jours (job cron)

### Calcul Prix Variantes
```javascript
function calculatePriceByQuantity(product, quantity) {
  if (qty === 1 && product.prix1) return product.prix1;
  if (qty === 2 && product.prix2) return product.prix2;
  if (qty >= 3 && product.prix3) return product.prix3;
  return product.prixUnitaire * qty;
}
```

### Statistiques en Temps Réel
- **KPIs Dashboard** : commandes du jour, en cours, livrées, CA
- **Graphiques** : évolution commandes, CA par jour/semaine/mois
- **Performance** : taux de conversion appelants, taux de réussite livreurs

---

## 🔐 SÉCURITÉ

### Authentification JWT
```javascript
JWT_SECRET=gs_pipeline_jwt_secret_key_2024_change_in_production
Token expiration: 24h
```

### Middleware d'Authentification
```javascript
authenticate → Vérifie token JWT
authorize([roles]) → Vérifie rôles autorisés
```

### Protection API Webhook
```javascript
X-API-KEY header pour webhooks Make/Google Sheets
MAKE_API_KEY dans .env
```

### CORS Configuration
```javascript
Origines autorisées:
- https://afgestion.net
- https://www.afgestion.net
- https://gs-pipeline-alpha.vercel.app
- http://localhost:3000 (dev)
```

---

## 🌐 INTÉGRATIONS EXTERNES

### 1. Google Sheets (Bee Venom)
**Webhook** : `https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet`

**Flux** :
```
Formulaire → Google Apps Script → Google Sheet + GS Pipeline
```

**Données transmises** :
- Nom client
- Téléphone
- Ville
- Offre/Tag
- Quantité

**Résultat** : Commande créée avec status NOUVELLE

### 2. Make.com
**Webhook** : `https://gs-pipeline-production.up.railway.app/api/webhook/make`

**Configuration** :
```javascript
Method: POST
Headers:
  Content-Type: application/json
  X-API-KEY: [MAKE_API_KEY depuis .env]
  
Body:
{
  "product_key": "CODE_PRODUIT",
  "customer_name": "{{1.nom}}",
  "customer_phone": "{{1.telephone}}",
  "customer_city": "{{1.ville}}",
  "customer_commune": "{{1.commune}}",
  "customer_address": "{{1.adresse}}",
  "quantity": "{{1.quantite}}",
  "source": "PAGE_PRODUIT",
  "campaign_source": "{{1.utm_source}}",
  "campaign_name": "{{1.utm_campaign}}",
  "page_url": "{{1.page_url}}"
}
```

**Produits configurés** :
- GAINE_TOURMALINE
- PATCH_CICATRICE
- BEE_VENOM
- PHOTOGRAY
- COLLANTGAINE
- CULOTTE
- SADOER
- BOXER
- BUTTOCK

---

## ⚙️ VARIABLES D'ENVIRONNEMENT

### Backend (.env à la racine)
```env
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/gs_pipeline"

# JWT
JWT_SECRET="gs_pipeline_jwt_secret_key_2024_change_in_production_123456789"

# Serveur
PORT=5000
NODE_ENV=production

# Webhook Make
MAKE_API_KEY="votre_cle_api_securisee"

# CORS
CORS_ORIGINS="https://afgestion.net,https://www.afgestion.net,https://gs-pipeline-alpha.vercel.app"
```

### Frontend (.env dans frontend/)
```env
VITE_API_URL=https://gs-pipeline-production.up.railway.app
```

---

## 🚀 DÉPLOIEMENT

### GitHub → Railway (Backend)
```
1. Push sur main
2. Railway détecte automatiquement
3. Build : npm install && npx prisma generate
4. Deploy : node server.js
5. Migrations : npx prisma migrate deploy (si nécessaire)
```

### GitHub → Vercel (Frontend)
```
1. Push sur main
2. Vercel détecte automatiquement
3. Build : npm run build (dans frontend/)
4. Deploy : dist/
```

### Commandes Utiles
```bash
# Backend local
npm run dev              # Développement
npm start               # Production
npm run prisma:migrate  # Migrations
npm run prisma:seed     # Seed base de données

# Frontend local
cd frontend
npm run dev            # Développement
npm run build          # Build production
npm run preview        # Preview build
```

---

## 📈 DERNIÈRES MISES À JOUR (17 Décembre 2024)

### 3 Commits Déployés

#### Commit 1: `e1b8924`
**Message** : "fix: ajout confirmation expedition avec code+photo dans page Mes Expeditions"
- ✅ Bouton "Confirmer l'expédition" pour EXPÉDITION (100%)
- ✅ Modal avec code + photo
- ✅ Validation et aperçu photo

#### Commit 2: `5452366`
**Message** : "feat: ajout code+photo pour EXPRESS (paiement 10%)"
- ✅ Extension code + photo pour EXPRESS
- ✅ Route backend `express/arrive` modifiée
- ✅ Modal adaptatif EXPÉDITION/EXPRESS

#### Commit 3: `8a3ee33`
**Message** : "feat: affichage code expedition dans EXPRESS En agence"
- ✅ Badge bleu avec code dans liste "EXPRESS - En agence"
- ✅ Code visible dans modal notification
- ✅ Police monospace pour lisibilité

---

## 📝 COMPTES DE TEST

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@gs-pipeline.com | admin123 |
| Manager | manager@gs-pipeline.com | manager123 |
| Appelant | appeleur@gs-pipeline.com | appeleur123 |
| Livreur | livreur@gs-pipeline.com | livreur123 |
| Stock Manager | stock@gs-pipeline.com | stock123 |

---

## 🐛 RÉSOLUTION DE PROBLÈMES COURANTS

### Backend ne démarre pas
```bash
# Vérifier PostgreSQL
# Vérifier DATABASE_URL dans .env
# Régénérer Prisma Client
npm run prisma:generate
```

### Erreur CORS
```bash
# Vérifier CORS_ORIGINS dans .env backend
# Vérifier VITE_API_URL dans .env frontend
```

### Erreur 401 Webhook
```bash
# Vérifier X-API-KEY dans headers
# Vérifier MAKE_API_KEY dans .env backend
```

### Stock ne se met pas à jour
```bash
# Vérifier que le statut passe bien à LIVREE
# Vérifier les mouvements dans table StockMovement
# Vérifier les logs backend
```

---

## 📚 DOCUMENTATION DISPONIBLE

### Guides Principaux
- `PROJET_COMPLET_RECAPITULATIF.md` - Vue d'ensemble complète
- `CONFIGURATION.md` - Configuration initiale
- `DEPLOIEMENT.md` - Guide de déploiement
- `GUIDE_CONFIGURATION_DETAILLE.md` - Configuration avancée

### Guides Fonctionnels
- `EXPEDITION_EXPRESS_GUIDE.md` - Guide EXPEDITION/EXPRESS
- `EXPEDITION_EXPRESS_SPECS_DEVELOPPEUR.md` - Spécifications techniques
- `GESTION_AUTOMATIQUE_STOCK.md` - Système de stock
- `GUIDE_MULTI_PRODUITS_GOOGLE_SHEET.md` - Intégration Google Sheets

### Corrections et Améliorations
- `RECAPITULATIF_JOURNEE_17DEC_EXPEDITIONS.md` - Dernières mises à jour
- `CORRECTION_*.md` - Historique des corrections

---

## 🎯 POINTS D'ATTENTION IMPORTANTS

### 1. Visibilité des Commandes par Rôle
**APPELANT** : Ne voit que NOUVELLE, A_APPELER + toutes EXPEDITION/EXPRESS  
**LIVREUR** : Ne voit que ses commandes assignées  
**GESTIONNAIRE** : Voit tout  
**ADMIN** : Voit tout

### 2. Gestion Stock EXPRESS
- Stock EXPRESS séparé du stock normal
- Réservation lors passage EXPRESS_ARRIVE
- Décrémentation lors EXPRESS_LIVRE
- Retour stock normal si annulation

### 3. Calcul Prix Automatique
- Prix variantes selon quantité (1, 2, 3+)
- Si pas de variantes → prixUnitaire × quantité

### 4. Photos Expédition
- Conversion base64 automatique
- Limite 5 MB par photo
- Suppression auto après 7 jours (job cron)
- Champ photoRecuExpedition dans table Order

### 5. RDV Programmés
- Système de rappel intégré
- Notifications automatiques
- Page dédiée pour appelants

---

## 🔄 PROCESSUS DE DÉVELOPPEMENT

### Workflow Git
```bash
1. Développement local
2. Test local (backend + frontend)
3. Commit avec message descriptif
4. Push sur main
5. Auto-déploiement Railway + Vercel
6. Vérification production
```

### Conventions de Commit
```
feat: Nouvelle fonctionnalité
fix: Correction de bug
docs: Documentation
refactor: Refactoring code
style: Formatting
test: Tests
chore: Maintenance
```

---

## 📊 MÉTRIQUES DU PROJET

- **Lignes de code** : ~15,000+
- **Fichiers** : 150+
- **Tables base de données** : 12
- **Routes API** : ~50+
- **Pages frontend** : 30+
- **Rôles utilisateurs** : 5
- **Statuts commandes** : 16
- **Intégrations externes** : 2 (Make + Google Sheets)

---

## ✅ CHECKLIST SYSTÈME OPÉRATIONNEL

### Infrastructure
- [x] Backend déployé sur Railway
- [x] Frontend déployé sur Vercel
- [x] Base de données PostgreSQL hébergée
- [x] Domaine personnalisé (afgestion.net)
- [x] SSL/HTTPS automatique
- [x] Auto-déploiement GitHub

### Fonctionnalités
- [x] Authentification JWT
- [x] 5 rôles utilisateurs
- [x] Gestion commandes complète
- [x] Système EXPEDITION/EXPRESS
- [x] Gestion stock automatique
- [x] RDV programmés
- [x] Statistiques en temps réel
- [x] Intégrations Make + Google Sheets
- [x] Upload photos (code expédition)
- [x] Recherche globale
- [x] Filtres avancés

### Sécurité
- [x] JWT avec expiration
- [x] Mots de passe hashés
- [x] API Key pour webhooks
- [x] CORS configuré
- [x] Validation des données
- [x] Permissions par rôle

---

## 📱 INTÉGRATION SMS8.io (18 Décembre 2024)

### Vue d'Ensemble

Intégration complète d'un système d'envoi de SMS automatiques via **SMS8.io** pour améliorer la communication avec les clients et l'efficacité opérationnelle.

### Configuration

**Clé API** : `6a854258b60b92bd3a87ee563ac8a375ed28a78f`  
**URL API** : `https://app.sms8.io/services/sendFront.php`  
**Nom expéditeur** : `GS-Pipeline`

### Variables d'Environnement (.env)

```env
# SMS Configuration
SMS8_API_KEY=6a854258b60b92bd3a87ee563ac8a375ed28a78f
SMS8_API_URL=https://app.sms8.io/services/sendFront.php
SMS_SENDER_NAME=GS-Pipeline
SMS_ENABLED=true

# Activation par type de SMS
SMS_ORDER_CREATED=true
SMS_ORDER_VALIDATED=true
SMS_DELIVERY_ASSIGNED=true
SMS_ORDER_DELIVERED=true
SMS_EXPEDITION_CONFIRMED=true
SMS_EXPRESS_ARRIVED=true
SMS_EXPRESS_REMINDER=true
SMS_RDV_SCHEDULED=true
SMS_RDV_REMINDER=true
SMS_DELIVERER_ALERT=true
```

### Architecture SMS

#### Service SMS (`services/sms.service.js`)

**Fonctions principales** :
- `sendSMS(phone, message, metadata)` - Envoi de SMS
- `getSMSCredits()` - Consultation du solde
- `getSMSStats(days)` - Statistiques d'envoi
- `getSMSHistory(filters)` - Historique des SMS
- `sendScheduledSMS()` - Envoi SMS programmés (job cron)

**Templates SMS disponibles** :
```javascript
smsTemplates.orderCreated(clientNom, orderReference)
smsTemplates.orderValidated(clientNom, produitNom, montant)
smsTemplates.deliveryAssigned(clientNom, livreurNom, telephone)
smsTemplates.orderDelivered(clientNom, orderReference)
smsTemplates.expeditionConfirmed(clientNom, codeExpedition, ville)
smsTemplates.expressArrived(clientNom, agence, codeExpedition, montantRestant)
smsTemplates.expressReminder(clientNom, agence, codeExpedition, joursAttente)
smsTemplates.rdvScheduled(clientNom, rdvDate, rdvHeure)
smsTemplates.rdvReminder(clientNom, rdvHeure)
smsTemplates.orderCancelled(clientNom, orderReference)
```

### Table Base de Données - SmsLog

```prisma
model SmsLog {
  id            Int       @id @default(autoincrement())
  phoneNumber   String
  message       String
  status        SmsStatus // SENT, FAILED, PENDING
  provider      String    @default("SMS8")
  providerId    String?
  errorMessage  String?
  orderId       Int?
  userId        Int?
  type          SmsType   // ORDER_CREATED, EXPRESS_ARRIVED, etc.
  credits       Int?
  sentAt        DateTime  @default(now())
}
```

**Enum SmsStatus** : `SENT`, `FAILED`, `PENDING`  
**Enum SmsType** : `ORDER_CREATED`, `ORDER_VALIDATED`, `DELIVERY_ASSIGNED`, `ORDER_DELIVERED`, `EXPEDITION`, `EXPRESS_ARRIVED`, `EXPRESS_REMINDER`, `RDV_SCHEDULED`, `RDV_REMINDER`, `ALERT`

### Points d'Intégration

#### 1. Création de Commande
**Route** : `POST /api/orders`  
**SMS** : Confirmation de commande reçue  
**Template** : `orderCreated`

#### 2. Validation de Commande
**Route** : `PUT /api/orders/:id/status` (→ VALIDEE)  
**SMS** : Confirmation de validation  
**Template** : `orderValidated`

#### 3. Commande Livrée
**Route** : `PUT /api/orders/:id/status` (→ LIVREE)  
**SMS** : Confirmation de livraison  
**Template** : `orderDelivered`

#### 4. EXPRESS Arrivé en Agence
**Route** : `PUT /api/orders/:id/express/arrive`  
**SMS** : Notification d'arrivée avec code retrait  
**Template** : `expressArrived`  
**Données** : Nom agence, code expédition, montant à payer (90%)

#### 5. RDV Programmé
**Route** : `POST /api/rdv/:id/programmer`  
**SMS** : Confirmation du RDV  
**Template** : `rdvScheduled`

#### 6. Rappels Automatiques (Job Cron)
**Fonction** : `sendScheduledSMS()`  
- Rappel RDV (1h avant)
- Rappel EXPRESS non retiré (après 3 jours)

### Routes API SMS

**Base** : `/api/sms`

| Route | Method | Permissions | Description |
|-------|--------|-------------|-------------|
| `/history` | GET | ADMIN, GESTIONNAIRE | Historique des SMS |
| `/stats` | GET | ADMIN, GESTIONNAIRE | Statistiques d'envoi |
| `/credits` | GET | ADMIN | Solde de crédits |
| `/test` | POST | ADMIN | Test d'envoi SMS |
| `/templates` | GET | ADMIN, GESTIONNAIRE, APPELANT | Liste des templates |
| `/config` | GET | ADMIN | Configuration actuelle |
| `/send-manual` | POST | ADMIN, GESTIONNAIRE, APPELANT | Envoi SMS manuel |

### Gestion d'Erreurs

**Envois non bloquants** : Si l'envoi de SMS échoue, l'opération principale (création commande, changement statut, etc.) continue normalement.

**Logs détaillés** :
```javascript
✅ SMS envoyé pour commande ORD-12345
⚠️ Erreur envoi SMS (non bloquante): Invalid phone number
```

**Statuts d'échec** : Enregistrés dans `SmsLog` avec `status: FAILED` et `errorMessage`

### Coûts

**Tarif indicatif** : ~10-20 FCFA/SMS en Côte d'Ivoire  
**Monitoring** : Consultation du solde via `/api/sms/credits`  
**Contrôle** : Activation/désactivation par type de SMS

### Désactivation SMS

**Mode test** (pas d'envoi réel) :
```env
SMS_ENABLED=false
```

**Désactiver un type spécifique** :
```env
SMS_EXPRESS_ARRIVED=false  # Pas de SMS pour EXPRESS
```

### Nettoyage des Numéros

Fonction automatique : `cleanPhoneNumber(phone)`
- Ajoute `+225` si manquant (Côte d'Ivoire)
- Convertit `00225` en `+225`
- Valide le format (minimum 10 chiffres)

**Exemples** :
```javascript
"0712345678" → "+2250712345678"
"00225712345678" → "+225712345678"
"+225712345678" → "+225712345678" (déjà correct)
```

### Migration Base de Données

**Fichier** : `prisma/migrations/20251218_add_sms_logs/migration.sql`

**Commande pour appliquer** :
```bash
npx prisma migrate deploy
```

**Ou en développement** :
```bash
npx prisma migrate dev
```

### Tests Recommandés

1. **Test basique** : `POST /api/sms/test` avec votre numéro
2. **Créer commande** : Vérifier réception SMS
3. **Valider commande** : Vérifier SMS de validation
4. **EXPRESS arrive** : Vérifier SMS avec code
5. **Programmer RDV** : Vérifier SMS de confirmation
6. **Consulter logs** : `GET /api/sms/history`
7. **Statistiques** : `GET /api/sms/stats`

### Fichiers Créés/Modifiés

**Nouveaux fichiers** :
- `services/sms.service.js` (650+ lignes)
- `routes/sms.routes.js` (400+ lignes)
- `prisma/migrations/20251218_add_sms_logs/migration.sql`
- `ENV_SMS_CONFIG.md`

**Fichiers modifiés** :
- `prisma/schema.prisma` (ajout table SmsLog + enums)
- `routes/order.routes.js` (intégration SMS)
- `routes/rdv.routes.js` (intégration SMS)
- `server.js` (ajout route SMS)

### Job Cron (Optionnel)

Pour activer les rappels automatiques, ajouter dans `server.js` :

```javascript
import cron from 'node-cron';
import { sendScheduledSMS } from './services/sms.service.js';

// Toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Exécution job SMS programmés...');
  await sendScheduledSMS();
});
```

### Monitoring Production

**Dashboard SMS8.io** : https://app.sms8.io/  
**Logs backend** : Rechercher `SMS` dans les logs Railway  
**Base de données** : Table `sms_logs`  
**API interne** : `/api/sms/stats` et `/api/sms/history`

### Limitations

- **SMS standard** : 160 caractères max
- **Pas de caractères spéciaux** : Certains emojis peuvent ne pas passer
- **Rate limiting** : Selon le plan SMS8.io
- **Crédits** : Surveiller régulièrement le solde

### Support et Dépannage

**Erreur "Invalid phone number"** :
- Vérifier le format du numéro
- Tester avec `cleanPhoneNumber()` en console

**SMS non reçus** :
- Vérifier `SMS_ENABLED=true`
- Consulter les logs SMS
- Vérifier le solde de crédits
- Tester avec `/api/sms/test`

**Erreur API** :
- Vérifier la clé API dans .env
- Tester l'URL API directement
- Consulter la documentation SMS8.io

---

## 🎓 NOTES POUR L'IA

### Lorsque tu reprends le projet
1. ✅ Lire ce document en entier
2. ✅ Vérifier les dernières mises à jour (section "DERNIÈRES MISES À JOUR")
3. ✅ Consulter les fichiers .md pertinents selon la tâche
4. ✅ Toujours vérifier le rôle utilisateur pour les permissions
5. ✅ Tester localement avant de déployer
6. ✅ Documenter les changements

### Commandes à retenir
```bash
# Voir les terminaux actifs
# Lire c:\Users\MSI\.cursor\projects\c-Users-MSI-Desktop-GS-cursor/terminals/*.txt

# Backend
npm run dev  # Port 5000

# Frontend
cd frontend && npm run dev  # Port 5173 ou 3000

# Base de données
npm run prisma:studio  # Interface graphique

# Déploiement
git add . && git commit -m "message" && git push origin main
```

### Architecture à respecter
- **Backend** : Express + Prisma + PostgreSQL
- **Frontend** : React + TypeScript + Tailwind
- **Déploiement** : Railway (backend) + Vercel (frontend)
- **Pas de Docker** en production (géré par Railway/Vercel)

---

## 🚨 POINTS CRITIQUES À NE JAMAIS OUBLIER

1. **Ne jamais commit .env** (dans .gitignore)
2. **Toujours tester les changements localement** avant push
3. **Respecter les permissions par rôle** (sécurité)
4. **Vérifier la gestion du stock** lors des changements de statut
5. **Utiliser les transactions Prisma** pour opérations critiques
6. **Valider les données** côté backend ET frontend
7. **Documenter les changements** dans les fichiers .md

---

**FIN DU DOCUMENT DE RÉFÉRENCE**

*Ce document doit être lu au début de chaque session pour rappel du contexte complet.*

*Dernière mise à jour : 18 Décembre 2024*
