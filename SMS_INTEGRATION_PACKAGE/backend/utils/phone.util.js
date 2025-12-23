/**
 * Utilitaire pour nettoyer et formater les numéros de téléphone
 */

/**
 * Nettoie et formate un numéro de téléphone ivoirien
 * @param {string} phone - Numéro brut
 * @returns {string} - Numéro formaté (+2250XXXXXXXXX)
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return phone;
  
  // Convertir en string et enlever tous les espaces, tirets, points, parenthèses
  let cleaned = String(phone)
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();
  
  // Si le numéro est vide après nettoyage
  if (!cleaned) return phone;
  
  // Si le numéro commence déjà par +225, le retourner tel quel
  if (cleaned.startsWith('+225')) {
    return cleaned;
  }
  
  // Si le numéro commence par 225 (sans +), ajouter le +
  if (cleaned.startsWith('225')) {
    return '+' + cleaned;
  }
  
  // Si le numéro commence par 0 (format local), ajouter +225
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    return '+225' + cleaned;
  }
  
  // Si le numéro a 10 chiffres et ne commence pas par 0, ajouter +2250
  if (/^\d{10}$/.test(cleaned)) {
    return '+2250' + cleaned;
  }
  
  // Si le numéro a 9 chiffres (sans le 0 initial), ajouter +2250
  if (/^\d{9}$/.test(cleaned)) {
    return '+2250' + cleaned;
  }
  
  // Sinon, retourner le numéro original
  console.warn(`⚠️  Format de numéro non reconnu: ${phone} → nettoyé: ${cleaned}`);
  return cleaned;
}

/**
 * Valide qu'un numéro est au format correct
 * @param {string} phone - Numéro à valider
 * @returns {boolean}
 */
export function isValidIvorianPhone(phone) {
  if (!phone) return false;
  
  // Format attendu: +2250XXXXXXXXX (13 caractères)
  const phoneRegex = /^\+2250\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Exemples de transformation
 * cleanPhoneNumber('0712345678') → '+2250712345678'
 * cleanPhoneNumber('712345678') → '+2250712345678'
 * cleanPhoneNumber('22507 12 34 56 78') → '+2250712345678'
 * cleanPhoneNumber('+2250712345678') → '+2250712345678'
 * cleanPhoneNumber('225 07 12 34 56 78') → '+2250712345678'
 */
