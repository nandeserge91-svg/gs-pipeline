// ========================================
// 🆕 CONFIGURATION (À PERSONNALISER)
// ========================================
const CONFIG = {
  // ID de votre Google Sheet (dans l'URL)
  SPREADSHEET_ID: '1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc',
  
  // Nom de la feuille
  SHEET_NAME: 'Bureau11',
  
  // URL de l'API GS Pipeline
  API_URL: 'https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet',
  
  // ⚙️ MAPPING DES PRODUITS
  // ⬇️⬇️⬇️ AJOUTEZ VOS NOUVEAUX PRODUITS ICI ⬇️⬇️⬇️
  PRODUCT_MAPPING: {
    // Bee Venom
    '1_Bee': 'BEE',
    '2_Bee': 'BEE',
    '3_Bee': 'BEE',
    '1_boite': 'BEE',
    '2_boites': 'BEE',
    '3_boites': 'BEE',
    
    // 🆕 Buttock (VOTRE PRODUIT)
    'Buttock': 'BUTTOCK',
    'buttock': 'BUTTOCK',
    'BUTTOCK': 'BUTTOCK',
    '1_Buttock': 'BUTTOCK',
    '2_Buttock': 'BUTTOCK',
    '3_Buttock': 'BUTTOCK',
    
    // 👉 AJOUTEZ ICI VOS NOUVEAUX PRODUITS
    // Format : 'tag_du_formulaire': 'CODE_PRODUIT_GS_PIPELINE',
    
    // Exemple pour un nouveau produit "Gaine Tourmaline" :
    // 'gaine tourmaline': 'GAINE_TOURMALINE',
    // 'Gaine': 'GAINE_TOURMALINE',
    // '1_Gaine': 'GAINE_TOURMALINE',
    
    // Exemple pour "Crème Anti-Cerne" :
    // 'creme anti cerne': 'CREME_ANTI_CERNE',
    // 'Creme': 'CREME_ANTI_CERNE',
    // '1_Creme': 'CREME_ANTI_CERNE',
    
  },
  
  // Noms lisibles des produits (optionnel)
  // ⬇️⬇️⬇️ AJOUTEZ LES NOMS ICI ⬇️⬇️⬇️
  PRODUCT_NAMES: {
    'BEE': 'Bee Venom',
    'BUTTOCK': 'Buttock',
    
    // 👉 AJOUTEZ ICI LES NOMS DE VOS NOUVEAUX PRODUITS
    // Format : 'CODE_PRODUIT': 'Nom affiché',
    
    // Exemple :
    // 'GAINE_TOURMALINE': 'Gaine Tourmaline Minceur',
    // 'CREME_ANTI_CERNE': 'Crème Anti-Cerne',
    
  }
};





















