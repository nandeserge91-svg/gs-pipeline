/****************************************************
 *   GOOGLE APPS SCRIPT - AVEC BOXER (VARIANTES DE TAILLES)
 *   
 *   ✅ Gère les produits avec tailles :
 *   - Format reçu : "Boxer Taille S Code ABC123"
 *   - Extraction : Produit = Boxer, Taille = S, Code = ABC123
 *   - Envoi vers GS Pipeline avec toutes les infos
 *   
 *   🧪 FONCTION DE TEST : testBoxer()
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
    '3_Creme': 'CREME_ANTI_CERNE',
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
    
    // Probiotique
    'Probiotique': 'PROBIOTIQUE',
    'probiotique': 'PROBIOTIQUE',
    '1_Probiotique': 'PROBIOTIQUE',
    '2_Probiotique': 'PROBIOTIQUE',
    '3_Probiotique': 'PROBIOTIQUE',

    // TagRecede
    'TagRecede': 'TAGRECEDE',
    'tagrecede': 'TAGRECEDE',
    'Tag Recede': 'TAGRECEDE',
    'tag recede': 'TAGRECEDE',
    '1_TagRecede': 'TAGRECEDE',
    '2_TagRecede': 'TAGRECEDE',
    '3_TagRecede': 'TAGRECEDE',

    // DRRASHEL
    'DRRASHEL': 'DRRASHEL',
    'drrashel': 'DRRASHEL',
    'DrRashel': 'DRRASHEL',
    'Dr Rashel': 'DRRASHEL',
    'dr rashel': 'DRRASHEL',
    '1_DRRASHEL': 'DRRASHEL',
    '2_DRRASHEL': 'DRRASHEL',
    '3_DRRASHEL': 'DRRASHEL',

    // ScarGel
    'ScarGel': 'SCARGEL',
    'scargel': 'SCARGEL',
    'Scar Gel': 'SCARGEL',
    'scar gel': 'SCARGEL',
    '1_ScarGel': 'SCARGEL',
    '2_ScarGel': 'SCARGEL',
    '3_ScarGel': 'SCARGEL',
    
    // 🆕 BOXER - TOUTES LES TAILLES
    // Taille S
    'Boxer Taille S': 'BOXER',
    'Boxer S': 'BOXER',
    'boxer taille s': 'BOXER',
    'boxer s': 'BOXER',
    
    // Taille M
    'Boxer Taille M': 'BOXER',
    'Boxer M': 'BOXER',
    'boxer taille m': 'BOXER',
    'boxer m': 'BOXER',
    
    // Taille L
    'Boxer Taille L': 'BOXER',
    'Boxer L': 'BOXER',
    'boxer taille l': 'BOXER',
    'boxer l': 'BOXER',
    
    // Taille XL
    'Boxer Taille XL': 'BOXER',
    'Boxer XL': 'BOXER',
    'boxer taille xl': 'BOXER',
    'boxer xl': 'BOXER',
    
    // Taille 2XL
    'Boxer Taille 2XL': 'BOXER',
    'Boxer 2XL': 'BOXER',
    'boxer taille 2xl': 'BOXER',
    'boxer 2xl': 'BOXER',
    
    // Taille 3XL
    'Boxer Taille 3XL': 'BOXER',
    'Boxer 3XL': 'BOXER',
    'boxer taille 3xl': 'BOXER',
    'boxer 3xl': 'BOXER',
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
    'PROBIOTIQUE': 'Probiotique',
    'TAGRECEDE': 'TagRecede',
    'DRRASHEL': 'DRRASHEL',
    'SCARGEL': 'ScarGel',
    'BOXER': 'Boxer',  // 🆕
  }
};

// ========================================
// 🔧 FONCTIONS UTILITAIRES
// ========================================

/**
 * 🆕 Extraire les informations du Boxer
 * Format attendu : "Boxer Taille S Code ABC123"
 * Retourne : { taille: "S", code: "ABC123", tagComplet: "Boxer Taille S Code ABC123" }
 */
function extraireInfosBoxer(tag) {
  if (!tag) return null;
  
  const tagLower = tag.toLowerCase();
  
  // Vérifier si c'est un Boxer
  if (!tagLower.includes('boxer')) {
    return null;
  }
  
  let taille = null;
  let code = null;
  
  // Extraire la taille (S, M, L, XL, 2XL, 3XL)
  const tailleRegex = /taille\s+(S|M|L|XL|2XL|3XL)/i;
  const matchTaille = tag.match(tailleRegex);
  if (matchTaille) {
    taille = matchTaille[1].toUpperCase();
  } else {
    // Essayer de détecter la taille sans le mot "Taille"
    const tailleSimpleRegex = /\b(S|M|L|XL|2XL|3XL)\b/i;
    const matchTailleSimple = tag.match(tailleSimpleRegex);
    if (matchTailleSimple) {
      taille = matchTailleSimple[1].toUpperCase();
    }
  }
  
  // Extraire le code (après "Code")
  const codeRegex = /code\s+([A-Z0-9]+)/i;
  const matchCode = tag.match(codeRegex);
  if (matchCode) {
    code = matchCode[1].toUpperCase();
  } else {
    // Si pas de "Code" explicite, chercher un code alphanumérique à la fin
    const codeFinRegex = /\b([A-Z0-9]{3,})\b$/i;
    const matchCodeFin = tag.match(codeFinRegex);
    if (matchCodeFin) {
      code = matchCodeFin[1].toUpperCase();
    }
  }
  
  return {
    taille: taille,
    code: code,
    tagComplet: tag
  };
}

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
  
  // 🆕 Si c'est un Boxer, extraire juste "Boxer Taille X" pour le mapping
  if (tag.toLowerCase().includes('boxer')) {
    const infos = extraireInfosBoxer(tag);
    if (infos && infos.taille) {
      // Essayer "Boxer Taille S", "Boxer S", etc.
      const variations = [
        `Boxer Taille ${infos.taille}`,
        `Boxer ${infos.taille}`,
        `boxer taille ${infos.taille.toLowerCase()}`,
        `boxer ${infos.taille.toLowerCase()}`
      ];
      
      for (let variation of variations) {
        if (CONFIG.PRODUCT_MAPPING[variation]) {
          return CONFIG.PRODUCT_MAPPING[variation];
        }
      }
    }
    
    // Si on trouve "Boxer" sans taille spécifique
    return 'BOXER';
  }
  
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
    
    // 🆕 Extraire les infos Boxer si applicable
    const infosBoxer = extraireInfosBoxer(orderData.tag || orderData.offre);
    
    Logger.log('📦 Tag reçu : "' + orderData.tag + '"');
    Logger.log('📦 Code produit mappé : "' + productCode + '"');
    Logger.log('📦 Nom produit : "' + productName + '"');
    Logger.log('📦 Quantité extraite : ' + quantity);
    
    if (infosBoxer) {
      Logger.log('👕 BOXER DÉTECTÉ !');
      Logger.log('   Taille : ' + (infosBoxer.taille || 'Non spécifiée'));
      Logger.log('   Code : ' + (infosBoxer.code || 'Non spécifié'));
      Logger.log('   Tag complet : ' + infosBoxer.tagComplet);
    }
    
    // Préparer le payload
    const apiPayload = {
      nom: orderData.nom || 'Client inconnu',
      telephone: orderData.telephone || '',
      ville: orderData.ville || '',
      offre: productName,
      tag: productCode,
      quantite: quantity,
      // 🆕 Ajouter les infos Boxer dans les notes si c'est un Boxer
      notes: infosBoxer ? 
        `Taille: ${infosBoxer.taille || 'N/A'} | Code: ${infosBoxer.code || 'N/A'}` : 
        undefined
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
 * 🆕 TESTER BOXER - DIFFÉRENTES TAILLES
 */
function testBoxer() {
  Logger.log('🧪 TEST : Boxer (différentes tailles)\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const tailles = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  
  tailles.forEach(function(taille, index) {
    Logger.log(`${index + 1}️⃣  Test Boxer Taille ${taille}...\n`);
    
    const tag = `Boxer Taille ${taille} Code REF${index + 1}${taille}`;
    
    const success = sendToGSPipeline({
      nom: `Test Client Boxer ${taille}`,
      telephone: `22507 ${String(index).padStart(2, '0')} 11 22 33`,
      ville: 'Abidjan',
      tag: tag
    });
    
    Logger.log(success ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
    
    Utilities.sleep(1000);
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Test terminé ! Vérifiez sur : https://afgestion.net/admin/to-call\n');
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
 * Tester tous les produits
 */
function testTousProduits() {
  Logger.log('🧪 TEST COMPLET : Tous les produits\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const tests = [
    { nom: 'Test Bee 1', tag: '2_Bee', ville: 'Abidjan' },
    { nom: 'Test Buttock 1', tag: 'Buttock', ville: 'Abidjan' },
    { nom: 'Test GrandTom 1', tag: 'GrandTom', ville: 'Abidjan' },
    { nom: 'Test Probiotique 1', tag: 'Probiotique', ville: 'Cocody' },
    { nom: 'Test TagRecede 1', tag: 'TagRecede', ville: 'Yopougon' },
    { nom: 'Test DRRASHEL 1', tag: 'DRRASHEL', ville: 'Abobo' },
    { nom: 'Test ScarGel 1', tag: 'ScarGel', ville: 'Marcory' },
    { nom: 'Test Boxer M 1', tag: 'Boxer Taille M Code REFM001', ville: 'Plateau' },
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




















