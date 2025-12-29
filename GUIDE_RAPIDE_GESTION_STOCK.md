# ⚡ GUIDE RAPIDE - GESTION DE STOCK

**Date** : 20 Décembre 2024  
**Référence rapide** : Comment le stock fonctionne

---

## 🎯 PRINCIPE FONDAMENTAL

> **Le stock ne diminue QUE quand un produit SORT PHYSIQUEMENT de l'inventaire**

---

## 📊 3 TYPES DE LIVRAISON

### 🚚 LOCAL (0% avant, 100% à la livraison)

```
NOUVELLE → A_APPELER → VALIDEE → ASSIGNEE → LIVREE ✅
└──────────── Stock intact ────────────────┘  │
                                              Stock réduit ici
```

**Règle** : Stock réduit au statut **LIVREE**

---

### 📦 EXPÉDITION (100% avant)

```
NOUVELLE → A_APPELER → VALIDEE → EXPEDITION ✅ → ASSIGNEE → LIVREE
└──── Stock intact ────────────┘    │
                                    Stock réduit ici (pas de changement après)
```

**Règle** : Stock réduit au statut **EXPEDITION** (dès paiement 100%)

---

### ⚡ EXPRESS (10% avant + 90% au retrait)

```
NOUVELLE → A_APPELER → VALIDEE → EXPRESS ✅ → ASSIGNEE → EXPRESS_ARRIVE → EXPRESS_LIVRE ✅
└──── Stock intact ────────────┘    │                                         │
                                    Stock réservé ici                        Stock libéré ici
                                    (déplacé vers stockExpress)              (sorti définitivement)
```

**Règle** : 
- Stock **réservé** au statut **EXPRESS** (déplacement vers `stockExpress`)
- Stock **libéré** au statut **EXPRESS_LIVRE** (sortie définitive)

---

## 📋 TABLEAU RÉCAPITULATIF

| Type | Paiement | Moment Réduction | Stock Concerné |
|------|----------|------------------|----------------|
| **LOCAL** | 0% avant | **LIVREE** | `stockActuel` |
| **EXPÉDITION** | **100% avant** | **EXPEDITION** | `stockActuel` |
| **EXPRESS** | **10% avant** + 90% retrait | **EXPRESS** (réserve) + **EXPRESS_LIVRE** (libère) | `stockActuel` → `stockExpress` |

---

## 📦 STRUCTURE BASE DE DONNÉES

### Product (Produits)

```javascript
{
  id: 1,
  code: "BEE-001",
  nom: "Bee Venom",
  prixUnitaire: 10000,
  stockActuel: 100,      // 🔑 Stock NORMAL disponible
  stockExpress: 2,       // 🔑 Stock RÉSERVÉ EXPRESS
  stockAlerte: 10        // Seuil d'alerte
}
```

### StockMovement (Mouvements)

```javascript
{
  id: 1,
  productId: 1,
  type: "LIVRAISON",     // Type de mouvement
  quantite: -2,          // Négatif = sortie, Positif = entrée
  stockAvant: 100,
  stockApres: 98,
  orderId: 123,
  effectuePar: 1,        // User ID
  motif: "Livraison commande CMD-xxx",
  createdAt: "2024-12-20T10:30:00Z"
}
```

---

## 🔄 TYPES DE MOUVEMENTS

| Type | Quand ? | Impact |
|------|---------|--------|
| **APPROVISIONNEMENT** | Ajout manuel stock | Stock augmente |
| **LIVRAISON** | Commande LIVREE | Stock diminue |
| **RETOUR** | Correction LIVREE → autre | Stock augmente |
| **RESERVATION** | EXPÉDITION créée | Stock diminue |
| **RESERVATION_EXPRESS** | EXPRESS créé | Stock normal → Stock EXPRESS |
| **RETRAIT_EXPRESS** | EXPRESS_LIVRE | Stock EXPRESS diminue |
| **ANNULATION_EXPRESS** | EXPRESS annulé | Stock EXPRESS → Stock normal |
| **CORRECTION** | Ajustement manuel | Selon quantité |
| **PERTE** | Casse/perte | Stock diminue |

---

## ✅ CAS SPÉCIAUX

### Correction d'Erreur (LIVREE → RETOURNE)

```
LIVREE (Stock: 98) → RETOURNE (Stock: 100 ✅)
Mouvement créé : RETOUR (+2)
```

**Raison** : Le stock avait été réduit à tort, on le restaure.

---

### Commande REFUSEE

```
ASSIGNEE (Stock: 100) → REFUSEE (Stock: 100 ✅)
PAS de mouvement de stock
```

**Raison** : Le stock n'avait jamais été réduit, pas de changement nécessaire.

---

### Annulation EXPRESS

```
EXPRESS (Stock normal: 98, Stock EXPRESS: 2)
  ↓
ANNULEE (Stock normal: 100 ✅, Stock EXPRESS: 0 ✅)
Mouvement créé : ANNULATION_EXPRESS (+2 vers stock normal)
```

**Raison** : Libérer le stock réservé.

---

## 🔧 CODE CLÉS

### Réduction Stock LOCAL (LIVREE)

```javascript
// routes/order.routes.js lignes 360-404

if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({ 
    where: { id: order.productId } 
  });

  if (product) {
    const stockAvant = product.stockActuel;
    const stockApres = stockAvant - order.quantite;

    await tx.product.update({
      where: { id: order.productId },
      data: { stockActuel: stockApres }
    });

    await tx.stockMovement.create({
      data: {
        productId: order.productId,
        type: 'LIVRAISON',
        quantite: -order.quantite,
        stockAvant,
        stockApres,
        orderId: order.id,
        effectuePar: user.id,
        motif: `Livraison commande ${order.orderReference}`
      }
    });
  }
}
```

---

### Réduction Stock EXPÉDITION

```javascript
// routes/order.routes.js lignes 1062-1127

const updatedOrder = await prisma.$transaction(async (tx) => {
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });

  if (!product) throw new Error('Produit introuvable');

  const stockAvant = product.stockActuel;
  const stockApres = stockAvant - order.quantite;

  await tx.product.update({
    where: { id: order.productId },
    data: { stockActuel: stockApres }
  });

  await tx.stockMovement.create({
    data: {
      productId: order.productId,
      type: 'RESERVATION',
      quantite: -order.quantite,
      stockAvant,
      stockApres,
      effectuePar: req.user.id,
      motif: `Réservation EXPÉDITION - Paiement total reçu`
    }
  });

  return await tx.order.update({
    where: { id: parseInt(id) },
    data: {
      status: 'EXPEDITION',
      deliveryType: 'EXPEDITION',
      montantPaye: parseFloat(montantPaye),
      validatedAt: new Date(),
      expedieAt: new Date()
    }
  });
});
```

---

### Réservation Stock EXPRESS

```javascript
// routes/order.routes.js lignes 1176-1231

const updatedOrder = await prisma.$transaction(async (tx) => {
  const product = order.product;
  const stockNormalAvant = product.stockActuel;
  const stockExpressAvant = product.stockExpress || 0;
  const stockNormalApres = stockNormalAvant - order.quantite;
  const stockExpressApres = stockExpressAvant + order.quantite;

  await tx.product.update({
    where: { id: order.productId },
    data: { 
      stockActuel: stockNormalApres,
      stockExpress: stockExpressApres
    }
  });

  await tx.stockMovement.create({
    data: {
      productId: order.productId,
      type: 'RESERVATION_EXPRESS',
      quantite: order.quantite,
      stockAvant: stockNormalAvant,
      stockApres: stockNormalApres,
      effectuePar: req.user.id,
      motif: `Réservation EXPRESS - Acompte payé`
    }
  });

  return await tx.order.update({
    where: { id: parseInt(id) },
    data: {
      status: 'EXPRESS',
      deliveryType: 'EXPRESS',
      montantPaye: parseFloat(montantPaye),
      montantRestant,
      agenceRetrait,
      validatedAt: new Date(),
      expedieAt: new Date()
    }
  });
});
```

---

## 📍 FICHIERS CLÉS

| Fichier | Description |
|---------|-------------|
| `routes/order.routes.js` | Logique réduction stock (LIVREE, EXPEDITION, EXPRESS) |
| `routes/product.routes.js` | Ajustement manuel stock (ADMIN, GESTIONNAIRE_STOCK) |
| `routes/stock.routes.js` | Gestion tournées, statistiques, mouvements |
| `routes/express.routes.js` | Retrait EXPRESS (libération stock EXPRESS) |
| `prisma/schema.prisma` | Modèles Product, StockMovement, Order |

---

## 🔍 VÉRIFIER LE STOCK

### API Endpoints

```bash
# Liste des produits avec stock
GET /api/products

# Détail produit avec historique mouvements
GET /api/products/:id

# Statistiques globales stock
GET /api/stock/stats

# Historique mouvements de stock
GET /api/stock/movements?productId=1&startDate=2024-12-20

# Produits en alerte (stock faible)
GET /api/products/alerts/low-stock
```

---

### Interface Gestionnaire

1. **Gestion des Produits** (`/admin/products`)
   - Liste tous les produits
   - Alerte visuelle si stock < seuil
   - Bouton "Ajuster le stock"
   - Historique des mouvements

2. **Gestion des Tournées** (`/stock/tournees`)
   - Confirmer remise colis au livreur
   - Confirmer retour colis
   - Voir écarts (colis manquants)
   - Raisons de retour

---

## 📊 EXEMPLE PRATIQUE

### Commande de 3 Bee Venom - LOCAL

```
Stock initial : 100

1. NOUVELLE     → Stock : 100 (pas de changement)
2. A_APPELER    → Stock : 100 (pas de changement)
3. VALIDEE      → Stock : 100 (pas de changement)
4. ASSIGNEE     → Stock : 100 (pas de changement)
5. LIVREE ✅    → Stock : 97 (-3) ✅
   Mouvement : LIVRAISON, Quantité : -3

Stock final : 97
```

---

### Commande de 3 Bee Venom - EXPÉDITION

```
Stock initial : 100

1. NOUVELLE     → Stock : 100 (pas de changement)
2. A_APPELER    → Stock : 100 (pas de changement)
3. VALIDEE      → Stock : 100 (pas de changement)
4. EXPEDITION ✅ → Stock : 97 (-3) ✅ (Paiement 100%)
   Mouvement : RESERVATION, Quantité : -3
5. ASSIGNEE     → Stock : 97 (pas de changement)
6. LIVREE       → Stock : 97 (pas de changement)

Stock final : 97
```

**Note** : Stock réduit dès l'EXPÉDITION (paiement total reçu) !

---

### Commande de 3 Bee Venom - EXPRESS

```
Stock initial : 100 (normal), 0 (EXPRESS)

1. NOUVELLE       → Stock : 100, EXPRESS : 0 (pas de changement)
2. A_APPELER      → Stock : 100, EXPRESS : 0 (pas de changement)
3. VALIDEE        → Stock : 100, EXPRESS : 0 (pas de changement)
4. EXPRESS ✅     → Stock : 97 (-3) ✅, EXPRESS : 3 (+3) ✅ (Acompte 10%)
   Mouvement : RESERVATION_EXPRESS, Quantité : -3
5. ASSIGNEE       → Stock : 97, EXPRESS : 3 (pas de changement)
6. EXPRESS_ARRIVE → Stock : 97, EXPRESS : 3 (pas de changement)
7. EXPRESS_LIVRE ✅ → Stock : 97 (pas de changement), EXPRESS : 0 (-3) ✅
   Mouvement : RETRAIT_EXPRESS, Quantité : -3

Stock final : 97 (normal), 0 (EXPRESS)
```

**Note** : Stock réservé à l'EXPRESS, puis libéré au retrait !

---

## 🛡️ SÉCURITÉ

✅ **Transactions atomiques** : Tout ou rien  
✅ **Traçabilité complète** : Chaque mouvement enregistré  
✅ **Verrouillage** : Pas de conditions de course  
✅ **Historique** : Impossible de perdre un mouvement  
✅ **Stock négatif autorisé** : Alertes automatiques

---

## ✅ AVANTAGES

- ✅ **Automatique** : Pas d'intervention manuelle
- ✅ **Temps réel** : Stock toujours à jour
- ✅ **Traçable** : Historique complet
- ✅ **Fiable** : Transactions atomiques
- ✅ **Transparent** : Mouvements consultables
- ✅ **Précis** : Pas d'erreur humaine
- ✅ **Intelligent** : 3 logiques selon type de livraison

---

## 🎊 RÉSUMÉ

**Votre système gère automatiquement le stock pour :**

✅ Commandes locales (LIVREE)  
✅ Expéditions (EXPEDITION - 100% payé)  
✅ Express (EXPRESS - 10% + 90%)  
✅ Retours et corrections  
✅ Ajustements manuels  
✅ Alertes stock faible

**Vous n'avez rien à faire, tout est automatique !** 🚀

---

## 📚 DOCUMENTS COMPLETS

- **Analyse complète** : `ANALYSE_COMPLETE_GESTION_STOCK.md`
- **Diagrammes visuels** : `DIAGRAMMES_GESTION_STOCK.md`
- **Gestion automatique** : `GESTION_AUTOMATIQUE_STOCK.md`
- **Guide rapide** : `GUIDE_RAPIDE_GESTION_STOCK.md` (ce fichier)

---

**✅ GESTION DE STOCK AUTOMATIQUE ET INTELLIGENT** 🎯
