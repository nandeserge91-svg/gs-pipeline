# 🔍 VÉRIFICATION - EXPRESS EN AGENCE

**Date** : 14 Janvier 2026  
**Objectif** : S'assurer que TOUTES les commandes EXPRESS_ARRIVE sont affichées dans la page "EXPRESS - En agence"

---

## 📊 ANALYSE DU CODE

### 1️⃣ Backend - Route `/api/express/en-agence`

**Fichier** : `routes/express.routes.js` (lignes 9-120)

**Requête Prisma** :
```javascript
const where = {
  deliveryType: 'EXPRESS',
  status: {
    in: ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE']
  }
};
```

**✅ Ce qui est récupéré** :
- ✅ Toutes les commandes avec `deliveryType: 'EXPRESS'`
- ✅ ET statut dans `['EXPRESS_ARRIVE', 'EXPRESS_LIVRE']`

**❌ Ce qui N'EST PAS récupéré** :
- ❌ Commandes avec statut `EXPRESS` seulement (pas encore arrivées)
- ❌ Commandes avec statut `EXPRESS_ARRIVE` mais `deliveryType` différent de `EXPRESS`

**Filtres appliqués** (optionnels) :
- 🔍 Recherche : nom, téléphone, référence, produit
- 📍 Agence : filtre par agence de retrait
- 📊 Statut : `EXPRESS_ARRIVE` ou `EXPRESS_LIVRE`
- 📅 Dates : par date d'arrivée (`arriveAt`) ou date de retrait

---

## ✅ CHECKLIST DE VÉRIFICATION

### Test 1 : Vérifier dans l'Interface Admin

1. Connectez-vous sur https://afgestion.net en tant qu'**ADMIN** ou **GESTIONNAIRE**
2. Allez dans **"EXPRESS - En agence"**
3. **Désactiver tous les filtres** :
   - ✅ Vider le champ de recherche
   - ✅ Agence : **"Toutes"**
   - ✅ Statut : **"Tous"**
   - ✅ Décocher "Non retirés uniquement"
   - ✅ Supprimer les filtres de dates
4. **Compter** le nombre de commandes affichées

### Test 2 : Vérifier dans "Toutes les Commandes"

1. Allez dans **"Toutes les commandes"** (menu Admin)
2. Filtrez par statut : **"EXPRESS_ARRIVE"**
3. **Compter** le nombre de commandes
4. **Comparer** avec le nombre vu dans "EXPRESS - En agence"

**Résultat attendu** :  
✅ Le nombre de commandes `EXPRESS_ARRIVE` dans "Toutes les commandes" = Nombre de commandes non retirées dans "EXPRESS - En agence"

---

## 🔍 DIAGNOSTIC DES PROBLÈMES

### Problème 1 : Commandes manquantes dans "EXPRESS - En agence"

**Causes possibles** :

#### A. Filtres actifs
- ❌ Un filtre de recherche est actif
- ❌ Un filtre d'agence est sélectionné
- ❌ Le filtre "Non retirés uniquement" est coché
- ❌ Un filtre de dates cache certaines commandes

**Solution** : Désactivez TOUS les filtres.

---

#### B. Statut incorrect
- ❌ La commande a le statut `EXPRESS` (pas encore arrivée)
- ❌ La commande a le statut `EXPEDITION` (pas EXPRESS)

**Comment vérifier** :
1. Allez dans "Toutes les commandes"
2. Cherchez la commande manquante
3. Vérifiez son statut et son type de livraison

**Solution** :
```sql
-- Si la commande est statut EXPRESS (pas encore arrivée)
-- Le livreur doit cliquer sur "Marquer arrivé" pour passer à EXPRESS_ARRIVE
```

---

#### C. `deliveryType` incorrect
- ❌ La commande a `deliveryType: 'EXPEDITION'` au lieu de `EXPRESS`
- ❌ La commande a `deliveryType: 'LOCAL'` au lieu de `EXPRESS`

**Comment vérifier** :
1. Dans "Toutes les commandes", cherchez la commande
2. Vérifiez la colonne "Type" (doit être "EXPRESS")

**Solution** : Corriger le type de livraison dans la base de données.

---

#### D. Date d'arrivée manquante (`arriveAt`)
- ⚠️ La commande n'a pas de `arriveAt` défini
- ⚠️ Le tri par date sera incorrect

**Comment vérifier** :
```javascript
// Ouvrir la console du navigateur (F12) sur la page EXPRESS - En agence
// Taper :
console.table(
  orders.filter(o => !o.arriveAt).map(o => ({
    ref: o.orderReference,
    client: o.clientNom,
    statut: o.status,
    arriveAt: o.arriveAt
  }))
);
```

**Solution** : La commande sera affichée mais en bas de liste (tri par date).

---

### Problème 2 : Certaines commandes n'ont pas de code d'expédition

**Symptôme** : La commande apparaît mais le code d'expédition n'est pas affiché.

**Cause** : Le champ `codeExpedition` est vide.

**Solution** :
1. Le **livreur** doit remplir le code lors du passage à "EXPRESS_ARRIVE"
2. Dans "Mes Expéditions" → "Confirmer l'expédition" → Saisir le code

---

### Problème 3 : Certaines commandes n'ont pas d'agence de retrait

**Symptôme** : La commande apparaît mais l'agence n'est pas affichée.

**Cause** : Le champ `agenceRetrait` est vide.

**Solution** :
1. L'**appelant** doit définir l'agence lors de la création de la commande EXPRESS
2. Ou le **livreur** doit la saisir lors de "Confirmer l'expédition"

---

## 🧪 TESTS MANUELS À EFFECTUER

### Test Complet - Cycle de Vie EXPRESS

1. **Créer une commande EXPRESS** (en tant qu'APPELANT)
   - Client paie 10%
   - Définir agence de retrait
   - ✅ Vérifier : Statut = `EXPRESS`

2. **Assigner un livreur** (en tant que GESTIONNAIRE)
   - ✅ Vérifier : Statut reste `EXPRESS`

3. **Marquer arrivé** (en tant que LIVREUR)
   - Dans "Mes Expéditions" → "Confirmer l'expédition"
   - Saisir code d'expédition
   - Upload photo (optionnel)
   - ✅ Vérifier : Statut = `EXPRESS_ARRIVE`

4. **Vérifier affichage** (en tant que GESTIONNAIRE)
   - Aller dans "EXPRESS - En agence"
   - ✅ La commande doit apparaître
   - ✅ Le code doit être visible (badge bleu)
   - ✅ L'agence doit être affichée

5. **Notifier le client** (en tant que GESTIONNAIRE)
   - Cliquer sur "Notifier"
   - ✅ Le code doit être affiché dans la modal

6. **Confirmer retrait** (en tant que GESTIONNAIRE)
   - Client vient récupérer + paie 90%
   - Cliquer sur "Client a retiré"
   - ✅ Vérifier : Statut = `EXPRESS_LIVRE`
   - ✅ La commande passe en bas de liste (grisée)

---

## 📈 REQUÊTE SQL POUR VÉRIFICATION DIRECTE

Si vous avez accès à la base de données PostgreSQL sur Railway :

```sql
-- 1️⃣ Toutes les commandes EXPRESS_ARRIVE
SELECT 
  "orderReference",
  "clientNom",
  "clientTelephone",
  "produitNom",
  "deliveryType",
  "status",
  "agenceRetrait",
  "codeExpedition",
  "arriveAt",
  "montant",
  "montantPaye",
  "montantRestant"
FROM orders
WHERE status = 'EXPRESS_ARRIVE'
ORDER BY "arriveAt" DESC;

-- 2️⃣ Vérifier les commandes EXPRESS_ARRIVE sans arriveAt
SELECT 
  "orderReference",
  "clientNom",
  "status",
  "arriveAt"
FROM orders
WHERE status = 'EXPRESS_ARRIVE'
  AND "arriveAt" IS NULL;

-- 3️⃣ Vérifier les commandes EXPRESS_ARRIVE sans agence
SELECT 
  "orderReference",
  "clientNom",
  "agenceRetrait"
FROM orders
WHERE status = 'EXPRESS_ARRIVE'
  AND ("agenceRetrait" IS NULL OR "agenceRetrait" = '');

-- 4️⃣ Vérifier les commandes EXPRESS_ARRIVE sans code
SELECT 
  "orderReference",
  "clientNom",
  "codeExpedition"
FROM orders
WHERE status = 'EXPRESS_ARRIVE'
  AND ("codeExpedition" IS NULL OR "codeExpedition" = '');

-- 5️⃣ Toutes les commandes EXPRESS (tous statuts)
SELECT 
  "status",
  COUNT(*) as nombre
FROM orders
WHERE "deliveryType" = 'EXPRESS'
GROUP BY "status"
ORDER BY nombre DESC;
```

---

## 🛠️ SCRIPT DE VÉRIFICATION AUTOMATIQUE

### Option 1 : Script Node.js avec API (recommandé)

**Fichier créé** : `verifier_express_api.js`

**Étapes** :
1. Connectez-vous sur https://afgestion.net
2. Ouvrez la console du navigateur (F12)
3. Tapez : `localStorage.getItem('token')`
4. Copiez le token
5. Ouvrez `verifier_express_api.js`
6. Remplacez `VOTRE_TOKEN_ICI` par votre token (ligne 21)
7. Exécutez :
```bash
node verifier_express_api.js
```

**Résultat** : Le script affichera toutes les commandes EXPRESS_ARRIVE avec détails et recommandations.

---

### Option 2 : Vérification dans la Console du Navigateur

1. Connectez-vous sur https://afgestion.net
2. Allez dans "EXPRESS - En agence"
3. Ouvrez la console (F12)
4. Collez ce code :

```javascript
// Récupérer les données affichées
const orders = window.__REACT_QUERY_STATE__?.queries
  ?.find(q => q.queryKey[0] === 'express-en-agence')
  ?.state?.data?.orders || [];

// Statistiques
const stats = {
  total: orders.length,
  expressArrive: orders.filter(o => o.status === 'EXPRESS_ARRIVE').length,
  expressLivre: orders.filter(o => o.status === 'EXPRESS_LIVRE').length,
  sansAgence: orders.filter(o => !o.agenceRetrait).length,
  sansCode: orders.filter(o => !o.codeExpedition).length,
  sansArriveAt: orders.filter(o => !o.arriveAt).length
};

console.log('📊 STATISTIQUES EXPRESS EN AGENCE');
console.table(stats);

// Commandes avec problèmes
const problemes = orders.filter(o => 
  o.status === 'EXPRESS_ARRIVE' && 
  (!o.agenceRetrait || !o.codeExpedition || !o.arriveAt)
);

if (problemes.length > 0) {
  console.log('⚠️ COMMANDES AVEC PROBLÈMES :');
  console.table(problemes.map(o => ({
    ref: o.orderReference,
    client: o.clientNom,
    agence: o.agenceRetrait || '❌',
    code: o.codeExpedition || '❌',
    arriveAt: o.arriveAt || '❌'
  })));
} else {
  console.log('✅ Toutes les commandes sont correctement configurées !');
}
```

---

## ✅ RÉSUMÉ DES BONNES PRATIQUES

### Pour les Livreurs
1. ✅ Toujours remplir le **code d'expédition** lors de "Confirmer l'expédition"
2. ✅ Indiquer l'**agence de retrait** si pas déjà définie
3. ✅ Upload la **photo du reçu** (optionnel mais recommandé)

### Pour les Appelants
1. ✅ Toujours définir l'**agence de retrait** lors de la création d'une commande EXPRESS
2. ✅ Informer le client du **montant à payer** (90%) lors du retrait

### Pour les Gestionnaires
1. ✅ Vérifier régulièrement les commandes dans "EXPRESS - En agence"
2. ✅ Notifier les clients dont les colis sont arrivés
3. ✅ Rappeler les clients dont les colis sont en attente depuis > 7 jours
4. ✅ Confirmer le retrait après paiement des 90% restants

---

## 🎯 POINTS CLÉS À RETENIR

### La page "EXPRESS - En agence" affiche :
- ✅ Toutes les commandes avec `deliveryType: 'EXPRESS'`
- ✅ ET statut `EXPRESS_ARRIVE` (non retirées) ou `EXPRESS_LIVRE` (retirées)

### Une commande N'APPARAÎTRA PAS si :
- ❌ Elle a le statut `EXPRESS` (pas encore arrivée) → Le livreur doit marquer arrivé
- ❌ Elle a un `deliveryType` différent de `EXPRESS`
- ❌ Un filtre actif la cache (recherche, agence, dates)

### Une commande APPARAÎTRA SANS CODE si :
- ⚠️ Le champ `codeExpedition` est vide
- ⚠️ Le livreur n'a pas rempli le code lors de "Confirmer l'expédition"

---

## 📞 SUPPORT

Si après toutes ces vérifications, vous constatez qu'une commande `EXPRESS_ARRIVE` n'apparaît pas dans "EXPRESS - En agence" :

1. **Vérifiez le statut exact** de la commande dans "Toutes les commandes"
2. **Vérifiez le type de livraison** (`deliveryType`)
3. **Désactivez TOUS les filtres** dans la page "EXPRESS - En agence"
4. **Consultez les logs backend** Railway pour voir si une erreur s'est produite
5. **Exécutez le script de vérification** `verifier_express_api.js`

---

**FIN DU DOCUMENT**

*Dernière mise à jour : 14 Janvier 2026*

