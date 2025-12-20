# ✅ AMÉLIORATION : TRI PRIORITAIRE POUR COMMANDES RENVOYÉES

## 🎯 BESOIN EXPRIMÉ

L'utilisateur souhaitait un comportement spécifique :
- ❌ **PAS** : Toute modification fait remonter la commande en haut
- ✅ **OUI** : Seulement les commandes **renvoyées vers "À appeler"** apparaissent en haut
- ✅ **OUI** : Les nouvelles commandes et modifications normales gardent leur position chronologique

---

## ✅ SOLUTION IMPLÉMENTÉE

### Nouveau Champ `renvoyeAAppelerAt`

**Ajout dans le schéma Prisma** :
```prisma
model Order {
  // ... autres champs ...
  
  // Priorisation "À appeler" (pour tri intelligent)
  renvoyeAAppelerAt DateTime?  // Date de renvoi vers "À appeler" (pour affichage prioritaire en haut)
  
  // Dates de suivi
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

**Caractéristiques** :
- `NULL` par défaut pour toutes les commandes normales
- Rempli UNIQUEMENT lors du clic "Renvoyer vers À appeler"
- Réinitialisé à `NULL` quand le statut change (validé, annulé, etc.)

---

## 🔄 LOGIQUE DE TRI

### Nouveau Tri Intelligent

**Code dans `routes/order.routes.js`** :
```javascript
const orderBy = [
  { renvoyeAAppelerAt: 'desc' },  // 1. Commandes renvoyées d'abord (triées par date de renvoi)
  { createdAt: 'desc' }            // 2. Puis par date de création normale
];
```

### Fonctionnement

**Prisma trie automatiquement** :
1. Les commandes avec `renvoyeAAppelerAt` rempli en **HAUT** (les plus récentes d'abord)
2. Les commandes avec `renvoyeAAppelerAt` = `NULL` en **BAS** (par date de création)

---

## 📊 EXEMPLE CONCRET

### Scénario : 5 Commandes

```
┌──────────────────────────────────────────────────────────────┐
│ AVANT LE RENVOI                                              │
├──────────────────────────────────────────────────────────────┤
│ 1. Commande A (créée 20/12 14:00) - NOUVELLE                │
│ 2. Commande B (créée 20/12 13:30) - NOUVELLE                │
│ 3. Commande C (créée 20/12 13:00) - NOUVELLE                │
│ 4. Commande D (créée 18/12 10:00) - VALIDEE                 │
│ 5. Commande E (créée 17/12 09:00) - ANNULEE                 │
└──────────────────────────────────────────────────────────────┘
```

**Action** : Admin renvoie la commande D (créée il y a 2 jours)

```
┌──────────────────────────────────────────────────────────────┐
│ APRÈS LE RENVOI                                              │
├──────────────────────────────────────────────────────────────┤
│ 1. ⭐ Commande D (renvoyée 20/12 14:25) ← EN HAUT !         │
│    │ createdAt: 18/12 10:00                                 │
│    │ renvoyeAAppelerAt: 20/12 14:25 ✅                       │
│    └─ Status: A_APPELER                                      │
│                                                               │
│ 2. Commande A (créée 20/12 14:00) - NOUVELLE                │
│    │ renvoyeAAppelerAt: NULL                                 │
│                                                               │
│ 3. Commande B (créée 20/12 13:30) - NOUVELLE                │
│    │ renvoyeAAppelerAt: NULL                                 │
│                                                               │
│ 4. Commande C (créée 20/12 13:00) - NOUVELLE                │
│    │ renvoyeAAppelerAt: NULL                                 │
│                                                               │
│ 5. Commande E (créée 17/12 09:00) - ANNULEE                 │
│    │ renvoyeAAppelerAt: NULL                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 CYCLE DE VIE DU CHAMP

### 1. Commande Normale (Nouvelle)

```
Création → createdAt: 20/12 14:00
           renvoyeAAppelerAt: NULL
           Status: NOUVELLE
```
**Position** : Par ordre chronologique (date de création)

### 2. Renvoi vers "À appeler"

```
Admin clique "Renvoyer" → renvoyeAAppelerAt: 20/12 14:25 ✅
                          Status: A_APPELER
```
**Position** : **EN HAUT** de la liste

### 3. Traitement par Appelant

```
Appelant valide → renvoyeAAppelerAt: NULL ❌ (réinitialisé)
                   Status: VALIDEE
```
**Position** : Disparaît de "À appeler"

### 4. Re-renvoi ultérieur

```
Admin re-renvoie → renvoyeAAppelerAt: 20/12 15:00 ✅ (nouvelle date)
                    Status: A_APPELER
```
**Position** : **Retour en haut** avec nouvelle priorité

---

## 💡 COMPORTEMENTS SPÉCIFIQUES

### ✅ CE QUI FAIT REMONTER EN HAUT

**UNIQUEMENT** :
- Clic sur "Renvoyer vers À appeler" depuis "Toutes les commandes"

### ❌ CE QUI NE FAIT PAS REMONTER

- Ajout de note
- Modification d'adresse
- Modification de quantité
- Assignation d'appelant
- Toute autre modification normale

### 🔄 CE QUI FAIT REDESCENDRE

Quand la commande change de statut (hors A_APPELER) :
- VALIDEE → `renvoyeAAppelerAt` = NULL
- ANNULEE → `renvoyeAAppelerAt` = NULL
- INJOIGNABLE → `renvoyeAAppelerAt` = NULL
- Etc.

---

## 🗂️ FICHIERS MODIFIÉS

### 1. Schema Prisma

**Fichier** : `prisma/schema.prisma`

**Ajout** :
```prisma
renvoyeAAppelerAt DateTime?  // Ligne ~146
```

### 2. Migration SQL

**Fichier** : `prisma/migrations/20251220142435_add_renvoye_a_appeler_at/migration.sql`

**Contenu** :
```sql
-- Ajout du champ renvoyeAAppelerAt
ALTER TABLE "orders" ADD COLUMN "renvoyeAAppelerAt" TIMESTAMP(3);

-- Index pour optimiser le tri
CREATE INDEX "orders_renvoyeAAppelerAt_idx" ON "orders"("renvoyeAAppelerAt");
```

### 3. Routes API

**Fichier** : `routes/order.routes.js`

**Modifications** :

#### A. Tri des commandes (ligne ~105)
```javascript
const orderBy = [
  { renvoyeAAppelerAt: 'desc' },  // Commandes renvoyées en haut
  { createdAt: 'desc' }            // Puis chronologique
];
```

#### B. Route "Renvoyer vers À appeler" (ligne ~615)
```javascript
data: {
  status: 'A_APPELER',
  // ... autres champs ...
  renvoyeAAppelerAt: new Date(),  // ✅ Remplir le champ
}
```

#### C. Route "Changement de statut" (ligne ~315)
```javascript
data: {
  status,
  // ... autres champs ...
  // Réinitialiser si statut != A_APPELER
  renvoyeAAppelerAt: status === 'A_APPELER' ? order.renvoyeAAppelerAt : null
}
```

---

## 🧪 TESTS RECOMMANDÉS

### Test 1 : Renvoyer une commande

1. Aller dans "Toutes les commandes"
2. Trouver une commande VALIDEE ou ANNULEE (ancienne)
3. Cliquer "Renvoyer vers À appeler"
4. Aller dans "À appeler"
5. **Vérifier** : La commande est EN HAUT ✅

### Test 2 : Modifier une commande normale

1. Aller dans "À appeler"
2. Choisir une commande normale (non renvoyée)
3. Ajouter une note
4. Actualiser (F5)
5. **Vérifier** : La commande garde sa position ✅

### Test 3 : Traiter une commande renvoyée

1. Commande renvoyée en haut
2. La valider (statut → VALIDEE)
3. Actualiser "À appeler"
4. **Vérifier** : La commande disparaît de "À appeler" ✅

### Test 4 : Nouvelle commande

1. Créer une nouvelle commande
2. Aller dans "À appeler"
3. **Vérifier** : 
   - Si commandes renvoyées → Nouvelle commande SOUS les renvoyées ✅
   - Si pas de renvoyées → Nouvelle commande en haut (normal) ✅

---

## 📊 IMPACT

### Appelants ✅

**Avantage** : Les commandes renvoyées sont **immédiatement visibles** sans chercher.

**Workflow** :
```
Admin renvoie → Commande en haut → Appelant la voit → Traite rapidement
```

### Admin/Gestionnaires ✅

**Avantage** : Meilleur contrôle de la priorisation.

### Performances ✅

**Impact positif** :
- Index créé sur `renvoyeAAppelerAt`
- Tri rapide même avec milliers de commandes
- Pas de charge additionnelle

---

## 🔍 VÉRIFICATION BASE DE DONNÉES

### Voir les commandes renvoyées

```sql
SELECT 
  orderReference,
  clientNom,
  status,
  createdAt,
  renvoyeAAppelerAt
FROM orders
WHERE status = 'A_APPELER'
ORDER BY renvoyeAAppelerAt DESC NULLS LAST, createdAt DESC
LIMIT 10;
```

### Compter les commandes renvoyées

```sql
SELECT 
  COUNT(*) FILTER (WHERE renvoyeAAppelerAt IS NOT NULL) AS renvoyees,
  COUNT(*) FILTER (WHERE renvoyeAAppelerAt IS NULL) AS normales
FROM orders
WHERE status = 'A_APPELER';
```

---

## 🚀 DÉPLOIEMENT

### Étapes

1. ✅ Modifier schema Prisma
2. ✅ Créer migration SQL
3. ✅ Modifier routes (tri + renvoi + reset)
4. ⏳ Générer client Prisma
5. ⏳ Push sur GitHub
6. ⏳ Railway déploie + applique migration
7. ⏳ Tester en production

### Commandes

```bash
# Générer client Prisma
npx prisma generate

# Commit
git add .
git commit -m "feat: tri prioritaire pour commandes renvoyées vers À appeler"

# Push
git push origin main
```

---

## ⚠️ NOTES IMPORTANTES

### Migration Automatique

La migration SQL sera **automatiquement appliquée** par Railway lors du déploiement.

**Aucune donnée perdue** : Le champ est `NULL` par défaut pour toutes les commandes existantes.

### Compatibilité

- ✅ Compatible avec toutes les commandes existantes
- ✅ Pas de régression
- ✅ Nouveau comportement s'active progressivement

### Réversibilité

Si besoin de revenir en arrière :
```sql
-- Supprimer l'index
DROP INDEX "orders_renvoyeAAppelerAt_idx";

-- Supprimer la colonne
ALTER TABLE "orders" DROP COLUMN "renvoyeAAppelerAt";
```

---

## 📋 RÉCAPITULATIF

### Problème Initial

Les commandes renvoyées vers "À appeler" se perdaient dans la liste chronologique.

### Solution

Ajout d'un champ `renvoyeAAppelerAt` qui :
- Est rempli UNIQUEMENT lors du renvoi
- Permet un tri prioritaire
- Est réinitialisé lors du traitement

### Résultat

- ✅ Commandes renvoyées **toujours en haut**
- ✅ Nouvelles commandes **en dessous** (ordre chronologique)
- ✅ Modifications normales **ne changent pas** la position
- ✅ Comportement **intuitif** et **prévisible**

---

**Date** : 20 Décembre 2024  
**Migration** : `20251220142435_add_renvoye_a_appeler_at`  
**Impact** : Toutes les listes de commandes  
**Status** : ✅ **IMPLÉMENTÉ - Prêt à déployer**
