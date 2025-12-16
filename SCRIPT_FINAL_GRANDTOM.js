/****************************************************
 *   GOOGLE APPS SCRIPT – AVEC VOTRE PRODUIT "GRANDTOM"
 *   
 *   ✅ CONFIGURATION :
 *   - Votre formulaire envoie : "GrandTom"
 *   - Le script mappe vers : GRANDTOM
 *   - Créez un produit avec le code : GRANDTOM
 *   
 *   🧪 FONCTION DE TEST : testGrandTom()
 ****************************************************/

// ========================================
// 🆕 CONFIGURATION
// ========================================
const CONFIG = {
  // ID de votre Google Sheet (dans l'URL)
  SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
  
  // 🆕 NOMS DES FEUILLES À SCANNER (plusieurs onglets du même Sheet)
  SHEET_NAMES: [
    'Bureau11',      // ← Feuille 1 (Bee Venom)
    'Bureau12'       // ← Feuille 2 (GrandTom) - MODIFIEZ le nom si différent
  ],
  
  // Nom de la feuille par défaut (pour doPost)
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
    
    // 🎯 GRANDTOM - VOTRE NOUVEAU PRODUIT ✅✅✅
    // Votre formulaire envoie exactement : "GrandTom"
    'GrandTom': 'GRANDTOM',         // ← VOTRE CAS (formulaire envoie "GrandTom")
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
    'GRANDTOM': 'GrandTom',        // ← VOTRE PRODUIT
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
 * Exemples : "1_Bee" → 1, "2_Gaine" → 2, "3_Patch" → 3
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
  
  // Chercher d'abord avec le tag exact
  if (CONFIG.PRODUCT_MAPPING[tag]) {
    return CONFIG.PRODUCT_MAPPING[tag];
  }
  
  // Chercher en ignorant la casse
  const tagLower = tag.toLowerCase().trim();
  for (let key in CONFIG.PRODUCT_MAPPING) {
    if (key.toLowerCase() === tagLower) {
      return CONFIG.PRODUCT_MAPPING[key];
    }
  }
  
  // Si pas trouvé, retourner le tag original
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
    // Extraire la quantité
    const quantity = extractQuantity(orderData.tag);
    
    // Obtenir le code produit
    const productCode = getProductCode(orderData.tag || orderData.offre);
    const productName = getProductName(productCode);
    
    Logger.log('📦 Tag reçu : "' + orderData.tag + '"');
    Logger.log('📦 Code produit mappé : "' + productCode + '"');
    Logger.log('📦 Nom produit : "' + productName + '"');
    Logger.log('📦 Quantité extraite : ' + quantity);
    
    // Préparer le payload
    const apiPayload = {
      nom: orderData.nom || 'Client inconnu',
      telephone: orderData.telephone || '',
      ville: orderData.ville || '',
      offre: productName,
      tag: productCode,
      quantite: quantity
    };
    
    Logger.log('📤 Envoi vers GS Pipeline : ' + JSON.stringify(apiPayload));
    
    // Options de la requête
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(apiPayload),
      muteHttpExceptions: true
    };
    
    // Envoyer vers l'API
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
 * 🎯 TESTER GRANDTOM (VOTRE PRODUIT)
 * Simule exactement ce que votre formulaire envoie : "GrandTom"
 */
function testGrandTom() {
  Logger.log('🧪 TEST : GrandTom\n');
  Logger.log('📝 Simulation : Le formulaire envoie "GrandTom"\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Client GrandTom',
    telephone: '22507 22 33 44 55',
    ville: 'Abidjan',
    tag: 'GrandTom'  // ← EXACTEMENT ce que votre formulaire envoie
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/admin/to-call\n');
}

/**
 * Tester Bee Venom
 */
function testBeeVenom() {
  Logger.log('🧪 TEST : Bee Venom (2 boîtes)\n');
  
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
 * Tester Buttock
 */
function testButtock() {
  Logger.log('🧪 TEST : Buttock\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Client Buttock',
    telephone: '22507 11 22 33 44',
    ville: 'Abidjan',
    tag: 'Buttock'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/admin/to-call\n');
}

/**
 * Tester Gaine Tourmaline
 */
function testGaineTourmaline() {
  Logger.log('🧪 TEST : Gaine Tourmaline\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Gaine',
    telephone: '22507 11 22 33 44',
    ville: 'Cocody',
    tag: 'gaine tourmaline'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
}

/**
 * Tester Crème Anti-Cerne
 */
function testCremeAntiCerne() {
  Logger.log('🧪 TEST : Crème Anti-Cerne\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Crème',
    telephone: '22507 22 33 44 55',
    ville: 'Yopougon',
    tag: 'creme anti cerne'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
}

/**
 * Tester tous les produits
 */
function testTousProduits() {
  Logger.log('🧪 TEST COMPLET : Tous les produits\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const tests = [
    { nom: 'Test Bee 1', tag: '2_Bee', ville: 'Abidjan' },
    { nom: 'Test Buttock 1', tag: 'Buttock', ville: 'Abidjan' },
    { nom: 'Test GrandTom 1', tag: 'GrandTom', ville: 'Abidjan' },
    { nom: 'Test Gaine 1', tag: 'gaine tourmaline', ville: 'Cocody' },
    { nom: 'Test Crème 1', tag: 'creme anti cerne', ville: 'Yopougon' },
    { nom: 'Test Patch 1', tag: 'Patch Anti cicatrice', ville: 'Abobo' },
  ];
  
  let successCount = 0;
  
  tests.forEach(function(test, index) {
    Logger.log((index + 1) + '️⃣  Test ' + test.tag + '...');
    
    const success = sendToGSPipeline({
      nom: test.nom,
      telephone: '22507' + String(index).padStart(2, '0') + '11 22 33',
      ville: test.ville,
      tag: test.tag
    });
    
    if (success) {
      successCount++;
      Logger.log('✅ OK\n');
    } else {
      Logger.log('❌ ÉCHOUÉ\n');
    }
    
    Utilities.sleep(1000);
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Résultats : ' + successCount + '/' + tests.length + ' tests réussis\n');
  
  if (successCount === tests.length) {
    Logger.log('🎉 🎉 🎉 TOUS LES TESTS RÉUSSIS ! 🎉 🎉 🎉\n');
  }
}

/**
 * Afficher la configuration actuelle
 */
function afficherConfig() {
  Logger.log('⚙️ CONFIGURATION ACTUELLE\n');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  Logger.log('📍 URL API : ' + CONFIG.API_URL);
  Logger.log('📂 Sheet : ' + CONFIG.SHEET_NAME);
  Logger.log('\n📦 MAPPING PRODUITS :\n');
  
  for (let key in CONFIG.PRODUCT_MAPPING) {
    Logger.log('   "' + key + '" → ' + CONFIG.PRODUCT_MAPPING[key]);
  }
  
  Logger.log('\n📝 NOMS PRODUITS :\n');
  
  for (let code in CONFIG.PRODUCT_NAMES) {
    Logger.log('   ' + code + ' → ' + CONFIG.PRODUCT_NAMES[code]);
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 🔄 SCANNER TOUTES LES FEUILLES ET ENVOYER VERS GS PIPELINE
 * Lit toutes les feuilles configurées dans SHEET_NAMES
 */
function scannerToutesLesFeuilles() {
  Logger.log('🔍 SCAN DE TOUTES LES FEUILLES\n');
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📂 Google Sheet ID : ' + CONFIG.SPREADSHEET_ID + '\n');
  
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let totalCommandes = 0;
  let totalEnvoyees = 0;
  
  CONFIG.SHEET_NAMES.forEach(function(sheetName, index) {
    Logger.log((index + 1) + '️⃣  Scanner feuille : "' + sheetName + '"\n');
    
    try {
      const sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        Logger.log('   ⚠️ Feuille non trouvée : "' + sheetName + '"\n');
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
      
      data.forEach(function(row, rowIndex) {
        const colA = row[0];        // Tag / Offre (colonne A)
        const ville = row[2];       // Ville (colonne C)
        const telephone = row[3];   // Téléphone (colonne D)
        const nom = row[6];         // Nom (colonne G)
        
        // Ne traiter que les lignes avec un téléphone
        if (telephone && telephone.toString().trim()) {
          totalCommandes++;
          
          Logger.log('   📞 Ligne ' + (rowIndex + 2) + ' : ' + nom + ' - ' + telephone);
          
          const success = sendToGSPipeline({
            nom: nom ? nom.toString().trim() : '',
            telephone: telephone.toString().trim(),
            ville: ville ? ville.toString().trim() : '',
            tag: colA ? colA.toString().trim() : '',
            offre: colA ? colA.toString().trim() : ''
          });
          
          if (success) {
            totalEnvoyees++;
            Logger.log('      ✅ Envoyé\n');
          } else {
            Logger.log('      ❌ Échec\n');
          }
        }
      });
      
      Logger.log('   ✅ Feuille "' + sheetName + '" traitée\n');
      
    } catch (error) {
      Logger.log('   ❌ Erreur : ' + error.toString() + '\n');
    }
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 RÉSUMÉ FINAL :\n');
  Logger.log('   • Feuilles scannées : ' + CONFIG.SHEET_NAMES.length);
  Logger.log('   • Commandes trouvées : ' + totalCommandes);
  Logger.log('   • Commandes envoyées : ' + totalEnvoyees);
  Logger.log('\n✅ SCAN TERMINÉ !\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/admin/to-call\n');
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

