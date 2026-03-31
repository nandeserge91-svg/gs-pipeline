/**
 * Met a jour le prix unitaire KITPNEU (Kit Reparation Express) et aligne le texte V2 WhatsApp.
 * Usage: DATABASE_URL=... node scripts/update-kitpneu-price.cjs
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

function syncPricesInText(s) {
  if (!s || typeof s !== 'string') return s;
  return s
    .replace(/23\s*900/g, '15 000')
    .replace(/23900/g, '15000')
    .replace(/16\s*900/g, '10 000')
    .replace(/16900/g, '10000')
    .replace(/9\s*900/g, '5 000')
    .replace(/9900/g, '5000');
}

function syncJsonArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const out = { ...item };
    if (typeof out.answer === 'string') out.answer = syncPricesInText(out.answer);
    return out;
  });
}

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL manquant. Exemple: DATABASE_URL=postgresql://... node scripts/update-kitpneu-price.cjs');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  const prod =
    (await prisma.product.findFirst({
      where: {
        OR: [
          { code: { equals: 'KITPNEU', mode: 'insensitive' } },
          { nom: { contains: 'Kit Reparation', mode: 'insensitive' } },
          { nom: { contains: 'KITPNEU', mode: 'insensitive' } }
        ],
        actif: true
      }
    })) ||
    (await prisma.product.findFirst({
      where: { id: 34 }
    }));

  if (!prod) {
    console.error('Produit KITPNEU / Kit Reparation Express introuvable.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Produit: id=${prod.id} code=${prod.code} nom=${prod.nom}`);
  console.log(`Ancien prix: unitaire=${prod.prixUnitaire} prix1=${prod.prix1} prix2=${prod.prix2} prix3=${prod.prix3}`);

  await prisma.product.update({
    where: { id: prod.id },
    data: {
      prixUnitaire: 5000,
      prix1: 5000,
      prix2: null,
      prix3: null
    }
  });

  console.log('Produit mis a jour: prixUnitaire=5000, prix1=5000 (prix2/prix3 vides => 2 kits=10000, 3=15000 via unitaire)');

  const k = await prisma.whatsAppProductKnowledge.findUnique({ where: { productId: prod.id } });

  if (!k) {
    console.log('Aucune ligne WhatsAppProductKnowledge pour ce produit.');
    await prisma.$disconnect();
    return;
  }

  await prisma.whatsAppProductKnowledge.update({
    where: { productId: prod.id },
    data: {
      keyBenefits: syncPricesInText(k.keyBenefits),
      usageTips: syncPricesInText(k.usageTips),
      closingScript: syncPricesInText(k.closingScript),
      missingInfoEscalation: syncPricesInText(k.missingInfoEscalation),
      objectionHandling: syncJsonArray(k.objectionHandling),
      faq: syncJsonArray(k.faq)
    }
  });

  const k2 = await prisma.whatsAppProductKnowledge.findUnique({ where: { productId: prod.id } });
  console.log('Knowledge V2 aligne. Extrait keyBenefits (100 premiers caracteres):');
  console.log((k2.keyBenefits || '').slice(0, 120) + '...');

  await prisma.$disconnect();
})();
