/**
 * Script de diagnostic : Vérifier les commandes renvoyées vers "À appeler"
 * 
 * Usage :
 * node verifier_commande_renvoyee.js [orderReference]
 * 
 * Exemple :
 * node verifier_commande_renvoyee.js CMD-123
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifierCommande() {
  try {
    const orderRef = process.argv[2];
    
    if (!orderRef) {
      console.log('\n❌ Veuillez fournir une référence de commande');
      console.log('Usage: node verifier_commande_renvoyee.js CMD-123\n');
      process.exit(1);
    }

    console.log(`\n🔍 Recherche de la commande ${orderRef}...\n`);

    const order = await prisma.order.findFirst({
      where: {
        orderReference: orderRef
      },
      include: {
        caller: {
          select: { prenom: true, nom: true }
        },
        deliverer: {
          select: { prenom: true, nom: true }
        }
      }
    });

    if (!order) {
      console.log(`❌ Commande ${orderRef} NON TROUVÉE dans la base de données\n`);
      console.log('Vérifiez la référence ou regardez toutes les commandes A_APPELER :\n');
      
      const commandesAAppeler = await prisma.order.findMany({
        where: {
          status: 'A_APPELER'
        },
        select: {
          orderReference: true,
          clientNom: true,
          renvoyeAAppelerAt: true
        },
        orderBy: [
          { renvoyeAAppelerAt: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10
      });
      
      console.log(`📋 Les 10 dernières commandes "À APPELER" :\n`);
      commandesAAppeler.forEach((cmd, idx) => {
        console.log(`${idx + 1}. ${cmd.orderReference} - ${cmd.clientNom}${cmd.renvoyeAAppelerAt ? ' 🟢 RENVOYÉE' : ''}`);
      });
      console.log();
      
      process.exit(0);
    }

    console.log('✅ COMMANDE TROUVÉE\n');
    console.log('─'.repeat(60));
    console.log('📋 INFORMATIONS GÉNÉRALES');
    console.log('─'.repeat(60));
    console.log(`Référence       : ${order.orderReference}`);
    console.log(`Client          : ${order.clientNom}`);
    console.log(`Téléphone       : ${order.clientTelephone}`);
    console.log(`Ville           : ${order.clientVille}`);
    console.log(`Produit         : ${order.produitNom}`);
    console.log(`Quantité        : ${order.quantite}`);
    console.log(`Montant         : ${order.montant} FCFA`);
    console.log();

    console.log('─'.repeat(60));
    console.log('🎯 STATUT ET TYPE');
    console.log('─'.repeat(60));
    console.log(`Status          : ${order.status} ${order.status === 'A_APPELER' ? '✅' : '❌'}`);
    console.log(`Type livraison  : ${order.deliveryType}`);
    console.log();

    console.log('─'.repeat(60));
    console.log('👥 ASSIGNATIONS');
    console.log('─'.repeat(60));
    console.log(`Appelant        : ${order.caller ? `${order.caller.prenom} ${order.caller.nom}` : 'Aucun ✅'}`);
    console.log(`callerId        : ${order.callerId || 'null ✅'}`);
    console.log(`calledAt        : ${order.calledAt || 'null ✅'}`);
    console.log();
    console.log(`Livreur         : ${order.deliverer ? `${order.deliverer.prenom} ${order.deliverer.nom}` : 'Aucun ✅'}`);
    console.log(`delivererId     : ${order.delivererId || 'null ✅'}`);
    console.log(`deliveryDate    : ${order.deliveryDate || 'null ✅'}`);
    console.log(`deliveryListId  : ${order.deliveryListId || 'null ✅'}`);
    console.log();

    console.log('─'.repeat(60));
    console.log('📅 RDV (CRITIQUE POUR VISIBILITÉ)');
    console.log('─'.repeat(60));
    console.log(`rdvProgramme    : ${order.rdvProgramme} ${order.rdvProgramme ? '❌ BLOQUE AFFICHAGE !' : '✅'}`);
    console.log(`rdvDate         : ${order.rdvDate || 'null ✅'}`);
    console.log(`rdvNote         : ${order.rdvNote || 'null ✅'}`);
    console.log(`rdvRappele      : ${order.rdvRappele} ${order.rdvRappele ? '⚠️' : '✅'}`);
    console.log(`rdvProgrammePar : ${order.rdvProgrammePar || 'null ✅'}`);
    console.log();

    console.log('─'.repeat(60));
    console.log('⭐ RENVOI (POUR TRI PRIORITAIRE)');
    console.log('─'.repeat(60));
    console.log(`renvoyeAAppelerAt: ${order.renvoyeAAppelerAt ? order.renvoyeAAppelerAt : 'null ❌'}`);
    if (order.renvoyeAAppelerAt) {
      console.log(`   ✅ Commande renvoyée le ${new Date(order.renvoyeAAppelerAt).toLocaleString('fr-FR')}`);
    } else {
      console.log(`   ⚠️  Commande normale (pas renvoyée)`);
    }
    console.log();

    console.log('─'.repeat(60));
    console.log('📝 NOTES');
    console.log('─'.repeat(60));
    console.log(`Note appelant   : ${order.noteAppelant || '(vide)'}`);
    console.log(`Note livreur    : ${order.noteLivreur || '(vide)'}`);
    console.log(`Note gestionnaire: ${order.noteGestionnaire || '(vide)'}`);
    console.log();

    console.log('─'.repeat(60));
    console.log('📅 DATES');
    console.log('─'.repeat(60));
    console.log(`Créée le        : ${new Date(order.createdAt).toLocaleString('fr-FR')}`);
    console.log(`Modifiée le     : ${new Date(order.updatedAt).toLocaleString('fr-FR')}`);
    if (order.validatedAt) {
      console.log(`Validée le      : ${new Date(order.validatedAt).toLocaleString('fr-FR')}`);
    }
    console.log();

    console.log('─'.repeat(60));
    console.log('🔍 DIAGNOSTIC');
    console.log('─'.repeat(60));
    
    const diagnostics = [];
    
    // Vérifier statut
    if (order.status !== 'A_APPELER') {
      diagnostics.push('❌ Status n\'est PAS "A_APPELER" !');
    } else {
      diagnostics.push('✅ Status correct : A_APPELER');
    }
    
    // Vérifier RDV
    if (order.rdvProgramme) {
      diagnostics.push('❌ rdvProgramme = true → COMMANDE CACHÉE dans "À appeler" !');
      diagnostics.push('   Solution : Réinitialiser rdvProgramme à false');
    } else {
      diagnostics.push('✅ Pas de RDV programmé (visible dans "À appeler")');
    }
    
    // Vérifier champ renvoi
    if (order.renvoyeAAppelerAt) {
      diagnostics.push('✅ renvoyeAAppelerAt rempli → Devrait être EN HAUT');
    } else {
      diagnostics.push('⚠️  renvoyeAAppelerAt null → Position chronologique normale');
    }
    
    // Vérifier assignations
    if (!order.callerId && !order.delivererId) {
      diagnostics.push('✅ Aucune assignation (commande libre)');
    } else {
      if (order.callerId) {
        diagnostics.push('⚠️  Appelant assigné (attendu : null)');
      }
      if (order.delivererId) {
        diagnostics.push('⚠️  Livreur assigné (attendu : null)');
      }
    }
    
    diagnostics.forEach(d => console.log(d));
    console.log();
    
    // Résumé final
    const isVisible = order.status === 'A_APPELER' && !order.rdvProgramme;
    
    console.log('─'.repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('─'.repeat(60));
    if (isVisible) {
      console.log('✅ COMMANDE DEVRAIT ÊTRE VISIBLE dans "À appeler"');
      if (order.renvoyeAAppelerAt) {
        console.log('⭐ ET devrait être EN HAUT de la liste');
      } else {
        console.log('📋 Position : Ordre chronologique (date de création)');
      }
    } else {
      console.log('❌ COMMANDE INVISIBLE dans "À appeler" !');
      console.log('\nRaisons possibles :');
      if (order.status !== 'A_APPELER') {
        console.log(`  - Status incorrect : ${order.status} (attendu : A_APPELER)`);
      }
      if (order.rdvProgramme) {
        console.log('  - RDV programmé : true (bloque affichage)');
      }
    }
    console.log('─'.repeat(60));
    console.log();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifierCommande();



