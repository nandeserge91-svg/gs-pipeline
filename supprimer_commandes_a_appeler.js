/**
 * SCRIPT DE SUPPRESSION - COMMANDES "À APPELER"
 * 
 * ⚠️ ATTENTION : Ce script supprime TOUTES les commandes avec statut :
 * - NOUVELLE
 * - A_APPELER
 * 
 * Cette action est IRRÉVERSIBLE !
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function supprimerCommandesAAppeler() {
  console.log('\n🔍 Recherche des commandes "À appeler"...\n');

  try {
    // 1. Compter les commandes à supprimer
    const count = await prisma.order.count({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      }
    });

    console.log(`📊 Nombre de commandes trouvées : ${count}\n`);

    if (count === 0) {
      console.log('✅ Aucune commande à supprimer.\n');
      return;
    }

    // 2. Afficher les détails des commandes
    const commandes = await prisma.order.findMany({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      },
      select: {
        id: true,
        reference: true,
        clientNom: true,
        clientTelephone: true,
        produitNom: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 Liste des commandes à supprimer :\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    commandes.forEach((cmd, index) => {
      console.log(`${index + 1}. Ref: ${cmd.reference}`);
      console.log(`   Client: ${cmd.clientNom} (${cmd.clientTelephone})`);
      console.log(`   Produit: ${cmd.produitNom}`);
      console.log(`   Statut: ${cmd.status}`);
      console.log(`   Date: ${new Date(cmd.createdAt).toLocaleString('fr-FR')}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');

    // 3. Demander confirmation
    console.log('⚠️  ATTENTION : Cette suppression est IRRÉVERSIBLE !\n');
    console.log(`🗑️  Vous êtes sur le point de supprimer ${count} commande(s).\n`);

    // 4. Supprimer les commandes
    console.log('🗑️  Suppression en cours...\n');

    const result = await prisma.order.deleteMany({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      }
    });

    console.log(`✅ ${result.count} commande(s) supprimée(s) avec succès !\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
supprimerCommandesAAppeler()
  .then(() => {
    console.log('✅ Script terminé.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error);
    process.exit(1);
  });

