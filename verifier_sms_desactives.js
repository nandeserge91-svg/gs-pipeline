/**
 * 🔍 SCRIPT DE VÉRIFICATION - SMS DÉSACTIVÉS
 * 
 * Ce script vérifie que les 4 types de SMS sont bien désactivés
 * 
 * Utilisation :
 * node verifier_sms_desactives.js
 */

console.log('🔍 VÉRIFICATION DE LA CONFIGURATION SMS\n');
console.log('=' .repeat(60));

// Variables à vérifier
const smsConfig = {
  'SMS_ORDER_DELIVERED': process.env.SMS_ORDER_DELIVERED,
  'SMS_ORDER_CANCELLED': process.env.SMS_ORDER_CANCELLED,
  'SMS_DELIVERY_ASSIGNED': process.env.SMS_DELIVERY_ASSIGNED,
  'SMS_DELIVERER_ALERT': process.env.SMS_DELIVERER_ALERT
};

console.log('\n📋 VARIABLES D\'ENVIRONNEMENT :\n');

let allDisabled = true;
let warnings = [];

Object.entries(smsConfig).forEach(([key, value]) => {
  const isDisabled = value === 'false';
  const status = isDisabled ? '❌ DÉSACTIVÉ' : '✅ ACTIF';
  const icon = isDisabled ? '✓' : '✗';
  
  console.log(`${icon} ${key.padEnd(25)} = ${value || 'undefined'} ${status}`);
  
  if (!isDisabled) {
    allDisabled = false;
    warnings.push(`⚠️  ${key} devrait être "false" mais vaut "${value || 'undefined'}"`);
  }
});

console.log('\n' + '=' .repeat(60));

// Résumé
console.log('\n📊 RÉSUMÉ :\n');

if (allDisabled) {
  console.log('✅ PARFAIT ! Les 4 types de SMS sont bien désactivés.');
  console.log('\n🎉 Configuration correcte !');
} else {
  console.log('⚠️  ATTENTION ! Certains SMS ne sont pas désactivés :\n');
  warnings.forEach(w => console.log(w));
  console.log('\n📝 ACTION REQUISE :');
  console.log('   1. Allez sur Railway Dashboard');
  console.log('   2. Ajoutez/modifiez les variables manquantes');
  console.log('   3. Attendez le redémarrage (1 minute)');
  console.log('   4. Relancez ce script');
}

console.log('\n' + '=' .repeat(60));

// Vérification SMS_ENABLED
console.log('\n🔧 CONFIGURATION GLOBALE :\n');

const smsEnabled = process.env.SMS_ENABLED;
console.log(`SMS_ENABLED = ${smsEnabled || 'undefined'} ${smsEnabled === 'true' ? '✅ (SMS actifs)' : '❌ (SMS désactivés)'}`);

if (smsEnabled !== 'true') {
  console.log('\n⚠️  ATTENTION : SMS_ENABLED n\'est pas "true"');
  console.log('   Tous les SMS sont désactivés globalement.');
  console.log('   Les variables spécifiques n\'auront aucun effet.');
}

console.log('\n' + '=' .repeat(60));
console.log('\n✅ Vérification terminée !\n');




