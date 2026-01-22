# 🚀 GUIDE : SYSTÈME MULTI-PRODUITS GOOGLE SHEET

**Envoyer N'IMPORTE QUEL PRODUIT depuis Google Sheets vers GS Pipeline**

**Date** : 12 décembre 2025  
**Statut** : ✅ SYSTÈME GÉNÉRIQUE CRÉÉ

---

## 🎯 PRINCIPE

Un **seul script** Google Apps Script réutilisable pour **tous vos produits** !

Plus besoin de créer un script différent pour chaque produit. Configurez simplement le **mapping** et c'est parti !

---

## 📋 ÉTAPE 1 : CRÉER VOS PRODUITS DANS GS PIPELINE

Avant tout, créez vos produits sur : https://afgestion.net/admin/products

### Exemples de produits à créer

| Code | Nom | Prix unitaire |
|------|-----|---------------|
| `BEE` | Bee Venom | 9 900 FCFA |
| `GAINE_TOURMALINE` | Gaine Tourmaline | 15 000 FCFA |
| `CREME_ANTI_CERNE` | Crème Anti-Cerne | 8 500 FCFA |
| `PATCH_ANTI_CICATRICE` | Patch Anti-Cicatrice | 12 000 FCFA |
| `PACK_DETOX` | Pack Détox Minceur | 25 000 FCFA |
| `CHAUSSETTE_CHAUFFANTE` | Chaussettes Chauffantes | 18 000 FCFA |

**⚠️ IMPORTANT** : Notez bien les **codes** (colonne 1), vous en aurez besoin pour le mapping !

---

## 📋 ÉTAPE 2 : CONFIGURER LE SCRIPT

### Ouvrir le script

1. Ouvrez votre Google Sheet
2. **Extensions** → **Apps Script**
3. Remplacez tout le code par `SCRIPT_GOOGLE_SHEET_GENERIQUE.js`

### Configurer la section CONFIG

```javascript
const CONFIG = {
  // 1️⃣ ID de votre Google Sheet (dans l'URL)
  SPREADSHEET_ID: 'VOTRE_SHEET_ID_ICI',
  
  // 2️⃣ Nom de la feuille
  SHEET_NAME: 'Bureau11',
  
  // 3️⃣ URL de l'API (ne pas changer)
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  
  // 4️⃣ MAPPING DES PRODUITS ⚠️ À CONFIGURER
  PRODUCT_MAPPING: {
    // Format : 'tag_formulaire' → 'CODE_PRODUIT_GS_PIPELINE'
    
    // Bee Venom
    '1_Bee': 'BEE',
    '2_Bee': 'BEE',
    '3_Bee': 'BEE',
    
    // Gaine Tourmaline
    'gaine tourmaline': 'GAINE_TOURMALINE',
    '1_Gaine': 'GAINE_TOURMALINE',
    '2_Gaine': 'GAINE_TOURMALINE',
    
    // Crème Anti-Cerne
    'creme anti cerne': 'CREME_ANTI_CERNE',
    '1_Creme': 'CREME_ANTI_CERNE',
    
    // Vos autres produits...
  },
  
  // 5️⃣ NOMS LISIBLES (optionnel)
  PRODUCT_NAMES: {
    'BEE': 'Bee Venom',
    'GAINE_TOURMALINE': 'Gaine Tourmaline',
    'CREME_ANTI_CERNE': 'Crème Anti-Cerne',
  }
};
```

---

## 🔧 CONFIGURATION DÉTAILLÉE

### 1. SPREADSHEET_ID

**Où le trouver ?**
- Dans l'URL de votre Google Sheet
- Exemple d'URL : `https://docs.google.com/spreadsheets/d/1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc/edit`
- Le SPREADSHEET_ID est : `1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc`

### 2. SHEET_NAME

**Nom de l'onglet** dans votre Google Sheet (en bas)
- Par défaut : `Bureau11`
- Peut être : `Feuille 1`, `Commandes`, etc.

### 3. PRODUCT_MAPPING

**Le plus important !** Associe les tags du formulaire aux codes produits GS Pipeline.

#### Format

```javascript
'tag_formulaire': 'CODE_PRODUIT_GS_PIPELINE'
```

#### Exemples

```javascript
PRODUCT_MAPPING: {
  // Si votre formulaire envoie "1_Bee", ça correspond au produit "BEE"
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  '3_Bee': 'BEE',
  
  // Si votre formulaire envoie "gaine tourmaline", ça correspond à "GAINE_TOURMALINE"
  'gaine tourmaline': 'GAINE_TOURMALINE',
  'Gaine Tourmaline': 'GAINE_TOURMALINE',  // Insensible à la casse
  
  // Patch anti-cicatrice
  'Patch Anti cicatrice': 'PATCH_ANTI_CICATRICE',
  'patch': 'PATCH_ANTI_CICATRICE',
}
```

#### Quantités variables

Si vos tags contiennent la quantité (ex: `2_Bee`, `3_Gaine`) :
- Le script extrait automatiquement le chiffre
- `2_Bee` → Produit: BEE, Quantité: 2
- `3_Gaine` → Produit: GAINE_TOURMALINE, Quantité: 3

### 4. PRODUCT_NAMES

**Optionnel** : Noms lisibles pour l'affichage.

Si non renseigné, le code produit sera utilisé.

---

## 📝 EXEMPLES DE CONFIGURATION

### Exemple 1 : Un seul produit avec quantités

```javascript
PRODUCT_MAPPING: {
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  '3_Bee': 'BEE',
  '1_boite': 'BEE',
  '2_boites': 'BEE',
  '3_boites': 'BEE',
},

PRODUCT_NAMES: {
  'BEE': 'Bee Venom'
}
```

### Exemple 2 : Plusieurs produits différents

```javascript
PRODUCT_MAPPING: {
  // Bee Venom
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  
  // Gaine
  'gaine tourmaline': 'GAINE_TOURMALINE',
  'Gaine': 'GAINE_TOURMALINE',
  
  // Crème
  'creme anti cerne': 'CREME_ANTI_CERNE',
  'Creme': 'CREME_ANTI_CERNE',
  
  // Patch
  'Patch Anti cicatrice': 'PATCH_ANTI_CICATRICE',
  'patch': 'PATCH_ANTI_CICATRICE',
},

PRODUCT_NAMES: {
  'BEE': 'Bee Venom',
  'GAINE_TOURMALINE': 'Gaine Tourmaline',
  'CREME_ANTI_CERNE': 'Crème Anti-Cerne',
  'PATCH_ANTI_CICATRICE': 'Patch Anti-Cicatrice',
}
```

### Exemple 3 : Produits avec codes simples

```javascript
PRODUCT_MAPPING: {
  'Produit A': 'PROD_A',
  'Produit B': 'PROD_B',
  'Produit C': 'PROD_C',
},

PRODUCT_NAMES: {
  'PROD_A': 'Mon Produit A',
  'PROD_B': 'Mon Produit B',
  'PROD_C': 'Mon Produit C',
}
```

---

## 🧪 ÉTAPE 3 : TESTER

### Tests disponibles

Le script inclut plusieurs fonctions de test :

#### 1. `testBeeVenom()`
Teste le produit Bee Venom

#### 2. `testGaineTourmaline()`
Teste le produit Gaine Tourmaline

#### 3. `testCremeAntiCerne()`
Teste la Crème Anti-Cerne

#### 4. `testTousProduits()`
Teste **tous** les produits configurés

#### 5. `afficherConfig()`
Affiche la configuration actuelle (utile pour vérifier)

### Comment tester

1. **Enregistrez** le script (💾)
2. Sélectionnez une fonction de test (ex: `testBeeVenom`)
3. Cliquez **▶️ Exécuter**
4. Regardez les **logs** (Affichage → Journaux d'exécution)
5. Vérifiez dans **"À appeler"** : https://afgestion.net/admin/to-call

### Logs attendus

```
🧪 TEST : Bee Venom (2 boîtes)

📦 Tag reçu : "2_Bee"
📦 Code produit mappé : "BEE"
📦 Nom produit : "Bee Venom"
📦 Quantité extraite : 2
📤 Envoi vers GS Pipeline : {...}
📡 Status : 200
✅ Commande créée dans GS Pipeline avec succès !
📋 ID commande : 123
📋 Référence : CMD-20251212-XXX

✅ TEST RÉUSSI !
```

---

## 🔄 FLUX COMPLET

```
┌─────────────────────────────┐
│  Formulaire Web             │
│  (n'importe quel produit)   │
└──────────────┬──────────────┘
               ↓
      [Client soumet]
               ↓
┌──────────────────────────────┐
│  Google Apps Script          │
│  (Script générique)          │
└──────┬───────────────────────┘
       ↓
   [Mapping]
       ↓
┌──────────────────────────────┐
│  Tag → Code produit          │
│  "2_Bee" → "BEE"             │
│  "gaine" → "GAINE_TOURMALINE"│
└──────┬───────────────────────┘
       ↓
   [Extraction quantité]
       ↓
┌──────────────────────────────┐
│  "2_Bee" → Quantité: 2       │
│  "3_Gaine" → Quantité: 3     │
└──────┬───────────────────────┘
       ↓
   [Envoi API]
       ↓
┌──────────────────────────────┐
│  Webhook GS Pipeline         │
│  /api/webhook/google-sheet   │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  Backend cherche produit     │
│  par code (BEE, GAINE, etc.) │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  Commande créée avec :       │
│  • Produit lié ✅            │
│  • Quantité correcte ✅      │
│  • Prix calculé ✅           │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  Section "À appeler"         │
│  https://afgestion.net       │
└──────────────────────────────┘
```

---

## 📦 AJOUTER UN NOUVEAU PRODUIT

### Étape 1 : Créer le produit dans GS Pipeline

1. https://afgestion.net/admin/products
2. **"+ Ajouter un produit"**
3. Remplir :
   ```
   Code : NOUVEAU_PRODUIT
   Nom : Nom du Nouveau Produit
   Prix unitaire : 10000
   Stock : 50
   ```

### Étape 2 : Ajouter au mapping

```javascript
PRODUCT_MAPPING: {
  // ... produits existants ...
  
  // 🆕 Nouveau produit
  'nouveau produit': 'NOUVEAU_PRODUIT',
  'NouveauProduit': 'NOUVEAU_PRODUIT',
  '1_Nouveau': 'NOUVEAU_PRODUIT',
},

PRODUCT_NAMES: {
  // ... noms existants ...
  
  'NOUVEAU_PRODUIT': 'Nom du Nouveau Produit',
}
```

### Étape 3 : Tester

Créez une fonction de test :

```javascript
function testNouveauProduit() {
  Logger.log('🧪 TEST : Nouveau Produit\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Nouveau',
    telephone: '22507 99 88 77 66',
    ville: 'Abidjan',
    tag: 'nouveau produit'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
}
```

---

## 🔧 UTILISATION AVEC PLUSIEURS SHEETS

### Option 1 : Un script par Sheet (recommandé)

Créez un script différent pour chaque Google Sheet :
- Sheet 1 (Bee Venom) → Script A avec SPREADSHEET_ID_1
- Sheet 2 (Gaine) → Script B avec SPREADSHEET_ID_2
- Etc.

### Option 2 : Un script pour tous (avancé)

Modifiez la fonction `doPost` pour détecter la source :

```javascript
function doPost(e) {
  // Déterminer quel sheet utiliser selon un paramètre
  const source = e.parameter.source || 'default';
  
  if (source === 'bee') {
    // Logique Bee Venom
  } else if (source === 'gaine') {
    // Logique Gaine
  }
  
  // ...
}
```

---

## 📊 STATISTIQUES PAR PRODUIT

Une fois vos produits configurés, vous pourrez voir dans GS Pipeline :

- 📈 **Nombre de commandes par produit**
- 💰 **Chiffre d'affaires par produit**
- 📦 **Stock restant par produit**
- 🔄 **Mouvements de stock par produit**
- 📊 **Top produits vendus**

---

## ✅ AVANTAGES DU SYSTÈME GÉNÉRIQUE

- ✅ **Un seul script** pour tous vos produits
- ✅ **Facile à maintenir** (un seul endroit à modifier)
- ✅ **Scalable** (ajoutez autant de produits que vous voulez)
- ✅ **Flexible** (mapping personnalisable)
- ✅ **Traçable** (logs détaillés)
- ✅ **Testable** (fonctions de test intégrées)

---

## 🆘 DÉPANNAGE

### Erreur : Produit non trouvé

**Cause** : Le code produit dans le mapping ne correspond à aucun produit dans GS Pipeline

**Solution** :
1. Vérifiez le code dans GS Pipeline (Gestion des Produits)
2. Mettez à jour le mapping avec le bon code
3. Retestez

### Quantité toujours 1

**Cause** : Le tag ne contient pas de chiffre au début

**Solution** :
- Utilisez des tags comme `1_Produit`, `2_Produit`, `3_Produit`
- Ou envoyez explicitement la quantité dans le formulaire

### Commande sans produit lié

**Cause** : Le tag du formulaire n'est pas dans le mapping

**Solution** :
1. Vérifiez les logs : `📦 Tag reçu : "..."`
2. Ajoutez ce tag au mapping
3. Retestez

---

## 🎊 RÉSULTAT

Avec ce système générique, vous pouvez **envoyer n'importe quel produit** depuis **n'importe quel Google Sheet** vers GS Pipeline !

**Configuration** : 5 minutes  
**Ajout d'un nouveau produit** : 2 minutes  
**Maintenance** : Minimale  

---

**Système multi-produits** : ✅ CRÉÉ  
**Documentation** : ✅ COMPLÈTE  
**Prêt à l'emploi** : ✅ OUI

































