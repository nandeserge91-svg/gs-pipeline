/**
 * Script pour vérifier l'état du déploiement Railway
 */

import https from 'https';

const API_URL = 'gs-pipeline-production.up.railway.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjYwODAwOTAsImV4cCI6MTc2NjE2NjQ5MH0.BSkX8YQW99ap1vy6ex0TczdRTHCOd8lPx_NUtRXil-M';

console.log('🔍 === VÉRIFICATION DU DÉPLOIEMENT ===\n');
console.log('⏰ Vérification en cours...\n');

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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout - API non accessible'));
    });
    req.end();
  });
}

async function checkDeployment() {
  // Test 1: API accessible
  console.log('📡 Test 1/3 : API Railway accessible ?');
  try {
    const ping = await makeRequest('/');
    if (ping.status === 200) {
      console.log('   ✅ API accessible\n');
    } else {
      console.log(`   ⚠️  API répond avec status ${ping.status}\n`);
    }
  } catch (err) {
    console.log(`   ❌ API inaccessible : ${err.message}`);
    console.log('   → Railway est peut-être en cours de redéploiement\n');
    return;
  }

  // Test 2: Configuration SMS
  console.log('⚙️  Test 2/3 : Variables SMS configurées ?');
  try {
    const config = await makeRequest('/api/sms/config');
    if (config.status === 200) {
      const cfg = config.data;
      
      const checks = [
        { name: 'SMS Enabled', value: cfg.enabled, expected: true },
        { name: 'Device ID', value: cfg.deviceId, expected: '5298' },
        { name: 'SIM Slot', value: cfg.simSlot, expected: 0 },
        { name: 'Sender Number', value: cfg.senderNumber, expected: '+2250595871746' },
        { name: 'API URL', value: cfg.apiUrl, expected: 'send.php' }
      ];

      let allGood = true;
      checks.forEach(check => {
        if (check.name === 'API URL') {
          const isCorrect = check.value && check.value.includes('send.php');
          console.log(`   ${isCorrect ? '✅' : '❌'} ${check.name}: ${check.value || 'Non configuré'}`);
          if (!isCorrect) allGood = false;
        } else {
          const isCorrect = check.value == check.expected;
          console.log(`   ${isCorrect ? '✅' : '❌'} ${check.name}: ${check.value !== undefined ? check.value : 'Non configuré'} ${!isCorrect ? `(attendu: ${check.expected})` : ''}`);
          if (!isCorrect) allGood = false;
        }
      });

      console.log('');
      
      if (allGood) {
        console.log('   🎉 TOUTES les variables sont correctement configurées !\n');
      } else {
        console.log('   ⚠️  Certaines variables manquent ou sont incorrectes');
        console.log('   → Consultez DEPLOIEMENT_RAPIDE_5MIN.md\n');
      }
    } else {
      console.log(`   ❌ Impossible de récupérer la config (status ${config.status})\n`);
    }
  } catch (err) {
    console.log(`   ❌ Erreur : ${err.message}\n`);
  }

  // Test 3: Derniers SMS
  console.log('📜 Test 3/3 : SMS utilisent l\'Android ?');
  try {
    const history = await makeRequest('/api/sms/history?limit=5');
    if (history.status === 200) {
      const logs = history.data.logs || [];
      
      if (logs.length > 0) {
        const androidSMS = logs.filter(l => l.provider && l.provider.includes('Device'));
        const cloudSMS = logs.filter(l => l.provider && !l.provider.includes('Device'));
        
        console.log(`   📊 SMS récents (${logs.length}) :`);
        console.log(`      Android : ${androidSMS.length}`);
        console.log(`      Cloud   : ${cloudSMS.length}`);
        console.log('');

        if (androidSMS.length > 0) {
          console.log('   ✅ Les SMS utilisent l\'Android !\n');
          console.log('   📋 Dernier SMS Android :');
          const last = androidSMS[0];
          console.log(`      Provider: ${last.provider}`);
          console.log(`      Status: ${last.status}`);
          console.log(`      Date: ${new Date(last.sentAt).toLocaleString('fr-FR')}`);
          console.log('');
        } else if (cloudSMS.length > 0) {
          console.log('   ⚠️  Les SMS utilisent encore le Cloud (pas Android)');
          console.log('   → Les variables ne sont pas encore prises en compte');
          console.log('   → Attendez 2-3 minutes et relancez ce script\n');
        }
      } else {
        console.log('   ℹ️  Aucun SMS dans l\'historique récent');
        console.log('   → Créez une commande test pour vérifier\n');
      }
    }
  } catch (err) {
    console.log(`   ❌ Erreur : ${err.message}\n`);
  }

  // Résumé final
  console.log('═'.repeat(70));
  console.log('🎯 RÉSUMÉ\n');
  console.log('Si toutes les variables sont ✅ :');
  console.log('   → Le déploiement est TERMINÉ');
  console.log('   → Créez une commande test sur https://afgestion.net');
  console.log('   → Vérifiez que le SMS arrive de +2250595871746\n');
  
  console.log('Si certaines variables sont ❌ :');
  console.log('   → Ajoutez les variables manquantes sur Railway');
  console.log('   → Consultez DEPLOIEMENT_RAPIDE_5MIN.md');
  console.log('   → Relancez ce script dans 3 minutes\n');
  
  console.log('Si "SMS utilisent encore le Cloud" :');
  console.log('   → Railway est en train de redéployer');
  console.log('   → Attendez 2-3 minutes');
  console.log('   → Relancez ce script');
  console.log('');
}

checkDeployment().catch(err => {
  console.error('❌ Erreur fatale :', err.message);
  console.log('\n💡 Solution : Vérifiez que Railway est accessible');
});
