/****************************************************
 *   GOOGLE APPS SCRIPT – RÉCEPTION FORMULAIRE BEE VENOM
 *   ENVOI VERS GS PIPELINE
 *   
 *   Spécifications :
 *   - Colonne A = tag (si existe) sinon offre
 *   - Colonne C = ville
 *   - Colonne D = téléphone
 *   - Colonne G = nom
 *   - Colonne J = timestamp
 ****************************************************/

// ID de ton Google Sheet
const SPREADSHEET_ID = '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc';

// Nom de la feuille cible pour le formulaire
const TARGET_SHEET_NAME = 'Bureau11';

// 🔔 URL du webhook GS PIPELINE (NOUVEAU)
const GS_PIPELINE_WEBHOOK_URL = 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet';

// 🔔 URL du webhook Make (ANCIEN - optionnel, garder si vous voulez)
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/e7ofme4aweln95i61e70mwsp02m1v6lj';

/****************************************************
 *               REÇU VIA WEB APP (FORMULAIRE)
 ****************************************************/
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(TARGET_SHEET_NAME);

    // Si la feuille n'existe pas → on la crée
    if (!sheet) {
      sheet = ss.insertSheet(TARGET_SHEET_NAME);
    }

    // Si aucune ligne → on crée les en-têtes
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Tag / Offre', // A
        '',            // B
        'Ville',       // C
        'Téléphone',   // D
        '',            // E
        '',            // F
        'Nom',         // G
        '',            // H
        '',            // I
        'Timestamp'    // J
      ]);
    }

    // Sécurité : si aucun paramètre
    const params = e && e.parameter ? e.parameter : {};

    const nom       = (params.nom       || "").trim();
    const telephone = (params.telephone || "").trim();
    const ville     = (params.ville     || "").trim();
    const offre     = (params.offre     || "").trim();
    const tag       = (params.tag       || "").trim();   // TAG reçu du popup

    // Ne rien enregistrer si tout est vide
    if (!nom && !telephone && !ville && !offre && !tag) {
      return ContentService
        .createTextOutput("IGNORED_EMPTY")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Ne rien enregistrer si pas de téléphone
    if (!telephone) {
      return ContentService
        .createTextOutput("IGNORED_NO_PHONE")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Colonne A = priorité au TAG
    const colA = tag || offre;

    // Ligne finale dans le Google Sheet
    const row = [
      colA,          // A
      '',            // B
      ville,         // C
      telephone,     // D
      '',            // E
      '',            // F
      nom,           // G
      '',            // H
      '',            // I
      new Date()     // J
    ];

    sheet.appendRow(row);

    // 🚀 NOUVEAU : Envoyer à GS Pipeline
    envoyerVersGSPipeline({
      nom: nom,
      telephone: telephone,
      ville: ville,
      offre: colA, // Tag ou offre
      tag: tag
    });

    return ContentService
      .createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService
      .createTextOutput("ERROR: " + err)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

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

    const response = UrlFetchApp.fetch(GS_PIPELINE_WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    console.log('✅ Réponse GS Pipeline code :', responseCode);
    console.log('✅ Réponse GS Pipeline body :', responseBody);

    if (responseCode === 200 || responseCode === 201) {
      console.log('🎉 Commande ajoutée dans GS Pipeline avec succès !');
    } else {
      console.warn('⚠️  Réponse non-200 de GS Pipeline :', responseCode);
    }

  } catch (err) {
    console.error('❌ Erreur envoi vers GS Pipeline :', err);
    // Ne pas bloquer l'enregistrement dans le Sheet même si l'envoi échoue
  }
}

/****************************************************
 *   SETUP MANUEL SI NÉCESSAIRE (exécuter 1 seule fois)
 ****************************************************/
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(TARGET_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(TARGET_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Tag / Offre', // A
      '',            // B
      'Ville',       // C
      'Téléphone',   // D
      '',            // E
      '',            // F
      'Nom',         // G
      '',            // H
      '',            // I
      'Timestamp'    // J
    ]);
  }
}

/****************************************************
 *   ONEDIT : ENVOI À MAKE SI COLONNE E = "ANNULER"
 *   → sur n'importe quelle feuille du fichier
 ****************************************************/
function onEdit(e) {
  try {
    // 🛡 Sécurité : si onEdit est exécuté manuellement (e = undefined)
    if (!e || !e.range) {
      console.log('onEdit appelé sans événement valide (exécution manuelle ?)');
      return;
    }

    const range = e.range;
    const sheet = range.getSheet();

    // Log de debug
    console.log(
      'onEdit déclenché → feuille:',
      sheet.getName(),
      'ligne:',
      range.getRow(),
      'colonne:',
      range.getColumn(),
      'valeur:',
      e.value
    );

    // 1️⃣ Vérifier que la colonne modifiée est E (5)
    if (range.getColumn() !== 5) {
      console.log('❌ Colonne ignorée :', range.getColumn());
      return;
    }

    // 2️⃣ Récupérer la nouvelle valeur
    const newValueRaw = e.value;
    if (!newValueRaw) {
      console.log('❌ Aucune valeur (newValue vide)');
      return;
    }

    // On nettoie la valeur : trim + majuscules
    const newValue = newValueRaw.toString().trim().toUpperCase();

    // 3️⃣ Ne déclencher que si la valeur correspond à "ANNULER"
    if (newValue !== 'ANNULER') {
      console.log('❌ Valeur différente de ANNULER :', newValue);
      return;
    }

    console.log('✅ Condition ANNULER remplie, préparation de l\'envoi à Make…');

    // 4️⃣ Ligne concernée
    const row = range.getRow();

    // 5️⃣ Récupérer colonnes A, D et G de la même feuille
    const valeurA = sheet.getRange(row, 1).getValue(); // Colonne A
    const valeurD = sheet.getRange(row, 4).getValue(); // Colonne D
    const valeurG = sheet.getRange(row, 7).getValue(); // Colonne G

    // 6️⃣ Préparation du payload pour Make
    const payload = {
      feuille: sheet.getName(),
      ligne: row,
      statut: newValue,       // "ANNULER"
      colonne_A: valeurA,     // Tag / Offre
      colonne_D: valeurD,     // Téléphone
      colonne_G: valeurG      // Nom
    };

    console.log('📦 Payload envoyé à Make :', JSON.stringify(payload));

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(MAKE_WEBHOOK_URL, options);

    console.log('✅ Réponse Make code :', response.getResponseCode());
    console.log('✅ Réponse Make body :', response.getContentText());

  } catch (err) {
    console.error('❌ Erreur onEdit ANNULER → ', err);
  }
}

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

  const response = UrlFetchApp.fetch(GS_PIPELINE_WEBHOOK_URL, options);
  console.log('Code réponse GS Pipeline :', response.getResponseCode());
  console.log('Contenu réponse GS Pipeline :', response.getContentText());
}

/****************************************************
 *   TEST MANUEL : ENVOI DE TEST VERS MAKE
 ****************************************************/
function testEnvoiVersMake() {
  const payload = {
    test: true,
    message: 'Hello depuis Google Apps Script',
    date: new Date().toISOString()
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(MAKE_WEBHOOK_URL, options);
  console.log('Code réponse Make :', response.getResponseCode());
  console.log('Contenu réponse Make :', response.getContentText());
}



















