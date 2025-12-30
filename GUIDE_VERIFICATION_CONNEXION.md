# 🔍 Guide de Vérification de Connexion

## 📋 Vue d'ensemble

Le script `verifier_connexion.js` permet de vérifier que toutes les connexions de votre système sont opérationnelles :
- ✅ Connexion au Google Sheet
- ✅ Connexion à l'API Railway (GS Pipeline)
- ✅ Test d'envoi de données (optionnel)

---

## 🚀 Installation

### Étape 1 : Copier le script dans Google Apps Script

1. Ouvrez votre Google Sheet : https://docs.google.com/spreadsheets/d/1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc
2. Cliquez sur **Extensions** > **Apps Script**
3. Créez un nouveau fichier : **Fichier** > **Nouveau** > **Fichier de script**
4. Nommez-le `VerifierConnexion`
5. Copiez tout le contenu de `verifier_connexion.js` dans ce fichier
6. Cliquez sur **💾 Enregistrer**

---

## 🎯 Utilisation

### ✅ Vérification complète (recommandé)

Pour vérifier **tous** les éléments :

```javascript
verifierConnexion()
```

**Cette fonction vérifie :**
1. ✅ Accès au Google Sheet
2. ✅ Connexion à l'API Railway
3. ✅ Structure de la feuille (en-têtes)

**Résultat attendu :**
```
🔍 VÉRIFICATION DES CONNEXIONS
═══════════════════════════════════════════════

1️⃣  Vérification Google Sheet...
   📂 ID Sheet : 1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc
   📄 Nom feuille : Bureau11
   ✓ Spreadsheet accessible
   ✓ Feuille "Bureau11" trouvée
   ℹ️  Nombre de lignes : 150
   ✅ Google Sheet OK

2️⃣  Vérification API Railway...
   🌐 URL API : https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet
   📡 Envoi requête de test...
   📡 Status HTTP : 200
   ✓ API accessible (serveur répond)
   ✓ Endpoint webhook fonctionnel
   ✅ API Railway OK

═══════════════════════════════════════════════
🎉 TOUTES LES CONNEXIONS SONT OPÉRATIONNELLES !
═══════════════════════════════════════════════
```

---

### 🌐 Vérifier uniquement l'API Railway

Pour vérifier **seulement** la connexion à l'API :

```javascript
verifierAPISeule()
```

**Plus rapide** si vous voulez uniquement vérifier que le serveur Railway est accessible.

---

### 📊 Vérifier uniquement le Google Sheet

Pour vérifier **seulement** l'accès au Google Sheet :

```javascript
verifierSheetSeul()
```

**Utile** pour s'assurer que les permissions du Sheet sont correctes.

---

### ⚙️ Afficher la configuration

Pour voir les paramètres actuels sans tester :

```javascript
afficherConfiguration()
```

**Affiche :**
- ID du Google Sheet
- Nom de la feuille
- URL de l'API Railway

---

## 🧪 Test d'envoi de commande (optionnel)

> ⚠️ **ATTENTION** : Cette fonction créera une **vraie** commande dans votre base de données !

Si vous voulez tester l'envoi complet d'une commande :

1. Dans `verifier_connexion.js`, **décommentez** les lignes 45-53 :

```javascript
// Avant (commenté)
// Logger.log('3️⃣  Test d\'envoi de commande...');
// const envOK = testerEnvoiCommande();

// Après (décommenté)
Logger.log('3️⃣  Test d\'envoi de commande...');
const envOK = testerEnvoiCommande();
if (envOK) {
  Logger.log('   ✅ Envoi de commande OK');
} else {
  Logger.log('   ❌ Envoi de commande ERREUR');
  toutOK = false;
}
```

2. Enregistrez et exécutez `verifierConnexion()`

**La commande de test créée :**
- Nom : "Test Connexion Script"
- Téléphone : 22507990011223
- Ville : "Abidjan Test"
- Produit : "Bee Venom"
- Notes : "Test de vérification de connexion"

---

## 🔧 Comment exécuter les fonctions

### Méthode 1 : Depuis l'éditeur Apps Script

1. Ouvrez votre script dans Google Apps Script
2. Dans le menu déroulant en haut, sélectionnez la fonction (par ex: `verifierConnexion`)
3. Cliquez sur le bouton **▶️ Exécuter**
4. Consultez les résultats dans **Exécutions** (icône horloge en bas à gauche)

### Méthode 2 : Depuis la console (Logs)

1. Dans Google Apps Script, cliquez sur **Affichage** > **Journaux**
2. Exécutez la fonction
3. Les logs s'affichent en temps réel

---

## ❌ Résolution des problèmes

### Problème : "Google Sheet non accessible"

**Causes possibles :**
- L'ID du spreadsheet est incorrect
- Vous n'avez pas les droits d'accès au sheet
- Le sheet a été supprimé ou déplacé

**Solution :**
1. Vérifiez l'ID dans l'URL de votre Google Sheet :
   ```
   https://docs.google.com/spreadsheets/d/1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc/edit
   ```
   L'ID est la partie entre `/d/` et `/edit`

2. Vérifiez que vous êtes propriétaire ou éditeur du sheet

---

### Problème : "API Railway non accessible"

**Causes possibles :**
- Le serveur Railway est arrêté ou en maintenance
- L'URL de l'API est incorrecte
- Problème de connexion internet
- Le projet Railway a été supprimé

**Solution :**
1. Vérifiez que l'URL est correcte dans `CONFIG.API_URL`
2. Testez l'URL dans votre navigateur : https://gs-pipeline-production.up.railway.app
3. Vérifiez sur Railway que le projet est bien déployé et actif
4. Consultez les logs de Railway pour voir les erreurs

---

### Problème : "Status HTTP 500"

**Cause :**
- Erreur serveur sur Railway
- Base de données inaccessible
- Bug dans le code de l'API

**Solution :**
1. Consultez les logs Railway : https://railway.app
2. Vérifiez que la base de données est bien connectée
3. Redéployez le projet si nécessaire

---

### Problème : "Status HTTP 400 ou 422"

**Cause :**
- Erreur de validation des données
- Format de données incorrect

**Note :** Pour un test de connexion, un status 400/422 peut être **normal** car les données de test peuvent être invalides. L'important est que l'API **réponde**.

---

## 📊 Configuration actuelle

```javascript
const CONFIG = {
  SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
  SHEET_NAME: 'Bureau11',
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet'
};
```

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. ✅ Exécutez `afficherConfiguration()` pour vérifier vos paramètres
2. ✅ Consultez les logs dans Google Apps Script
3. ✅ Vérifiez les logs Railway
4. ✅ Testez chaque composant séparément (`verifierAPISeule()`, `verifierSheetSeul()`)

---

## ✅ Checklist avant production

- [ ] `verifierConnexion()` retourne "TOUTES LES CONNEXIONS SONT OPÉRATIONNELLES"
- [ ] Le Google Sheet contient les en-têtes corrects
- [ ] L'API Railway répond (status 200)
- [ ] Vous avez testé avec une vraie commande (optionnel mais recommandé)
- [ ] Les logs ne montrent aucune erreur

---

## 🎯 Fonctions disponibles

| Fonction | Description | Durée |
|----------|-------------|-------|
| `verifierConnexion()` | ✅ Vérification complète | ~10-15s |
| `verifierAPISeule()` | 🌐 API Railway uniquement | ~5s |
| `verifierSheetSeul()` | 📊 Google Sheet uniquement | ~2s |
| `afficherConfiguration()` | ⚙️ Afficher config | Instantané |
| `testerEnvoiCommande()` | 📤 Test avec vraie commande | ~5s |

---

**✨ Conseil** : Exécutez `verifierConnexion()` régulièrement pour vous assurer que tout fonctionne correctement !
















