import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifierCommande() {
  try {
    console.log('🔍 Vérification des commandes EXPRESS...\n');
    
    // Trouver une commande EXPRESS
    const expressOrders = await prisma.order.findMany({
      where: {
        status: 'EXPRESS'
      },
      take: 5,
      include: {
        deliverer: {
          select: {
            id: true,
            prenom: true,
            nom: true
          }
        }
      }
    });

    if (expressOrders.length === 0) {
      console.log('❌ Aucune commande EXPRESS trouvée\n');
      return;
    }

    console.log(`✅ ${expressOrders.length} commande(s) EXPRESS trouvée(s):\n`);
    
    expressOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.clientNom}`);
      console.log(`   Référence: ${order.orderReference}`);
      console.log(`   Produit: ${order.produitNom}`);
      console.log(`   Agence: ${order.agenceRetrait}`);
      console.log(`   Statut: ${order.status}`);
      console.log(`   Livreur: ${order.deliverer ? `${order.deliverer.prenom} ${order.deliverer.nom}` : 'Non assigné'}`);
      console.log('');
    });

    // Vérifier les commandes EXPEDITION
    const expeditionOrders = await prisma.order.findMany({
      where: {
        status: 'EXPEDITION'
      },
      take: 3
    });

    console.log(`\n📦 ${expeditionOrders.length} commande(s) EXPÉDITION:\n`);
    expeditionOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.clientNom} - ${order.clientVille}`);
      console.log(`   Statut: ${order.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifierCommande();
