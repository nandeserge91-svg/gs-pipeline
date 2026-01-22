/****************************************************
 *   EXEMPLE DE CONFIGURATION : GAINE TOURMALINE
 *   
 *   Copiez ce code dans votre Google Apps Script
 *   pour gérer les commandes de Gaine Tourmaline
 ****************************************************/

const CONFIG = {
  // Votre Google Sheet ID
  SPREADSHEET_ID: 'VOTRE_SHEET_ID_ICI',  // ⚠️ À CHANGER
  
  // Nom de la feuille
  SHEET_NAME: 'Gaine_Commandes',  // ⚠️ À ADAPTER
  
  // URL de l'API (ne pas changer)
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  
  // Mapping pour Gaine Tourmaline
  PRODUCT_MAPPING: {
    // Différentes variantes du formulaire
    'gaine tourmaline': 'GAINE_TOURMALINE',
    'Gaine Tourmaline': 'GAINE_TOURMALINE',
    'GAINE_TOURMALINE': 'GAINE_TOURMALINE',
    'gaine': 'GAINE_TOURMALINE',
    'Gaine': 'GAINE_TOURMALINE',
    
    // Avec quantités
    '1_Gaine': 'GAINE_TOURMALINE',
    '2_Gaine': 'GAINE_TOURMALINE',
    '3_Gaine': 'GAINE_TOURMALINE',
    
    // Avec tailles (si vous gérez des tailles)
    'gaine_S': 'GAINE_TOURMALINE_S',
    'gaine_M': 'GAINE_TOURMALINE_M',
    'gaine_L': 'GAINE_TOURMALINE_L',
    'gaine_XL': 'GAINE_TOURMALINE_XL',
  },
  
  // Noms lisibles
  PRODUCT_NAMES: {
    'GAINE_TOURMALINE': 'Gaine Tourmaline Minceur',
    'GAINE_TOURMALINE_S': 'Gaine Tourmaline Minceur (S)',
    'GAINE_TOURMALINE_M': 'Gaine Tourmaline Minceur (M)',
    'GAINE_TOURMALINE_L': 'Gaine Tourmaline Minceur (L)',
    'GAINE_TOURMALINE_XL': 'Gaine Tourmaline Minceur (XL)',
  }
};

// ... (copiez le reste du code du script générique)

































