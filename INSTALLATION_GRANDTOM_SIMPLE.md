# 🚀 INSTALLATION : PRODUIT GRANDTOM

**Votre formulaire envoie : "GrandTom"**  
**Le script mappe vers : GRANDTOM** ✅

---

## ✅ ÉTAPE 1 : CRÉER LE PRODUIT (2 minutes)

### Allez sur : https://afgestion.net/admin/products

Cliquez : **"+ Ajouter un produit"**

Remplissez **EXACTEMENT** :

```
Code (product_key) : GRANDTOM
Nom               : GrandTom
Description       : Produit GrandTom
Prix unitaire     : 15000
Stock actuel      : 100
Seuil d'alerte    : 10
```

**⚠️ TRÈS IMPORTANT** : Le code doit être **`GRANDTOM`** (tout en majuscules, un seul mot)

Cliquez **"Enregistrer"** ✅

---

## ✅ ÉTAPE 2 : COPIER LE SCRIPT (2 minutes)

### 1. Ouvrir Google Apps Script

- Allez sur votre Google Sheet
- Menu : **Extensions** → **Apps Script**

### 2. Remplacer le code

- **Supprimez** tout le code actuel (Ctrl+A puis Delete)
- **Ouvrez** le fichier : `SCRIPT_FINAL_GRANDTOM.js`
- **Copiez TOUT** (Ctrl+A puis Ctrl+C)
- **Collez** dans Google Apps Script (Ctrl+V)
- **Enregistrez** (💾 ou Ctrl+S)

---

## ✅ ÉTAPE 3 : TESTER (1 minute)

### Dans Google Apps Script :

1. **Rafraîchissez** la page (F5)
2. **Menu déroulant** (en haut) → Sélectionnez : **`testGrandTom`**
3. **Cliquez** sur ▶️ **Exécuter**
4. Si première fois : **Autorisez** le script
5. **Affichage** → **Journaux d'exécution**

### Logs attendus :

```
🧪 TEST : GrandTom

📝 Simulation : Le formulaire envoie "GrandTom"

📦 Tag reçu : "GrandTom"
📦 Code produit mappé : "GRANDTOM"
📦 Nom produit : "GrandTom"
📦 Quantité extraite : 1
📤 Envoi vers GS Pipeline : {
  "nom":"Test Client GrandTom",
  "telephone":"22507 22 33 44 55",
  "ville":"Abidjan",
  "offre":"GrandTom",
  "tag":"GRANDTOM",
  "quantite":1
}
📡 Status : 200
✅ Commande créée dans GS Pipeline avec succès !
📋 ID commande : 123
📋 Référence : CMD-20251212-XXX

✅ TEST RÉUSSI !
👉 Vérifiez sur : https://afgestion.net/admin/to-call
```

---

## ✅ ÉTAPE 4 : VÉRIFIER (30 secondes)

Allez sur : **https://afgestion.net/admin/to-call**

Vous devriez voir :

```
┌────────────────────────────────────┐
│ Commande : CMD-20251212-XXX        │
│ Client   : Test Client GrandTom    │
│ Produit  : GrandTom               │
│ Prix     : 15 000 FCFA            │
│ Quantité : 1                       │
│ Tél      : 22507 22 33 44 55      │
│ Ville    : Abidjan                │
└────────────────────────────────────┘
```

**✅ SI VOUS VOYEZ ÇA, C'EST BON !**

---

## 🎯 COMMENT ÇA FONCTIONNE

### Votre formulaire HTML :

```javascript
// Votre formulaire envoie
fetch(url, {
  method: "POST",
  body: new URLSearchParams({
    nom: "Jean Dupont",
    telephone: "22507 00 00 00 00",
    ville: "Abidjan",
    tag: "GrandTom"  // ← Exactement ça
  })
});
```

### Le script reçoit :

```
tag = "GrandTom"
```

### Le script mappe :

```javascript
'GrandTom': 'GRANDTOM'
```

### Le script envoie vers GS Pipeline :

```json
{
  "tag": "GRANDTOM",
  "offre": "GrandTom",
  "quantite": 1
}
```

### GS Pipeline cherche :

```
Produit avec code = "GRANDTOM"
```

### Résultat :

```
✅ Commande créée avec produit lié
✅ Prix calculé automatiquement
✅ Stock géré automatiquement
```

---

## 🔄 GESTION AUTOMATIQUE DU STOCK

### Quand vous livrez une commande :

```
Commande GrandTom → Statut LIVREE
Stock avant : 100
Stock après : 99  ✅ (-1 automatiquement)
```

### Quand il y a un retour :

```
Commande GrandTom → Statut RETOURNE
Stock avant : 99
Stock après : 100  ✅ (+1 automatiquement)
```

**Vous n'avez RIEN à faire, tout est automatique !** ✅

---

## 🆘 DÉPANNAGE

### ❌ Erreur : "Produit non trouvé"

**Cause** : Le produit GRANDTOM n'existe pas

**Solution** :
1. Allez sur https://afgestion.net/admin/products
2. Créez le produit avec le code **GRANDTOM**

### ❌ Erreur : "Commande créée mais pas de produit lié"

**Cause** : Le code du produit n'est pas correct

**Solution** :
1. Vérifiez que le code est **GRANDTOM** (majuscules)
2. Pas `GrandTom`, pas `Grand Tom`, pas `grandtom`
3. Exactement **`GRANDTOM`**

### ❌ Erreur : "testGrandTom() pas visible"

**Cause** : Script pas enregistré

**Solution** :
1. Enregistrez (💾)
2. Rafraîchissez la page (F5)
3. Attendez 5 secondes

---

## 📋 RÉCAPITULATIF

```
1️⃣  Créer produit GRANDTOM dans GS Pipeline
    https://afgestion.net/admin/products
    
2️⃣  Copier SCRIPT_FINAL_GRANDTOM.js
    Google Sheet → Extensions → Apps Script
    
3️⃣  Tester avec testGrandTom()
    Menu déroulant → Exécuter
    
4️⃣  Vérifier dans "À appeler"
    https://afgestion.net/admin/to-call
    
✅ C'EST TOUT !
```

---

## 🎊 RÉSULTAT

Une fois configuré :

✅ **Formulaire envoie** : "GrandTom"  
✅ **Script mappe** : vers GRANDTOM  
✅ **GS Pipeline trouve** : le produit  
✅ **Commande créée** : dans "À appeler"  
✅ **Produit lié** : automatiquement  
✅ **Prix calculé** : automatiquement  
✅ **Stock géré** : automatiquement  

**Votre système est prêt !** 🚀

---

**Temps total** : 5 minutes  
**Difficulté** : ⭐ Facile  
**Fichier à copier** : `SCRIPT_FINAL_GRANDTOM.js`




















