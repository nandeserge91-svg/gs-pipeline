import https from 'https';

const API_URL = 'gs-pipeline-production.up.railway.app';

console.log('🔍 === VÉRIFICATION DÉPLOIEMENT GOOGLE SHEETS ===\n');
console.log('⏰ Vérification en cours...\n');

const options = {
  hostname: API_URL,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = https.request(options, (res) => {
  console.log(`✅ Railway est ACTIF (Status: ${res.statusCode})\n`);
  console.log('════════════════════════════════════════════════════════');
  console.log('🧪 PROCHAINE ÉTAPE : TEST RÉEL\n');
  console.log('1. 📝 Remplissez votre formulaire Google (celui connecté à Sheets)');
  console.log('2. ⏰ Attendez 30 secondes');
  console.log('3. 📱 Vérifiez votre téléphone → SMS reçu\n');
  console.log('📩 Message attendu :');
  console.log('   "Bonjour [Prénom], votre commande ORD-XXXXX est enregistree.');
  console.log('   Nous vous appellerons bientot. - AFGestion"\n');
  console.log('📞 Expéditeur : +2250595871746 (votre Android)\n');
  console.log('════════════════════════════════════════════════════════');
});

req.on('timeout', () => {
  console.log('⏰ Timeout - Railway redémarre encore...');
  console.log('   Attendez 1-2 minutes et relancez ce script\n');
  req.destroy();
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('🔄 Railway redémarre encore...');
    console.log('   Attendez 1-2 minutes et relancez ce script\n');
  } else {
    console.error(`❌ Erreur: ${error.message}\n`);
  }
});

req.end();
