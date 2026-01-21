# 🚀 GUIDE RAPIDE : PRODUIT BUTTOCK

**Configuration en 3 étapes pour tester votre produit Buttock**

---

## 📦 ÉTAPE 1 : CRÉER LE PRODUIT DANS GS PIPELINE

### Allez sur : https://afgestion.net/admin/products

Cliquez sur **"+ Ajouter un produit"** et remplissez :

| Champ | Valeur à entrer |
|-------|-----------------|
| **Code (product_key)** | `BUTTOCK` |
| **Nom** | `Buttock` |
| **Description** | `Produit Buttock` (ou votre description) |
| **Prix unitaire (XOF)** | Votre prix (ex: `15000`) |
| **Stock actuel** | Votre stock (ex: `100`) |
| **Seuil d'alerte** | `10` |

Cliquez **"Enregistrer"** ✅

**⚠️ TRÈS IMPORTANT** : Le code doit être **exactement** `BUTTOCK` (en majuscules)

---

## 📝 ÉTAPE 2 : UTILISER LE SCRIPT MIS À JOUR

Le script a été modifié et inclut maintenant **Buttock** !

### Configuration déjà ajoutée :

```javascript
PRODUCT_MAPPING: {
  // ... autres produits ...
  
  // 🆕 Buttock (VOTRE PRODUIT)
  'Buttock': 'BUTTOCK',
  'buttock': 'BUTTOCK',
  'BUTTOCK': 'BUTTOCK',
  '1_Buttock': 'BUTTOCK',
  '2_Buttock': 'BUTTOCK',
  '3_Buttock': 'BUTTOCK',
},

PRODUCT_NAMES: {
  // ... autres noms ...
  'BUTTOCK': 'Buttock',
}
```

### Dans Google Apps Script :

1. Le script `SCRIPT_GOOGLE_SHEET_GENERIQUE.js` est déjà ouvert
2. **Copiez TOUT** le contenu (Ctrl+A puis Ctrl+C)
3. Dans Google Apps Script, **supprimez** l'ancien code
4. **Collez** le nouveau code
5. **Enregistrez** (💾 ou Ctrl+S)

---

## 🧪 ÉTAPE 3 : TESTER

### Dans Google Apps Script :

1. **Rafraîchissez** la page (F5)
2. Dans le **menu déroulant** (en haut)
3. Sélectionnez : **`testButtock`**
4. Cliquez sur **▶️ Exécuter**
5. Si première fois, **autorisez** le script

### Logs attendus :

```
🧪 TEST : Buttock

📦 Tag reçu : "Buttock"
📦 Code produit mappé : "BUTTOCK"
📦 Nom produit : "Buttock"
📦 Quantité extraite : 1
📤 Envoi vers GS Pipeline : {...}
📡 Status : 200
✅ Commande créée dans GS Pipeline avec succès !
📋 ID commande : 123
📋 Référence : CMD-20251212-XXX

✅ TEST RÉUSSI !
👉 Vérifiez sur : https://afgestion.net/admin/to-call
```

---

## ✅ ÉTAPE 4 : VÉRIFIER

### Dans GS Pipeline :

1. Allez sur : https://afgestion.net/admin/to-call
2. Vous devriez voir une **nouvelle commande** :
   - **Client** : Test Client Buttock
   - **Produit** : Buttock ✅
   - **Quantité** : 1
   - **Téléphone** : 22507 11 22 33 44
   - **Ville** : Abidjan

### Vérifier que le produit est bien lié :

- La commande doit afficher le **nom du produit** "Buttock"
- Le **prix** doit être calculé automatiquement
- Si vous marquez la commande comme **LIVREE**, le **stock doit diminuer** ✅

---

## 🔢 SUPPORT DES QUANTITÉS

Le système supporte déjà les quantités pour Buttock :

| Tag formulaire | Code produit | Quantité |
|----------------|--------------|----------|
| `Buttock` | BUTTOCK | 1 |
| `1_Buttock` | BUTTOCK | 1 |
| `2_Buttock` | BUTTOCK | 2 |
| `3_Buttock` | BUTTOCK | 3 |
| `buttock` | BUTTOCK | 1 |

**Exemples** :
- Formulaire envoie `2_Buttock` → Commande de 2 Buttock
- Formulaire envoie `buttock` → Commande de 1 Buttock

---

## 📋 RÉCAPITULATIF RAPIDE

```
1. Créer produit "Buttock" dans GS Pipeline ✅
   Code: BUTTOCK
   
2. Copier le script générique dans Google Apps Script ✅
   (déjà mis à jour avec Buttock)
   
3. Enregistrer le script (💾) ✅

4. Exécuter testButtock() ✅

5. Vérifier dans "À appeler" ✅
```

---

## 🎯 VARIANTES DE TAGS SUPPORTÉES

Votre formulaire peut envoyer n'importe laquelle de ces variantes :

- ✅ `Buttock`
- ✅ `buttock` (minuscules)
- ✅ `BUTTOCK` (majuscules)
- ✅ `1_Buttock` (avec quantité)
- ✅ `2_Buttock` (avec quantité)
- ✅ `3_Buttock` (avec quantité)

**Toutes seront reconnues et mappées vers le produit BUTTOCK !** 🎯

---

## 🆘 SI LE TEST ÉCHOUE

### Erreur : Produit non trouvé

**Logs** :
```
❌ PRODUIT NON TROUVÉ pour: BUTTOCK
```

**Solution** :
- Vérifiez que le produit existe dans GS Pipeline
- Le code doit être **exactement** `BUTTOCK` (majuscules)

### Erreur 404 ou 500

**Solution** :
- Attendez que Railway termine le redéploiement (2 minutes)
- Vérifiez que Railway est actif

---

## 🎊 RÉSULTAT

Une fois le test réussi, toutes les commandes **Buttock** depuis vos Google Sheets apparaîtront automatiquement dans "À appeler" avec :
- ✅ Produit lié
- ✅ Prix calculé automatiquement
- ✅ Quantité correcte
- ✅ Stock géré automatiquement

---

**Créez le produit BUTTOCK maintenant, puis testez !** 🚀
































