/****************************************************
 *   GOOGLE APPS SCRIPT - AVEC PRODUITS À TAILLES
 *   
 *   ✅ Gère les produits avec tailles :
 *   - Boxer : "Boxer Taille S Code ABC123"
 *   - Taille-collantgaine : "Taille-collantgaine S"
 *   
 *   Extraction : Produit, Taille, Code (si fourni)
 *   Envoi vers GS Pipeline avec infos dans notes
 *   
 *   🧪 FONCTIONS DE TEST : 
 *   - testBoxer()
 *   - testCollantGaine()
 *   - testTousProduits()
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
    
    // Sadoer
    'Sadoer': 'SADOER',
    'sadoer': 'SADOER',
    'SADOER': 'SADOER',
    '1_Sadoer': 'SADOER',
    '2_Sadoer': 'SADOER',
    '3_Sadoer': 'SADOER',
    
    // PhotoGray - TOUTES LES VARIANTES
    'PhotoGray Z': 'PHOTOGRAY',
    'photogray z': 'PHOTOGRAY',
    'PHOTOGRAY Z': 'PHOTOGRAY',
    'PhotoGray Y': 'PHOTOGRAY',
    'photogray y': 'PHOTOGRAY',
    'PHOTOGRAY Y': 'PHOTOGRAY',
    'PhotoGray X': 'PHOTOGRAY',
    'photogray x': 'PHOTOGRAY',
    'PHOTOGRAY X': 'PHOTOGRAY',
    'PhotoGray M1': 'PHOTOGRAY',
    'photogray m1': 'PHOTOGRAY',
    'PHOTOGRAY M1': 'PHOTOGRAY',
    'PhotoGray M2': 'PHOTOGRAY',
    'photogray m2': 'PHOTOGRAY',
    'PHOTOGRAY M2': 'PHOTOGRAY',
    'PhotoGray M3': 'PHOTOGRAY',
    'photogray m3': 'PHOTOGRAY',
    'PHOTOGRAY M3': 'PHOTOGRAY',
    'PhotoGray': 'PHOTOGRAY',
    'photogray': 'PHOTOGRAY',
    'PHOTOGRAY': 'PHOTOGRAY',
    '1_PhotoGray': 'PHOTOGRAY',
    '2_PhotoGray': 'PHOTOGRAY',
    '3_PhotoGray': 'PHOTOGRAY',
    
    // Lunettes Correcteur
    'Lunettes_Correcteur': 'LUNETTES_CORRECTEUR',
    'lunettes_correcteur': 'LUNETTES_CORRECTEUR',
    'LUNETTES_CORRECTEUR': 'LUNETTES_CORRECTEUR',
    'Lunettes Correcteur': 'LUNETTES_CORRECTEUR',
    'lunettes correcteur': 'LUNETTES_CORRECTEUR',
    'LUNETTES CORRECTEUR': 'LUNETTES_CORRECTEUR',
    '1_Lunettes_Correcteur': 'LUNETTES_CORRECTEUR',
    '2_Lunettes_Correcteur': 'LUNETTES_CORRECTEUR',
    '3_Lunettes_Correcteur': 'LUNETTES_CORRECTEUR',
    
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
    
    // 🆕 CULOTTE - TOUTES LES TAILLES
    // Taille S
    'Culotte Taille S': 'CULOTTE',
    'Culotte S': 'CULOTTE',
    'culotte taille s': 'CULOTTE',
    'culotte s': 'CULOTTE',
    
    // Taille M
    'Culotte Taille M': 'CULOTTE',
    'Culotte M': 'CULOTTE',
    'culotte taille m': 'CULOTTE',
    'culotte m': 'CULOTTE',
    
    // Taille L
    'Culotte Taille L': 'CULOTTE',
    'Culotte L': 'CULOTTE',
    'culotte taille l': 'CULOTTE',
    'culotte l': 'CULOTTE',
    
    // Taille XL
    'Culotte Taille XL': 'CULOTTE',
    'Culotte XL': 'CULOTTE',
    'culotte taille xl': 'CULOTTE',
    'culotte xl': 'CULOTTE',
    
    // Taille 2XL
    'Culotte Taille 2XL': 'CULOTTE',
    'Culotte 2XL': 'CULOTTE',
    'culotte taille 2xl': 'CULOTTE',
    'culotte 2xl': 'CULOTTE',
    
    // Taille 3XL
    'Culotte Taille 3XL': 'CULOTTE',
    'Culotte 3XL': 'CULOTTE',
    'culotte taille 3xl': 'CULOTTE',
    'culotte 3xl': 'CULOTTE',
    
    // 🆕 TAILLE-COLLANTGAINE - TOUTES LES TAILLES
    // Taille S
    'Taille-collantgaine S': 'COLLANTGAINE',
    'taille-collantgaine s': 'COLLANTGAINE',
    'Taille-collantgaine s': 'COLLANTGAINE',
    'TAILLE-COLLANTGAINE S': 'COLLANTGAINE',
    
    // Taille M
    'Taille-collantgaine M': 'COLLANTGAINE',
    'taille-collantgaine m': 'COLLANTGAINE',
    'Taille-collantgaine m': 'COLLANTGAINE',
    'TAILLE-COLLANTGAINE M': 'COLLANTGAINE',
    
    // Taille L
    'Taille-collantgaine L': 'COLLANTGAINE',
    'taille-collantgaine l': 'COLLANTGAINE',
    'Taille-collantgaine l': 'COLLANTGAINE',
    'TAILLE-COLLANTGAINE L': 'COLLANTGAINE',
    
    // Taille XL
    'Taille-collantgaine XL': 'COLLANTGAINE',
    'taille-collantgaine xl': 'COLLANTGAINE',
    'Taille-collantgaine xl': 'COLLANTGAINE',
    'TAILLE-COLLANTGAINE XL': 'COLLANTGAINE',
    
    // Taille 2XL
    'Taille-collantgaine 2XL': 'COLLANTGAINE',
    'taille-collantgaine 2xl': 'COLLANTGAINE',
    'Taille-collantgaine 2xl': 'COLLANTGAINE',
    'TAILLE-COLLANTGAINE 2XL': 'COLLANTGAINE',
    
    // Taille 3XL
    'Taille-collantgaine 3XL': 'COLLANTGAINE',
    'taille-collantgaine 3xl': 'COLLANTGAINE',
    'Taille-collantgaine 3xl': 'COLLANTGAINE',
    'TAILLE-COLLANTGAINE 3XL': 'COLLANTGAINE',
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
    'SADOER': 'Sadoer',
    'PHOTOGRAY': 'LUNETTES PHOTOGRAY',
    'LUNETTES_CORRECTEUR': 'Lunettes Correcteur',
    'BOXER': 'Boxer',
    'CULOTTE': 'Culotte',
    'COLLANTGAINE': 'Taille-collantgaine',
  }
};

// ========================================
// 🔧 FONCTIONS UTILITAIRES
// ========================================

/**
 * 🆕 Extraire les informations des produits avec tailles/variantes
 * Formats supportés :
 * - "Boxer Taille S Code ABC123"
 * - "Taille-collantgaine S"
 * - "PhotoGray Z"
 * Retourne : { produit, taille, code, tagComplet }
 */
function extraireInfosProduitAvecTaille(tag) {
  if (!tag) return null;
  
  // Nettoyer le tag (trim et normaliser les espaces)
  tag = tag.trim().replace(/\s+/g, ' ');
  
  const tagLower = tag.toLowerCase();
  
  // Déterminer le type de produit
  let typeProduit = null;
  let taille = null;
  let code = null;
  
  if (tagLower.includes('boxer')) {
    typeProduit = 'BOXER';
    // Extraire la taille (S, M, L, XL, 2XL, 3XL)
    const tailleRegex = /\b(S|M|L|XL|2XL|3XL)\b/i;
    const matchTaille = tag.match(tailleRegex);
    if (matchTaille) {
      taille = matchTaille[1].toUpperCase();
    }
    
    // Extraire le code (après "Code" ou alphanumérique à la fin)
    const codeRegex = /code\s+([A-Z0-9]+)/i;
    const matchCode = tag.match(codeRegex);
    if (matchCode) {
      code = matchCode[1].toUpperCase();
    } else {
      // Si pas de "Code" explicite, chercher un code alphanumérique après la taille
      const codeFinRegex = /\b(S|M|L|XL|2XL|3XL)\s+([A-Z0-9]{3,})\b/i;
      const matchCodeFin = tag.match(codeFinRegex);
      if (matchCodeFin) {
        code = matchCodeFin[2].toUpperCase();
      }
    }
    
  } else if (tagLower.includes('culotte')) {
    typeProduit = 'CULOTTE';
    // Extraire la taille (S, M, L, XL, 2XL, 3XL)
    const tailleRegex = /\b(S|M|L|XL|2XL|3XL)\b/i;
    const matchTaille = tag.match(tailleRegex);
    if (matchTaille) {
      taille = matchTaille[1].toUpperCase();
    }
    
    // Extraire le code (après "Code" ou alphanumérique à la fin)
    const codeRegex = /code\s+([A-Z0-9]+)/i;
    const matchCode = tag.match(codeRegex);
    if (matchCode) {
      code = matchCode[1].toUpperCase();
    } else {
      // Si pas de "Code" explicite, chercher un code alphanumérique après la taille
      const codeFinRegex = /\b(S|M|L|XL|2XL|3XL)\s+([A-Z0-9]{3,})\b/i;
      const matchCodeFin = tag.match(codeFinRegex);
      if (matchCodeFin) {
        code = matchCodeFin[2].toUpperCase();
      }
    }
    
  } else if (tagLower.includes('collantgaine') || tagLower.includes('collant-gaine')) {
    typeProduit = 'COLLANTGAINE';
    // Extraire la taille (S, M, L, XL, 2XL, 3XL)
    const tailleRegex = /\b(S|M|L|XL|2XL|3XL)\b/i;
    const matchTaille = tag.match(tailleRegex);
    if (matchTaille) {
      taille = matchTaille[1].toUpperCase();
    }
    
  } else if (tagLower.includes('photogray')) {
    typeProduit = 'PHOTOGRAY';
    // Extraire la variante (Z, M2, M3, X1, etc.) - lettre + chiffres optionnels
    const varianteRegex = /photogray\s+([A-Z][\d]*)/i;
    const matchVariante = tag.match(varianteRegex);
    
    Logger.log('🔍 [DEBUG PhotoGray] Tag original: "' + tag + '"');
    Logger.log('🔍 [DEBUG PhotoGray] Match result: ' + (matchVariante ? JSON.stringify(matchVariante) : 'null'));
    
    if (matchVariante) {
      taille = matchVariante[1].toUpperCase();
      Logger.log('✅ [DEBUG PhotoGray] Variante extraite: "' + taille + '"');
    } else {
      Logger.log('❌ [DEBUG PhotoGray] Aucune variante détectée !');
    }
  }
  
  // Si ce n'est pas un produit avec taille/variante, retourner null
  if (!typeProduit) {
    return null;
  }
  
  return {
    produit: typeProduit,
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
  
  // 🆕 Si c'est un produit avec taille, extraire les infos
  const infosTaille = extraireInfosProduitAvecTaille(tag);
  if (infosTaille && infosTaille.produit) {
    return infosTaille.produit;
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
    
    // 🆕 Extraire les infos de taille si applicable
    const infosTaille = extraireInfosProduitAvecTaille(orderData.tag || orderData.offre);
    
    Logger.log('📦 Tag reçu : "' + orderData.tag + '"');
    Logger.log('📦 Code produit mappé : "' + productCode + '"');
    Logger.log('📦 Nom produit : "' + productName + '"');
    Logger.log('📦 Quantité extraite : ' + quantity);
    
    if (infosTaille) {
      Logger.log('👕 PRODUIT AVEC TAILLE DÉTECTÉ !');
      Logger.log('   Produit : ' + infosTaille.produit);
      Logger.log('   Taille : ' + (infosTaille.taille || 'Non spécifiée'));
      Logger.log('   Code : ' + (infosTaille.code || 'Non spécifié'));
      Logger.log('   Tag complet : ' + infosTaille.tagComplet);
    }
    
    // Préparer le payload
    const apiPayload = {
      nom: orderData.nom || 'Client inconnu',
      telephone: orderData.telephone || '',
      ville: orderData.ville || '',
      offre: productName,
      tag: productCode,
      quantite: quantity,
      // 🆕 Ajouter les infos de taille/variante dans les notes si applicable
      notes: infosTaille ? 
        (infosTaille.produit === 'PHOTOGRAY' ? 
          `Variante: ${infosTaille.taille || 'N/A'}` : 
          `Taille: ${infosTaille.taille || 'N/A'}${infosTaille.code ? ' | Code: ' + infosTaille.code : ''}`) : 
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
      telephone: `22507 ${String(10 + index).padStart(2, '0')} 11 22 33`,
      ville: 'Abidjan',
      tag: tag
    });
    
    Logger.log(success ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
    
    Utilities.sleep(1000);
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Test terminé ! Vérifiez sur : https://afgestion.net/appelant/orders\n');
}

/**
 * 🆕 TESTER TAILLE-COLLANTGAINE - DIFFÉRENTES TAILLES
 */
function testCollantGaine() {
  Logger.log('🧪 TEST : Taille-collantgaine (différentes tailles)\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const tailles = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  
  tailles.forEach(function(taille, index) {
    Logger.log(`${index + 1}️⃣  Test Taille-collantgaine ${taille}...\n`);
    
    const tag = `Taille-collantgaine ${taille}`;
    
    const success = sendToGSPipeline({
      nom: `Test Client Collant ${taille}`,
      telephone: `22507 ${String(20 + index).padStart(2, '0')} 33 44 55`,
      ville: 'Abidjan',
      tag: tag
    });
    
    Logger.log(success ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
    
    Utilities.sleep(1000);
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Test terminé ! Vérifiez sur : https://afgestion.net/appelant/orders\n');
}

/**
 * 🆕 TESTER PHOTOGRAY - DIFFÉRENTES VARIANTES
 */
function testPhotoGray() {
  Logger.log('🧪 TEST : PhotoGray (différentes variantes)\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const variantes = ['Z', 'Y', 'X', 'M1', 'M2', 'M3'];
  
  variantes.forEach(function(variante, index) {
    Logger.log(`${index + 1}️⃣  Test PhotoGray ${variante}...\n`);
    
    const tag = `PhotoGray ${variante}`;
    
    const success = sendToGSPipeline({
      nom: `Test Client PhotoGray ${variante}`,
      telephone: `22507 ${String(30 + index).padStart(2, '0')} 11 22 33`,
      ville: 'Abidjan',
      tag: tag
    });
    
    Logger.log(success ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
    
    Utilities.sleep(1000);
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Test terminé ! Vérifiez sur : https://afgestion.net/appelant/orders\n');
}

/**
 * Tester Lunettes Correcteur
 */
function testLunettesCorrecteur() {
  Logger.log('🧪 TEST : Lunettes Correcteur\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Client Lunettes Correcteur',
    telephone: '22507 40 55 66 77',
    ville: 'Abidjan',
    tag: 'Lunettes_Correcteur'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Test terminé ! Vérifiez sur : https://afgestion.net/appelant/orders\n');
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
  Logger.log('👉 Vérifiez sur : https://afgestion.net/appelant/orders\n');
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
    { nom: 'Test PhotoGray Z', tag: 'PhotoGray Z', ville: 'Cocody' },
    { nom: 'Test Lunettes_Correcteur 1', tag: 'Lunettes_Correcteur', ville: 'Abidjan' },
    { nom: 'Test Boxer M 1', tag: 'Boxer Taille M Code REFM001', ville: 'Plateau' },
    { nom: 'Test Collant L 1', tag: 'Taille-collantgaine L', ville: 'Treichville' },
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

