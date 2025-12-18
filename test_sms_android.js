/**
 * Script de test pour vérifier l'envoi SMS via Android
 */

import https from 'https';

const API_URL = 'gs-pipeline-production.up.railway.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjYwODAwOTAsImV4cCI6MTc2NjE2NjQ5MH0.BSkX8YQW99ap1vy6ex0TczdRTHCOd8lPx_NUtRXil-M';

console.log('🔍 === TEST SMS ANDROID ===\n');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      path: path,
      method: method,
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

async function testAndroid() {
  // Test 1: Configuration
  console.log('⚙️  Test 1: Configuration Android...');
  try {
    const config = await makeRequest('/api/sms/config');
    if (config.status === 200) {
      const cfg = config.data;
      console.log(`✅ Configuration récupérée`);
      console.log(`   SMS Enabled: ${cfg.enabled || 'Non configuré'}`);
      console.log(`   API URL: ${cfg.apiUrl || 'Non retourné'}`);
      console.log(`   Device ID: ${cfg.deviceId || 'Non configuré'}`);
      console.log(`   SIM Slot: ${cfg.simSlot !== undefined ? cfg.simSlot : 'Non configuré'}`);
      console.log(`   Sender Number: ${cfg.senderNumber || 'Non configuré'}`);
      console.log('');

      // Validation
      if (!cfg.deviceId) {
        console.log('❌ PROBLÈME: SMS_DEVICE_ID non configuré sur Railway!');
        console.log('   → Consultez CONFIG_RAILWAY_ANDROID.md pour la configuration\n');
      }
      if (cfg.apiUrl && !cfg.apiUrl.includes('send.php')) {
        console.log('⚠️  ATTENTION: API URL devrait être send.php (pas sendFront.php)');
        console.log(`   Actuel: ${cfg.apiUrl}`);
        console.log(`   Attendu: https://app.sms8.io/services/send.php\n`);
      }
    } else {
      console.log(`❌ Erreur config: ${config.status}\n`);
    }
  } catch (err) {
    console.log(`❌ Erreur: ${err.message}\n`);
  }

  // Test 2: Historique récent
  console.log('📜 Test 2: Historique SMS (10 minutes)...');
  try {
    const history = await makeRequest('/api/sms/history?limit=10');
    if (history.status === 200) {
      const logs = history.data.logs || [];
      
      // Filtrer les 10 dernières minutes
      const now = new Date();
      const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const recent = logs.filter(log => new Date(log.sentAt) > tenMinAgo);
      
      console.log(`✅ ${logs.length} SMS dans l'historique`);
      console.log(`   ${recent.length} SMS dans les 10 dernières minutes\n`);

      if (logs.length > 0) {
        const last = logs[0];
        console.log('📋 Dernier SMS:');
        console.log(`   Status: ${last.status}`);
        console.log(`   Provider: ${last.provider}`);
        console.log(`   Téléphone: ${last.phoneNumber}`);
        console.log(`   Date: ${new Date(last.sentAt).toLocaleString('fr-FR')}`);
        console.log('');

        // Analyse du provider
        if (last.provider && last.provider.includes('Device')) {
          console.log('✅ SMS envoyé via Android dédié !');
          const match = last.provider.match(/Device-(\d+)/);
          if (match) {
            console.log(`   Device ID utilisé: ${match[1]}`);
          }
        } else {
          console.log('⚠️  SMS envoyé via API Cloud (pas Android)');
          console.log('   Vérifiez la configuration des variables Railway');
        }
        console.log('');

        // Stats
        const androidSMS = logs.filter(l => l.provider && l.provider.includes('Device'));
        const cloudSMS = logs.filter(l => l.provider && !l.provider.includes('Device'));
        console.log('📊 Statistiques:');
        console.log(`   SMS via Android: ${androidSMS.length}/${logs.length}`);
        console.log(`   SMS via Cloud: ${cloudSMS.length}/${logs.length}`);
        console.log('');
      } else {
        console.log('⚠️  Aucun SMS dans l\'historique');
        console.log('   Créez une commande test pour vérifier\n');
      }
    } else {
      console.log(`❌ Erreur historique: ${history.status}\n`);
    }
  } catch (err) {
    console.log(`❌ Erreur: ${err.message}\n`);
  }

  // Résumé
  console.log('═'.repeat(80));
  console.log('🎯 RÉSUMÉ\n');
  console.log('📝 VÉRIFICATIONS NÉCESSAIRES:');
  console.log('');
  console.log('1. Variables Railway configurées ?');
  console.log('   → SMS_DEVICE_ID = 5298');
  console.log('   → SMS_SIM_SLOT = 0');
  console.log('   → SMS_SENDER_NUMBER = +2250595871746');
  console.log('   → SMS8_API_URL = https://app.sms8.io/services/send.php');
  console.log('');
  console.log('2. Android KLE-A0 Online ?');
  console.log('   → https://app.sms8.io/devices');
  console.log('   → Status: Online (pastille verte)');
  console.log('');
  console.log('3. Test d\'envoi:');
  console.log('   → Créez une commande sur https://afgestion.net');
  console.log('   → Vérifiez que l\'expéditeur est +2250595871746');
  console.log('');
  console.log('📚 Documentation: CONFIG_RAILWAY_ANDROID.md');
}

testAndroid().catch(err => {
  console.error('❌ Erreur fatale:', err);
});

