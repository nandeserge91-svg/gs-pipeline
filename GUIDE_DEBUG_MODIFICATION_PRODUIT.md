# 🔍 Guide de Débogage - Modification Produit

## 🎯 Objectif

Identifier exactement quelle erreur empêche la modification des produits.

---

## 📋 Checklist de Vérification

### 1️⃣ Vérifier que le Déploiement est Terminé

**Railway (Backend)** :
1. Allez sur https://railway.app/
2. Ouvrez votre projet
3. Cliquez sur le service Backend
4. Onglet "Deployments"
5. **Vérifiez** : Le dernier déploiement est **"Active"** ✅

**Vercel (Frontend)** :
1. Allez sur https://vercel.com/
2. Ouvrez votre projet
3. Onglet "Deployments"
4. **Vérifiez** : Le dernier déploiement est **"Ready"** ✅

**⏰ Si "Building..." → Attendez la fin !**

---

### 2️⃣ Vider le Cache Navigateur

Le navigateur peut utiliser l'ancien code JavaScript.

**Étapes** :
1. Ouvrez la page `afgestion.net/stock/products`
2. **Videz le cache** :
   - **Chrome/Edge** : `Ctrl + Shift + Delete` → Cocher "Images et fichiers en cache" → Effacer
   - **Firefox** : `Ctrl + Shift + Delete` → Cocher "Cache" → Effacer
3. **Rafraîchir FORT** : `Ctrl + Shift + F5`
4. **Ou** : `Ctrl + F5` plusieurs fois

---

### 3️⃣ Vérifier les Erreurs dans la Console

**Ouvrir la Console** :
1. Appuyez sur `F12`
2. Onglet **"Console"**
3. Tentez de modifier un produit
4. **Regardez les erreurs** affichées

**Ce que vous devriez voir** :
```javascript
PUT https://votre-api.railway.app/api/products/123
Status: 500 (ou 400)
```

**Cliquez sur la ligne rouge** pour voir les détails de l'erreur.

---

### 4️⃣ Vérifier l'Onglet Network

**Ouvrir Network** :
1. `F12` → Onglet **"Network"**
2. Cochez **"Preserve log"**
3. Tentez de modifier un produit
4. Cherchez la ligne qui commence par `products`
5. **Cliquez dessus**

**Regardez** :
- **Request** → **Headers** → **Request Payload** : Données envoyées
- **Response** : Réponse du serveur avec l'erreur

**Copier les détails** et me les envoyer.

---

### 5️⃣ Vérifier les Valeurs Envoyées

Dans l'onglet **Network** → **Request Payload**, vous devriez voir :

```json
{
  "code": "BEE",
  "nom": "BEE VENOM",
  "description": "ANTI DOULEUR",
  "prixUnitaire": 9900,
  "prix1": 9900,
  "prix2": 16900,
  "prix3": 23900,
  "stockAlerte": 50
}
```

**Vérifiez** :
- ✅ Les prix sont des **nombres** (pas de guillemets)
- ✅ Pas de `NaN` ou `null` pour prix1, prix2, prix3
- ✅ `prixUnitaire` est un nombre

---

## 🔧 Solutions Possibles

### Problème 1 : Déploiement Pas Terminé

**Symptôme** : Erreur persiste après 5 minutes

**Solution** :
1. Vérifier Railway et Vercel (statut "Active"/"Ready")
2. Si "Building", attendre la fin
3. Si "Failed", forcer un redéploiement :
   ```bash
   git commit --allow-empty -m "chore: force redeploy"
   git push origin main
   ```

---

### Problème 2 : Cache Navigateur

**Symptôme** : L'ancien code JavaScript est utilisé

**Solution** :
1. Vider le cache (Ctrl + Shift + Delete)
2. Mode Incognito : `Ctrl + Shift + N`
3. Tester dans le mode privé

---

### Problème 3 : Valeurs Incorrectes

**Symptôme** : `prix1: NaN` ou `prix1: ""`

**Solution** :
- Si vous voyez `NaN` → Le frontend n'a pas été mis à jour
- Si vous voyez `""` → Le frontend n'a pas été mis à jour
- Attendre le déploiement Vercel

---

### Problème 4 : Erreur Backend Spécifique

**Symptôme** : Erreur 500 avec message précis

**Actions** :
1. Lire le message d'erreur dans la Response
2. Me donner le message exact
3. Je pourrai corriger le problème précis

---

## 🧪 Test Manuel avec Postman/Insomnia

Si vous voulez tester directement l'API :

### 1. Obtenir votre Token

1. Allez sur `afgestion.net`
2. Connectez-vous en tant qu'Admin
3. `F12` → Console → Tapez :
   ```javascript
   localStorage.getItem('token')
   ```
4. Copiez le token (sans les guillemets)

### 2. Tester avec Postman

**Request** :
```
PUT https://votre-api.railway.app/api/products/1
```

**Headers** :
```
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json
```

**Body** (raw JSON) :
```json
{
  "code": "BEE",
  "nom": "BEE VENOM",
  "description": "ANTI DOULEUR",
  "prixUnitaire": 9900,
  "prix1": 9900,
  "prix2": 16900,
  "prix3": 23900,
  "stockAlerte": 50
}
```

**Cliquez** "Send"

**Résultat attendu** :
```json
{
  "product": {
    "id": 1,
    "code": "BEE",
    "nom": "BEE VENOM",
    ...
  },
  "message": "Produit modifié avec succès."
}
```

---

## 🔍 Erreurs Courantes et Solutions

### Erreur : "Le code 'BEE' est déjà utilisé"

**Cause** : Vous essayez de changer le code vers un code existant

**Solution** : Gardez le même code "BEE"

---

### Erreur : "Prix invalide"

**Cause** : Le prix est négatif ou NaN

**Solution** : Vérifier que tous les prix sont des nombres positifs

---

### Erreur : "Produit non trouvé"

**Cause** : L'ID du produit n'existe pas

**Solution** : Vérifier l'ID du produit dans la console

---

### Erreur : "Unauthorized"

**Cause** : Token expiré ou invalide

**Solution** :
1. Déconnectez-vous
2. Reconnectez-vous
3. Réessayez

---

## 📊 Informations à me Fournir

Si l'erreur persiste, donnez-moi :

### 1. Capture d'écran de l'erreur complète

### 2. Console (F12 → Console)
```
Copier toutes les lignes en rouge
```

### 3. Network (F12 → Network → products)
**Request Payload** :
```json
{...}
```

**Response** :
```json
{...}
```

### 4. État des Déploiements
- Railway : Active / Building / Failed ?
- Vercel : Ready / Building / Failed ?

### 5. Navigateur Utilisé
- Chrome / Firefox / Edge / Safari ?
- Version ?

---

## ⚡ Solution Rapide

**Si vous êtes pressé** :

1. **Mode Incognito** : `Ctrl + Shift + N`
2. Allez sur `afgestion.net`
3. Connectez-vous
4. Essayez de modifier le produit
5. **Si ça marche** → C'était le cache
6. **Si ça ne marche pas** → Le déploiement n'est pas terminé

---

## 🎯 Prochaines Étapes

1. ⏰ **Attendre 10 minutes** depuis le dernier push
2. 🔄 **Vider le cache** complètement
3. 🧪 **Tester** la modification
4. 📊 **Me donner** les détails de l'erreur si ça ne marche pas

---

**Le code est correct. Le problème vient soit du déploiement pas terminé, soit du cache navigateur ! 🚀**
