/**
 * Script de vérification de la configuration SMS
 * Vérifie quels types de SMS sont actifs/désactivés
 */

import https from 'https';

const API_URL = 'gs-pipeline-production.up.railway.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjYwODAwOTAsImV4cCI6MTc2NjE2NjQ5MH0.BSkX8YQW99ap1vy6ex0TczdRTHCOd8lPx_NUtRXil-M';

console.log('🔍 === VÉRIFICATION CONFIGURATION SMS ===\n');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifierConfig() {
  try {
    console.log('📡 Récupération de la configuration...\n');
    
    const config = await makeRequest('/api/sms/config');
    
    if (config.status !== 200) {
      console.log(`❌ Erreur: ${config.status}`);
      return;
    }

    const cfg = config.data;

    // Configuration globale
    console.log('⚙️  CONFIGURATION GLOBALE\n');
    console.log(`   SMS Enabled: ${cfg.enabled ? '✅ Activé' : '❌ Désactivé'}`);
    console.log(`   API URL: ${cfg.apiUrl || 'Non configuré'}`);
    console.log(`   Device ID: ${cfg.deviceId || 'Non configuré'}`);
    console.log(`   Sender: ${cfg.senderNumber || 'Non configuré'}`);
    console.log('');

    // Types de SMS - Mapping
    const smsTypes = {
      'SMS_ORDER_CREATED': { label: 'Commande créée', emoji: '✅', expected: true },
      'SMS_ORDER_VALIDATED': { label: 'Commande validée', emoji: '✅', expected: true },
      'SMS_ORDER_DELIVERED': { label: 'Commande livrée', emoji: '❌', expected: false },
      'SMS_ORDER_CANCELLED': { label: 'Commande annulée', emoji: '❌', expected: false },
      'SMS_EXPEDITION_CONFIRMED': { label: 'Expédition confirmée', emoji: '✅', expected: true },
      'SMS_EXPEDITION_EN_ROUTE': { label: 'Expédition en route', emoji: '✅', expected: true },
      'SMS_EXPRESS_ARRIVED': { label: 'EXPRESS arrivé', emoji: '✅', expected: true },
      'SMS_EXPRESS_PAYMENT_PENDING': { label: 'EXPRESS paiement', emoji: '✅', expected: true },
      'SMS_DELIVERY_ASSIGNED': { label: 'Livreur assigné', emoji: '❌', expected: false },
      'SMS_RDV_SCHEDULED': { label: 'RDV programmé', emoji: '✅', expected: true },
      'SMS_RDV_REMINDER': { label: 'Rappel RDV', emoji: '❌', expected: false },
      'SMS_NOTIFICATION': { label: 'Alerte livreur', emoji: '❌', expected: false }
    };

    console.log('📊 TYPES DE SMS - STATUT ACTUEL\n');
    console.log('Type                          | Status     | Attendu    | Check');
    console.log('------------------------------|------------|------------|-------');

    let allCorrect = true;

    for (const [key, info] of Object.entries(smsTypes)) {
      const envKey = key.replace('SMS_', '').toLowerCase();
      const isEnabled = cfg[envKey] !== false;
      const status = isEnabled ? '✅ Actif  ' : '❌ Inactif';
      const expected = info.expected ? '✅ Actif  ' : '❌ Inactif';
      const check = (isEnabled === info.expected) ? '✅' : '⚠️';
      
      if (isEnabled !== info.expected) {
        allCorrect = false;
      }

      console.log(`${info.label.padEnd(29)} | ${status} | ${expected} | ${check}`);
    }

    console.log('');

    // Résumé
    console.log('═'.repeat(70));
    console.log('📋 RÉSUMÉ\n');

    const actifs = Object.entries(smsTypes).filter(([key, info]) => {
      const envKey = key.replace('SMS_', '').toLowerCase();
      return cfg[envKey] !== false;
    }).length;

    const desactives = 12 - actifs;

    console.log(`✅ SMS actifs : ${actifs}/12`);
    console.log(`❌ SMS désactivés : ${desactives}/12`);
    console.log('');

    if (allCorrect) {
      console.log('🎉 Configuration CONFORME aux attentes !');
      console.log('');
      console.log('✅ SMS désactivés correctement :');
      console.log('   - Commande livrée');
      console.log('   - Commande annulée');
      console.log('   - Livreur assigné');
      console.log('   - Rappel RDV');
      console.log('   - Alerte livreur');
    } else {
      console.log('⚠️  Configuration NON CONFORME');
      console.log('');
      console.log('📝 Actions recommandées :');
      console.log('   1. Allez sur Railway → Variables');
      console.log('   2. Ajoutez les variables manquantes :');
      console.log('      - SMS_ORDER_DELIVERED=false');
      console.log('      - SMS_ORDER_CANCELLED=false');
      console.log('      - SMS_DELIVERY_ASSIGNED=false');
      console.log('      - SMS_RDV_REMINDER=false');
      console.log('      - SMS_NOTIFICATION=false');
      console.log('   3. Attendez le redémarrage automatique');
      console.log('   4. Relancez ce script pour vérifier');
    }

    console.log('');
    console.log('📚 Documentation : DESACTIVER_SMS_SPECIFIQUES.md');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

verifierConfig();
