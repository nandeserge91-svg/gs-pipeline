/****************************************************
 *   GOOGLE APPS SCRIPT – MULTI-SHEETS
 *   
 *   ✅ SUPPORTE PLUSIEURS GOOGLE SHEETS !
 *   - Ajoutez autant de Sheets que vous voulez
 *   - Toutes les commandes arrivent dans "À appeler"
 *   
 *   📝 CONFIGURATION : Ajoutez vos Sheets dans SHEETS_CONFIG
 ****************************************************/

// ========================================
// 🆕 CONFIGURATION MULTI-SHEETS
// ========================================
const SHEETS_CONFIG = [
  // 📝 SHEET 1 : Bureau11 (votre Sheet actuel)
  {
    SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet Bee Venom'  // Pour vos logs
  },
  
  // 🆕 SHEET 2 : Votre deuxième Sheet
  // 👉 MODIFIEZ L'ID CI-DESSOUS avec votre 2ème Sheet
  {
    SPREADSHEET_ID: 'COLLEZ_ICI_ID_DU_2EME_SHEET',  // ← À MODIFIER
    SHEET_NAME: 'Bureau11',  // ou le nom de la feuille dans le 2ème Sheet
    DESCRIPTION: 'Sheet GrandTom'  // Pour vos logs
  },
  
  // 🆕 SHEET 3 : Si vous avez un 3ème Sheet (optionnel)
  // Décommentez et configurez si besoin
  /*
  {
    SPREADSHEET_ID: 'ID_DU_3EME_SHEET',
    SHEET_NAME: 'Bureau11',
    DESCRIPTION: 'Sheet Autre Produit'
  },
  */
];

// URL de l'API GS Pipeline (commune à tous les Sheets)
const API_URL = 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet';

// ⚙️ MAPPING DES PRODUITS (commun à tous les Sheets)
const PRODUCT_MAPPING = {
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
};

// Noms lisibles des produits
const PRODUCT_NAMES = {
  'BEE': 'Bee Venom',
  'BUTTOCK': 'Buttock',
  'GRANDTOM': 'GrandTom',
  'GAINE_TOURMALINE': 'Gaine Tourmaline',
  'CREME_ANTI_CERNE': 'Crème Anti-Cerne',
  'PATCH_ANTI_CICATRICE': 'Patch Anti-Cicatrice',
  'PACK_DETOX': 'Pack Détox Minceur',
  'CHAUSSETTE_CHAUFFANTE': 'Chaussettes Chauffantes Tourmaline',
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
  
  if (PRODUCT_MAPPING[tag]) {
    return PRODUCT_MAPPING[tag];
  }
  
  const tagLower = tag.toLowerCase().trim();
  for (let key in PRODUCT_MAPPING) {
    if (key.toLowerCase() === tagLower) {
      return PRODUCT_MAPPING[key];
    }
  }
  
  return tag;
}

/**
 * Obtenir le nom du produit
 */
function getProductName(productCode) {
  return PRODUCT_NAMES[productCode] || productCode;
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
    
    const response = UrlFetchApp.fetch(API_URL, options);
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
// 🔄 SCANNER TOUS LES SHEETS
// ========================================

/**
 * Scanner toutes les nouvelles commandes de TOUS les Sheets
 * et les envoyer vers GS Pipeline
 */
function scannerTousLesSheets() {
  Logger.log('🔍 SCAN DE TOUS LES SHEETS\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  let totalCommandes = 0;
  let totalEnvoyees = 0;
  
  SHEETS_CONFIG.forEach(function(sheetConfig, index) {
    Logger.log((index + 1) + '️⃣  Scanner : ' + sheetConfig.DESCRIPTION);
    Logger.log('   📂 Sheet ID : ' + sheetConfig.SPREADSHEET_ID);
    Logger.log('   📄 Feuille : ' + sheetConfig.SHEET_NAME + '\n');
    
    try {
      const ss = SpreadsheetApp.openById(sheetConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(sheetConfig.SHEET_NAME);
      
      if (!sheet) {
        Logger.log('   ⚠️ Feuille non trouvée : ' + sheetConfig.SHEET_NAME + '\n');
        return;
      }
      
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        Logger.log('   ℹ️ Aucune donnée dans cette feuille\n');
        return;
      }
      
      // Lire toutes les lignes (sauf l'en-tête)
      const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      
      Logger.log('   📊 ' + data.length + ' ligne(s) trouvée(s)\n');
      
      data.forEach(function(row) {
        const colA = row[0];        // Tag / Offre
        const ville = row[2];       // Ville (colonne C)
        const telephone = row[3];   // Téléphone (colonne D)
        const nom = row[6];         // Nom (colonne G)
        
        // Ne traiter que les lignes avec un téléphone
        if (telephone && telephone.toString().trim()) {
          totalCommandes++;
          
          const success = sendToGSPipeline({
            nom: nom ? nom.toString() : '',
            telephone: telephone.toString(),
            ville: ville ? ville.toString() : '',
            tag: colA ? colA.toString() : '',
            offre: colA ? colA.toString() : ''
          });
          
          if (success) {
            totalEnvoyees++;
          }
        }
      });
      
      Logger.log('   ✅ Sheet traité\n');
      
    } catch (error) {
      Logger.log('   ❌ Erreur : ' + error.toString() + '\n');
    }
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 RÉSUMÉ FINAL :\n');
  Logger.log('   • Sheets scannés : ' + SHEETS_CONFIG.length);
  Logger.log('   • Commandes trouvées : ' + totalCommandes);
  Logger.log('   • Commandes envoyées : ' + totalEnvoyees);
  Logger.log('\n✅ SCAN TERMINÉ !\n');
}

// ========================================
// 📥 RÉCEPTION FORMULAIRE (doPost)
// ========================================
function doPost(e) {
  try {
    // Utiliser le premier Sheet configuré par défaut
    const defaultSheet = SHEETS_CONFIG[0];
    const ss = SpreadsheetApp.openById(defaultSheet.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(defaultSheet.SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(defaultSheet.SHEET_NAME);
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
 * 🎯 TESTER GRANDTOM
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
 * Afficher la configuration actuelle
 */
function afficherConfig() {
  Logger.log('⚙️ CONFIGURATION MULTI-SHEETS\n');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  Logger.log('📍 URL API : ' + API_URL);
  Logger.log('\n📂 SHEETS CONFIGURÉS :\n');
  
  SHEETS_CONFIG.forEach(function(config, index) {
    Logger.log('   ' + (index + 1) + '. ' + config.DESCRIPTION);
    Logger.log('      ID : ' + config.SPREADSHEET_ID);
    Logger.log('      Feuille : ' + config.SHEET_NAME + '\n');
  });
  
  Logger.log('📦 MAPPING PRODUITS : ' + Object.keys(PRODUCT_MAPPING).length + ' entrées\n');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Setup initial pour tous les Sheets
 */
function setupTousLesSheets() {
  Logger.log('🔧 SETUP DE TOUS LES SHEETS\n');
  
  SHEETS_CONFIG.forEach(function(sheetConfig, index) {
    Logger.log((index + 1) + '️⃣  Setup : ' + sheetConfig.DESCRIPTION);
    
    try {
      const ss = SpreadsheetApp.openById(sheetConfig.SPREADSHEET_ID);
      let sheet = ss.getSheetByName(sheetConfig.SHEET_NAME);

      if (!sheet) {
        sheet = ss.insertSheet(sheetConfig.SHEET_NAME);
        Logger.log('   ✅ Feuille créée');
      }

      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Tag / Offre', '', 'Ville', 'Téléphone', '', '', 'Nom', '', '', 'Timestamp'
        ]);
        Logger.log('   ✅ En-têtes ajoutés');
      }
      
      Logger.log('   ✅ Setup terminé\n');
    } catch (error) {
      Logger.log('   ❌ Erreur : ' + error.toString() + '\n');
    }
  });
  
  Logger.log('✅ SETUP COMPLET TERMINÉ !\n');
}




















