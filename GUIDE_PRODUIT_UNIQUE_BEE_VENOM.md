# 🐝 GUIDE : UN SEUL PRODUIT BEE VENOM AVEC QUANTITÉS

**Concept** : Au lieu de créer 3 produits différents, on crée **UN SEUL produit** "Bee Venom" et on gère les quantités (1, 2 ou 3) dans les commandes.

---

## 🎯 PRINCIPE

```
❌ ANCIENNE MÉTHODE (3 produits) :
   - Produit "Bee Venom 1 boîte" (code: 1_Bee)
   - Produit "Bee Venom 2 boîtes" (code: 2_Bee)  
   - Produit "Bee Venom 3 boîtes" (code: 3_Bee)

✅ NOUVELLE MÉTHODE (1 produit) :
   - Produit "Bee Venom" (code: BEE)
   - Quantité variable : 1, 2 ou 3
```

---

## 📦 ÉTAPE 1 : CRÉER LE PRODUIT UNIQUE

### Allez sur : https://afgestion.net/admin/products

Cliquez sur **"+ Ajouter un produit"** et remplissez :

| Champ | Valeur |
|-------|--------|
| **Code (product_key)** | `BEE` |
| **Nom** | `Bee Venom` |
| **Description** | `Crème Bee Venom anti-douleur - Vendue par boîte` |
| **Prix unitaire (XOF)** | `9900` (prix d'1 boîte) |
| **Stock actuel** | `300` (ou votre stock total en boîtes) |
| **Seuil d'alerte** | `20` |

Cliquez **"Enregistrer"** ✅

**⚠️ IMPORTANT** : Le code doit être exactement `BEE` (en majuscules)

---

## 📊 FONCTIONNEMENT

### Quand un client commande :

| Formulaire | Tag | Quantité extraite | Prix calculé |
|------------|-----|-------------------|--------------|
| 1 boîte – 9 900 CFA | `1_Bee` | **1** | 9 900 × 1 = **9 900 FCFA** |
| 2 boîtes – 16 900 CFA | `2_Bee` | **2** | 9 900 × 2 = **19 800 FCFA** ⚠️ |
| 3 boîtes – 23 900 CFA | `3_Bee` | **3** | 9 900 × 3 = **29 700 FCFA** ⚠️ |

### ⚠️ ATTENTION AUX PRIX

Si vous proposez des **prix réduits** pour les packs (16 900 au lieu de 19 800), vous devrez **ajuster manuellement** le prix dans GS Pipeline après réception de la commande.

**Ou mieux** : Créez **3 produits différents** si les prix ne sont pas simplement "prix unitaire × quantité".

---

## 🚀 ÉTAPE 2 : INSTALLER LE SCRIPT

### Ouvrir Google Apps Script

1. Ouvrez votre Google Sheet Bee Venom
2. **Extensions** → **Apps Script**

### Remplacer le script

1. **Sélectionnez TOUT** le code actuel (Ctrl+A)
2. **Supprimez** (Delete)
3. **Ouvrez** le fichier : `SCRIPT_GOOGLE_SHEET_BEE_VENOM_FINAL.js`
4. **Copiez TOUT** le contenu
5. **Collez** dans Google Apps Script
6. **Cliquez** sur 💾 **Enregistrer**

---

## 🧪 ÉTAPE 3 : TESTER

Le script contient **4 fonctions de test** :

### Test 1 : `test1Boite()`
- Commande de 1 boîte
- Quantité extraite : 1

### Test 2 : `test2Boites()`
- Commande de 2 boîtes
- Quantité extraite : 2

### Test 3 : `test3Boites()`
- Commande de 3 boîtes
- Quantité extraite : 3

### Test 4 : `testToutesQuantites()`
- Teste les 3 quantités d'un coup
- Crée 3 commandes

**Comment tester** :

1. Sélectionnez `testToutesQuantites` dans le menu déroulant
2. Cliquez **▶️ Exécuter**
3. Regardez les **logs** (Affichage → Journaux d'exécution)
4. Allez sur https://afgestion.net/admin/to-call
5. Vous devriez voir **3 commandes** :
   - Test 1 Boîte | Quantité: 1
   - Test 2 Boîtes | Quantité: 2
   - Test 3 Boîtes | Quantité: 3

---

## 🔧 CONFIGURATION DU SCRIPT

Le script est configuré automatiquement :

```javascript
const GS_PIPELINE_CONFIG = {
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  PRODUCT_CODE: 'BEE',          // Code du produit unique
  PRODUCT_NAME: 'Bee Venom'     // Nom du produit
};
```

**Rien à changer si vous avez créé le produit avec le code `BEE` !**

---

## 🔢 EXTRACTION DE LA QUANTITÉ

Le script extrait automatiquement la quantité du tag :

```javascript
function extractQuantity(tag) {
  // "1_Bee" → 1
  // "2_Bee" → 2
  // "3_Bee" → 3
  // "1_boite" → 1
  // etc.
}
```

**Tags supportés** :
- `1_Bee`, `2_Bee`, `3_Bee`
- `1_boite`, `2_boites`, `3_boites`
- Ou tout autre format commençant par un chiffre

---

## 📋 EXEMPLE DE LOGS (TEST RÉUSSI)

```
🧪 TEST COMPLET : Toutes les quantités

═══════════════════════════════════════════════

1️⃣  Test 1 boîte...
📦 Extraction quantité du tag "1_Bee" → 1
📤 Envoi vers GS Pipeline : {"nom":"Test 1 Boîte","telephone":"...","ville":"Abidjan","offre":"Bee Venom","tag":"BEE","quantite":1}
📡 Status : 200
📡 Réponse : {"success":true,"order_id":456,"order_reference":"CMD-20251212-002"}
✅ Commande créée dans GS Pipeline avec succès !
📋 ID commande : 456
📋 Référence : CMD-20251212-002
✅ OK

2️⃣  Test 2 boîtes...
📦 Extraction quantité du tag "2_Bee" → 2
📤 Envoi vers GS Pipeline : {"nom":"Test 2 Boîtes","telephone":"...","ville":"Cocody","offre":"Bee Venom","tag":"BEE","quantite":2}
📡 Status : 200
✅ OK

3️⃣  Test 3 boîtes...
📦 Extraction quantité du tag "3_Bee" → 3
📤 Envoi vers GS Pipeline : {"nom":"Test 3 Boîtes","telephone":"...","ville":"Yopougon","offre":"Bee Venom","tag":"BEE","quantite":3}
📡 Status : 200
✅ OK

═══════════════════════════════════════════════

🎉 🎉 🎉 TOUS LES TESTS RÉUSSIS ! 🎉 🎉 🎉

👉 Vérifiez dans GS Pipeline → À appeler
👉 Vous devriez voir 3 commandes avec quantités différentes
```

---

## 🔄 FLUX COMPLET

```
┌─────────────────────────────┐
│  Formulaire Bee Venom       │
│  Client choisit :           │
│  - 1 boîte (tag: 1_Bee)     │
│  - 2 boîtes (tag: 2_Bee)    │
│  - 3 boîtes (tag: 3_Bee)    │
└──────────────┬──────────────┘
               ↓
┌──────────────────────────────┐
│  Google Apps Script          │
│  • Enregistre dans Sheet     │
│  • Extrait quantité du tag   │
│  • 1_Bee → quantite: 1       │
│  • 2_Bee → quantite: 2       │
│  • 3_Bee → quantite: 3       │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│  API GS Pipeline             │
│  Payload envoyé :            │
│  {                           │
│    nom: "...",               │
│    telephone: "...",         │
│    ville: "...",             │
│    offre: "Bee Venom",       │
│    tag: "BEE",               │
│    quantite: 2               │
│  }                           │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│  Backend Railway             │
│  • Cherche produit "BEE"     │
│  • Prix = 9900 × quantite    │
│  • Crée commande             │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│  Section "À appeler"         │
│  Commande affichée :         │
│  • Produit : Bee Venom       │
│  • Quantité : 2              │
│  • Prix : 19 800 FCFA        │
└──────────────────────────────┘
```

---

## ⚖️ AVANTAGES vs INCONVÉNIENTS

### ✅ Avantages de la méthode unique

- ✅ **Gestion de stock centralisée** (1 seul produit à suivre)
- ✅ **Plus simple** (moins de produits à créer)
- ✅ **Flexible** (peut gérer n'importe quelle quantité)
- ✅ **Rapports plus clairs** (1 ligne pour Bee Venom)

### ⚠️ Inconvénients

- ⚠️ **Prix calculés** (prix unitaire × quantité)
- ⚠️ **Pas de prix réduits** pour les packs (sauf ajustement manuel)
- ⚠️ **Moins de détails** dans les statistiques par "pack"

---

## 🤔 QUELLE MÉTHODE CHOISIR ?

### Choisissez **1 produit unique** si :

- ✅ Prix = prix unitaire × quantité (9 900 × 2 = 19 800)
- ✅ Pas de remise sur les packs
- ✅ Vous voulez simplifier la gestion

### Choisissez **3 produits différents** si :

- ✅ Prix réduits sur les packs (16 900 au lieu de 19 800)
- ✅ Vous voulez des stats détaillées par pack
- ✅ Vous proposez des promotions spécifiques

---

## 📊 DANS GS PIPELINE

Avec la méthode unique, les commandes s'afficheront comme :

```
┌─────────────────────────────────────────────┐
│ À APPELER                                   │
├─────────────────────────────────────────────┤
│ 🆕 Awa Kouadio                              │
│    📦 Bee Venom (Quantité: 2)               │
│    💰 19 800 FCFA                           │
│    📍 Abidjan                               │
│    📞 22507 00 00 00 00                     │
└─────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST

- [ ] Créer le produit "Bee Venom" (code: BEE, prix: 9900)
- [ ] Remplacer le script Google Apps Script
- [ ] Sauvegarder le script
- [ ] Exécuter `afficherConfig()` pour vérifier
- [ ] Exécuter `testToutesQuantites()` pour tester
- [ ] Vérifier les logs (3 tests OK ?)
- [ ] Vérifier dans "À appeler" (3 commandes ?)
- [ ] Tester avec une vraie commande
- [ ] ✅ TOUT FONCTIONNE !

---

## 🆘 DÉPANNAGE

### Erreur : "Produit introuvable"

**Cause** : Le produit avec le code `BEE` n'existe pas

**Solution** : Créez le produit avec exactement le code `BEE` (majuscules)

### Les quantités sont toujours 1

**Cause** : Le tag ne contient pas de chiffre

**Solution** : Vérifiez que le formulaire envoie bien `1_Bee`, `2_Bee`, `3_Bee`

### Les prix ne correspondent pas

**Cause** : Prix calculé = prix unitaire × quantité

**Solution** : 
- Soit ajustez le prix unitaire du produit
- Soit modifiez manuellement les commandes
- Soit créez 3 produits différents avec leurs propres prix

---

## 🎊 RÉSULTAT

Avec cette méthode, toutes vos commandes Bee Venom apparaîtront automatiquement dans "À appeler" avec **la bonne quantité** ! 🚀

---

**Fichier** : `SCRIPT_GOOGLE_SHEET_BEE_VENOM_FINAL.js`  
**Webhook** : ✅ Modifié et déployé sur Railway  
**Temps d'installation** : 5 minutes

































