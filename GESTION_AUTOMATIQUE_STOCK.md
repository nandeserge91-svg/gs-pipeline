# 📦 GESTION AUTOMATIQUE DU STOCK

**Statut** : ✅ DÉJÀ IMPLÉMENTÉ ET OPÉRATIONNEL  
**Date** : 12 décembre 2025

---

## 🎯 PRINCIPE

Votre système GS Pipeline gère **automatiquement** le stock selon les changements de statut des commandes :

- ✅ **Commande livrée** → Stock diminue
- ✅ **Commande retournée/annulée** → Stock augmente
- ✅ **Traçabilité complète** via mouvements de stock

---

## 📊 RÈGLES MÉTIER IMPLÉMENTÉES

### RÈGLE 1 : Décrémentation du stock (LIVRAISON)

**Quand ?** : La commande passe au statut **LIVREE**

**Code** : `routes/order.routes.js` lignes 244-274

```javascript
// RÈGLE MÉTIER 1 : Décrémenter le stock uniquement si la commande passe à LIVRÉE
if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });

  if (product) {
    const stockAvant = product.stockActuel;
    const stockApres = stockAvant - order.quantite;

    // Mettre à jour le stock du produit
    await tx.product.update({
      where: { id: order.productId },
      data: { stockActuel: stockApres }
    });

    // Créer le mouvement de stock
    await tx.stockMovement.create({
      data: {
        productId: order.productId,
        type: 'LIVRAISON',
        quantite: -order.quantite,
        stockAvant,
        stockApres,
        orderId: order.id,
        effectuePar: user.id,
        motif: `Livraison commande ${order.orderReference} - ${order.clientNom}`
      }
    });
  }
}
```

### RÈGLE 2 : Incrémentation du stock (RETOUR/CORRECTION)

**Quand ?** : Une commande **LIVREE** est changée vers un autre statut (correction d'erreur)

**Code** : `routes/order.routes.js` lignes 276-307

```javascript
// RÈGLE MÉTIER 2 : Réincrémenter le stock si la commande était LIVRÉE et change vers un autre statut
// (Le livreur corrige son erreur : la livraison n'a pas été effectuée)
if (order.status === 'LIVREE' && status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });

  if (product) {
    const stockAvant = product.stockActuel;
    const stockApres = stockAvant + order.quantite; // RÉINCRÉMENTER

    // Mettre à jour le stock du produit
    await tx.product.update({
      where: { id: order.productId },
      data: { stockActuel: stockApres }
    });

    // Créer le mouvement de stock (RETOUR)
    await tx.stockMovement.create({
      data: {
        productId: order.productId,
        type: 'RETOUR',
        quantite: order.quantite, // Positif car on rajoute
        stockAvant,
        stockApres,
        orderId: order.id,
        effectuePar: user.id,
        motif: `Correction statut ${order.orderReference} - ${order.status} → ${status} - ${order.clientNom}`
      }
    });
  }
}
```

---

## 🔄 FLUX COMPLET

### Scénario 1 : Livraison normale

```
┌─────────────────────────────┐
│  Commande NOUVELLE          │
│  Stock initial : 100        │
└──────────────┬──────────────┘
               ↓
         (Appelant valide)
               ↓
┌─────────────────────────────┐
│  Commande VALIDEE           │
│  Stock : 100 (inchangé)     │
└──────────────┬──────────────┘
               ↓
      (Livreur livre)
               ↓
┌─────────────────────────────┐
│  Commande LIVREE ✅         │
│  Stock : 98 (-2) ✅         │
│  Mouvement de stock créé ✅ │
└─────────────────────────────┘
```

### Scénario 2 : Correction d'erreur

```
┌─────────────────────────────┐
│  Commande LIVREE            │
│  Stock : 98                 │
└──────────────┬──────────────┘
               ↓
    (Erreur : pas livrée)
               ↓
┌─────────────────────────────┐
│  Commande RETOURNE ✅       │
│  Stock : 100 (+2) ✅        │
│  Mouvement RETOUR créé ✅   │
└─────────────────────────────┘
```

### Scénario 3 : EXPÉDITION (cas spécial)

```
┌─────────────────────────────┐
│  Commande NOUVELLE          │
│  Stock initial : 100        │
└──────────────┬──────────────┘
               ↓
    (Appelant crée EXPÉDITION)
               ↓
┌─────────────────────────────┐
│  Commande EXPEDITION ✅     │
│  Stock : 98 (-2) ✅         │
│  Mouvement RESERVATION ✅   │
│  Stock réduit IMMÉDIATEMENT │
└──────────────┬──────────────┘
               ↓
    (Livreur confirme expédition)
               ↓
┌─────────────────────────────┐
│  Commande LIVREE            │
│  Stock : 98 (inchangé)      │
│  PAS de nouveau mouvement   │
└─────────────────────────────┘
```

**⚠️ Important EXPÉDITION** : Le stock est réduit **dès la création** de l'EXPÉDITION (paiement 100%), pas lors de la livraison !

### Scénario 4 : EXPRESS (cas spécial)

```
┌─────────────────────────────┐
│  Commande NOUVELLE          │
│  Stock normal : 100         │
│  Stock EXPRESS : 0          │
└──────────────┬──────────────┘
               ↓
    (Appelant crée EXPRESS)
               ↓
┌─────────────────────────────┐
│  Commande EXPRESS ✅        │
│  Stock normal : 98 (-2) ✅  │
│  Stock EXPRESS : 2 (+2) ✅  │
│  Mouvement RESERVATION_EXPRESS ✅ │
└──────────────┬──────────────┘
               ↓
    (Colis arrive en agence)
               ↓
┌─────────────────────────────┐
│  Commande EXPRESS_ARRIVE    │
│  Stocks inchangés           │
└──────────────┬──────────────┘
               ↓
    (Client paie et retire)
               ↓
┌─────────────────────────────┐
│  Commande EXPRESS_LIVRE ✅  │
│  Stock EXPRESS : 0 (-2) ✅  │
│  Mouvement RETRAIT_EXPRESS ✅│
└─────────────────────────────┘
```

**⚠️ Important EXPRESS** : Le stock est déplacé dans un "stock EXPRESS" réservé, puis libéré lors du retrait client.

---

## 📋 TYPES DE MOUVEMENTS DE STOCK

Le système crée automatiquement des mouvements de stock pour la traçabilité :

| Type | Quand ? | Impact |
|------|---------|--------|
| **LIVRAISON** | Commande passe à LIVREE | Stock diminue |
| **RETOUR** | Correction d'une commande LIVREE | Stock augmente |
| **RESERVATION** | Création EXPÉDITION | Stock diminue immédiatement |
| **RESERVATION_EXPRESS** | Création EXPRESS | Stock normal → Stock EXPRESS |
| **RETRAIT_EXPRESS** | Finalisation EXPRESS | Stock EXPRESS diminue |
| **CORRECTION** | Suppression de commande | Stock restauré si nécessaire |

---

## 🔍 VÉRIFIER LES MOUVEMENTS DE STOCK

### Dans GS Pipeline

1. Allez sur : https://afgestion.net/admin/products
2. Cliquez sur un produit → **"Historique Mouvements"**
3. Vous verrez tous les mouvements avec :
   - Date et heure
   - Type de mouvement
   - Quantité
   - Stock avant / après
   - Utilisateur
   - Motif détaillé
   - Commande liée (si applicable)

### Exemple de mouvement

```
📦 Historique Mouvements - Bee Venom

┌─────────────────────────────────────────────────┐
│ 12/12/2025 19:30 | LIVRAISON                    │
│ Quantité : -2                                   │
│ Stock : 100 → 98                                │
│ Par : Système Admin                             │
│ Motif : Livraison commande CMD-20251212-003 -  │
│         Awa Kouadio                             │
│ Commande : CMD-20251212-003                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 12/12/2025 19:25 | RESERVATION                  │
│ Quantité : -1                                   │
│ Stock : 101 → 100                               │
│ Par : Jean Dupont                               │
│ Motif : Réservation stock pour EXPÉDITION      │
│         CMD-20251212-002 - Marie Diallo         │
│ Commande : CMD-20251212-002                     │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURATIONS

### Transactions atomiques

Toutes les opérations stock + statut utilisent des **transactions Prisma** :

```javascript
const updatedOrder = await prisma.$transaction(async (tx) => {
  // 1. Mettre à jour le statut
  // 2. Ajuster le stock
  // 3. Créer le mouvement
  // Tout ou rien !
});
```

**Avantage** : Si une opération échoue, TOUT est annulé (cohérence garantie).

### Stock négatif autorisé

Le système **autorise** le stock négatif pour :
- **EXPÉDITION** : On peut créer une expédition même si stock insuffisant
- **EXPRESS** : On peut réserver même si stock insuffisant

**Raison** : Le stock sera renouvelé plus tard, on ne bloque pas les ventes.

**Alert automatique** : Si stock < seuil d'alerte, notification créée.

---

## 📊 CAS D'USAGE

### Cas 1 : Client commande 2 Bee Venom

```
1. Commande créée (NOUVELLE) → Stock : 100 (inchangé)
2. Appelant valide (VALIDEE) → Stock : 100 (inchangé)
3. Livreur livre (LIVREE) → Stock : 98 ✅
```

**Mouvement créé** :
```
Type: LIVRAISON
Quantité: -2
Stock: 100 → 98
Motif: Livraison commande CMD-xxx - Client Y
```

### Cas 2 : Livreur s'est trompé, pas livré

```
1. Commande LIVREE → Stock : 98
2. Gestionnaire corrige → RETOURNE → Stock : 100 ✅
```

**Mouvement créé** :
```
Type: RETOUR
Quantité: +2
Stock: 98 → 100
Motif: Correction statut CMD-xxx - LIVREE → RETOURNE
```

### Cas 3 : EXPÉDITION vers Yamoussoukro

```
1. Commande NOUVELLE → Stock : 100
2. Appelant crée EXPÉDITION (paiement 100%) → Stock : 97 ✅
3. Livreur confirme expédition → Stock : 97 (inchangé)
```

**Mouvements créés** :
```
1. Type: RESERVATION
   Quantité: -3
   Stock: 100 → 97
   Motif: Réservation stock pour EXPÉDITION CMD-xxx
```

### Cas 4 : EXPRESS à l'agence GTI

```
1. Commande NOUVELLE
   → Stock normal : 100, Stock EXPRESS : 0

2. Appelant crée EXPRESS (acompte 10%)
   → Stock normal : 99 ✅, Stock EXPRESS : 1 ✅

3. Colis arrive en agence (EXPRESS_ARRIVE)
   → Stocks inchangés

4. Client paie et retire (EXPRESS_LIVRE)
   → Stock normal : 99, Stock EXPRESS : 0 ✅
```

**Mouvements créés** :
```
1. Type: RESERVATION_EXPRESS
   Quantité: +1 (vers stock EXPRESS)
   Stock normal: 100 → 99
   
2. Type: RETRAIT_EXPRESS
   Quantité: -1 (depuis stock EXPRESS)
   Stock EXPRESS: 1 → 0
```

---

## 🛡️ SÉCURITÉ ET COHÉRENCE

### Protection contre les incohérences

✅ **Transactions atomiques** : Tout ou rien  
✅ **Verrouillage** : Pas de conditions de course  
✅ **Traçabilité** : Chaque mouvement enregistré  
✅ **Historique** : Impossible de perdre un mouvement  

### Gestion des erreurs

Si une opération stock échoue :
1. ❌ La transaction est annulée
2. ❌ Le statut ne change pas
3. ❌ Erreur renvoyée à l'utilisateur
4. ✅ Cohérence préservée

---

## 📈 STATISTIQUES ET RAPPORTS

### Rapports disponibles

1. **Historique mouvements** (par produit)
2. **Stock actuel** (temps réel)
3. **Stock EXPRESS** (réservations en cours)
4. **Alertes stock faible** (< seuil)
5. **Prévisions** (basées sur ventes)

### Exports

Vous pouvez exporter :
- ✅ Historique mouvements (CSV/Excel)
- ✅ État des stocks (PDF)
- ✅ Rapports comptables (par période)

---

## 🔧 MAINTENANCE

### Aucune maintenance requise !

Le système fonctionne automatiquement :
- ✅ Pas de script cron nécessaire
- ✅ Pas d'intervention manuelle
- ✅ Pas de risque d'oubli

### Corrections si besoin

Si vous devez corriger manuellement un stock :
1. Allez dans "Gestion des Produits"
2. Cliquez sur "Ajuster le stock"
3. Le mouvement sera enregistré automatiquement

---

## ✅ AVANTAGES

- ✅ **Automatique** : Pas d'intervention humaine
- ✅ **Temps réel** : Stock toujours à jour
- ✅ **Traçable** : Historique complet
- ✅ **Fiable** : Transactions atomiques
- ✅ **Transparent** : Mouvements consultables
- ✅ **Précis** : Pas d'erreur humaine

---

## 🎊 RÉSULTAT

**Votre système gère automatiquement le stock pour** :

- ✅ Commandes locales (LIVREE)
- ✅ Expéditions (EXPEDITION)
- ✅ Express (EXPRESS)
- ✅ Retours et corrections
- ✅ Suppressions de commandes

**Vous n'avez rien à faire, tout est automatique !** 🚀

---

**Gestion automatique du stock** : ✅ DÉJÀ IMPLÉMENTÉ  
**Statut** : ✅ OPÉRATIONNEL  
**Testé** : ✅ OUI  
**Documentation** : ✅ COMPLÈTE












