/**
 * Rétro-attribution callerId / calledAt pour les commandes déjà traitées
 * sans appelant en base (stats performance incomplètes).
 *
 * Utilise status_history : première transition depuis NOUVELLE/A_APPELER vers
 * VALIDEE, ANNULEE, INJOIGNABLE, EXPEDITION ou EXPRESS, effectuée par un user APPELANT.
 *
 * Usage:
 *   node scripts/backfill_callerid_from_history.js           # simulation
 *   node scripts/backfill_callerid_from_history.js --apply # écrit en base
 *
 * Nécessite DATABASE_URL (ex. .env local ou Railway: railway run node ... --apply)
 */
import dotenv from 'dotenv';

dotenv.config();

import prisma from '../config/prisma.js';

const QUEUE = ['NOUVELLE', 'A_APPELER'];
const OUTCOMES = ['VALIDEE', 'ANNULEE', 'INJOIGNABLE', 'EXPEDITION', 'EXPRESS'];

async function main() {
  const apply = process.argv.includes('--apply');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL manquant. Ajoutez-le au .env ou utilisez Railway CLI.');
    process.exit(1);
  }

  const appelants = await prisma.user.findMany({
    where: { role: 'APPELANT' },
    select: { id: true }
  });
  const appelantIds = new Set(appelants.map((u) => u.id));

  const orders = await prisma.order.findMany({
    where: {
      callerId: null,
      status: { notIn: ['NOUVELLE', 'A_APPELER'] }
    },
    select: {
      id: true,
      orderReference: true,
      status: true,
      validatedAt: true,
      calledAt: true
    }
  });

  console.log(
    `\n📋 Commandes sans callerId (hors file d'appel) : ${orders.length}\nMode : ${apply ? '✍️ APPLICATION' : '🔍 SIMULATION'}\n`
  );

  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    const histories = await prisma.statusHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' }
    });

    const hit = histories.find(
      (h) =>
        appelantIds.has(h.changedBy) &&
        (h.oldStatus == null || QUEUE.includes(h.oldStatus)) &&
        OUTCOMES.includes(h.newStatus)
    );

    if (!hit) {
      skipped++;
      continue;
    }

    const data = {
      callerId: hit.changedBy,
      calledAt: hit.createdAt
    };
    if (
      !order.validatedAt &&
      ['VALIDEE', 'ANNULEE', 'INJOIGNABLE'].includes(hit.newStatus)
    ) {
      data.validatedAt = hit.createdAt;
    }

    if (apply) {
      await prisma.order.update({
        where: { id: order.id },
        data
      });
    }

    console.log(
      `${apply ? '✅' : '•'} ${order.orderReference} (id ${order.id}) → appelant userId ${hit.changedBy} (${hit.newStatus} @ ${hit.createdAt.toISOString()})`
    );
    updated++;
  }

  console.log(`\nRésumé : ${updated} corrigée(s), ${skipped} sans historique appelant exploitable.\n`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
