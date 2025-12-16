import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function trouverAppelant() {
  try {
    console.log('🔍 Recherche de la commande...\n');
    
    // Rechercher la commande
    const commande = await prisma.order.findFirst({
      where: {
        clientNom: {
          contains: 'Christelle',
          mode: 'insensitive'
        },
        produitNom: {
          contains: 'BEE VENOM',
          mode: 'insensitive'
        },
        clientVille: {
          contains: 'San Pedro',
          mode: 'insensitive'
        },
        montant: 9900
      },
      include: {
        caller: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            role: true
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!commande) {
      console.log('❌ Commande non trouvée avec ces critères.');
      
      // Recherche plus large
      console.log('\n🔍 Recherche plus large...\n');
      const commandes = await prisma.order.findMany({
        where: {
          OR: [
            {
              clientNom: {
                contains: 'Christelle',
                mode: 'insensitive'
              }
            },
            {
              clientNom: {
                contains: 'akabla',
                mode: 'insensitive'
              }
            }
          ],
          produitNom: {
            contains: 'BEE VENOM',
            mode: 'insensitive'
          }
        },
        include: {
          caller: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        },
        take: 10
      });

      if (commandes.length > 0) {
        console.log(`✅ ${commandes.length} commande(s) similaire(s) trouvée(s):\n`);
        commandes.forEach((cmd, index) => {
          console.log(`${index + 1}. Commande #${cmd.id}`);
          console.log(`   Référence: ${cmd.orderReference}`);
          console.log(`   Client: ${cmd.clientNom}`);
          console.log(`   Produit: ${cmd.produitNom}`);
          console.log(`   Ville: ${cmd.clientVille}`);
          console.log(`   Montant: ${cmd.montant} F CFA`);
          console.log(`   Statut: ${cmd.status}`);
          console.log(`   Date: ${cmd.createdAt}`);
          if (cmd.caller) {
            console.log(`   👤 Appelant: ${cmd.caller.prenom} ${cmd.caller.nom} (${cmd.caller.email})`);
          } else {
            console.log(`   👤 Appelant: Non assigné`);
          }
          console.log('');
        });
      } else {
        console.log('❌ Aucune commande trouvée même avec recherche large.');
      }
      
      return;
    }

    // Afficher les détails de la commande
    console.log('✅ COMMANDE TROUVÉE\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Référence: ${commande.orderReference}`);
    console.log(`📝 ID: ${commande.id}`);
    console.log(`👤 Client: ${commande.clientNom}`);
    console.log(`📱 Téléphone: ${commande.clientTelephone}`);
    console.log(`📍 Ville: ${commande.clientVille}`);
    console.log(`📦 Produit: ${commande.produitNom}`);
    console.log(`💰 Montant: ${commande.montant.toLocaleString()} F CFA`);
    console.log(`📊 Statut: ${commande.status}`);
    console.log(`📅 Date création: ${commande.createdAt}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Afficher l'appelant assigné
    if (commande.caller) {
      console.log('👤 APPELANT QUI A TRAITÉ CETTE COMMANDE:\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Nom complet: ${commande.caller.prenom} ${commande.caller.nom}`);
      console.log(`Email: ${commande.caller.email}`);
      console.log(`Téléphone: ${commande.caller.telephone || 'Non renseigné'}`);
      console.log(`Rôle: ${commande.caller.role}`);
      console.log(`ID: ${commande.caller.id}`);
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️ AUCUN APPELANT ASSIGNÉ à cette commande\n');
    }

    // Afficher l'historique des statuts
    if (commande.statusHistory && commande.statusHistory.length > 0) {
      console.log('📜 HISTORIQUE DES STATUTS:\n');
      console.log('═══════════════════════════════════════════════════════════');
      commande.statusHistory.forEach((history, index) => {
        console.log(`${index + 1}. ${history.status}`);
        console.log(`   Date: ${history.createdAt}`);
        if (history.user) {
          console.log(`   Par: ${history.user.prenom} ${history.user.nom} (${history.user.role})`);
        }
        if (history.note) {
          console.log(`   Note: ${history.note}`);
        }
        console.log('');
      });
      console.log('═══════════════════════════════════════════════════════════\n');
    }

    // Trouver qui a validé (changé le statut vers VALIDEE)
    const validation = commande.statusHistory.find(h => h.status === 'VALIDEE');
    if (validation && validation.user) {
      console.log('✅ UTILISATEUR QUI A VALIDÉ LA COMMANDE:\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`👤 ${validation.user.prenom} ${validation.user.nom}`);
      console.log(`📧 ${validation.user.email}`);
      console.log(`🎭 ${validation.user.role}`);
      console.log(`📅 Date de validation: ${validation.createdAt}`);
      if (validation.note) {
        console.log(`📝 Note: ${validation.note}`);
      }
      console.log('═══════════════════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

trouverAppelant();



