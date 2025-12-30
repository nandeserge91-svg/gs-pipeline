# 🐝 GUIDE D'INSTALLATION - SCRIPT ADAPTÉ BEE VENOM

**Méthode** : Envoi direct vers GS Pipeline avec mapping produits  
**Date** : 12 décembre 2025

---

## 🎯 CE QUE FAIT CE SCRIPT

1. ✅ **Reçoit** les données du formulaire Bee Venom
2. ✅ **Enregistre** dans le Google Sheet
3. ✅ **Mappe** l'offre vers le bon product_key (1_Bee, 2_Bee, 3_Bee)
4. ✅ **Envoie** vers GS Pipeline via API
5. ✅ **Crée** la commande dans "À appeler"

---

## 📋 PRÉREQUIS

### ÉTAPE 1 : Créer les 3 produits Bee Venom dans GS Pipeline

**Vous DEVEZ d'abord créer ces produits** : https://afgestion.net/admin/products

| Code (product_key) | Nom | Prix (XOF) | Stock |
|-------------------|-----|------------|-------|
| `1_Bee` | Bee Venom 1 boîte | 9900 | 100 |
| `2_Bee` | Bee Venom 2 boîtes | 16900 | 100 |
| `3_Bee` | Bee Venom 3 boîtes | 23900 | 100 |

**⚠️ IMPORTANT** : Les codes doivent être **exactement** `1_Bee`, `2_Bee`, `3_Bee` (sensible à la casse)

---

## 🚀 INSTALLATION DU SCRIPT

### ÉTAPE 1 : Ouvrir Google Apps Script

1. Ouvrez votre Google Sheet Bee Venom
2. **Extensions** → **Apps Script**
3. Vous verrez votre script actuel

### ÉTAPE 2 : Remplacer le script

1. **Sélectionnez TOUT** le code actuel (Ctrl+A)
2. **Supprimez** (Delete)
3. **Ouvrez** le fichier : `SCRIPT_GOOGLE_SHEET_BEE_VENOM_ADAPTE.js`
4. **Copiez TOUT** le contenu
5. **Collez** dans Google Apps Script
6. **Cliquez** sur 💾 **Enregistrer**

### ÉTAPE 3 : Tester

1. Dans le menu déroulant (en haut), sélectionnez : `testEnvoiVersGSPipeline`
2. Cliquez sur **▶️ Exécuter**
3. Si c'est la première fois, autorisez le script
4. Regardez les **logs** (Affichage → Journaux d'exécution)

### ÉTAPE 4 : Vérifier

1. Allez sur https://afgestion.net/admin/to-call
2. Vous devriez voir : **"Test Client Bee Venom"**
3. Produit : **"Bee Venom 2 boîtes"**
4. Prix : **16 900 FCFA** ✅

---

## 🔧 CONFIGURATION

### URL de l'API

```javascript
API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet'
```

**✅ Déjà configurée, rien à changer !**

### Mapping des produits

```javascript
PRODUCT_MAPPING: {
  '1_boite': '1_Bee',    // Formulaire → GS Pipeline
  '2_boites': '2_Bee',
  '3_boites': '3_Bee',
  '1_Bee': '1_Bee',      // Tag direct
  '2_Bee': '2_Bee',
  '3_Bee': '3_Bee'
}
```

**Ce mapping permet de gérer** :
- Les valeurs du formulaire (`1_boite`, `2_boites`, `3_boites`)
- Les tags directs (`1_Bee`, `2_Bee`, `3_Bee`)

### Noms des produits

```javascript
PRODUCT_NAMES: {
  '1_Bee': 'Bee Venom 1 boîte',
  '2_Bee': 'Bee Venom 2 boîtes',
  '3_Bee': 'Bee Venom 3 boîtes'
}
```

**Ces noms apparaîtront** dans GS Pipeline comme nom de produit.

---

## 🧪 TESTS DISPONIBLES

### Test 1 : `testEnvoiVersGSPipeline()`

**Ce qu'il fait** :
- Envoie une commande test vers GS Pipeline
- N'enregistre PAS dans le Google Sheet
- Permet de tester uniquement l'API

**Données envoyées** :
```
Nom : Test Client Bee Venom
Téléphone : 22507 00 00 00 00
Ville : Abidjan
Offre : 2_boites → 2_Bee
```

**Comment l'exécuter** :
1. Sélectionnez `testEnvoiVersGSPipeline` dans le menu
2. Cliquez **▶️ Exécuter**
3. Vérifiez les logs
4. Vérifiez "À appeler" sur GS Pipeline

### Test 2 : `testComplet()`

**Ce qu'il fait** :
- Simule un envoi complet (Sheet + GS Pipeline)
- Enregistre dans le Google Sheet
- Envoie vers GS Pipeline

**Données envoyées** :
```
Nom : Test Complet Client
Téléphone : 22507 11 22 33 44
Ville : Cocody
Offre : 3_boites → 3_Bee
```

**Comment l'exécuter** :
1. Sélectionnez `testComplet` dans le menu
2. Cliquez **▶️ Exécuter**
3. Vérifiez le Google Sheet → Nouvelle ligne
4. Vérifiez "À appeler" → Nouvelle commande

### Test 3 : `afficherConfig()`

**Ce qu'il fait** :
- Affiche la configuration actuelle
- Utile pour vérifier le mapping

**Comment l'exécuter** :
1. Sélectionnez `afficherConfig` dans le menu
2. Cliquez **▶️ Exécuter**
3. Regardez les logs

---

## 📊 FLUX DE DONNÉES

```
┌─────────────────────────────┐
│  Formulaire Bee Venom       │
│  (Client remplit)           │
└──────────────┬──────────────┘
               ↓
         [Soumission]
               ↓
┌──────────────────────────────┐
│  Google Apps Script          │
│  (doPost)                    │
└──────┬───────────────────────┘
       ↓
   [Enregistrement]
       ↓
┌──────────────────────────────┐
│  Google Sheet                │
│  Ligne ajoutée ✅            │
└──────────────────────────────┘
       ↓
   [Appel API]
       ↓
┌──────────────────────────────┐
│  sendToGSPipeline()          │
│  • Mapping produit           │
│  • Préparation payload       │
│  • Envoi HTTP POST           │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  GS Pipeline API             │
│  /api/webhook/google-sheet   │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  Backend Railway             │
│  • Cherche produit par code  │
│  • Crée commande             │
│  • Statut NOUVELLE           │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  Base de données PostgreSQL  │
│  Commande enregistrée ✅     │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│  Section "À appeler"         │
│  afgestion.net               │
│  Commande visible ✅         │
└──────────────────────────────┘
```

---

## 📋 EXEMPLE DE LOGS (TEST RÉUSSI)

```
🧪 TEST ENVOI VERS GS PIPELINE...

📦 Données de test : {"nom":"Test Client Bee Venom","telephone":"22507 00 00 00 00","ville":"Abidjan","offre":"2_boites","tag":"2_Bee"}

📤 Envoi vers GS Pipeline : {"nom":"Test Client Bee Venom","telephone":"22507 00 00 00 00","ville":"Abidjan","offre":"Bee Venom 2 boîtes","tag":"2_Bee"}

📡 Status : 200

📡 Réponse : {"success":true,"order_id":123,"order_reference":"CMD-20251212-001","message":"Commande ajoutée dans 'À appeler'"}

✅ Commande créée dans GS Pipeline avec succès !
📋 ID commande : 123
📋 Référence : CMD-20251212-001

✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅
👉 Allez vérifier dans GS Pipeline → À appeler
👉 URL : https://afgestion.net/admin/to-call
```

---

## 🔍 CORRESPONDANCE FORMULAIRE → API

| Champ formulaire | Paramètre Script | Champ API | Exemple |
|------------------|-----------------|-----------|---------|
| Nom complet | `nom` | `nom` | "Awa Kouadio" |
| Contact | `telephone` | `telephone` | "22507 00 00 00 00" |
| Ville | `ville` | `ville` | "Abidjan" |
| Offre choisie | `offre` | - | "2_boites" |
| Tag (calculé) | `tag` | `tag` | "2_Bee" |
| - | - | `offre` | "Bee Venom 2 boîtes" |

---

## 🛡️ GESTION DES ERREURS

Le script gère les erreurs de manière robuste :

```javascript
try {
  sendToGSPipeline(...);
} catch (error) {
  Logger.log('⚠️ Erreur sync GS Pipeline (ignorée, Sheet enregistré)');
}
```

**Même si l'envoi vers GS Pipeline échoue** :
- ✅ Le Google Sheet est enregistré
- ✅ Le client n'est pas impacté
- ✅ Vous pouvez réessayer manuellement plus tard

---

## 🆘 DÉPANNAGE

### Erreur : "Produit introuvable"

**Cause** : Les produits n'existent pas dans GS Pipeline

**Solution** :
1. Allez sur https://afgestion.net/admin/products
2. Créez les 3 produits avec les codes **exacts** : `1_Bee`, `2_Bee`, `3_Bee`

### Erreur : "Response code 404"

**Cause** : L'URL de l'API est incorrecte

**Solution** :
1. Vérifiez que Railway est actif
2. Vérifiez l'URL dans le script : `GS_PIPELINE_CONFIG.API_URL`

### Erreur : "Response code 500"

**Cause** : Erreur côté serveur Railway

**Solution** :
1. Vérifiez les logs Railway
2. Vérifiez que la base de données est accessible

### Les commandes n'apparaissent pas

**Solutions** :
1. Vérifiez les logs Google Apps Script
2. Testez avec `testEnvoiVersGSPipeline()`
3. Vérifiez que les produits existent avec le bon code

---

## ✅ CHECKLIST D'INSTALLATION

- [ ] Créer les 3 produits Bee Venom dans GS Pipeline
- [ ] Remplacer le script dans Google Apps Script
- [ ] Sauvegarder le script
- [ ] Exécuter `testEnvoiVersGSPipeline()`
- [ ] Vérifier les logs (succès ?)
- [ ] Vérifier dans "À appeler" (commande apparue ?)
- [ ] Tester avec `testComplet()`
- [ ] Vérifier Google Sheet + GS Pipeline
- [ ] Tester avec une vraie commande du formulaire
- [ ] ✅ TOUT FONCTIONNE !

---

## 🎊 RÉSULTAT FINAL

Une fois installé et testé :

1. **Client** remplit le formulaire Bee Venom
2. **Google Sheet** enregistre la ligne
3. **Script** mappe automatiquement l'offre vers le product_key
4. **API GS Pipeline** reçoit les données
5. **Commande créée** avec le bon produit et le bon prix
6. **Apparaît dans "À appeler"** pour traitement

**Pipeline 100% automatisé !** 🚀

---

**Fichier** : `SCRIPT_GOOGLE_SHEET_BEE_VENOM_ADAPTE.js`  
**À installer dans** : Google Apps Script de votre Sheet Bee Venom  
**Temps d'installation** : 5 minutes  
**Niveau** : ⭐⭐ Moyen (copier-coller)





















