/**
 * TEST - EXTRACTION DES VARIANTES PHOTOGRAY
 * 
 * Ce script teste l'extraction des variantes PhotoGray
 */

// Fonction d'extraction (copiée depuis SCRIPT_COMPLET_AVEC_TAILLES.js)
function extraireInfosProduitAvecTaille(tag) {
  if (!tag) return null;
  
  const tagLower = tag.toLowerCase();
  
  let typeProduit = null;
  let taille = null;
  let code = null;
  
  if (tagLower.includes('photogray')) {
    typeProduit = 'PHOTOGRAY';
    // Extraire la variante (Z, M2, M3, X1, etc.) - lettre + chiffres optionnels
    const varianteRegex = /photogray\s+([A-Z][\d]*)/i;
    const matchVariante = tag.match(varianteRegex);
    if (matchVariante) {
      taille = matchVariante[1].toUpperCase();
    }
  }
  
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

// Tests
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   🧪 TEST EXTRACTION VARIANTES PHOTOGRAY                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const testCases = [
  'PhotoGray Z',
  'PhotoGray M2',
  'photogray z',
  'PHOTOGRAY Z',
  'PhotoGray Y',
  'PhotoGray X',
  'PhotoGray M1',
  'PhotoGray M3',
  'photogray m2',
  'PHOTOGRAY M2'
];

testCases.forEach((tag, index) => {
  const result = extraireInfosProduitAvecTaille(tag);
  
  console.log(`${index + 1}. Test : "${tag}"`);
  
  if (result && result.taille) {
    console.log(`   ✅ Variante extraite : "${result.taille}"`);
  } else if (result && !result.taille) {
    console.log(`   ⚠️  Produit détecté mais variante NON extraite (N/A)`);
    console.log(`   Résultat:`, result);
  } else {
    console.log(`   ❌ Produit NON détecté`);
  }
  
  console.log('');
});

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   ✅ TEST TERMINÉ                                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📝 Notes :');
console.log('   • Si toutes les variantes sont extraites correctement : ✅');
console.log('   • Si "N/A" apparaît : ⚠️  Le regex ne fonctionne pas\n');















