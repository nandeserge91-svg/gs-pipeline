/**
 * 🔍 SCRIPT DE VÉRIFICATION - CONFIGURATION ANDROID SMS8
 * 
 * Ce script vérifie que la configuration Android est correcte
 * 
 * Utilisation :
 * node verifier_config_android.js
 */

console.log('📱 VÉRIFICATION CONFIGURATION ANDROID SMS8\n');
console.log('=' .repeat(70));

// Configuration actuelle
const config = {
  SMS_DEVICE_ID: process.env.SMS_DEVICE_ID,
  SMS_SIM_SLOT: process.env.SMS_SIM_SLOT,
  SMS_SENDER_NUMBER: process.env.SMS_SENDER_NUMBER,
  SMS8_API_KEY: process.env.SMS8_API_KEY,
  SMS8_API_URL: process.env.SMS8_API_URL,
  SMS_ENABLED: process.env.SMS_ENABLED
};

console.log('\n📋 CONFIGURATION ACTUELLE :\n');

let hasErrors = false;
let warnings = [];

// Vérification Device ID
const deviceId = config.SMS_DEVICE_ID;
if (deviceId) {
  console.log(`✓ SMS_DEVICE_ID        = ${deviceId}`);
} else {
  console.log(`✗ SMS_DEVICE_ID        = ❌ MANQUANT`);
  hasErrors = true;
  warnings.push('⚠️  SMS_DEVICE_ID est requis (ex: 5298)');
}

// Vérification SIM Slot
const simSlot = config.SMS_SIM_SLOT;
if (simSlot === '0' || simSlot === '1') {
  console.log(`✓ SMS_SIM_SLOT         = ${simSlot} (SIM ${parseInt(simSlot) + 1})`);
} else {
  console.log(`✗ SMS_SIM_SLOT         = ${simSlot || 'MANQUANT'} ❌`);
  hasErrors = true;
  warnings.push('⚠️  SMS_SIM_SLOT doit être "0" (SIM 1) ou "1" (SIM 2)');
}

// Vérification numéro expéditeur
const senderNumber = config.SMS_SENDER_NUMBER;
if (senderNumber && senderNumber.startsWith('+225')) {
  console.log(`✓ SMS_SENDER_NUMBER    = ${senderNumber}`);
} else if (senderNumber) {
  console.log(`⚠ SMS_SENDER_NUMBER    = ${senderNumber} (format suspect)`);
  warnings.push(`⚠️  Le numéro devrait commencer par +225 (format: ${senderNumber})`);
} else {
  console.log(`✗ SMS_SENDER_NUMBER    = ❌ MANQUANT`);
  hasErrors = true;
  warnings.push('⚠️  SMS_SENDER_NUMBER est requis (ex: +2250595871746)');
}

// Vérification API Key
const apiKey = config.SMS8_API_KEY;
if (apiKey && apiKey.length > 20) {
  console.log(`✓ SMS8_API_KEY         = ${apiKey.substring(0, 20)}... (${apiKey.length} car.)`);
} else {
  console.log(`✗ SMS8_API_KEY         = ${apiKey || 'MANQUANT'} ❌`);
  hasErrors = true;
  warnings.push('⚠️  SMS8_API_KEY est invalide ou manquant');
}

// Vérification API URL
const apiUrl = config.SMS8_API_URL;
if (apiUrl === 'https://app.sms8.io/services/send.php') {
  console.log(`✓ SMS8_API_URL         = ${apiUrl} ✅ (Android)`);
} else if (apiUrl === 'https://app.sms8.io/services/sendFront.php') {
  console.log(`⚠ SMS8_API_URL         = ${apiUrl} ⚠️  (API Web)`);
  warnings.push('⚠️  Vous utilisez l\'API Web (sendFront.php) au lieu de l\'API Android (send.php)');
} else {
  console.log(`✗ SMS8_API_URL         = ${apiUrl || 'MANQUANT'} ❌`);
  hasErrors = true;
  warnings.push('⚠️  SMS8_API_URL devrait être "https://app.sms8.io/services/send.php"');
}

// Vérification SMS activé
const smsEnabled = config.SMS_ENABLED;
if (smsEnabled === 'true') {
  console.log(`✓ SMS_ENABLED          = ${smsEnabled} ✅ (Actif)`);
} else {
  console.log(`⚠ SMS_ENABLED          = ${smsEnabled || 'undefined'} ⚠️  (SMS désactivés)`);
  warnings.push('⚠️  SMS_ENABLED n\'est pas "true", les SMS ne seront pas envoyés');
}

console.log('\n' + '=' .repeat(70));

// Résumé
console.log('\n📊 DIAGNOSTIC :\n');

if (hasErrors) {
  console.log('❌ ERREURS CRITIQUES DÉTECTÉES\n');
  warnings.forEach(w => console.log(w));
  console.log('\n📝 ACTION REQUISE :');
  console.log('   1. Allez sur Railway Dashboard → Variables');
  console.log('   2. Corrigez les variables manquantes/incorrectes');
  console.log('   3. Attendez le redémarrage (1 minute)');
  console.log('   4. Relancez ce script');
} else if (warnings.length > 0) {
  console.log('⚠️  AVERTISSEMENTS\n');
  warnings.forEach(w => console.log(w));
  console.log('\n💡 Le système peut fonctionner mais certaines optimisations sont possibles.');
} else {
  console.log('✅ PARFAIT ! Configuration Android correcte.\n');
  console.log('🎉 Votre système SMS est bien configuré !');
  console.log('\n📱 Device actuel :');
  console.log(`   - Android ID : ${deviceId}`);
  console.log(`   - SIM Slot   : ${simSlot} (SIM ${parseInt(simSlot) + 1})`);
  console.log(`   - Numéro     : ${senderNumber}`);
}

console.log('\n' + '=' .repeat(70));

// Conseils
console.log('\n💡 CONSEILS :\n');
console.log('📱 Assurez-vous que votre Android :');
console.log('   - Est allumé et connecté à Internet');
console.log('   - A l\'app SMS8.io ouverte (peut être en arrière-plan)');
console.log('   - Affiche le status "Online" sur https://app.sms8.io/devices');
console.log('   - A du crédit SIM ou un forfait SMS');
console.log('   - N\'est pas en mode avion ou économie d\'énergie');

console.log('\n🔄 Pour tester l\'envoi :');
console.log('   1. Allez sur https://afgestion.net/admin/sms-settings');
console.log('   2. Cliquez sur l\'onglet "Test d\'envoi"');
console.log('   3. Entrez votre numéro');
console.log('   4. Envoyez un SMS test');

console.log('\n' + '=' .repeat(70));
console.log('\n✅ Vérification terminée !\n');




