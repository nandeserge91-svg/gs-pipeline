// ========================================
// 📝 EXEMPLE : AJOUTER "GAINE TOURMALINE"
// ========================================

// AVANT (vous avez déjà ces lignes) :
// =====================================

PRODUCT_MAPPING: {
  // Bee Venom
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  '3_Bee': 'BEE',
  
  // Buttock
  'Buttock': 'BUTTOCK',
  'buttock': 'BUTTOCK',
  '1_Buttock': 'BUTTOCK',
  '2_Buttock': 'BUTTOCK',
},


// APRÈS (ajoutez ces lignes) :
// ===========================

PRODUCT_MAPPING: {
  // Bee Venom
  '1_Bee': 'BEE',
  '2_Bee': 'BEE',
  '3_Bee': 'BEE',
  
  // Buttock
  'Buttock': 'BUTTOCK',
  'buttock': 'BUTTOCK',
  '1_Buttock': 'BUTTOCK',
  '2_Buttock': 'BUTTOCK',
  
  // 🆕 AJOUTEZ CES LIGNES ICI ⬇️⬇️⬇️
  // Gaine Tourmaline
  'gaine tourmaline': 'GAINE_TOURMALINE',
  'Gaine Tourmaline': 'GAINE_TOURMALINE',
  'gaine': 'GAINE_TOURMALINE',
  '1_Gaine': 'GAINE_TOURMALINE',
  '2_Gaine': 'GAINE_TOURMALINE',
  // 🆕 FIN DES LIGNES À AJOUTER ⬆️⬆️⬆️
},


// ========================================
// MÊME CHOSE POUR PRODUCT_NAMES
// ========================================

// AVANT :
// =======

PRODUCT_NAMES: {
  'BEE': 'Bee Venom',
  'BUTTOCK': 'Buttock',
}


// APRÈS :
// =======

PRODUCT_NAMES: {
  'BEE': 'Bee Venom',
  'BUTTOCK': 'Buttock',
  
  // 🆕 AJOUTEZ CETTE LIGNE ⬇️
  'GAINE_TOURMALINE': 'Gaine Tourmaline Minceur',
  // 🆕 FIN ⬆️
}


// ========================================
// 📋 CHECKLIST RAPIDE
// ========================================
/*
  ✅ 1. Créer produit dans GS Pipeline
       Code : GAINE_TOURMALINE
  
  ✅ 2. Ajouter dans PRODUCT_MAPPING :
       'gaine tourmaline': 'GAINE_TOURMALINE',
       'Gaine Tourmaline': 'GAINE_TOURMALINE',
       '1_Gaine': 'GAINE_TOURMALINE',
  
  ✅ 3. Ajouter dans PRODUCT_NAMES :
       'GAINE_TOURMALINE': 'Gaine Tourmaline Minceur',
  
  ✅ 4. Enregistrer (💾)
  
  ✅ 5. Tester
*/


// ========================================
// 🎯 TEMPLATE RAPIDE À COPIER
// ========================================

/*
  COPIEZ-COLLEZ DANS PRODUCT_MAPPING :
  
  // 🆕 [NOM DU PRODUIT]
  '[tag_1]': '[CODE_PRODUIT]',
  '[tag_2]': '[CODE_PRODUIT]',
  '1_[Tag]': '[CODE_PRODUIT]',
  '2_[Tag]': '[CODE_PRODUIT]',
  
  
  COPIEZ-COLLEZ DANS PRODUCT_NAMES :
  
  '[CODE_PRODUIT]': '[Nom Affiché]',
*/



















