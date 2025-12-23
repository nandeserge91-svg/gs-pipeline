# 🔍 DIAGNOSTIC : VARIATION DU STOCK

**Problème** : Le stock ne se met pas à jour lors des livraisons  
**Date** : 12 décembre 2025  
**Statut** : 🔍 EN DIAGNOSTIC

---

## ✅ LOGS DE DÉBOGAGE AJOUTÉS

J'ai ajouté des **logs détaillés** dans le système pour identifier le problème.

Railway va redéployer automatiquement (1-2 minutes).

---

## 🧪 TEST À EFFECTUER

### Étape 1 : Vérifier que le produit existe

1. Allez sur : https://afgestion.net/admin/products
2. Vérifiez qu'il existe **UN produit** avec :
   - **Code** : `BEE` (en majuscules)
   - **Nom** : `Bee Venom` (ou similaire)
   - **Stock actuel** : Un nombre (ex: 100)

**⚠️ IMPORTANT** : Si le produit n'existe pas ou a un code différent, créez-le !

### Étape 2 : Créer une commande de test

1. Depuis Google Apps Script :
   - Ouvrez votre script
   - Exécutez `test1Boite()` ou `testToutesQuantites()`
   
2. Vérifiez dans "À appeler" :
   - La commande apparaît ✅
   - Regardez si le **produit** est bien lié
   - Notez la **référence** de la commande (ex: CMD-20251212-XXX)

### Étape 3 : Changer le statut en LIVREE

1. Dans "À appeler", cliquez sur la commande
2. Validez-la (VALIDEE)
3. Assignez un livreur ou marquez-la comme LIVREE

### Étape 4 : Vérifier les logs Railway

1. Allez sur : https://railway.app/dashboard
2. Cliquez sur votre projet → Service `gs-pipeline`
3. Onglet **"Deployments"** → Dernier déploiement → **"View Logs"**
4. Cherchez les messages suivants :

#### Logs attendus lors de la création de commande :

```
🔍 Recherche produit avec terme: BEE
✅ Produit trouvé par code: BEE | Bee Venom | ID: 1
✅ Commande créée depuis Google Sheet: ...
```

#### Logs attendus lors du changement de statut :

```
🔍 Vérification stock - Statut: LIVREE | Ancien statut: VALIDEE | ProductID: 1
✅ Conditions remplies pour décrémenter le stock
📦 STOCK UPDATE: Bee Venom | Avant: 100 | Après: 98 | Quantité: -2
✅ Stock mis à jour et mouvement créé
```

---

## ❌ PROBLÈMES POSSIBLES ET SOLUTIONS

### Problème 1 : Produit non trouvé

**Logs** :
```
❌ PRODUIT NON TROUVÉ pour: BEE
💡 Vérifiez que le produit existe avec code "BEE"
```

**Cause** : Le produit n'existe pas ou a un code différent

**Solution** :
1. Allez sur https://afgestion.net/admin/products
2. Créez le produit avec :
   - Code : `BEE` (exactement, en majuscules)
   - Nom : `Bee Venom`
   - Prix unitaire : `9900` FCFA
   - Stock actuel : `100`

### Problème 2 : Commande sans productId

**Logs** :
```
❌ PROBLÈME: Commande sans productId - Stock ne sera pas mis à jour
```

**Cause** : La commande a été créée sans lien vers un produit

**Solution** :
1. Vérifiez que le produit `BEE` existe
2. Testez une nouvelle commande
3. Si le problème persiste, modifier manuellement la commande :
   - Admin → Commandes → Modifier
   - Sélectionner le produit

### Problème 3 : Statut n'est pas LIVREE

**Logs** :
```
⚠️ Statut n'est pas LIVREE
```

**Cause** : Le stock ne se met à jour QUE quand le statut passe à **LIVREE**

**Solution** :
- Assurez-vous de marquer la commande comme **LIVREE** (pas seulement VALIDEE)
- Le stock diminue seulement à la livraison effective

### Problème 4 : Commande déjà LIVREE

**Logs** :
```
⚠️ Commande déjà LIVREE
```

**Cause** : Le stock ne peut pas être réduit deux fois

**Solution** :
- C'est normal, le stock a déjà été mis à jour
- Pour tester à nouveau, créez une nouvelle commande

---

## 📋 CHECKLIST DE DIAGNOSTIC

- [ ] **Attendez 2 minutes** que Railway redéploie
- [ ] **Vérifiez** que le produit `BEE` existe avec le bon code
- [ ] **Créez** une commande de test depuis Google Apps Script
- [ ] **Vérifiez** dans "À appeler" que le produit est lié
- [ ] **Changez** le statut en LIVREE
- [ ] **Consultez** les logs Railway
- [ ] **Notez** les messages d'erreur si présents
- [ ] **Vérifiez** si le stock a changé dans "Gestion des Produits"

---

## 🔧 VÉRIFICATIONS COMPLÉMENTAIRES

### Vérifier le produit actuel

1. Allez sur https://afgestion.net/admin/products
2. Trouvez "Bee Venom"
3. Vérifiez :
   - ✅ Le code est bien `BEE` (en majuscules)
   - ✅ Le stock actuel est visible
   - ✅ Le produit n'est pas désactivé

### Vérifier une commande existante

1. Allez dans une commande dans "À appeler"
2. Regardez les détails :
   - Y a-t-il un **produit lié** ?
   - Le **prix** est-il correct ?
   - La **quantité** est-elle visible ?

Si **pas de produit lié** → C'est le problème !

---

## 💡 SOLUTION RAPIDE

Si vous voulez tester immédiatement :

### 1. Créer le produit BEE (si pas déjà fait)

**URL** : https://afgestion.net/admin/products → "+ Ajouter un produit"

```
Code (product_key) : BEE
Nom : Bee Venom
Prix unitaire : 9900
Stock actuel : 100
Seuil d'alerte : 20
```

### 2. Tester avec le script Google

```javascript
// Dans Google Apps Script, exécutez :
testEnvoiVersGSPipeline()
```

### 3. Vérifier la commande

- Allez sur https://afgestion.net/admin/to-call
- La commande doit apparaître
- Vérifiez qu'elle a un **produit lié** ("Bee Venom")

### 4. Marquer comme LIVREE

- Cliquez sur la commande
- Changez le statut : NOUVELLE → VALIDEE → LIVREE
- Retournez dans "Produits" → Le stock doit avoir diminué ✅

---

## 📊 EXEMPLE DE TEST COMPLET

### Configuration initiale

```
Produit : Bee Venom
Code : BEE
Stock initial : 100
```

### Test

```
1. Créer commande test (2 boîtes)
   → Commande CMD-20251212-005 créée
   → Produit lié : Bee Venom ✅
   → Stock : 100 (inchangé)

2. Valider commande (VALIDEE)
   → Stock : 100 (inchangé)

3. Livrer commande (LIVREE)
   → Stock : 98 ✅ (-2)
   → Mouvement créé : LIVRAISON -2
```

### Logs Railway attendus

```
🔍 Recherche produit avec terme: BEE
✅ Produit trouvé par code: BEE | Bee Venom | ID: 1
✅ Commande créée depuis Google Sheet: {...}

[Plus tard, lors du changement de statut]

🔍 Vérification stock - Statut: LIVREE | Ancien statut: VALIDEE | ProductID: 1
✅ Conditions remplies pour décrémenter le stock
📦 STOCK UPDATE: Bee Venom | Avant: 100 | Après: 98 | Quantité: -2
✅ Stock mis à jour et mouvement créé
```

---

## 🆘 SI LE PROBLÈME PERSISTE

**Partagez avec moi** :

1. **Capture d'écran** du produit dans "Gestion des Produits"
2. **Logs Railway** (les messages de débogage)
3. **Référence** d'une commande de test (ex: CMD-20251212-XXX)

Je pourrai identifier le problème exact !

---

## 📖 RESSOURCES

- **Logs Railway** : https://railway.app/dashboard → Votre projet → Deployments → View Logs
- **Produits** : https://afgestion.net/admin/products
- **À appeler** : https://afgestion.net/admin/to-call
- **Script Google** : Extensions → Apps Script → testEnvoiVersGSPipeline()

---

**Logs de débogage** : ✅ ACTIFS (après redéploiement)  
**Temps d'attente** : ~2 minutes  
**Prochaine étape** : Effectuer le test ci-dessus et vérifier les logs



















