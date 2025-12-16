/****************************************************
 *   GOOGLE APPS SCRIPT – RÉCEPTION FORMULAIRE BEE VENOM
 *   + ENVOI VERS GS PIPELINE
 *   
 *   UN SEUL PRODUIT avec quantités variables (1, 2 ou 3)
 ****************************************************/

// ID de ton Google Sheet
const SPREADSHEET_ID = '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc';

// Nom de la feuille cible pour le formulaire
const TARGET_SHEET_NAME = 'Bureau11';

// ========================================
// 🆕 CONFIGURATION API GS PIPELINE
// ========================================
const GS_PIPELINE_CONFIG = {
  // URL de votre API Railway
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  
  // Code du produit unique dans GS Pipeline
  PRODUCT_CODE: 'BEE',
  
  // Nom du produit
  PRODUCT_NAME: 'Bee Venom'
};

// ========================================
// 🆕 EXTRAIRE LA QUANTITÉ DU TAG
// ========================================
function extractQuantity(tag) {
  // Tag format : "1_Bee", "2_Bee", "3_Bee"
  // ou "1_boite", "2_boites", "3_boites"
  
  if (!tag) return 1;
  
  // Extraire le chiffre au début
  const match = tag.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return 1; // Par défaut
}

// ========================================
// 🆕 ENVOYER LA COMMANDE VERS GS PIPELINE
// ========================================
function sendToGSPipeline(orderData) {
  try {
    // Extraire la quantité du tag
    const quantity = extractQuantity(orderData.tag);
    
    Logger.log('📦 Extraction quantité du tag "' + orderData.tag + '" → ' + quantity);
    
    // Préparer les données pour l'API
    const apiPayload = {
      nom: orderData.nom || 'Client inconnu',
      telephone: orderData.telephone || '',
      ville: orderData.ville || '',
      offre: GS_PIPELINE_CONFIG.PRODUCT_NAME,  // "Bee Venom"
      tag: GS_PIPELINE_CONFIG.PRODUCT_CODE,    // "BEE"
      quantite: quantity                        // 1, 2 ou 3
    };
    
    Logger.log('📤 Envoi vers GS Pipeline : ' + JSON.stringify(apiPayload));
    
    // Options de la requête HTTP
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(apiPayload),
      muteHttpExceptions: true
    };
    
    // Envoyer vers l'API GS Pipeline
    const response = UrlFetchApp.fetch(GS_PIPELINE_CONFIG.API_URL, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('📡 Status : ' + statusCode);
    Logger.log('📡 Réponse : ' + responseText);
    
    if (statusCode === 200 || statusCode === 201) {
      Logger.log('✅ Commande créée dans GS Pipeline avec succès !');
      try {
        const responseData = JSON.parse(responseText);
        Logger.log('📋 ID commande : ' + responseData.order_id);
        Logger.log('📋 Référence : ' + responseData.order_reference);
      } catch (e) {
        // Ignore parsing error
      }
      return true;
    } else {
      Logger.log('⚠️ Erreur HTTP ' + statusCode + ' : ' + responseText);
      return false;
    }
    
  } catch (error) {
    Logger.log('❌ Erreur envoi GS Pipeline : ' + error.toString());
    return false;
  }
}

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

    // 🚀 ENVOYER VERS GS PIPELINE
    try {
      sendToGSPipeline({
        nom: nom,
        telephone: telephone,
        ville: ville,
        offre: offre,
        tag: tag || offre
      });
    } catch (error) {
      Logger.log('⚠️ Erreur sync GS Pipeline (ignorée, Sheet enregistré) : ' + error.toString());
    }

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
 *   TEST 1 : ENVOI COMMANDE 1 BOÎTE
 ****************************************************/
function test1Boite() {
  Logger.log('🧪 TEST : Commande 1 boîte Bee Venom\n');
  
  const testData = {
    nom: 'Test Client 1 Boîte',
    telephone: '22507 00 00 00 00',
    ville: 'Abidjan',
    offre: '1_boite',
    tag: '1_Bee'
  };
  
  Logger.log('📦 Données de test : ' + JSON.stringify(testData) + '\n');
  
  const success = sendToGSPipeline(testData);
  
  if (success) {
    Logger.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
    Logger.log('👉 Vérifiez dans GS Pipeline → À appeler');
    Logger.log('👉 Produit : Bee Venom | Quantité : 1');
    Logger.log('👉 URL : https://afgestion.net/admin/to-call\n');
  } else {
    Logger.log('\n❌ TEST ÉCHOUÉ - Vérifiez les logs ci-dessus\n');
  }
  
  return success;
}

/****************************************************
 *   TEST 2 : ENVOI COMMANDE 2 BOÎTES
 ****************************************************/
function test2Boites() {
  Logger.log('🧪 TEST : Commande 2 boîtes Bee Venom\n');
  
  const testData = {
    nom: 'Test Client 2 Boîtes',
    telephone: '22507 11 22 33 44',
    ville: 'Cocody',
    offre: '2_boites',
    tag: '2_Bee'
  };
  
  Logger.log('📦 Données de test : ' + JSON.stringify(testData) + '\n');
  
  const success = sendToGSPipeline(testData);
  
  if (success) {
    Logger.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
    Logger.log('👉 Vérifiez dans GS Pipeline → À appeler');
    Logger.log('👉 Produit : Bee Venom | Quantité : 2');
    Logger.log('👉 URL : https://afgestion.net/admin/to-call\n');
  } else {
    Logger.log('\n❌ TEST ÉCHOUÉ - Vérifiez les logs ci-dessus\n');
  }
  
  return success;
}

/****************************************************
 *   TEST 3 : ENVOI COMMANDE 3 BOÎTES
 ****************************************************/
function test3Boites() {
  Logger.log('🧪 TEST : Commande 3 boîtes Bee Venom\n');
  
  const testData = {
    nom: 'Test Client 3 Boîtes',
    telephone: '22507 55 66 77 88',
    ville: 'Yopougon',
    offre: '3_boites',
    tag: '3_Bee'
  };
  
  Logger.log('📦 Données de test : ' + JSON.stringify(testData) + '\n');
  
  const success = sendToGSPipeline(testData);
  
  if (success) {
    Logger.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
    Logger.log('👉 Vérifiez dans GS Pipeline → À appeler');
    Logger.log('👉 Produit : Bee Venom | Quantité : 3');
    Logger.log('👉 URL : https://afgestion.net/admin/to-call\n');
  } else {
    Logger.log('\n❌ TEST ÉCHOUÉ - Vérifiez les logs ci-dessus\n');
  }
  
  return success;
}

/****************************************************
 *   TEST COMPLET : LES 3 QUANTITÉS
 ****************************************************/
function testToutesQuantites() {
  Logger.log('🧪 TEST COMPLET : Toutes les quantités\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  Logger.log('1️⃣  Test 1 boîte...');
  const test1 = sendToGSPipeline({
    nom: 'Test 1 Boîte',
    telephone: '22507 00 11 22 33',
    ville: 'Abidjan',
    tag: '1_Bee'
  });
  Logger.log(test1 ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
  
  Utilities.sleep(1000); // Pause 1 seconde
  
  Logger.log('2️⃣  Test 2 boîtes...');
  const test2 = sendToGSPipeline({
    nom: 'Test 2 Boîtes',
    telephone: '22507 22 33 44 55',
    ville: 'Cocody',
    tag: '2_Bee'
  });
  Logger.log(test2 ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
  
  Utilities.sleep(1000); // Pause 1 seconde
  
  Logger.log('3️⃣  Test 3 boîtes...');
  const test3 = sendToGSPipeline({
    nom: 'Test 3 Boîtes',
    telephone: '22507 44 55 66 77',
    ville: 'Yopougon',
    tag: '3_Bee'
  });
  Logger.log(test3 ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
  
  Logger.log('═══════════════════════════════════════════════\n');
  
  if (test1 && test2 && test3) {
    Logger.log('🎉 🎉 🎉 TOUS LES TESTS RÉUSSIS ! 🎉 🎉 🎉\n');
    Logger.log('👉 Vérifiez dans GS Pipeline → À appeler');
    Logger.log('👉 Vous devriez voir 3 commandes avec quantités différentes\n');
  } else {
    Logger.log('⚠️  Certains tests ont échoué\n');
  }
}

/****************************************************
 *   AFFICHER LA CONFIGURATION ACTUELLE
 ****************************************************/
function afficherConfig() {
  Logger.log('⚙️ CONFIGURATION GS PIPELINE\n');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  Logger.log('📍 URL API : ' + GS_PIPELINE_CONFIG.API_URL);
  Logger.log('📦 Code produit : ' + GS_PIPELINE_CONFIG.PRODUCT_CODE);
  Logger.log('📝 Nom produit : ' + GS_PIPELINE_CONFIG.PRODUCT_NAME);
  Logger.log('\n🔢 EXTRACTION QUANTITÉ :');
  Logger.log('   1_Bee → ' + extractQuantity('1_Bee'));
  Logger.log('   2_Bee → ' + extractQuantity('2_Bee'));
  Logger.log('   3_Bee → ' + extractQuantity('3_Bee'));
  Logger.log('   1_boite → ' + extractQuantity('1_boite'));
  Logger.log('   2_boites → ' + extractQuantity('2_boites'));
  Logger.log('   3_boites → ' + extractQuantity('3_boites'));
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}









