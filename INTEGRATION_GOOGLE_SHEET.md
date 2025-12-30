# 📊 INTÉGRATION GOOGLE SHEET → GS PIPELINE

## 🎯 Objectif

Envoyer automatiquement les commandes de votre Google Sheet (Bee Venom) vers la section **"À appeler"** de votre application GS Pipeline.

---

## ✅ WEBHOOK CRÉÉ

Le webhook est maintenant actif sur :

```
https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet
```

---

## 📋 CONFIGURATION GOOGLE APPS SCRIPT

### ÉTAPE 1 : Ouvrir le script

1. Ouvrez votre Google Sheet
2. **Extensions** → **Apps Script**
3. Vous verrez votre script actuel

---

### ÉTAPE 2 : Modifier le script

Remplacez **TOUTE LA FONCTION `doPost`** par la nouvelle version :

**Cherchez cette partie** (vers la ligne 33) :

```javascript
function doPost(e) {
  try {
    // ... votre code actuel ...
    
    sheet.appendRow(row);

    return ContentService
      .createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);
```

**Remplacez par** :

```javascript
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(TARGET_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(TARGET_SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Tag / Offre', '', 'Ville', 'Téléphone', '', '', 'Nom', '', '', 'Timestamp'
      ]);
    }

    const params = e && e.parameter ? e.parameter : {};
    const nom       = (params.nom       || "").trim();
    const telephone = (params.telephone || "").trim();
    const ville     = (params.ville     || "").trim();
    const offre     = (params.offre     || "").trim();
    const tag       = (params.tag       || "").trim();

    if (!nom && !telephone && !ville && !offre && !tag) {
      return ContentService.createTextOutput("IGNORED_EMPTY").setMimeType(ContentService.MimeType.TEXT);
    }

    if (!telephone) {
      return ContentService.createTextOutput("IGNORED_NO_PHONE").setMimeType(ContentService.MimeType.TEXT);
    }

    const colA = tag || offre;

    const row = [
      colA, '', ville, telephone, '', '', nom, '', '', new Date()
    ];

    sheet.appendRow(row);

    // 🚀 NOUVEAU : Envoyer à GS Pipeline
    envoyerVersGSPipeline({
      nom: nom,
      telephone: telephone,
      ville: ville,
      offre: colA,
      tag: tag
    });

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

---

### ÉTAPE 3 : Ajouter la nouvelle fonction

**À LA FIN DU SCRIPT**, ajoutez cette nouvelle fonction :

```javascript
/****************************************************
 *   🚀 NOUVELLE FONCTION : ENVOI VERS GS PIPELINE
 ****************************************************/
function envoyerVersGSPipeline(data) {
  try {
    const payload = {
      nom: data.nom,
      telephone: data.telephone,
      ville: data.ville,
      offre: data.offre,
      tag: data.tag || null
    };

    console.log('📤 Envoi vers GS Pipeline :', JSON.stringify(payload));

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(
      'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
      options
    );
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    console.log('✅ Réponse GS Pipeline code :', responseCode);
    console.log('✅ Réponse GS Pipeline body :', responseBody);

    if (responseCode === 200 || responseCode === 201) {
      console.log('🎉 Commande ajoutée dans "À appeler" avec succès !');
    } else {
      console.warn('⚠️  Réponse non-200 de GS Pipeline :', responseCode);
    }

  } catch (err) {
    console.error('❌ Erreur envoi vers GS Pipeline :', err);
  }
}
```

---

### ÉTAPE 4 : Ajouter la fonction de test

**À LA FIN DU SCRIPT**, ajoutez aussi :

```javascript
/****************************************************
 *   TEST MANUEL : ENVOI DE TEST VERS GS PIPELINE
 ****************************************************/
function testEnvoiVersGSPipeline() {
  const payload = {
    nom: 'Test Client',
    telephone: '+212600000000',
    ville: 'Casablanca',
    offre: 'Montre Connectée Pro',
    tag: 'test'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(
    'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
    options
  );
  
  console.log('Code réponse :', response.getResponseCode());
  console.log('Contenu réponse :', response.getContentText());
}
```

---

### ÉTAPE 5 : Sauvegarder et tester

1. **Cliquez** sur l'icône **💾 Enregistrer** (en haut)
2. **Exécutez** la fonction de test :
   - Sélectionnez `testEnvoiVersGSPipeline` dans le menu déroulant (en haut)
   - Cliquez sur **▶️ Exécuter**
3. **Vérifiez** les logs (Affichage → Journaux d'exécution)
4. **Vérifiez** dans GS Pipeline → "À appeler" → Une nouvelle commande de test devrait apparaître !

---

## 🔄 FLUX DE DONNÉES

```
Formulaire Bee Venom
        ↓
Google Apps Script (doPost)
        ↓
   ├─→ Google Sheet (sauvegarde) ✓
   └─→ GS Pipeline (webhook) ✓
        ↓
   Base de données Railway
        ↓
   Section "À appeler" (statut NOUVELLE)
```

---

## ✅ RÉSULTAT

Chaque fois qu'un client remplit le formulaire Bee Venom :

1. ✅ Les données sont enregistrées dans votre Google Sheet (comme avant)
2. ✅ **NOUVEAU** : Les données sont automatiquement envoyées à GS Pipeline
3. ✅ La commande apparaît dans la section **"À appeler"**
4. ✅ Vous pouvez la traiter directement dans l'application !

---

## 🧪 TEST

### Test manuel depuis Google Apps Script :

1. Sélectionnez la fonction `testEnvoiVersGSPipeline`
2. Cliquez **Exécuter**
3. Vérifiez les logs
4. Allez dans GS Pipeline → À appeler
5. Vous devriez voir une commande "Test Client" !

### Test réel :

1. Remplissez un formulaire Bee Venom de test
2. Vérifiez le Google Sheet → La ligne est ajoutée ✓
3. Vérifiez GS Pipeline → La commande apparaît dans "À appeler" ✓

---

## 🐛 DÉPANNAGE

### Les commandes n'arrivent pas dans GS Pipeline

**Solution** :
1. Vérifiez les logs Google Apps Script (Affichage → Journaux)
2. Cherchez les messages d'erreur
3. Vérifiez que l'URL webhook est correcte
4. Testez avec `testEnvoiVersGSPipeline()`

### Erreur 400 ou 500

**Solution** :
- Vérifiez que les champs `nom`, `telephone`, `ville` sont bien remplis
- Ce sont des champs obligatoires

### Erreur CORS

**Solution** :
- Les webhooks ne sont pas concernés par CORS
- Si erreur CORS, c'est un autre problème

---

## 📝 FICHIER COMPLET

Le fichier complet est disponible dans : **GOOGLE_SHEET_SCRIPT_NOUVEAU.js**

Vous pouvez copier tout le contenu et le coller dans votre Google Apps Script.

---

## ✅ AVANTAGES

- ✅ Double sauvegarde (Google Sheet + Base de données)
- ✅ Centralisation dans GS Pipeline
- ✅ Suivi complet du pipeline
- ✅ Pas de double saisie
- ✅ Automatisation complète

---

**Une fois configuré, toutes vos commandes Bee Venom apparaîtront automatiquement dans "À appeler" !** 🚀





















