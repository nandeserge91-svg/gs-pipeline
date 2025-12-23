# 📦 CRÉATION DU PRODUIT BUTTOCK

**Guide pas à pas pour créer votre produit Buttock dans GS Pipeline**

---

## 🎯 OBJECTIF

Créer le produit "Buttock" dans GS Pipeline pour que les commandes Google Sheet soient automatiquement liées à ce produit.

---

## 📋 ÉTAPES DÉTAILLÉES

### 1. Ouvrir la gestion des produits

**URL** : https://afgestion.net/admin/products

**Connexion** : Utilisez votre compte admin
- Email : `admin@gs-pipeline.com`
- Mot de passe : `admin123`

### 2. Cliquer sur "+ Ajouter un produit"

Le bouton bleu en haut à droite de la page.

### 3. Remplir le formulaire

Un popup s'ouvre avec plusieurs champs :

#### Code (product_key) *
```
BUTTOCK
```
**⚠️ ATTENTION** :
- Doit être **exactement** `BUTTOCK` (tout en majuscules)
- Pas d'espaces
- Pas d'accents
- C'est l'identifiant unique du produit

#### Nom *
```
Buttock
```
Le nom affiché dans l'application (peut contenir ce que vous voulez).

#### Description (optionnel)
```
Produit Buttock - Description de votre produit
```
Vous pouvez mettre une description détaillée.

#### Prix unitaire (XOF) *
```
15000
```
Le prix en Francs CFA pour **1 unité** du produit.

**Exemples de prix** :
- 15 000 FCFA → Entrez `15000`
- 12 500 FCFA → Entrez `12500`
- 20 000 FCFA → Entrez `20000`

#### Stock actuel *
```
100
```
Le nombre d'unités en stock actuellement.

#### Seuil d'alerte *
```
10
```
Quand le stock descend sous ce seuil, une alerte sera générée.

### 4. Enregistrer

Cliquez sur le bouton **"Enregistrer"** en bas du formulaire.

### 5. Vérifier

Le produit **Buttock** doit maintenant apparaître dans la liste des produits !

---

## ✅ RÉSULTAT ATTENDU

Vous devriez voir dans la liste :

```
┌─────────────────────────────────────────────┐
│ Buttock                                     │
│ Code: BUTTOCK                               │
│ Stock: 100                                  │
│ Prix unitaire: 15 000 FCFA                  │
└─────────────────────────────────────────────┘
```

---

## 🧪 TESTER ENSUITE

### Une fois le produit créé :

1. **Google Sheet** → **Extensions** → **Apps Script**
2. **Copiez** le script `SCRIPT_GOOGLE_SHEET_GENERIQUE.js`
3. **Collez** dans Google Apps Script
4. **Enregistrez** (💾)
5. **Rafraîchissez** (F5)
6. **Sélectionnez** : `testButtock`
7. **Exécutez** (▶️)

### Vérification :

1. **Logs** : Affichage → Journaux d'exécution
2. **"À appeler"** : https://afgestion.net/admin/to-call
3. Vous devriez voir : **"Test Client Buttock"** avec le produit lié ✅

---

## 🔄 FLUX COMPLET

```
┌─────────────────────────┐
│  1. Créer produit       │
│     BUTTOCK             │
│     dans GS Pipeline    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  2. Configurer script   │
│     Google Apps         │
│     (déjà fait ✅)      │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  3. Tester avec         │
│     testButtock()       │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  4. Commande apparaît   │
│     dans "À appeler"    │
│     avec produit lié ✅ │
└─────────────────────────┘
```

---

## 📊 EXEMPLE DE PRIX

### Si vous vendez Buttock en packs :

| Pack | Prix | Configuration |
|------|------|---------------|
| 1 unité | 15 000 FCFA | Prix unitaire : 15000 |
| 2 unités | 28 000 FCFA | Prix unitaire : 14000 |
| 3 unités | 39 000 FCFA | Prix unitaire : 13000 |

**Méthode 1 (simple)** : 
- Créez 1 produit avec prix unitaire moyen
- Le prix sera : Prix × Quantité

**Méthode 2 (précise)** :
- Créez 3 produits différents : BUTTOCK_1, BUTTOCK_2, BUTTOCK_3
- Chacun avec son propre prix

---

## 🎊 RÉSULTAT FINAL

Une fois le produit créé et testé :

✅ **Toutes vos commandes Buttock** depuis Google Sheets apparaîtront automatiquement dans "À appeler"  
✅ **Produit lié** correctement  
✅ **Prix calculé** automatiquement  
✅ **Stock géré** automatiquement  
✅ **Quantités variables** supportées  

**Votre système est prêt !** 🚀

---

**Temps total** : 3 minutes  
**Difficulté** : ⭐ Facile  
**Statut** : ✅ Prêt à tester



















