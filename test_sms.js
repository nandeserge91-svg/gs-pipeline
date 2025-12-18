/**
 * 🧪 SCRIPT DE TEST SMS8.io
 * 
 * Ce script permet de tester l'intégration SMS sans passer par l'API
 * Utilisation : node test_sms.js
 */

import { sendSMS, getSMSCredits, smsTemplates } from './services/sms.service.js';

// ⚠️ REMPLACEZ PAR VOTRE NUMÉRO DE TEST
const TEST_PHONE = '+2250712345678'; // Format: +225XXXXXXXXXX

console.log('🧪 === TEST INTÉGRATION SMS8.io ===\n');

async function testSMS() {
  try {
    // Test 1 : Vérifier les crédits
    console.log('📊 Test 1 : Récupération crédits SMS...');
    const creditsResult = await getSMSCredits();
    if (creditsResult.success) {
      console.log(`✅ Crédits disponibles : ${creditsResult.credits}`);
    } else {
      console.log(`❌ Erreur crédits : ${creditsResult.error}`);
      return;
    }
    console.log('');

    // Test 2 : Envoi SMS simple
    console.log('📱 Test 2 : Envoi SMS simple...');
    const simpleMessage = 'Test SMS GS-Pipeline. Si vous recevez ce message, l\'integration fonctionne !';
    const simpleResult = await sendSMS(TEST_PHONE, simpleMessage, {
      type: 'NOTIFICATION'
    });
    
    if (simpleResult.success) {
      console.log('✅ SMS simple envoyé avec succès !');
      console.log(`   - SMS Log ID: ${simpleResult.smsLogId}`);
      console.log(`   - Crédits restants: ${simpleResult.credits}`);
    } else {
      console.log(`❌ Échec envoi SMS : ${simpleResult.error}`);
    }
    console.log('');

    // Test 3 : Test des templates
    console.log('📝 Test 3 : Test des templates SMS...');
    
    // Template ORDER_CREATED
    const templateMessage = smsTemplates.orderCreated('Test Client', 'ORD-12345');
    console.log(`Template ORDER_CREATED :\n"${templateMessage}"\n`);
    
    const templateResult = await sendSMS(TEST_PHONE, templateMessage, {
      type: 'ORDER_CREATED'
    });
    
    if (templateResult.success) {
      console.log('✅ SMS template envoyé avec succès !');
      console.log(`   - Crédits restants: ${templateResult.credits}`);
    } else {
      console.log(`❌ Échec envoi template : ${templateResult.error}`);
    }
    console.log('');

    // Test 4 : Test EXPRESS template
    console.log('📦 Test 4 : Test template EXPRESS...');
    const expressMessage = smsTemplates.expressArrived(
      'Test Client',
      'Agence Cocody',
      'EXP-2024-12345',
      9000
    );
    console.log(`Template EXPRESS_ARRIVED :\n"${expressMessage}"\n`);
    
    const expressResult = await sendSMS(TEST_PHONE, expressMessage, {
      type: 'EXPRESS_ARRIVED'
    });
    
    if (expressResult.success) {
      console.log('✅ SMS EXPRESS envoyé avec succès !');
      console.log(`   - Crédits restants: ${expressResult.credits}`);
    } else {
      console.log(`❌ Échec envoi EXPRESS : ${expressResult.error}`);
    }
    console.log('');

    // Résumé
    console.log('📋 === RÉSUMÉ DES TESTS ===');
    console.log('✅ Test 1 : Crédits SMS - OK');
    console.log(`${simpleResult.success ? '✅' : '❌'} Test 2 : SMS simple - ${simpleResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`${templateResult.success ? '✅' : '❌'} Test 3 : Template ORDER - ${templateResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`${expressResult.success ? '✅' : '❌'} Test 4 : Template EXPRESS - ${expressResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log('');
    console.log('🎉 Tests terminés !');
    
  } catch (error) {
    console.error('💥 Erreur lors des tests :', error);
  }
}

// Afficher les templates disponibles
function showTemplates() {
  console.log('📚 === TEMPLATES SMS DISPONIBLES ===\n');
  
  const templates = [
    {
      name: 'orderCreated',
      example: smsTemplates.orderCreated('John Doe', 'ORD-12345')
    },
    {
      name: 'orderValidated',
      example: smsTemplates.orderValidated('John Doe', 'BEE VENOM', 10000)
    },
    {
      name: 'deliveryAssigned',
      example: smsTemplates.deliveryAssigned('John Doe', 'Mohamed', '+2250712345678')
    },
    {
      name: 'orderDelivered',
      example: smsTemplates.orderDelivered('John Doe', 'ORD-12345')
    },
    {
      name: 'expeditionConfirmed',
      example: smsTemplates.expeditionConfirmed('John Doe', 'EXP-2024-12345', 'Yamoussoukro')
    },
    {
      name: 'expressArrived',
      example: smsTemplates.expressArrived('John Doe', 'Agence Cocody', 'EXP-2024-789', 9000)
    },
    {
      name: 'expressReminder',
      example: smsTemplates.expressReminder('John Doe', 'Agence Cocody', 'EXP-2024-789', 3)
    },
    {
      name: 'rdvScheduled',
      example: smsTemplates.rdvScheduled('John Doe', '20/12/2024', '14:00')
    },
    {
      name: 'rdvReminder',
      example: smsTemplates.rdvReminder('John Doe', '14:00')
    },
    {
      name: 'orderCancelled',
      example: smsTemplates.orderCancelled('John Doe', 'ORD-12345')
    }
  ];
  
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   "${template.example}"`);
    console.log(`   Longueur : ${template.example.length} caractères\n`);
  });
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--templates') || args.includes('-t')) {
  showTemplates();
} else {
  console.log(`⚠️  ATTENTION : Modifiez la variable TEST_PHONE avant de lancer ce test !`);
  console.log(`   Numéro actuel : ${TEST_PHONE}\n`);
  
  if (TEST_PHONE === '+2250712345678') {
    console.log('❌ Veuillez modifier TEST_PHONE dans test_sms.js');
    console.log('   Remplacez par votre vrai numéro de téléphone.\n');
    console.log('📚 Pour voir les templates sans envoyer de SMS : node test_sms.js --templates\n');
    process.exit(1);
  }
  
  testSMS();
}
