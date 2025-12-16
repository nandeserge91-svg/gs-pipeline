# 🚀 GUIDE : MULTIPLE GOOGLE SHEETS → "À APPELER"

**Envoyez les commandes de PLUSIEURS Google Sheets vers "À appeler" !**

---

## 🎯 OBJECTIF

Vous avez **plusieurs Google Sheets** (ex: un pour Bee Venom, un pour GrandTom) et vous voulez que **toutes les commandes** arrivent dans "À appeler" de GS Pipeline.

---

## ✅ ÉTAPE 1 : TROUVER L'ID DE VOTRE 2ÈME SHEET (1 minute)

### 1. Ouvrez votre 2ème Google Sheet

### 2. Regardez l'URL dans la navigateur :

```
https://docs.google.com/spreadsheets/d/XXXXX_ICI_C'EST_L'ID_XXXXX/edit
                                        ↑
                                   COPIEZ CETTE PARTIE
```

### Exemple :

```
https://docs.google.com/spreadsheets/d/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T1u2V/edit
                                        └──────────────────────────────────────────┘
                                                   C'EST L'ID DU SHEET
```

### 3. **Copiez cet ID** quelque part (Notepad)

---

## ✅ ÉTAPE 2 : CONFIGURER LE SCRIPT (2 minutes)

### 1. Ouvrez le fichier `SCRIPT_MULTI_SHEETS.js`

### 2. Trouvez cette section (lignes 11-29) :

```javascript
const SHEETS_CONFIG = [
  // 📝 SHEET 1 : Bureau11 (votre Sheet actuel)
  {
    SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet Bee Venom'
  },
  
  // 🆕 SHEET 2 : Votre deuxième Sheet
  {
    SPREADSHEET_ID: 'COLLEZ_ICI_ID_DU_2EME_SHEET',  // ← À MODIFIER
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet GrandTom'
  },
];
```

### 3. **Remplacez** `'COLLEZ_ICI_ID_DU_2EME_SHEET'` par l'ID copié

**Exemple** :

```javascript
const SHEETS_CONFIG = [
  // Sheet 1
  {
    SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet Bee Venom'
  },
  
  // Sheet 2 (MODIFIÉ ✅)
  {
    SPREADSHEET_ID: '1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T1u2V',  // ← Votre ID
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet GrandTom'
  },
];
```

### 4. **Vérifiez le nom de la feuille**

Si votre 2ème Sheet n'a pas de feuille "Bureau11", changez `SHEET_NAME` :

```javascript
SHEET_NAME: 'Feuille 1',  // ou le nom exact de votre feuille
```

---

## ✅ ÉTAPE 3 : INSTALLER LE SCRIPT (2 minutes)

### Pour le Sheet 1 (Bureau11) :

1. **Ouvrez** votre Google Sheet 1
2. **Menu** : Extensions → Apps Script
3. **Supprimez** tout le code actuel
4. **Copiez** tout `SCRIPT_MULTI_SHEETS.js`
5. **Collez** dans Google Apps Script
6. **Enregistrez** (💾)

### Pour le Sheet 2 (GrandTom) :

1. **Ouvrez** votre Google Sheet 2
2. **Menu** : Extensions → Apps Script
3. **Supprimez** tout le code actuel
4. **Copiez** tout `SCRIPT_MULTI_SHEETS.js` (le même)
5. **Collez** dans Google Apps Script
6. **Enregistrez** (💾)

**Important** : Le même script va dans les deux Sheets ! ✅

---

## ✅ ÉTAPE 4 : SCANNER LES COMMANDES (1 minute)

### Dans l'un des deux Google Apps Script :

1. **Rafraîchissez** la page (F5)
2. **Menu déroulant** → Sélectionnez : **`scannerTousLesSheets`** ✅
3. **Cliquez** sur ▶️ **Exécuter**
4. Si première fois : **Autorisez** le script
5. **Affichage** → **Journaux d'exécution**

---

## 📊 LOGS ATTENDUS

```
🔍 SCAN DE TOUS LES SHEETS

═══════════════════════════════════════════════

1️⃣  Scanner : Sheet Bee Venom
   📂 Sheet ID : 1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc
   📄 Feuille : Bureau11

   📊 5 ligne(s) trouvée(s)

   📦 Tag reçu : "2_Bee"
   📦 Code produit mappé : "BEE"
   ✅ Commande créée dans GS Pipeline avec succès !
   
   (... autres commandes ...)
   
   ✅ Sheet traité

2️⃣  Scanner : Sheet GrandTom
   📂 Sheet ID : 1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T1u2V
   📄 Feuille : Bureau11

   📊 3 ligne(s) trouvée(s)

   📦 Tag reçu : "GrandTom"
   📦 Code produit mappé : "GRANDTOM"
   ✅ Commande créée dans GS Pipeline avec succès !
   
   (... autres commandes ...)
   
   ✅ Sheet traité

═══════════════════════════════════════════════
📊 RÉSUMÉ FINAL :
   • Sheets scannés : 2
   • Commandes trouvées : 8
   • Commandes envoyées : 8

✅ SCAN TERMINÉ !
```

---

## ✅ VÉRIFICATION

Allez sur : **https://afgestion.net/admin/to-call**

Vous devriez voir **toutes les commandes** :
- ✅ Commandes du Sheet 1 (Bee Venom)
- ✅ Commandes du Sheet 2 (GrandTom)
- ✅ Toutes avec produits liés

---

## 🔄 AUTOMATISATION (OPTIONNEL)

### Pour scanner automatiquement toutes les heures :

1. Dans Google Apps Script
2. **Menu** : Déclencheurs (⏰ en bas à gauche)
3. **Cliquez** : "+ Ajouter un déclencheur"
4. **Fonction** : `scannerTousLesSheets`
5. **Type d'événement** : "Événement temporel"
6. **Type de déclencheur** : "Toutes les heures"
7. **Enregistrer**

**Résultat** : Le script scannera automatiquement vos deux Sheets toutes les heures ! ✅

---

## 🎯 COMMENT ÇA FONCTIONNE

```
┌────────────────────────┐
│  Google Sheet 1        │
│  (Bee Venom)           │
│  - Commande 1          │
│  - Commande 2          │
└──────────┬─────────────┘
           │
           │  scannerTousLesSheets()
           │
           ↓
┌────────────────────────┐
│  Script                │
│  lit les 2 Sheets      │
└──────────┬─────────────┘
           │
           │  sendToGSPipeline()
           │
           ↓
┌────────────────────────┐
│  GS Pipeline API       │
│  Crée les commandes    │
└──────────┬─────────────┘
           │
           ↓
┌────────────────────────┐
│  "À appeler"           │
│  ✅ Commandes Sheet 1  │
│  ✅ Commandes Sheet 2  │
└────────────────────────┘

┌────────────────────────┐
│  Google Sheet 2        │
│  (GrandTom)            │
│  - Commande 3          │
│  - Commande 4          │
└────────────────────────┘
```

---

## 📝 AJOUTER UN 3ÈME SHEET

### Si vous avez un 3ème Sheet :

1. **Ouvrez** `SCRIPT_MULTI_SHEETS.js`
2. **Trouvez** cette section (ligne 25)
3. **Décommentez** et modifiez :

```javascript
const SHEETS_CONFIG = [
  // Sheet 1
  { ... },
  
  // Sheet 2
  { ... },
  
  // 🆕 SHEET 3
  {
    SPREADSHEET_ID: 'ID_DU_3EME_SHEET',
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet Autre Produit'
  },
];
```

**Enregistrez et relancez `scannerTousLesSheets()`** ✅

---

## 🆘 DÉPANNAGE

### ❌ "Feuille non trouvée"

**Cause** : Le nom de la feuille ne correspond pas

**Solution** :
1. Vérifiez le nom exact de l'onglet dans le Sheet
2. Modifiez `SHEET_NAME` dans la config

### ❌ "Permission refusée"

**Cause** : Le script n'a pas accès au 2ème Sheet

**Solution** :
1. Exécutez `scannerTousLesSheets()`
2. Autorisez le script quand demandé
3. Relancez

### ❌ "ID invalide"

**Cause** : L'ID du Sheet 2 est incorrect

**Solution** :
1. Vérifiez que vous avez copié tout l'ID
2. Pas d'espaces avant/après
3. Entre guillemets simples `'...'`

---

## 📋 RÉCAPITULATIF

```
1️⃣  Trouver l'ID du 2ème Sheet
    (dans l'URL)
    
2️⃣  Modifier SHEETS_CONFIG
    Ajouter l'ID du 2ème Sheet
    
3️⃣  Copier le script dans les 2 Sheets
    Extensions → Apps Script
    
4️⃣  Exécuter scannerTousLesSheets()
    Menu déroulant → Exécuter
    
5️⃣  Vérifier dans "À appeler"
    https://afgestion.net/admin/to-call
    
✅ AUTOMATISER (optionnel)
    Déclencheur toutes les heures
```

---

## 🎊 RÉSULTAT

Une fois configuré :

✅ **Scanner manuellement** : `scannerTousLesSheets()`  
✅ **Scanner automatiquement** : Déclencheur horaire  
✅ **2+ Google Sheets** : Supportés  
✅ **Toutes les commandes** : Dans "À appeler"  
✅ **Produits liés** : Automatiquement  
✅ **Stock géré** : Automatiquement  

**Votre système multi-sheets est prêt !** 🚀

---

## 📞 FONCTIONS DISPONIBLES

| Fonction | Description |
|----------|-------------|
| `scannerTousLesSheets()` | Scanner tous les Sheets et envoyer |
| `testGrandTom()` | Tester GrandTom |
| `afficherConfig()` | Voir la configuration |
| `setupTousLesSheets()` | Initialiser tous les Sheets |

---

**Temps total** : 5 minutes  
**Difficulté** : ⭐⭐ Moyen  
**Fichier** : `SCRIPT_MULTI_SHEETS.js`









