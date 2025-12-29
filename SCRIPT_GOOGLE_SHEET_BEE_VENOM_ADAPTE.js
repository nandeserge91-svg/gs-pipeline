/****************************************************
 *   GOOGLE APPS SCRIPT – RÉCEPTION FORMULAIRE BEE VENOM
 *   + ENVOI VERS GS PIPELINE (MÉTHODE ADAPTÉE)
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
  
  // Mapping produit : offre formulaire → product_key dans GS Pipeline
  PRODUCT_MAPPING: {
    '1_boite': '1_Bee',
    '2_boites': '2_Bee',
    '3_boites': '3_Bee',
    '1_Bee': '1_Bee',
    '2_Bee': '2_Bee',
    '3_Bee': '3_Bee'
  },
  
  // Noms lisibles des produits
  PRODUCT_NAMES: {
    '1_Bee': 'Bee Venom 1 boîte',
    '2_Bee': 'Bee Venom 2 boîtes',
    '3_Bee': 'Bee Venom 3 boîtes'
  }
};

// ========================================
// 🆕 ENVOYER LA COMMANDE VERS GS PIPELINE
// ========================================
function sendToGSPipeline(orderData) {
  try {
    // Identifier le product_key (tag)
    let tag = orderData.tag || orderData.offre || '';
    let productKey = GS_PIPELINE_CONFIG.PRODUCT_MAPPING[tag] || tag;
    
    // Nom du produit pour affichage
    let productName = GS_PIPELINE_CONFIG.PRODUCT_NAMES[productKey] || orderData.offre || 'Bee Venom';
    
    // Préparer les données pour l'API
    const apiPayload = {
      nom: orderData.nom || 'Client inconnu',
      telephone: orderData.telephone || '',
      ville: orderData.ville || '',
      offre: productName,  // Nom lisible du produit
      tag: productKey      // Code produit (1_Bee, 2_Bee, 3_Bee)
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
      const responseData = JSON.parse(responseText);
      Logger.log('📋 ID commande : ' + responseData.order_id);
      Logger.log('📋 Référence : ' + responseData.order_reference);
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
 *   TEST MANUEL : ENVOI DE TEST VERS GS PIPELINE
 ****************************************************/
function testEnvoiVersGSPipeline() {
  Logger.log('🧪 TEST ENVOI VERS GS PIPELINE...\n');
  
  const testData = {
    nom: 'Test Client Bee Venom',
    telephone: '22507 00 00 00 00',
    ville: 'Abidjan',
    offre: '2_boites',
    tag: '2_Bee'
  };
  
  Logger.log('📦 Données de test : ' + JSON.stringify(testData) + '\n');
  
  const success = sendToGSPipeline(testData);
  
  if (success) {
    Logger.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
    Logger.log('👉 Allez vérifier dans GS Pipeline → À appeler');
    Logger.log('👉 URL : https://afgestion.net/admin/to-call\n');
  } else {
    Logger.log('\n❌ TEST ÉCHOUÉ - Vérifiez les logs ci-dessus\n');
  }
  
  return success;
}

/****************************************************
 *   TEST COMPLET AVEC ENREGISTREMENT SHEET
 ****************************************************/
function testComplet() {
  Logger.log('🧪 TEST COMPLET (Sheet + GS Pipeline)...\n');
  
  // Simuler un appel doPost
  const mockEvent = {
    parameter: {
      nom: 'Test Complet Client',
      telephone: '22507 11 22 33 44',
      ville: 'Cocody',
      offre: '3_boites',
      tag: '3_Bee'
    }
  };
  
  const result = doPost(mockEvent);
  
  Logger.log('\n📋 Résultat doPost : ' + result.getContent());
  Logger.log('\n✅ Vérifiez :');
  Logger.log('1️⃣  Google Sheet → Nouvelle ligne ajoutée');
  Logger.log('2️⃣  GS Pipeline → À appeler → Nouvelle commande\n');
}

/****************************************************
 *   AFFICHER LA CONFIGURATION ACTUELLE
 ****************************************************/
function afficherConfig() {
  Logger.log('⚙️ CONFIGURATION GS PIPELINE\n');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  Logger.log('📍 URL API : ' + GS_PIPELINE_CONFIG.API_URL);
  Logger.log('\n📦 MAPPING PRODUITS :');
  
  for (let key in GS_PIPELINE_CONFIG.PRODUCT_MAPPING) {
    Logger.log('   ' + key + ' → ' + GS_PIPELINE_CONFIG.PRODUCT_MAPPING[key]);
  }
  
  Logger.log('\n📝 NOMS PRODUITS :');
  for (let key in GS_PIPELINE_CONFIG.PRODUCT_NAMES) {
    Logger.log('   ' + key + ' → ' + GS_PIPELINE_CONFIG.PRODUCT_NAMES[key]);
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}




















