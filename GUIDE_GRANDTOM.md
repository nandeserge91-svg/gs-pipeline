# 📦 GUIDE : PRODUIT GRANDTOM

**Configuration complète pour votre produit "GrandTom"**

---

## ✅ CE QUI A ÉTÉ FAIT

Votre produit **GrandTom** est maintenant configuré dans le script !

### 1️⃣ PRODUCT_MAPPING

```javascript
// 🆕 GrandTom (VOTRE PRODUIT) ✅✅✅
'GrandTom': 'GRANDTOM',
'grandtom': 'GRANDTOM',
'GRANDTOM': 'GRANDTOM',
'Grand Tom': 'GRANDTOM',
'grand tom': 'GRANDTOM',
'1_GrandTom': 'GRANDTOM',
'2_GrandTom': 'GRANDTOM',
'3_GrandTom': 'GRANDTOM',
```

### 2️⃣ PRODUCT_NAMES

```javascript
'GRANDTOM': 'GrandTom',
```

### 3️⃣ FONCTION DE TEST

```javascript
function testGrandTom() {
  Logger.log('🧪 TEST : GrandTom\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Client GrandTom',
    telephone: '22507 22 33 44 55',
    ville: 'Abidjan',
    tag: 'GrandTom'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/admin/to-call\n');
}
```

---

## 🚀 INSTALLATION EN 3 ÉTAPES

### ÉTAPE 1 : CRÉER LE PRODUIT DANS GS PIPELINE

**Allez sur** : https://afgestion.net/admin/products

**Cliquez** : "+ Ajouter un produit"

**Remplissez** :

| Champ | Valeur |
|-------|--------|
| **Code (product_key)** | `GRANDTOM` |
| **Nom** | `GrandTom` |
| **Description** | `Produit GrandTom` |
| **Prix unitaire (XOF)** | Votre prix (ex: `15000`) |
| **Stock actuel** | Votre stock (ex: `100`) |
| **Seuil d'alerte** | `10` |

**⚠️ TRÈS IMPORTANT** : Le code doit être exactement **`GRANDTOM`** (tout en majuscules, un seul mot)

**Cliquez** : "Enregistrer" ✅

---

### ÉTAPE 2 : INSTALLER LE SCRIPT

1. **Ouvrez** votre Google Sheet
2. **Menu** : Extensions → Apps Script
3. **Supprimez** tout le code actuel (Ctrl+A puis Delete)
4. **Ouvrez** le fichier : `SCRIPT_AVEC_GRANDTOM_COMPLET.js`
5. **Copiez TOUT** le contenu (Ctrl+A puis Ctrl+C)
6. **Collez** dans Google Apps Script (Ctrl+V)
7. **Enregistrez** (💾 ou Ctrl+S)

---

### ÉTAPE 3 : TESTER

1. **Rafraîchissez** la page Google Apps Script (F5)
2. **Menu déroulant** (en haut) → Sélectionnez : **`testGrandTom`** ✅
3. **Cliquez** sur ▶️ **Exécuter**
4. Si première fois : **Autorisez** le script
5. **Affichage** → **Journaux d'exécution** (voir les logs)

---

## 📊 LOGS ATTENDUS

```
🧪 TEST : GrandTom

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
📡 Réponse : {"success":true,"order_id":123,...}
✅ Commande créée dans GS Pipeline avec succès !
📋 ID commande : 123
📋 Référence : CMD-20251212-XXX

✅ TEST RÉUSSI !
👉 Vérifiez sur : https://afgestion.net/admin/to-call
```

---

## ✅ VÉRIFICATION

Allez sur : https://afgestion.net/admin/to-call

Vous devriez voir une **nouvelle commande** :
- ✅ **Client** : Test Client GrandTom
- ✅ **Produit** : GrandTom (avec le prix correct)
- ✅ **Quantité** : 1
- ✅ **Téléphone** : 22507 22 33 44 55
- ✅ **Ville** : Abidjan

---

## 🔢 TAGS SUPPORTÉS

Votre formulaire peut envoyer n'importe laquelle de ces variantes :

| Tag du formulaire | Code produit | Quantité |
|-------------------|--------------|----------|
| `GrandTom` | GRANDTOM | 1 |
| `grandtom` | GRANDTOM | 1 |
| `GRANDTOM` | GRANDTOM | 1 |
| `Grand Tom` | GRANDTOM | 1 |
| `grand tom` | GRANDTOM | 1 |
| `1_GrandTom` | GRANDTOM | 1 |
| `2_GrandTom` | GRANDTOM | 2 |
| `3_GrandTom` | GRANDTOM | 3 |

**Toutes seront reconnues et mappées vers le produit GRANDTOM !** ✅

---

## 📋 EXEMPLE D'UTILISATION

### Dans votre formulaire HTML :

```javascript
// Exemple 1 : Commande simple
fetch(url, {
  method: "POST",
  body: new URLSearchParams({
    nom: "Jean Dupont",
    telephone: "22507 00 00 00 00",
    ville: "Abidjan",
    tag: "GrandTom"  // ← Sera reconnu
  })
});

// Exemple 2 : Commande de 2 unités
fetch(url, {
  method: "POST",
  body: new URLSearchParams({
    nom: "Marie Kouassi",
    telephone: "22507 11 22 33 44",
    ville: "Cocody",
    tag: "2_GrandTom"  // ← Quantité = 2
  })
});

// Exemple 3 : Variante avec espace
fetch(url, {
  method: "POST",
  body: new URLSearchParams({
    nom: "Yao N'Dri",
    telephone: "22507 22 33 44 55",
    ville: "Yopougon",
    tag: "Grand Tom"  // ← Sera reconnu aussi
  })
});
```

---

## 🎯 FLUX COMPLET

```
1️⃣  Client remplit le formulaire
    Tag = "GrandTom" ou "2_GrandTom"
    
2️⃣  Formulaire envoie vers Google Apps Script
    
3️⃣  Script mappe "GrandTom" → "GRANDTOM"
    Extrait quantité (si présente)
    
4️⃣  Script envoie vers GS Pipeline
    API URL + données
    
5️⃣  GS Pipeline cherche produit GRANDTOM
    Crée la commande
    
6️⃣  Commande apparaît dans "À appeler"
    Avec produit lié ✅
    Prix calculé automatiquement ✅
    
7️⃣  À la livraison
    Stock diminue automatiquement ✅
```

---

## 🔄 GESTION AUTOMATIQUE DU STOCK

Une fois le produit créé et testé, le stock sera géré automatiquement :

### LIVRAISON
```
Commande GrandTom (2 unités) → LIVREE
Stock avant : 100
Stock après : 98  ✅ (-2 automatiquement)
```

### RETOUR
```
Commande GrandTom (2 unités) → RETOURNE
Stock avant : 98
Stock après : 100  ✅ (+2 automatiquement)
```

---

## 💡 PERSONNALISATION

### Prix par quantité

Si vous avez des prix différents selon la quantité :

**Option 1 : Prix unitaire fixe**
- Créez 1 produit : GRANDTOM
- Prix unitaire : 15 000 FCFA
- Commande de 2 = 30 000 FCFA (15000 × 2)

**Option 2 : Produits distincts**
- Créez 3 produits : GRANDTOM_1, GRANDTOM_2, GRANDTOM_3
- Chacun avec son propre prix
- Modifiez le mapping dans le script

---

## 🆘 DÉPANNAGE

### Erreur : "Produit non trouvé"

**Cause** : Le produit GRANDTOM n'existe pas dans GS Pipeline

**Solution** :
1. Allez sur https://afgestion.net/admin/products
2. Vérifiez qu'il existe un produit avec le code **GRANDTOM** (majuscules)
3. Si absent, créez-le (voir ÉTAPE 1)

### Erreur : "Commande créée mais pas de produit lié"

**Cause** : Le code du produit ne correspond pas exactement

**Solution** :
1. Dans GS Pipeline, vérifiez le code exact du produit
2. Doit être **GRANDTOM** (tout en majuscules)
3. Pas d'espaces, pas d'accents

### Test ne s'exécute pas

**Cause** : Script non enregistré ou autorisation manquante

**Solution** :
1. Enregistrez le script (💾)
2. Rafraîchissez la page (F5)
3. Autorisez le script lors de la première exécution

---

## 🎊 RÉSULTAT FINAL

Une fois configuré correctement :

✅ **Toutes vos commandes GrandTom** depuis Google Sheets apparaîtront automatiquement dans "À appeler"  
✅ **Produit lié** correctement  
✅ **Prix calculé** automatiquement  
✅ **Quantités variables** supportées (1, 2, 3, etc.)  
✅ **Stock géré** automatiquement à la livraison/retour  
✅ **Historique complet** des mouvements de stock  

**Votre système est prêt et évolutif !** 🚀

---

## 📞 FONCTIONS DISPONIBLES

Dans Google Apps Script, vous avez accès à ces fonctions :

| Fonction | Description |
|----------|-------------|
| `testGrandTom()` | Tester GrandTom |
| `testBeeVenom()` | Tester Bee Venom |
| `testButtock()` | Tester Buttock |
| `testTousProduits()` | Tester tous les produits |
| `afficherConfig()` | Voir la configuration |
| `setup()` | Initialiser le Google Sheet |

---

**Fichier créé** : `SCRIPT_AVEC_GRANDTOM_COMPLET.js`  
**Prêt à copier-coller** dans Google Apps Script !  

**Créez le produit GRANDTOM maintenant, puis testez !** 📦🚀









