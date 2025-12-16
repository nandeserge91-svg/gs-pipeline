# 🚀 GUIDE : 2 FEUILLES DU MÊME SHEET → "À APPELER"

**Envoyez les commandes de PLUSIEURS FEUILLES (onglets) du même Google Sheet vers "À appeler" !**

---

## 🎯 VOTRE SITUATION

Vous avez **1 seul Google Sheet** avec **plusieurs feuilles** (onglets) :

```
Google Sheet : "Mes Commandes"
├─ 📄 Feuille 1 : "Bureau11" (Bee Venom)
└─ 📄 Feuille 2 : "Bureau12" (GrandTom)
```

**Objectif** : Toutes les commandes des 2 feuilles arrivent dans "À appeler" ✅

---

## ✅ ÉTAPE 1 : TROUVER LE NOM DE VOTRE 2ÈME FEUILLE (30 sec)

### 1. Ouvrez votre Google Sheet

### 2. Regardez les onglets en bas :

```
┌────────────┬────────────┬─────┐
│ Bureau11   │ Bureau12   │  +  │  ← Onglets
└────────────┴────────────┴─────┘
```

### 3. Notez le nom EXACT de la 2ème feuille

**Exemples** :
- `Bureau12`
- `GrandTom`
- `Feuille 2`
- `Sheet2`

---

## ✅ ÉTAPE 2 : MODIFIER LA CONFIGURATION (1 minute)

### 1. Ouvrez le fichier `SCRIPT_FINAL_GRANDTOM.js`

### 2. Trouvez cette section (lignes 14-17) :

```javascript
// 🆕 NOMS DES FEUILLES À SCANNER
SHEET_NAMES: [
  'Bureau11',      // ← Feuille 1 (Bee Venom)
  'Bureau12'       // ← Feuille 2 (GrandTom) - MODIFIEZ le nom si différent
],
```

### 3. **Remplacez** `'Bureau12'` par le nom exact de votre 2ème feuille

**Exemple 1** : Si votre 2ème feuille s'appelle "GrandTom"

```javascript
SHEET_NAMES: [
  'Bureau11',
  'GrandTom'   // ← MODIFIÉ
],
```

**Exemple 2** : Si votre 2ème feuille s'appelle "Sheet2"

```javascript
SHEET_NAMES: [
  'Bureau11',
  'Sheet2'     // ← MODIFIÉ
],
```

### 4. **Enregistrez** le fichier (Ctrl+S)

---

## ✅ ÉTAPE 3 : COPIER LE SCRIPT (1 minute)

### Dans Google Apps Script :

1. **Ouvrez** votre Google Sheet
2. **Menu** : Extensions → Apps Script
3. **Supprimez** tout le code actuel (Ctrl+A puis Delete)
4. **Ouvrez** `SCRIPT_FINAL_GRANDTOM.js` (dans Notepad)
5. **Copiez TOUT** (Ctrl+A puis Ctrl+C)
6. **Collez** dans Google Apps Script (Ctrl+V)
7. **Enregistrez** (💾 ou Ctrl+S)

---

## ✅ ÉTAPE 4 : SCANNER LES 2 FEUILLES (30 sec)

### Dans Google Apps Script :

1. **Rafraîchissez** la page (F5)
2. **Menu déroulant** (en haut) → Sélectionnez : **`scannerToutesLesFeuilles`** ✅
3. **Cliquez** sur ▶️ **Exécuter**
4. Si première fois : **Autorisez** le script
5. **Affichage** → **Journaux d'exécution**

---

## 📊 LOGS ATTENDUS

```
🔍 SCAN DE TOUTES LES FEUILLES
═══════════════════════════════════════════════
📂 Google Sheet ID : 1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc

1️⃣  Scanner feuille : "Bureau11"

   📊 5 ligne(s) trouvée(s)

   📞 Ligne 2 : Client Bee - 22507001122
      📦 Tag reçu : "2_Bee"
      📦 Code produit mappé : "BEE"
      ✅ Commande créée dans GS Pipeline avec succès !
      ✅ Envoyé

   (... autres lignes ...)
   
   ✅ Feuille "Bureau11" traitée

2️⃣  Scanner feuille : "Bureau12"

   📊 3 ligne(s) trouvée(s)

   📞 Ligne 2 : Client GrandTom - 22507112233
      📦 Tag reçu : "GrandTom"
      📦 Code produit mappé : "GRANDTOM"
      ✅ Commande créée dans GS Pipeline avec succès !
      ✅ Envoyé

   (... autres lignes ...)
   
   ✅ Feuille "Bureau12" traitée

═══════════════════════════════════════════════
📊 RÉSUMÉ FINAL :
   • Feuilles scannées : 2
   • Commandes trouvées : 8
   • Commandes envoyées : 8

✅ SCAN TERMINÉ !
👉 Vérifiez sur : https://afgestion.net/admin/to-call
```

---

## ✅ VÉRIFICATION

Allez sur : **https://afgestion.net/admin/to-call**

Vous devriez voir :
- ✅ **Commandes de la feuille "Bureau11"** (Bee Venom)
- ✅ **Commandes de la feuille "Bureau12"** (GrandTom)
- ✅ **Toutes avec produits liés**

---

## 🔄 AUTOMATISATION (optionnel)

Pour scanner automatiquement toutes les heures :

1. **Google Apps Script** → **Déclencheurs** (⏰ icône en bas à gauche)
2. **+ Ajouter un déclencheur**
3. **Fonction** : `scannerToutesLesFeuilles`
4. **Type d'événement** : "Événement temporel"
5. **Type de déclencheur** : "Toutes les heures"
6. **Enregistrer** ✅

**Résultat** : Vos 2 feuilles seront scannées automatiquement ! 🔄

---

## 📝 AJOUTER UNE 3ÈME FEUILLE

Si vous avez une 3ème feuille, modifiez `SHEET_NAMES` :

```javascript
SHEET_NAMES: [
  'Bureau11',
  'Bureau12',
  'Bureau13'   // ← Ajoutez ici
],
```

**Enregistrez et relancez `scannerToutesLesFeuilles()`** ✅

---

## 🎯 COMMENT ÇA FONCTIONNE

```
Google Sheet (1 seul fichier)
│
├─ 📄 Feuille "Bureau11"
│  ├─ Ligne 2 : Commande 1 (Bee Venom)
│  ├─ Ligne 3 : Commande 2 (Bee Venom)
│  └─ Ligne 4 : Commande 3 (Bee Venom)
│                    ↓
│              scannerToutesLesFeuilles()
│                    ↓
│              sendToGSPipeline()
│                    ↓
│              GS Pipeline API
│                    ↓
│              "À appeler" ✅
│
└─ 📄 Feuille "Bureau12"
   ├─ Ligne 2 : Commande 4 (GrandTom)
   ├─ Ligne 3 : Commande 5 (GrandTom)
   └─ Ligne 4 : Commande 6 (GrandTom)
                   ↓
             scannerToutesLesFeuilles()
                   ↓
             sendToGSPipeline()
                   ↓
             GS Pipeline API
                   ↓
             "À appeler" ✅
```

---

## 🆘 DÉPANNAGE

### ❌ "Feuille non trouvée : Bureau12"

**Cause** : Le nom de la feuille ne correspond pas

**Solution** :
1. Vérifiez le nom EXACT de l'onglet (majuscules/minuscules)
2. Modifiez `SHEET_NAMES` dans le script
3. Enregistrez et relancez

### ❌ "Aucune donnée dans cette feuille"

**Cause** : La feuille est vide ou n'a qu'une ligne d'en-tête

**Solution** :
1. Vérifiez que la feuille contient des commandes
2. Vérifiez que la ligne 1 est l'en-tête
3. Vérifiez que les données commencent ligne 2

### ❌ "scannerToutesLesFeuilles() pas visible"

**Cause** : Script pas enregistré ou pas rafraîchi

**Solution** :
1. Enregistrez le script (💾)
2. Rafraîchissez la page (F5)
3. Attendez 5 secondes

---

## 📋 RÉCAPITULATIF RAPIDE

```
1. Trouver le nom de la 2ème feuille (onglet en bas)
2. Modifier SHEET_NAMES dans le script (ligne 14)
3. Copier le script dans Google Apps Script
4. Exécuter scannerToutesLesFeuilles()
5. Vérifier dans "À appeler" ✅
```

---

## 📊 STRUCTURE DES FEUILLES

Chaque feuille doit avoir la même structure :

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| **Tag/Offre** | | **Ville** | **Téléphone** | | | **Nom** | | | **Timestamp** |
| 2_Bee | | Abidjan | 22507001122 | | | Jean Dupont | | | 2025-12-12 |
| GrandTom | | Cocody | 22507112233 | | | Marie Kouassi | | | 2025-12-12 |

**Les 3 colonnes importantes** :
- **Colonne A** : Tag/Offre du produit
- **Colonne D** : Téléphone (obligatoire)
- **Colonne G** : Nom du client

---

## 🎊 RÉSULTAT

Une fois configuré :

✅ **Scanner manuellement** : `scannerToutesLesFeuilles()`  
✅ **Scanner automatiquement** : Déclencheur horaire  
✅ **2+ feuilles du même Sheet** : Supportées  
✅ **Toutes les commandes** : Dans "À appeler"  
✅ **Produits liés** : Automatiquement  
✅ **Stock géré** : Automatiquement  

**Votre système multi-feuilles est prêt !** 🚀

---

## 📞 FONCTIONS DISPONIBLES

| Fonction | Description |
|----------|-------------|
| `scannerToutesLesFeuilles()` | Scanner toutes les feuilles ✅ |
| `testGrandTom()` | Tester GrandTom |
| `testBeeVenom()` | Tester Bee Venom |
| `afficherConfig()` | Voir la configuration |
| `setup()` | Initialiser une feuille |

---

**Temps total** : 3 minutes  
**Difficulté** : ⭐ Facile  
**Fichier** : `SCRIPT_FINAL_GRANDTOM.js` (modifié)









