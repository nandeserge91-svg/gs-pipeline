/**
 * Script de diagnostic : Trouver les commandes invisibles dans "À appeler"
 * 
 * Usage :
 * node diagnostiquer_commandes_invisibles.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnostiquer() {
  try {
    console.log('\n🔍 DIAGNOSTIC : Commandes invisibles dans "À appeler"\n');
    console.log('─'.repeat(80));

    // Récupérer TOUTES les commandes NOUVELLE et A_APPELER
    const toutesCommandes = await prisma.order.findMany({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      },
      select: {
        id: true,
        orderReference: true,
        clientNom: true,
        clientTelephone: true,
        status: true,
        rdvProgramme: true,
        rdvDate: true,
        deliveryType: true,
        createdAt: true,
        renvoyeAAppelerAt: true
      },
      orderBy: [
        { renvoyeAAppelerAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`\n📊 Total commandes NOUVELLE ou A_APPELER : ${toutesCommandes.length}\n`);

    // Séparer les commandes
    const commandesVisibles = toutesCommandes.filter(c => !c.rdvProgramme);
    const commandesAvecRDV = toutesCommandes.filter(c => c.rdvProgramme);

    console.log('─'.repeat(80));
    console.log('✅ COMMANDES VISIBLES dans "À appeler"');
    console.log('─'.repeat(80));
    console.log(`Total : ${commandesVisibles.length}\n`);

    if (commandesVisibles.length > 0) {
      console.log('Les 10 premières :');
      commandesVisibles.slice(0, 10).forEach((cmd, idx) => {
        const renvoyee = cmd.renvoyeAAppelerAt ? ' 🟢 RENVOYÉE' : '';
        console.log(`${idx + 1}. ${cmd.orderReference} - ${cmd.clientNom} - ${cmd.clientTelephone}${renvoyee}`);
        console.log(`   Status: ${cmd.status} | Type: ${cmd.deliveryType}`);
      });
    }

    console.log('\n' + '─'.repeat(80));
    console.log('❌ COMMANDES CACHÉES (RDV programmé)');
    console.log('─'.repeat(80));
    console.log(`Total : ${commandesAvecRDV.length}\n`);

    if (commandesAvecRDV.length > 0) {
      console.log('⚠️  Ces commandes existent mais sont INVISIBLES dans "À appeler" :');
      console.log();
      commandesAvecRDV.forEach((cmd, idx) => {
        const rdvDate = cmd.rdvDate ? new Date(cmd.rdvDate).toLocaleString('fr-FR') : 'Date non définie';
        console.log(`${idx + 1}. ${cmd.orderReference} - ${cmd.clientNom}`);
        console.log(`   📞 ${cmd.clientTelephone}`);
        console.log(`   Status: ${cmd.status} | Type: ${cmd.deliveryType}`);
        console.log(`   📅 RDV: ${rdvDate}`);
        console.log();
      });
    } else {
      console.log('✅ Aucune commande avec RDV programmé');
    }

    console.log('─'.repeat(80));
    console.log('📋 RÉSUMÉ');
    console.log('─'.repeat(80));
    console.log(`Total NOUVELLE/A_APPELER  : ${toutesCommandes.length}`);
    console.log(`  ├─ Visibles (sans RDV)  : ${commandesVisibles.length} ✅`);
    console.log(`  └─ Cachées (avec RDV)   : ${commandesAvecRDV.length} ❌`);
    console.log();

    if (commandesAvecRDV.length > 0) {
      console.log('⚠️  PROBLÈME DÉTECTÉ :');
      console.log(`   ${commandesAvecRDV.length} commandes sont CACHÉES dans "À appeler"`);
      console.log('   car elles ont un RDV programmé (rdvProgramme = true)');
      console.log();
      console.log('💡 SOLUTIONS POSSIBLES :');
      console.log('   1. Afficher aussi les RDV dans "À appeler" (avec badge "RDV")');
      console.log('   2. Garder les RDV séparés dans la page "RDV"');
      console.log('   3. Ajouter une option "Voir avec RDV" dans "À appeler"');
    } else {
      console.log('✅ Aucun problème détecté !');
      console.log('   Toutes les commandes NOUVELLE/A_APPELER sont visibles.');
    }

    console.log('─'.repeat(80));
    console.log();

    // Vérifier les types de livraison
    const parType = {};
    toutesCommandes.forEach(cmd => {
      const type = cmd.deliveryType || 'LOCAL';
      parType[type] = (parType[type] || 0) + 1;
    });

    console.log('📦 Répartition par type de livraison :');
    Object.entries(parType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnostiquer();



