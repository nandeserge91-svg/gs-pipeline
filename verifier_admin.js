/**
 * SCRIPT - VÉRIFIER/CRÉER UN COMPTE ADMIN
 * 
 * Ce script vous permet de :
 * 1. Vérifier si un compte admin existe
 * 2. Créer un nouveau compte admin si besoin
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifierAdmin() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔐 VÉRIFICATION DES COMPTES ADMIN                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Chercher tous les admins
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        actif: true
      }
    });

    console.log(`📊 Nombre de comptes ADMIN trouvés : ${admins.length}\n`);

    if (admins.length === 0) {
      console.log('❌ Aucun compte ADMIN trouvé.\n');
      console.log('💡 Voulez-vous en créer un ?\n');
      console.log('   Modifiez le script et décommentez la section "CRÉER UN ADMIN"\n');
      return;
    }

    console.log('📋 Liste des comptes ADMIN :\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.prenom} ${admin.nom}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Statut: ${admin.actif ? '✅ Actif' : '❌ Désactivé'}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 Utilisez un de ces emails pour vous connecter.\n');
    console.log('   Si vous avez oublié le mot de passe, contactez l\'administrateur système.\n');

    // ============================================
    // 🆕 CRÉER UN NOUVEAU COMPTE ADMIN (décommentez si besoin)
    // ============================================
    /*
    console.log('🆕 Création d\'un nouveau compte admin...\n');

    const newAdmin = await prisma.user.create({
      data: {
        email: 'nouvel-admin@afgestion.com',  // ⚠️ MODIFIEZ ICI
        password: await bcrypt.hash('AdminPassword123!', 10),  // ⚠️ MODIFIEZ ICI
        nom: 'Admin',  // ⚠️ MODIFIEZ ICI
        prenom: 'Super',  // ⚠️ MODIFIEZ ICI
        role: 'ADMIN',
        actif: true,
        telephone: '0000000000'
      }
    });

    console.log('✅ Nouveau compte ADMIN créé :\n');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Nom: ${newAdmin.prenom} ${newAdmin.nom}`);
    console.log('   Mot de passe: AdminPassword123!\n');
    console.log('⚠️  Changez ce mot de passe après votre première connexion !\n');
    */

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter
verifierAdmin()
  .then(() => {
    console.log('✅ Script terminé.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error.message);
    process.exit(1);
  });










