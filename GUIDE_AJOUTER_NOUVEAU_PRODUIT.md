# ➕ GUIDE : AJOUTER UN NOUVEAU PRODUIT

**Guide ultra-simple pour ajouter n'importe quel produit à votre script Google Apps Script**

---

## 🎯 PARTIE À MODIFIER

### Cherchez cette section dans votre script :

```javascript
const CONFIG = {
  SPREADSHEET_ID: '...',
  SHEET_NAME: '...',
  API_URL: '...',
  
  PRODUCT_MAPPING: {
    // ⬇️⬇️⬇️ MODIFIEZ ICI ⬇️⬇️⬇️
    '1_Bee': 'BEE',
    '2_Bee': 'BEE',
    'Buttock': 'BUTTOCK',
    // 👉 AJOUTEZ VOS LIGNES ICI
  },
  
  PRODUCT_NAMES: {
    // ⬇️⬇️⬇️ MODIFIEZ ICI ⬇️⬇️⬇️
    'BEE': 'Bee Venom',
    'BUTTOCK': 'Buttock',
    // 👉 AJOUTEZ VOS LIGNES ICI
  }
};
```

---

## ✅ ÉTAPE 1 : AJOUTER LE MAPPING

### Dans la section `PRODUCT_MAPPING`

**Format** :
```javascript
'tag_formulaire': 'CODE_PRODUIT_GS_PIPELINE',
```

### Exemple pour un nouveau produit "Gaine Tourmaline"

**AVANT** :
```javascript
PRODUCT_MAPPING: {
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  'Buttock': 'BUTTOCK',
},
```

**APRÈS** (ajoutez vos lignes) :
```javascript
PRODUCT_MAPPING: {
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  'Buttock': 'BUTTOCK',
  
  // 🆕 Nouveau produit : Gaine Tourmaline
  'gaine tourmaline': 'GAINE_TOURMALINE',
  'Gaine Tourmaline': 'GAINE_TOURMALINE',
  'gaine': 'GAINE_TOURMALINE',
  '1_Gaine': 'GAINE_TOURMALINE',
  '2_Gaine': 'GAINE_TOURMALINE',
},
```

**⚠️ N'OUBLIEZ PAS LA VIRGULE** à la fin de chaque ligne !

---

## ✅ ÉTAPE 2 : AJOUTER LE NOM (OPTIONNEL)

### Dans la section `PRODUCT_NAMES`

**Format** :
```javascript
'CODE_PRODUIT': 'Nom affiché',
```

### Exemple

**AVANT** :
```javascript
PRODUCT_NAMES: {
  'BEE': 'Bee Venom',
  'BUTTOCK': 'Buttock',
}
```

**APRÈS** (ajoutez votre ligne) :
```javascript
PRODUCT_NAMES: {
  'BEE': 'Bee Venom',
  'BUTTOCK': 'Buttock',
  
  // 🆕 Nouveau produit
  'GAINE_TOURMALINE': 'Gaine Tourmaline Minceur',
}
```

---

## 📝 EXEMPLES CONCRETS

### Exemple 1 : Ajouter "Crème Anti-Cerne"

```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Crème Anti-Cerne
  'creme anti cerne': 'CREME_ANTI_CERNE',
  'Creme anti cerne': 'CREME_ANTI_CERNE',
  'creme': 'CREME_ANTI_CERNE',
  '1_Creme': 'CREME_ANTI_CERNE',
  '2_Creme': 'CREME_ANTI_CERNE',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  // 🆕 Crème Anti-Cerne
  'CREME_ANTI_CERNE': 'Crème Anti-Cerne Premium',
}
```

### Exemple 2 : Ajouter "Pack Détox"

```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Pack Détox
  'Pack Détox Minceur': 'PACK_DETOX',
  'pack detox': 'PACK_DETOX',
  'detox': 'PACK_DETOX',
  '1_Detox': 'PACK_DETOX',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  // 🆕 Pack Détox
  'PACK_DETOX': 'Pack Détox Minceur Complet',
}
```

### Exemple 3 : Ajouter "Chaussettes Chauffantes"

```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Chaussettes Chauffantes
  'Chaussettes chauffantes tourmaline': 'CHAUSSETTE_CHAUFFANTE',
  'chaussettes chauffantes': 'CHAUSSETTE_CHAUFFANTE',
  'chaussettes': 'CHAUSSETTE_CHAUFFANTE',
  '1_Chaussettes': 'CHAUSSETTE_CHAUFFANTE',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  // 🆕 Chaussettes
  'CHAUSSETTE_CHAUFFANTE': 'Chaussettes Chauffantes Tourmaline',
}
```

---

## 🔧 RÈGLES IMPORTANTES

### 1. Code produit (côté droit)

✅ **BON** : `'BUTTOCK'` (majuscules)  
✅ **BON** : `'GAINE_TOURMALINE'` (snake_case)  
❌ **MAUVAIS** : `'buttock'` (minuscules)  
❌ **MAUVAIS** : `'Gaine Tourmaline'` (espaces)  

**Le code doit correspondre EXACTEMENT** au code dans GS Pipeline !

### 2. Tag formulaire (côté gauche)

✅ **BON** : Peut être n'importe quoi  
✅ **BON** : `'Buttock'`, `'buttock'`, `'1_Buttock'`  
✅ **BON** : `'gaine tourmaline'` (avec espaces)  

**Le tag peut avoir n'importe quel format** (c'est ce que votre formulaire envoie).

### 3. Virgules

✅ **BON** :
```javascript
'Buttock': 'BUTTOCK',  // ← virgule ici
'Gaine': 'GAINE',      // ← virgule ici
```

❌ **MAUVAIS** :
```javascript
'Buttock': 'BUTTOCK'   // ← pas de virgule = ERREUR !
'Gaine': 'GAINE',
```

**Chaque ligne doit se terminer par une virgule** (sauf la dernière).

### 4. Guillemets

✅ **BON** : `'Buttock': 'BUTTOCK',` (guillemets simples)  
✅ **BON** : `"Buttock": "BUTTOCK",` (guillemets doubles)  
❌ **MAUVAIS** : `Buttock: BUTTOCK,` (sans guillemets)  

---

## 📋 TEMPLATE À COPIER

Pour ajouter un nouveau produit, **copiez-collez** cette section :

```javascript
// 🆕 [NOM DE VOTRE PRODUIT]
'[tag_formulaire]': '[CODE_PRODUIT]',
'[variante_1]': '[CODE_PRODUIT]',
'[variante_2]': '[CODE_PRODUIT]',
'1_[Produit]': '[CODE_PRODUIT]',
'2_[Produit]': '[CODE_PRODUIT]',
```

**Remplacez** :
- `[NOM DE VOTRE PRODUIT]` → ex: "Gaine Tourmaline"
- `[tag_formulaire]` → ex: "gaine tourmaline"
- `[CODE_PRODUIT]` → ex: "GAINE_TOURMALINE" (celui dans GS Pipeline)
- `[variante_1]` → ex: "gaine"
- `[Produit]` → ex: "Gaine"

---

## 🎯 EXEMPLE COMPLET

### Vous voulez ajouter 3 nouveaux produits

```javascript
const CONFIG = {
  SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
  SHEET_NAME: 'Bureau11',
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  
  PRODUCT_MAPPING: {
    // Bee Venom
    '1_Bee': 'BEE',
    '2_Bee': 'BEE',
    '3_Bee': 'BEE',
    
    // Buttock
    'Buttock': 'BUTTOCK',
    'buttock': 'BUTTOCK',
    '1_Buttock': 'BUTTOCK',
    '2_Buttock': 'BUTTOCK',
    
    // 🆕 NOUVEAU PRODUIT 1 : Gaine Tourmaline
    'gaine tourmaline': 'GAINE_TOURMALINE',
    'Gaine Tourmaline': 'GAINE_TOURMALINE',
    'gaine': 'GAINE_TOURMALINE',
    '1_Gaine': 'GAINE_TOURMALINE',
    '2_Gaine': 'GAINE_TOURMALINE',
    
    // 🆕 NOUVEAU PRODUIT 2 : Crème Anti-Cerne
    'creme anti cerne': 'CREME_ANTI_CERNE',
    'Creme': 'CREME_ANTI_CERNE',
    '1_Creme': 'CREME_ANTI_CERNE',
    
    // 🆕 NOUVEAU PRODUIT 3 : Pack Détox
    'Pack Détox Minceur': 'PACK_DETOX',
    'pack detox': 'PACK_DETOX',
    'detox': 'PACK_DETOX',
  },
  
  PRODUCT_NAMES: {
    'BEE': 'Bee Venom',
    'BUTTOCK': 'Buttock',
    
    // 🆕 NOUVEAUX NOMS
    'GAINE_TOURMALINE': 'Gaine Tourmaline Minceur',
    'CREME_ANTI_CERNE': 'Crème Anti-Cerne Premium',
    'PACK_DETOX': 'Pack Détox Minceur Complet',
  }
};
```

---

## ✅ CHECKLIST POUR AJOUTER UN PRODUIT

### 1. Créer le produit dans GS Pipeline
- [ ] Code : `MON_PRODUIT` (majuscules, underscores)
- [ ] Nom : Le nom que vous voulez
- [ ] Prix : Le prix unitaire
- [ ] Stock : Votre stock

### 2. Ajouter dans PRODUCT_MAPPING
- [ ] Ouvrir le script Google Apps Script
- [ ] Trouver la section `PRODUCT_MAPPING: {`
- [ ] Ajouter vos lignes :
  ```javascript
  'mon produit': 'MON_PRODUIT',
  '1_MonProduit': 'MON_PRODUIT',
  ```

### 3. Ajouter dans PRODUCT_NAMES (optionnel)
- [ ] Trouver la section `PRODUCT_NAMES: {`
- [ ] Ajouter votre ligne :
  ```javascript
  'MON_PRODUIT': 'Mon Beau Produit',
  ```

### 4. Enregistrer et tester
- [ ] Enregistrer (💾)
- [ ] Créer une fonction de test (ou utiliser testBeeVenom)
- [ ] Exécuter
- [ ] Vérifier dans "À appeler"

---

## 🎯 CAS D'USAGE : VOTRE PRODUIT "BUTTOCK"

### Configuration actuelle dans le script :

```javascript
PRODUCT_MAPPING: {
  // ... autres produits ...
  
  // Buttock
  'Buttock': 'BUTTOCK',      // Tag "Buttock" → CODE "BUTTOCK"
  'buttock': 'BUTTOCK',      // Tag "buttock" → CODE "BUTTOCK"
  'BUTTOCK': 'BUTTOCK',      // Tag "BUTTOCK" → CODE "BUTTOCK"
  '1_Buttock': 'BUTTOCK',    // Tag "1_Buttock" → CODE "BUTTOCK", Quantité: 1
  '2_Buttock': 'BUTTOCK',    // Tag "2_Buttock" → CODE "BUTTOCK", Quantité: 2
  '3_Buttock': 'BUTTOCK',    // Tag "3_Buttock" → CODE "BUTTOCK", Quantité: 3
},

PRODUCT_NAMES: {
  // ... autres noms ...
  
  'BUTTOCK': 'Buttock',      // CODE "BUTTOCK" s'affiche "Buttock"
}
```

### Ce que ça permet :

| Tag formulaire | Produit trouvé | Quantité | Résultat |
|----------------|----------------|----------|----------|
| `Buttock` | BUTTOCK | 1 | Commande de 1 Buttock |
| `buttock` | BUTTOCK | 1 | Commande de 1 Buttock |
| `2_Buttock` | BUTTOCK | 2 | Commande de 2 Buttock |
| `3_Buttock` | BUTTOCK | 3 | Commande de 3 Buttock |

---

## 📝 MODÈLE POUR AJOUTER UN NOUVEAU PRODUIT

### Copiez-collez cette section dans PRODUCT_MAPPING :

```javascript
// 🆕 [NOM DU PRODUIT]
'[tag_principal]': '[CODE_PRODUIT]',
'[tag_variante_1]': '[CODE_PRODUIT]',
'[tag_variante_2]': '[CODE_PRODUIT]',
'1_[Tag]': '[CODE_PRODUIT]',
'2_[Tag]': '[CODE_PRODUIT]',
'3_[Tag]': '[CODE_PRODUIT]',
```

### Et cette ligne dans PRODUCT_NAMES :

```javascript
'[CODE_PRODUIT]': '[Nom Affiché]',
```

---

## 💡 EXEMPLES RÉELS

### Exemple 1 : Ajouter "Super Gel"

**Dans GS Pipeline** :
- Code : `SUPER_GEL`

**Dans le script** :
```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Super Gel
  'super gel': 'SUPER_GEL',
  'Super Gel': 'SUPER_GEL',
  'gel': 'SUPER_GEL',
  '1_Gel': 'SUPER_GEL',
  '2_Gel': 'SUPER_GEL',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  'SUPER_GEL': 'Super Gel Miracle',
}
```

### Exemple 2 : Ajouter "Masque Visage"

**Dans GS Pipeline** :
- Code : `MASQUE_VISAGE`

**Dans le script** :
```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Masque Visage
  'masque visage': 'MASQUE_VISAGE',
  'Masque Visage': 'MASQUE_VISAGE',
  'masque': 'MASQUE_VISAGE',
  '1_Masque': 'MASQUE_VISAGE',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  'MASQUE_VISAGE': 'Masque Visage Purifiant',
}
```

### Exemple 3 : Ajouter "Sérum Éclat"

**Dans GS Pipeline** :
- Code : `SERUM_ECLAT`

**Dans le script** :
```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Sérum Éclat
  'serum eclat': 'SERUM_ECLAT',
  'Sérum Éclat': 'SERUM_ECLAT',
  'serum': 'SERUM_ECLAT',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  'SERUM_ECLAT': 'Sérum Éclat Anti-Âge',
}
```

---

## 🚀 PROCESSUS COMPLET

```
1️⃣  Créer produit dans GS Pipeline
    Code : MON_PRODUIT

2️⃣  Ouvrir le script Google Apps Script

3️⃣  Trouver : PRODUCT_MAPPING: {

4️⃣  Ajouter :
    'mon produit': 'MON_PRODUIT',
    '1_MonProduit': 'MON_PRODUIT',

5️⃣  Trouver : PRODUCT_NAMES: {

6️⃣  Ajouter :
    'MON_PRODUIT': 'Mon Beau Produit',

7️⃣  Enregistrer (💾)

8️⃣  Tester avec une fonction de test

9️⃣  Vérifier dans "À appeler" ✅
```

---

## 🎓 RÈGLES DE NOMMAGE

### Pour le CODE_PRODUIT (dans GS Pipeline) :

✅ **Recommandé** :
- MAJUSCULES
- Underscores pour les espaces
- Pas d'accents
- Pas d'espaces

**Exemples** :
- `BUTTOCK` ✅
- `GAINE_TOURMALINE` ✅
- `CREME_ANTI_CERNE` ✅
- `PACK_DETOX` ✅

❌ **À éviter** :
- `Buttock` (minuscules/majuscules mixtes)
- `Gaine Tourmaline` (espaces)
- `crème-anti-cerne` (tirets + accents)

### Pour le tag_formulaire :

✅ **N'importe quel format** :
- `'buttock'` ✅
- `'Buttock'` ✅
- `'gaine tourmaline'` ✅ (avec espaces)
- `'2_Buttock'` ✅ (avec quantité)

---

## ⚠️ ERREURS COURANTES

### Erreur 1 : Oubli de virgule

❌ **MAUVAIS** :
```javascript
'Buttock': 'BUTTOCK'    // ← PAS DE VIRGULE
'Gaine': 'GAINE',
```

✅ **BON** :
```javascript
'Buttock': 'BUTTOCK',   // ← AVEC VIRGULE
'Gaine': 'GAINE',
```

### Erreur 2 : Code différent

❌ **MAUVAIS** :
```javascript
// Dans le script :
'buttock': 'Buttock',  // ← Minuscules

// Dans GS Pipeline :
Code: BUTTOCK  // ← Majuscules
// → PAS DE CORRESPONDANCE !
```

✅ **BON** :
```javascript
// Dans le script :
'buttock': 'BUTTOCK',  // ← Majuscules

// Dans GS Pipeline :
Code: BUTTOCK  // ← Majuscules
// → CORRESPONDANCE ✅
```

### Erreur 3 : Accolades manquantes

❌ **MAUVAIS** :
```javascript
PRODUCT_MAPPING: {
  'Buttock': 'BUTTOCK',
  // ← Oubli de fermer avec }
```

✅ **BON** :
```javascript
PRODUCT_MAPPING: {
  'Buttock': 'BUTTOCK',
},  // ← Accolade fermante + virgule
```

---

## 🎊 RÉSULTAT

Une fois configuré correctement :

✅ **Votre formulaire** envoie un tag (ex: "buttock")  
✅ **Le script mappe** vers le code (ex: BUTTOCK)  
✅ **GS Pipeline trouve** le produit  
✅ **Commande créée** avec produit lié  
✅ **Stock géré** automatiquement  

**C'est tout !** 🚀

---

**Fichier créé** : `SECTION_A_MODIFIER_POUR_NOUVEAU_PRODUIT.js`  
**Contient** : Juste la section à modifier (copier-coller facile)  
**Documentation** : Ce guide complet















































