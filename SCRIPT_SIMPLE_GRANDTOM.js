/****************************************************
 *   GOOGLE APPS SCRIPT – SIMPLE (1 FEUILLE)
 *   
 *   ✅ Votre formulaire envoie : "GrandTom"
 *   ✅ Le script mappe vers : GRANDTOM
 *   ✅ Créez un produit avec le code : GRANDTOM
 *   
 *   🧪 Fonction de test : testGrandTom()
 ****************************************************/

// ========================================
// 🆕 CONFIGURATION
// ========================================
const CONFIG = {
  // ID de votre Google Sheet (dans l'URL)
  SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
  
  // Nom de la feuille
  SHEET_NAME: 'Bureau11',
  
  // URL de l'API GS Pipeline
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  
  // ⚙️ MAPPING DES PRODUITS
  PRODUCT_MAPPING: {
    // Bee Venom
    '1_Bee': 'BEE',
    '2_Bee': 'BEE',
    '3_Bee': 'BEE',
    '1_boite': 'BEE',
    '2_boites': 'BEE',
    '3_boites': 'BEE',
    
    // Buttock
    'Buttock': 'BUTTOCK',
    'buttock': 'BUTTOCK',
    'BUTTOCK': 'BUTTOCK',
    '1_Buttock': 'BUTTOCK',
    '2_Buttock': 'BUTTOCK',
    '3_Buttock': 'BUTTOCK',
    
    // GrandTom
    'GrandTom': 'GRANDTOM',
    'grandtom': 'GRANDTOM',
    'GRANDTOM': 'GRANDTOM',
    'Grand Tom': 'GRANDTOM',
    'grand tom': 'GRANDTOM',
    'GRAND TOM': 'GRANDTOM',
    '1_GrandTom': 'GRANDTOM',
    '2_GrandTom': 'GRANDTOM',
    '3_GrandTom': 'GRANDTOM',
    
    // Gaine Tourmaline
    '1_Gaine': 'GAINE_TOURMALINE',
    '2_Gaine': 'GAINE_TOURMALINE',
    '3_Gaine': 'GAINE_TOURMALINE',
    'gaine tourmaline': 'GAINE_TOURMALINE',
    
    // Crème Anti-Cerne
    '1_Creme': 'CREME_ANTI_CERNE',
    '2_Creme': 'CREME_ANTI_CERNE',
    'creme anti cerne': 'CREME_ANTI_CERNE',
    
    // Patch Anti-Cicatrice
    '1_Patch': 'PATCH_ANTI_CICATRICE',
    '2_Patch': 'PATCH_ANTI_CICATRICE',
    'Patch Anti cicatrice': 'PATCH_ANTI_CICATRICE',
    
    // Pack Détox Minceur
    'Pack Détox Minceur': 'PACK_DETOX',
    'pack detox': 'PACK_DETOX',
    
    // Chaussettes Chauffantes
    'Chaussettes chauffantes tourmaline': 'CHAUSSETTE_CHAUFFANTE',
    'chaussettes chauffantes': 'CHAUSSETTE_CHAUFFANTE',
  },
  
  // Noms lisibles des produits
  PRODUCT_NAMES: {
    'BEE': 'Bee Venom',
    'BUTTOCK': 'Buttock',
    'GRANDTOM': 'GrandTom',
    'GAINE_TOURMALINE': 'Gaine Tourmaline',
    'CREME_ANTI_CERNE': 'Crème Anti-Cerne',
    'PATCH_ANTI_CICATRICE': 'Patch Anti-Cicatrice',
    'PACK_DETOX': 'Pack Détox Minceur',
    'CHAUSSETTE_CHAUFFANTE': 'Chaussettes Chauffantes Tourmaline',
  }
};

// ========================================
// 🔧 FONCTIONS UTILITAIRES
// ========================================

/**
 * Extraire la quantité du tag
 */
function extractQuantity(tag) {
  if (!tag) return 1;
  const match = tag.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Obtenir le code produit depuis le mapping
 */
function getProductCode(tag) {
  if (!tag) return null;
  
  if (CONFIG.PRODUCT_MAPPING[tag]) {
    return CONFIG.PRODUCT_MAPPING[tag];
  }
  
  const tagLower = tag.toLowerCase().trim();
  for (let key in CONFIG.PRODUCT_MAPPING) {
    if (key.toLowerCase() === tagLower) {
      return CONFIG.PRODUCT_MAPPING[key];
    }
  }
  
  return tag;
}

/**
 * Obtenir le nom du produit
 */
function getProductName(productCode) {
  return CONFIG.PRODUCT_NAMES[productCode] || productCode;
}

// ========================================
// 📤 ENVOYER LA COMMANDE VERS GS PIPELINE
// ========================================
function sendToGSPipeline(orderData) {
  try {
    const quantity = extractQuantity(orderData.tag);
    const productCode = getProductCode(orderData.tag || orderData.offre);
    const productName = getProductName(productCode);
    
    Logger.log('📦 Tag reçu : "' + orderData.tag + '"');
    Logger.log('📦 Code produit mappé : "' + productCode + '"');
    Logger.log('📦 Nom produit : "' + productName + '"');
    Logger.log('📦 Quantité extraite : ' + quantity);
    
    const apiPayload = {
      nom: orderData.nom || 'Client inconnu',
      telephone: orderData.telephone || '',
      ville: orderData.ville || '',
      offre: productName,
      tag: productCode,
      quantite: quantity
    };
    
    Logger.log('📤 Envoi vers GS Pipeline : ' + JSON.stringify(apiPayload));
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(apiPayload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.API_URL, options);
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
        // Ignore
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

// ========================================
// 📥 RÉCEPTION FORMULAIRE (doPost)
// ========================================
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
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
      return ContentService.createTextOutput("IGNORED_EMPTY")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    if (!telephone) {
      return ContentService.createTextOutput("IGNORED_NO_PHONE")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    const colA = tag || offre;

    const row = [
      colA, '', ville, telephone, '', '', nom, '', '', new Date()
    ];

    sheet.appendRow(row);

    // Envoyer vers GS Pipeline
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

    return ContentService.createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ========================================
// 🧪 FONCTIONS DE TEST
// ========================================

/**
 * Tester GrandTom
 */
function testGrandTom() {
  Logger.log('🧪 TEST : GrandTom\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Client GrandTom',
    telephone: '22507 22 33 44 55',
    ville: 'Abidjan',
    tag: 'GrandTom'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/admin/to-call\n');
}

/**
 * Tester Bee Venom
 */
function testBeeVenom() {
  Logger.log('🧪 TEST : Bee Venom\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Bee Venom',
    telephone: '22507 00 00 00 00',
    ville: 'Abidjan',
    tag: '2_Bee'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/admin/to-call\n');
}

/**
 * Afficher la configuration actuelle
 */
function afficherConfig() {
  Logger.log('⚙️ CONFIGURATION ACTUELLE\n');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  Logger.log('📍 URL API : ' + CONFIG.API_URL);
  Logger.log('📂 Sheet ID : ' + CONFIG.SPREADSHEET_ID);
  Logger.log('📄 Feuille : ' + CONFIG.SHEET_NAME);
  Logger.log('\n📦 PRODUITS CONFIGURÉS :\n');
  
  const produits = {};
  for (let key in CONFIG.PRODUCT_MAPPING) {
    const code = CONFIG.PRODUCT_MAPPING[key];
    if (!produits[code]) {
      produits[code] = CONFIG.PRODUCT_NAMES[code] || code;
    }
  }
  
  for (let code in produits) {
    Logger.log('   • ' + code + ' → ' + produits[code]);
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Setup initial
 */
function setup() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Tag / Offre', '', 'Ville', 'Téléphone', '', '', 'Nom', '', '', 'Timestamp'
    ]);
  }
  
  Logger.log('✅ Setup terminé !');
}









