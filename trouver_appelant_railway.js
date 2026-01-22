import { PrismaClient } from '@prisma/client';

// Configuration Prisma avec l'URL Railway
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:wPpyDIIQxtBrYFIaZVDBnCDofLcIIupx@postgres.railway.internal:5432/railway'
    }
  }
});

async function trouverAppelant() {
  try {
    console.log('🔍 Connexion à Railway et recherche de la commande...\n');
    
    // Rechercher la commande exacte
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
      console.log('❌ Commande non trouvée avec ces critères exacts.');
      
      // Recherche plus large
      console.log('\n🔍 Recherche plus large (toutes les Christelle avec BEE VENOM)...\n');
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
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      if (commandes.length > 0) {
        console.log(`✅ ${commandes.length} commande(s) similaire(s) trouvée(s):\n`);
        commandes.forEach((cmd, index) => {
          console.log(`${index + 1}. Commande #${cmd.id}`);
          console.log(`   📋 Référence: ${cmd.orderReference}`);
          console.log(`   👤 Client: ${cmd.clientNom}`);
          console.log(`   📦 Produit: ${cmd.produitNom}`);
          console.log(`   📍 Ville: ${cmd.clientVille}`);
          console.log(`   💰 Montant: ${cmd.montant} F CFA`);
          console.log(`   📊 Statut: ${cmd.status}`);
          console.log(`   📅 Date: ${new Date(cmd.createdAt).toLocaleString('fr-FR')}`);
          if (cmd.caller) {
            console.log(`   🎯 Appelant: ${cmd.caller.prenom} ${cmd.caller.nom} (${cmd.caller.email})`);
          } else {
            console.log(`   ⚠️ Appelant: Non assigné`);
          }
          console.log('');
        });
      } else {
        console.log('❌ Aucune commande trouvée même avec recherche large.');
      }
      
      return;
    }

    // ✅ Commande trouvée - Afficher tous les détails
    console.log('✅ ✅ ✅ COMMANDE TROUVÉE ✅ ✅ ✅\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Référence: ${commande.orderReference}`);
    console.log(`📝 ID: ${commande.id}`);
    console.log(`👤 Client: ${commande.clientNom}`);
    console.log(`📱 Téléphone: ${commande.clientTelephone}`);
    console.log(`📍 Ville: ${commande.clientVille}`);
    console.log(`🏠 Adresse: ${commande.clientAdresse || 'Non renseignée'}`);
    console.log(`📦 Produit: ${commande.produitNom}`);
    console.log(`💰 Montant: ${commande.montant.toLocaleString()} F CFA`);
    console.log(`📊 Statut: ${commande.status}`);
    console.log(`📅 Date création: ${new Date(commande.createdAt).toLocaleString('fr-FR')}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Afficher l'appelant assigné
    if (commande.caller) {
      console.log('🎯 🎯 🎯 APPELANT QUI A TRAITÉ CETTE COMMANDE 🎯 🎯 🎯\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`👤 Nom complet: ${commande.caller.prenom} ${commande.caller.nom}`);
      console.log(`📧 Email: ${commande.caller.email}`);
      console.log(`📱 Téléphone: ${commande.caller.telephone || 'Non renseigné'}`);
      console.log(`🎭 Rôle: ${commande.caller.role}`);
      console.log(`🆔 ID: ${commande.caller.id}`);
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️ ⚠️ ⚠️ AUCUN APPELANT ASSIGNÉ à cette commande ⚠️ ⚠️ ⚠️\n');
    }

    // Afficher l'historique complet des statuts
    if (commande.statusHistory && commande.statusHistory.length > 0) {
      console.log('📜 HISTORIQUE COMPLET DES STATUTS:\n');
      console.log('═══════════════════════════════════════════════════════════');
      commande.statusHistory.forEach((history, index) => {
        console.log(`\n${index + 1}. 📊 Statut: ${history.status}`);
        console.log(`   📅 Date: ${new Date(history.createdAt).toLocaleString('fr-FR')}`);
        if (history.user) {
          console.log(`   👤 Par: ${history.user.prenom} ${history.user.nom} (${history.user.role})`);
          console.log(`   📧 Email: ${history.user.email}`);
        } else {
          console.log(`   🤖 Système (automatique)`);
        }
        if (history.note) {
          console.log(`   📝 Note: ${history.note}`);
        }
      });
      console.log('\n═══════════════════════════════════════════════════════════\n');
    }

    // 🎯 Trouver QUI A VALIDÉ (changé le statut vers VALIDEE)
    const validation = commande.statusHistory.find(h => h.status === 'VALIDEE');
    if (validation) {
      console.log('✅ ✅ ✅ UTILISATEUR QUI A VALIDÉ LA COMMANDE ✅ ✅ ✅\n');
      console.log('═══════════════════════════════════════════════════════════');
      if (validation.user) {
        console.log(`👤 NOM COMPLET: ${validation.user.prenom} ${validation.user.nom}`);
        console.log(`📧 EMAIL: ${validation.user.email}`);
        console.log(`🎭 RÔLE: ${validation.user.role}`);
        console.log(`📅 DATE DE VALIDATION: ${new Date(validation.createdAt).toLocaleString('fr-FR')}`);
        if (validation.note) {
          console.log(`📝 NOTE: ${validation.note}`);
        }
      } else {
        console.log(`🤖 Validation automatique (système)`);
        console.log(`📅 DATE: ${new Date(validation.createdAt).toLocaleString('fr-FR')}`);
      }
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️ Cette commande n\'a jamais été VALIDEE (statut VALIDEE introuvable)\n');
      console.log('Statuts actuels disponibles:');
      commande.statusHistory.forEach(h => console.log(`  - ${h.status}`));
      console.log('');
    }

    // Résumé final
    console.log('\n📋 RÉSUMÉ:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Commande: ${commande.clientNom} - ${commande.produitNom}`);
    console.log(`Ville: ${commande.clientVille}`);
    console.log(`Montant: ${commande.montant} F CFA`);
    if (commande.caller) {
      console.log(`\n✅ Appelant assigné: ${commande.caller.prenom} ${commande.caller.nom}`);
    } else {
      console.log(`\n⚠️ Aucun appelant assigné`);
    }
    if (validation && validation.user) {
      console.log(`✅ Validée par: ${validation.user.prenom} ${validation.user.nom}`);
      console.log(`✅ Le: ${new Date(validation.createdAt).toLocaleString('fr-FR')}`);
    }
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('\nDétails:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

trouverAppelant();



























