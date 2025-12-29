# 📊 DIAGRAMMES - GESTION DE STOCK

**Date** : 20 Décembre 2024  
**Projet** : GS Pipeline  
**Visualisation** : Flux de gestion de stock

---

## 🎯 VUE GLOBALE DU SYSTÈME

```
┌──────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE GESTION DE STOCK                   │
│                            GS PIPELINE                           │
└──────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼────────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │   LIVRAISON    │ │  EXPÉDITION │ │   EXPRESS   │
        │     LOCAL      │ │   (100%)    │ │   (10%)     │
        └───────┬────────┘ └──────┬──────┘ └──────┬──────┘
                │                 │                 │
        ┌───────▼────────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │Stock réduit à  │ │Stock réduit │ │Stock réservé│
        │  la livraison  │ │immédiatement│ │puis libéré  │
        └────────────────┘ └─────────────┘ └─────────────┘
```

---

## 🔄 FLUX COMPLET PAR TYPE DE LIVRAISON

### 🚚 TYPE 1 : LIVRAISON LOCALE

```
                    FLUX LIVRAISON LOCALE
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  📝 COMMANDE CRÉÉE                                          │
│  ┌─────────────────────┐                                    │
│  │ NOUVELLE            │  Stock: 100                        │
│  │ Client: Marie       │  Stock EXPRESS: 0                  │
│  │ Produit: Bee Venom  │  Quantité commandée: 2             │
│  │ Quantité: 2         │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ A_APPELER           │  Stock: 100 (inchangé)             │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ VALIDEE             │  Stock: 100 (inchangé)             │
│  │ ✅ Appelant confirme│                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ ASSIGNEE            │  Stock: 100 (inchangé)             │
│  │ 🚚 Livreur: Jean    │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ 🎯 LIVREE           │  Stock: 98 ✅ (-2)                 │
│  │ ✅ Livré avec succès│  Stock EXPRESS: 0                  │
│  └─────────────────────┘                                    │
│                                                              │
│  📦 MOUVEMENT DE STOCK CRÉÉ :                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type: LIVRAISON                                      │  │
│  │ Quantité: -2                                         │  │
│  │ Stock avant: 100                                     │  │
│  │ Stock après: 98                                      │  │
│  │ Motif: Livraison commande CMD-xxx - Marie           │  │
│  │ Date: 20/12/2024 10:30                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 RÈGLE : Le stock ne diminue QUE lors du statut LIVREE
```

---

### 📦 TYPE 2 : EXPÉDITION (100% payé)

```
                    FLUX EXPÉDITION (100%)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  📝 COMMANDE CRÉÉE                                          │
│  ┌─────────────────────┐                                    │
│  │ NOUVELLE            │  Stock: 100                        │
│  │ Client: Awa         │  Quantité commandée: 3             │
│  │ Produit: Bee Venom  │  Destination: Yamoussoukro         │
│  │ Quantité: 3         │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ A_APPELER           │  Stock: 100 (inchangé)             │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ VALIDEE             │  Stock: 100 (inchangé)             │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  💰 PAIEMENT 100% REÇU                                      │
│  ┌─────────────────────┐                                    │
│  │ 🎯 EXPEDITION       │  Stock: 97 ✅ (-3)                 │
│  │ 💰 30 000 FCFA payé │  Stock EXPRESS: 0                  │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  📦 MOUVEMENT DE STOCK CRÉÉ :                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type: RESERVATION                                    │  │
│  │ Quantité: -3                                         │  │
│  │ Stock avant: 100                                     │  │
│  │ Stock après: 97                                      │  │
│  │ Motif: Réservation EXPÉDITION - Paiement total reçu │  │
│  │ Date: 20/12/2024 10:30                               │  │
│  └──────────────────────────────────────────────────────┘  │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ ASSIGNEE            │  Stock: 97 (inchangé)              │
│  │ 🚚 Livreur expédie  │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ LIVREE              │  Stock: 97 (inchangé)              │
│  │ ✅ Client reçoit    │  PAS de nouveau mouvement          │
│  └─────────────────────┘                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 RÈGLE : Le stock diminue dès le statut EXPEDITION (paiement 100%)
```

---

### ⚡ TYPE 3 : EXPRESS (10% + 90%)

```
                    FLUX EXPRESS (10% puis 90%)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  📝 COMMANDE CRÉÉE                                          │
│  ┌─────────────────────┐                                    │
│  │ NOUVELLE            │  Stock normal: 100                 │
│  │ Client: Fatou       │  Stock EXPRESS: 0                  │
│  │ Produit: Bee Venom  │  Quantité commandée: 2             │
│  │ Quantité: 2         │  Agence: GTI                       │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ A_APPELER           │  Stock normal: 100 (inchangé)      │
│  └──────────┬──────────┘  Stock EXPRESS: 0                  │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ VALIDEE             │  Stock normal: 100 (inchangé)      │
│  └──────────┬──────────┘  Stock EXPRESS: 0                  │
│             ↓                                                │
│  💰 ACOMPTE 10% PAYÉ                                        │
│  ┌─────────────────────┐                                    │
│  │ 🎯 EXPRESS          │  Stock normal: 98 ✅ (-2)          │
│  │ 💰 2 000 FCFA payé  │  Stock EXPRESS: 2 ✅ (+2)          │
│  │ Restant: 18 000 FCFA│                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  📦 MOUVEMENT DE STOCK CRÉÉ :                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type: RESERVATION_EXPRESS                            │  │
│  │ Quantité: -2 (du stock normal)                       │  │
│  │ Stock normal avant: 100                              │  │
│  │ Stock normal après: 98                               │  │
│  │ Stock EXPRESS avant: 0                               │  │
│  │ Stock EXPRESS après: 2                               │  │
│  │ Motif: Réservation EXPRESS - Acompte payé           │  │
│  │ Date: 20/12/2024 10:30                               │  │
│  └──────────────────────────────────────────────────────┘  │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ ASSIGNEE            │  Stock normal: 98 (inchangé)       │
│  │ 🚚 Envoi vers agence│  Stock EXPRESS: 2 (inchangé)       │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ EXPRESS_ARRIVE      │  Stock normal: 98 (inchangé)       │
│  │ 📍 Agence GTI       │  Stock EXPRESS: 2 (inchangé)       │
│  │ ⏳ Attente client   │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  💰 SOLDE 90% PAYÉ                                          │
│  ┌─────────────────────┐                                    │
│  │ 🎯 EXPRESS_LIVRE    │  Stock normal: 98 (inchangé)       │
│  │ 💰 18 000 FCFA payé │  Stock EXPRESS: 0 ✅ (-2)          │
│  │ ✅ Client retire    │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  📦 MOUVEMENT DE STOCK CRÉÉ :                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type: RETRAIT_EXPRESS                                │  │
│  │ Quantité: -2 (du stock EXPRESS)                      │  │
│  │ Stock EXPRESS avant: 2                               │  │
│  │ Stock EXPRESS après: 0                               │  │
│  │ Motif: Retrait EXPRESS - Client a payé le solde     │  │
│  │ Date: 20/12/2024 15:45                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 RÈGLE : Le stock normal diminue au statut EXPRESS (réservation)
          Le stock EXPRESS diminue au statut EXPRESS_LIVRE (retrait)
```

---

## 📊 SCHÉMA DE BASE DE DONNÉES

```
┌──────────────────────────────────────────────────────────────┐
│                        TABLE PRODUCT                         │
├──────────────────────────────────────────────────────────────┤
│ id             │ Int (PK)                                    │
│ code           │ String (unique) - "BEE-001"                │
│ nom            │ String - "Bee Venom"                       │
│ prixUnitaire   │ Float - 10000.00                           │
│ prix1          │ Float? - 10000.00                          │
│ prix2          │ Float? - 19000.00                          │
│ prix3          │ Float? - 27000.00                          │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🔑 stockActuel  │ Int - 100    (Stock NORMAL)         │ │
│ │ 🔑 stockExpress │ Int - 2      (Stock RÉSERVÉ EXPRESS)│ │
│ └────────────────────────────────────────────────────────┘ │
│ stockAlerte    │ Int - 10                                   │
│ actif          │ Boolean - true                             │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   TABLE STOCK_MOVEMENT                       │
├──────────────────────────────────────────────────────────────┤
│ id             │ Int (PK)                                    │
│ productId      │ Int (FK → Product)                         │
│ type           │ StockMovementType                          │
│                │   • APPROVISIONNEMENT                       │
│                │   • LIVRAISON                               │
│                │   • RETOUR                                  │
│                │   • CORRECTION                              │
│                │   • PERTE                                   │
│                │   • RESERVATION                             │
│                │   • RESERVATION_EXPRESS                     │
│                │   • RETRAIT_EXPRESS                         │
│                │   • ANNULATION_EXPRESS                      │
│ quantite       │ Int - (+positif/-négatif)                  │
│ stockAvant     │ Int - 100                                  │
│ stockApres     │ Int - 98                                   │
│ orderId        │ Int? (FK → Order)                          │
│ tourneeId      │ Int? (FK → TourneeStock)                   │
│ effectuePar    │ Int (FK → User)                            │
│ motif          │ String - "Livraison commande CMD-xxx"      │
│ createdAt      │ DateTime                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 DÉCISIONS DE RÉDUCTION DE STOCK

```
                ARBRE DE DÉCISION : QUAND RÉDUIRE LE STOCK ?

┌────────────────────────────────────────────────────────────────┐
│                    Quel type de commande ?                     │
└───────────────────────────┬────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼─────┐       ┌────▼────┐
   │  LOCAL  │        │EXPÉDITION│       │ EXPRESS │
   └────┬────┘        └────┬─────┘       └────┬────┘
        │                  │                   │
        │                  │                   │
   ┌────▼──────────────────────────┐          │
   │ Paiement à la livraison ?     │          │
   │        OUI : 0% avant          │          │
   └────┬──────────────────────────┘          │
        │                                      │
        │                  ┌───────────────────▼────────────────┐
        │                  │ Paiement 100% avant envoi ?        │
        │                  │        OUI : 100% payé             │
        │                  └────┬───────────────────────────────┘
        │                       │
        │                       │           ┌────────────────────▼───────────────┐
        │                       │           │ Paiement en 2 fois ?               │
        │                       │           │   OUI : 10% avant + 90% au retrait │
        │                       │           └────┬───────────────────────────────┘
        │                       │                │
        │                       │                │
   ┌────▼─────────┐     ┌──────▼──────┐    ┌───▼──────────┐
   │ Stock réduit │     │ Stock réduit│    │Stock réservé │
   │ au statut    │     │ au statut   │    │au statut     │
   │   LIVREE     │     │ EXPEDITION  │    │  EXPRESS     │
   └──────────────┘     └─────────────┘    └───┬──────────┘
                                                │
                                                │
                                         ┌──────▼──────────┐
                                         │Stock libéré au  │
                                         │statut           │
                                         │ EXPRESS_LIVRE   │
                                         └─────────────────┘
```

---

## 📈 ÉVOLUTION DU STOCK - EXEMPLE CONCRET

```
    ÉVOLUTION DU STOCK SUR 1 JOURNÉE - PRODUIT BEE VENOM

Stock
 │
100├───────────────┐                      ┌──────────────────────
 98│               └──────┐     ┌─────────┘
 96│                      └─────┘
 94│                                           ┌──────────────────
 92│                                     ┌─────┘
 90│                               ┌─────┘
 88│                          ┌────┘
 86│                     ┌────┘
 84│                ┌────┘
 82│           ┌────┘
 80│      ┌────┘
   └──────┴────┴────┴────┴────┴────┴────┴────┴────────────────►
      8h  9h  10h 11h 12h 13h 14h 15h 16h  17h  18h  19h      Temps

Événements :
├─ 8h00  : Stock initial : 100
├─ 9h30  : 📦 LIVRAISON LOCAL (2 unités) → Stock : 98
├─ 10h15 : 📦 EXPÉDITION (3 unités, 100% payé) → Stock : 95
├─ 11h20 : 📦 LIVRAISON LOCAL (3 unités) → Stock : 92
├─ 13h45 : 📦 EXPRESS (2 unités, 10% payé)
│          → Stock normal : 90, Stock EXPRESS : 2
├─ 14h30 : 📦 LIVRAISON LOCAL (2 unités) → Stock : 88
├─ 16h00 : 📦 EXPÉDITION (4 unités, 100% payé) → Stock : 84
├─ 17h30 : ✅ Retrait EXPRESS (2 unités)
│          → Stock normal : 84, Stock EXPRESS : 0
└─ 18h00 : 📦 LIVRAISON LOCAL (2 unités) → Stock : 82

Stock final : 82 unités (normal) + 0 unités (EXPRESS)
Total vendu dans la journée : 18 unités
```

---

## 🔄 CAS SPÉCIAUX - DIAGRAMMES

### ✅ Correction d'Erreur (LIVREE → RETOURNE)

```
┌──────────────────────────────────────────────────────────────┐
│                  CORRECTION D'ERREUR                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AVANT CORRECTION                                            │
│  ┌─────────────────────┐                                    │
│  │ LIVREE              │  Stock: 98                         │
│  │ ❌ Erreur livreur   │  (réduit à tort)                   │
│  │ Pas vraiment livré  │                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  👨‍💼 GESTIONNAIRE CORRIGE                                   │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ RETOURNE            │  Stock: 100 ✅ (+2)                │
│  │ ✅ Stock restauré   │  Stock restauré                    │
│  └─────────────────────┘                                    │
│                                                              │
│  📦 MOUVEMENT DE STOCK CRÉÉ :                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type: RETOUR                                         │  │
│  │ Quantité: +2                                         │  │
│  │ Stock avant: 98                                      │  │
│  │ Stock après: 100                                     │  │
│  │ Motif: Correction statut - LIVREE → RETOURNE        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### ❌ Commande REFUSEE (Pas de Changement de Stock)

```
┌──────────────────────────────────────────────────────────────┐
│              COMMANDE REFUSÉE - PAS DE CHANGEMENT            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐                                    │
│  │ ASSIGNEE            │  Stock: 100                        │
│  │ 🚚 Livreur va livrer│                                    │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ REFUSEE             │  Stock: 100 ✅ (inchangé)          │
│  │ ❌ Client refuse    │                                    │
│  │                     │  PAS de mouvement de stock         │
│  └─────────────────────┘                                    │
│                                                              │
│  💡 POURQUOI PAS DE CHANGEMENT ?                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Le stock n'a JAMAIS été réduit avant               │  │
│  │ • RÈGLE : Stock réduit seulement au statut LIVREE    │  │
│  │ • Le produit revient physiquement, mais le stock     │  │
│  │   logique n'avait pas bougé                          │  │
│  │ • Donc : Aucun ajustement nécessaire                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 🔄 Annulation d'un EXPRESS

```
┌──────────────────────────────────────────────────────────────┐
│              ANNULATION EXPRESS - RESTAURATION               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AVANT ANNULATION                                            │
│  ┌─────────────────────┐                                    │
│  │ EXPRESS             │  Stock normal: 98                  │
│  │ 💰 Acompte 10% payé │  Stock EXPRESS: 2                  │
│  └──────────┬──────────┘                                    │
│             ↓                                                │
│  👨‍💼 CLIENT ANNULE                                          │
│             ↓                                                │
│  ┌─────────────────────┐                                    │
│  │ ANNULEE             │  Stock normal: 100 ✅ (+2)         │
│  │ ✅ Stock restauré   │  Stock EXPRESS: 0 ✅ (-2)          │
│  └─────────────────────┘                                    │
│                                                              │
│  📦 MOUVEMENT DE STOCK CRÉÉ :                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type: ANNULATION_EXPRESS                             │  │
│  │ Quantité: +2 (vers stock normal)                     │  │
│  │ Stock normal avant: 98                               │  │
│  │ Stock normal après: 100                              │  │
│  │ Stock EXPRESS avant: 2                               │  │
│  │ Stock EXPRESS après: 0                               │  │
│  │ Motif: Annulation EXPRESS - Stock libéré             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 TABLEAU DE BORD - GESTION DE STOCK

```
╔══════════════════════════════════════════════════════════════╗
║              📦 TABLEAU DE BORD - STOCK                      ║
╚══════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│  📊 STATISTIQUES GLOBALES                                    │
├──────────────────────────────────────────────────────────────┤
│  • Total produits : 16                                       │
│  • Produits actifs : 14                                      │
│  • Produits en alerte : 3 ⚠️                                │
│  • Stock total : 1 959 unités                                │
│  • Valeur stock : 18 627 850 FCFA                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📦 MOUVEMENTS DU JOUR                                       │
├──────────────────────────────────────────────────────────────┤
│  • Total livraisons : 45                                     │
│  • Total retours : 3                                         │
│  • Réservations EXPRESS : 12                                 │
│  • Retraits EXPRESS : 8                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  ⚠️ ALERTES STOCK FAIBLE                                    │
├──────────────────────────────────────────────────────────────┤
│  🔴 Bee Venom      : Stock : 3   / Alerte : 10               │
│  🟡 Boxer Homme    : Stock : 8   / Alerte : 15               │
│  🟡 Culotte Dame   : Stock : 12  / Alerte : 20               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📍 STOCK EXPRESS EN COURS                                   │
├──────────────────────────────────────────────────────────────┤
│  • Bee Venom     : 13 unités (en attente retrait)            │
│  • Boxer Homme   : 3 unités (en attente retrait)             │
│  • TOTAL EXPRESS : 16 unités                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 RÉSUMÉ VISUEL

```
┌──────────────────────────────────────────────────────────────┐
│         QUAND LE STOCK SE RÉDUIT-IL ? - RÉSUMÉ              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  LOCAL (0% avant)                                            │
│  ────────────────────────────────►                          │
│  NOUVELLE  A_APPELER  VALIDEE  ASSIGNEE  [LIVREE] ✅        │
│  └─────────────────── Pas de changement ──────┘             │
│                                                              │
│  EXPÉDITION (100% avant)                                     │
│  ─────────────►                                             │
│  NOUVELLE  A_APPELER  VALIDEE  [EXPEDITION] ✅  ASSIGNEE  LIVREE │
│  └────── Pas de changement ───┘                             │
│                                                              │
│  EXPRESS (10% + 90%)                                         │
│  ─────────────►                  ─────────────────►         │
│  NOUVELLE  A_APPELER  VALIDEE  [EXPRESS] ✅  ASSIGNEE  EXPRESS_ARRIVE  [EXPRESS_LIVRE] ✅ │
│  └────── Pas de changement ───┘          └──── Stock réservé ────┘                        │
│                                                              │
│  ✅ = Moment où le stock se réduit                          │
└──────────────────────────────────────────────────────────────┘
```

---

**✅ SYSTÈME DE GESTION DE STOCK AUTOMATIQUE ET INTELLIGENT** 🚀
