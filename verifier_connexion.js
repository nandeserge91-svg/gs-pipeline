/****************************************************
 *   SCRIPT DE VÉRIFICATION DE CONNEXION
 *   
 *   ✅ Vérifie :
 *   1. Connexion à l'API Railway (GS Pipeline)
 *   2. Accès au Google Sheet
 *   3. Validité de la configuration
 ****************************************************/

// Configuration (copiée depuis SCRIPT_COMPLET_AVEC_TAILLES.js)
const CONFIG = {
  SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
  SHEET_NAME: 'Bureau11',
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet'
};

/**
 * 🔍 FONCTION PRINCIPALE - VÉRIFIER TOUTES LES CONNEXIONS
 */
function verifierConnexion() {
  Logger.log('🔍 VÉRIFICATION DES CONNEXIONS');
  Logger.log('═══════════════════════════════════════════════\n');
  
  let toutOK = true;
  
  // 1. Vérifier Google Sheet
  Logger.log('1️⃣  Vérification Google Sheet...');
  const sheetOK = verifierGoogleSheet();
  if (sheetOK) {
    Logger.log('   ✅ Google Sheet OK');
  } else {
    Logger.log('   ❌ Google Sheet ERREUR');
    toutOK = false;
  }
  Logger.log('');
  
  // 2. Vérifier API Railway
  Logger.log('2️⃣  Vérification API Railway...');
  const apiOK = verifierAPIRailway();
  if (apiOK) {
    Logger.log('   ✅ API Railway OK');
  } else {
    Logger.log('   ❌ API Railway ERREUR');
    toutOK = false;
  }
  Logger.log('');
  
  // 3. Test d'envoi de données (optionnel - commenté par défaut)
  // Logger.log('3️⃣  Test d\'envoi de commande...');
  // const envOK = testerEnvoiCommande();
  // if (envOK) {
  //   Logger.log('   ✅ Envoi de commande OK');
  // } else {
  //   Logger.log('   ❌ Envoi de commande ERREUR');
  //   toutOK = false;
  // }
  
  // Résumé
  Logger.log('═══════════════════════════════════════════════');
  if (toutOK) {
    Logger.log('🎉 TOUTES LES CONNEXIONS SONT OPÉRATIONNELLES !');
  } else {
    Logger.log('⚠️  CERTAINES CONNEXIONS ONT ÉCHOUÉ');
  }
  Logger.log('═══════════════════════════════════════════════\n');
}

/**
 * ✅ Vérifier l'accès au Google Sheet
 */
function verifierGoogleSheet() {
  try {
    Logger.log('   📂 ID Sheet : ' + CONFIG.SPREADSHEET_ID);
    Logger.log('   📄 Nom feuille : ' + CONFIG.SHEET_NAME);
    
    // Ouvrir le spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('   ✓ Spreadsheet accessible');
    
    // Vérifier la feuille
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      Logger.log('   ⚠️  Feuille "' + CONFIG.SHEET_NAME + '" non trouvée, création...');
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      Logger.log('   ✓ Feuille créée');
    } else {
      Logger.log('   ✓ Feuille "' + CONFIG.SHEET_NAME + '" trouvée');
    }
    
    // Vérifier les données
    const lastRow = sheet.getLastRow();
    Logger.log('   ℹ️  Nombre de lignes : ' + lastRow);
    
    if (lastRow === 0) {
      Logger.log('   ⚠️  Feuille vide, création des en-têtes...');
      sheet.appendRow([
        'Tag / Offre', '', 'Ville', 'Téléphone', '', '', 'Nom', '', '', 'Timestamp'
      ]);
      Logger.log('   ✓ En-têtes créés');
    }
    
    return true;
  } catch (error) {
    Logger.log('   ❌ ERREUR : ' + error.toString());
    Logger.log('   💡 Vérifiez :');
    Logger.log('      - L\'ID du spreadsheet est correct');
    Logger.log('      - Vous avez les droits d\'accès');
    return false;
  }
}

/**
 * 🌐 Vérifier la connexion à l'API Railway
 */
function verifierAPIRailway() {
  try {
    Logger.log('   🌐 URL API : ' + CONFIG.API_URL);
    
    // Tenter une requête GET pour vérifier que l'API est accessible
    const options = {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true
    };
    
    Logger.log('   📡 Envoi requête de test...');
    const response = UrlFetchApp.fetch(CONFIG.API_URL.replace('/api/webhook/google-sheet', '/'), options);
    const statusCode = response.getResponseCode();
    
    Logger.log('   📡 Status HTTP : ' + statusCode);
    
    // L'API peut retourner 404 pour GET, mais si elle répond, c'est qu'elle est accessible
    if (statusCode >= 200 && statusCode < 500) {
      Logger.log('   ✓ API accessible (serveur répond)');
      
      // Test plus spécifique avec un payload minimal
      const testPayload = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          nom: 'TEST_CONNEXION',
          telephone: '00000000000',
          ville: 'TEST',
          offre: 'TEST',
          tag: 'TEST',
          quantite: 1
        }),
        muteHttpExceptions: true
      };
      
      Logger.log('   📡 Test POST sur endpoint webhook...');
      const testResponse = UrlFetchApp.fetch(CONFIG.API_URL, testPayload);
      const testStatus = testResponse.getResponseCode();
      const testBody = testResponse.getContentText();
      
      Logger.log('   📡 Status POST : ' + testStatus);
      Logger.log('   📡 Réponse : ' + testBody.substring(0, 100) + (testBody.length > 100 ? '...' : ''));
      
      if (testStatus === 200 || testStatus === 201) {
        Logger.log('   ✓ Endpoint webhook fonctionnel');
        return true;
      } else if (testStatus === 400 || testStatus === 422) {
        Logger.log('   ✓ API répond (erreur validation attendue pour test)');
        return true;
      } else {
        Logger.log('   ⚠️  Status inattendu : ' + testStatus);
        return false;
      }
    } else {
      Logger.log('   ❌ API inaccessible (status ' + statusCode + ')');
      return false;
    }
  } catch (error) {
    Logger.log('   ❌ ERREUR : ' + error.toString());
    Logger.log('   💡 Vérifiez :');
    Logger.log('      - L\'URL de l\'API est correcte');
    Logger.log('      - Le serveur Railway est démarré');
    Logger.log('      - Votre connexion internet');
    return false;
  }
}

/**
 * 📤 Test d'envoi d'une vraie commande (optionnel)
 * ⚠️  ATTENTION : Ceci créera une vraie commande dans la base
 */
function testerEnvoiCommande() {
  try {
    Logger.log('   📤 Envoi commande de test...');
    
    const payload = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        nom: 'Test Connexion Script',
        telephone: '22507990011223',
        ville: 'Abidjan Test',
        offre: 'Bee Venom',
        tag: 'BEE',
        quantite: 1,
        notes: 'Test de vérification de connexion'
      }),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.API_URL, payload);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('   📡 Status : ' + statusCode);
    Logger.log('   📡 Réponse : ' + responseText.substring(0, 200));
    
    if (statusCode === 200 || statusCode === 201) {
      Logger.log('   ✓ Commande test créée avec succès');
      try {
        const data = JSON.parse(responseText);
        if (data.order_id) {
          Logger.log('   ℹ️  ID commande : ' + data.order_id);
        }
        if (data.order_reference) {
          Logger.log('   ℹ️  Référence : ' + data.order_reference);
        }
      } catch (e) {
        // Ignore parse error
      }
      return true;
    } else {
      Logger.log('   ⚠️  Erreur HTTP ' + statusCode);
      return false;
    }
  } catch (error) {
    Logger.log('   ❌ ERREUR : ' + error.toString());
    return false;
  }
}

/**
 * 🔎 Afficher la configuration actuelle
 */
function afficherConfiguration() {
  Logger.log('⚙️  CONFIGURATION ACTUELLE');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('📂 Google Sheet ID : ' + CONFIG.SPREADSHEET_ID);
  Logger.log('📄 Nom de la feuille : ' + CONFIG.SHEET_NAME);
  Logger.log('🌐 URL API Railway : ' + CONFIG.API_URL);
  Logger.log('═══════════════════════════════════════════════\n');
}

/**
 * 🌐 Vérifier uniquement l'API (version rapide)
 */
function verifierAPISeule() {
  Logger.log('🌐 VÉRIFICATION RAPIDE API RAILWAY');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const apiOK = verifierAPIRailway();
  
  Logger.log('\n═══════════════════════════════════════════════');
  if (apiOK) {
    Logger.log('✅ API OPÉRATIONNELLE');
  } else {
    Logger.log('❌ API NON ACCESSIBLE');
  }
  Logger.log('═══════════════════════════════════════════════\n');
}

/**
 * 📊 Vérifier uniquement le Google Sheet (version rapide)
 */
function verifierSheetSeul() {
  Logger.log('📊 VÉRIFICATION RAPIDE GOOGLE SHEET');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const sheetOK = verifierGoogleSheet();
  
  Logger.log('\n═══════════════════════════════════════════════');
  if (sheetOK) {
    Logger.log('✅ GOOGLE SHEET OPÉRATIONNEL');
  } else {
    Logger.log('❌ GOOGLE SHEET NON ACCESSIBLE');
  }
  Logger.log('═══════════════════════════════════════════════\n');
}














