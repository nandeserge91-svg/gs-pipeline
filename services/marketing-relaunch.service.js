import prisma from '../config/prisma.js';
import { generateSmsFromTemplate, sendSMS } from './sms.service.js';

export const MARKETING_REMINDER_DAYS = Object.freeze([3, 5, 7]);
export const MARKETING_MAX_ATTEMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

const REMINDER_TYPES = Object.freeze({
  3: 'MARKETING_RELANCE_J3',
  5: 'MARKETING_RELANCE_J5',
  7: 'MARKETING_RELANCE_J7'
});

const REMINDER_TEMPLATE_FIELDS = Object.freeze({
  3: 'marketingTemplateJ3',
  5: 'marketingTemplateJ5',
  7: 'marketingTemplateJ7'
});

export function buildMarketingReminderSchedule(orderId, cancellationAt) {
  const cancelledAt = new Date(cancellationAt);

  if (!Number.isInteger(orderId) || orderId <= 0 || Number.isNaN(cancelledAt.getTime())) {
    throw new Error('Données invalides pour planifier les relances marketing');
  }

  return MARKETING_REMINDER_DAYS.map((dayOffset) => ({
    orderId,
    cancellationAt: cancelledAt,
    dayOffset,
    dueAt: new Date(cancelledAt.getTime() + dayOffset * DAY_MS)
  }));
}

export async function scheduleMarketingReminders(db, orderId, cancellationAt) {
  return db.marketingReminder.createMany({
    data: buildMarketingReminderSchedule(orderId, cancellationAt),
    skipDuplicates: true
  });
}

export async function cancelPendingMarketingReminders(db, orderId) {
  return db.marketingReminder.updateMany({
    where: {
      orderId,
      status: { in: ['PENDING', 'PROCESSING', 'FAILED'] }
    },
    data: {
      status: 'CANCELLED',
      errorMessage: 'Commande sortie du statut ANNULEE'
    }
  });
}

function isSameInstant(left, right) {
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
}

function isValidMarketingUrl(value) {
  if (!value || typeof value !== 'string') return false;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function firstName(clientName) {
  return String(clientName || 'Client').trim().split(/\s+/)[0] || 'Client';
}

function groupDueReminders(reminders) {
  const grouped = new Map();

  for (const reminder of reminders) {
    const group = grouped.get(reminder.orderId) || [];
    group.push(reminder);
    grouped.set(reminder.orderId, group);
  }

  return [...grouped.values()].map((group) =>
    group.sort((left, right) => new Date(right.dueAt) - new Date(left.dueAt))
  );
}

export async function runMarketingRelaunches(options = {}) {
  const db = options.db || prisma;
  const sendSms = options.sendSms || sendSMS;
  const generateMessage = options.generateMessage || generateSmsFromTemplate;
  const env = options.env || process.env;
  const logger = options.logger || console;
  const now = options.now ? new Date(options.now) : new Date();

  const summary = {
    disabled: false,
    sent: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    recovered: 0
  };

  if (env.SMS_ENABLED !== 'true' || env.SMS_MARKETING_RELAUNCH !== 'true') {
    summary.disabled = true;
    return summary;
  }

  const processingTimeout = new Date(now.getTime() - 30 * 60 * 1000);
  await db.marketingReminder.updateMany({
    where: {
      status: 'PROCESSING',
      lastAttemptAt: { lt: processingTimeout }
    },
    data: {
      status: 'FAILED',
      errorMessage: 'Relance réouverte après interruption du traitement'
    }
  });

  const dueReminders = await db.marketingReminder.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      dueAt: { lte: now },
      order: {
        is: {
          status: 'ANNULEE',
          marketingCancelledAt: { not: null },
          product: {
            is: {
              marketingEnabled: true,
              marketingFunnelUrl: { not: null }
            }
          }
        }
      }
    },
    include: {
      order: {
        include: { product: true }
      }
    },
    orderBy: [
      { orderId: 'asc' },
      { dueAt: 'desc' }
    ],
    take: 300
  });

  for (const reminders of groupDueReminders(dueReminders)) {
    const [reminder, ...outdated] = reminders;

    if (outdated.length > 0) {
      const skippedResult = await db.marketingReminder.updateMany({
        where: { id: { in: outdated.map((item) => item.id) } },
        data: {
          status: 'SKIPPED',
          errorMessage: 'Échéance plus récente déjà atteinte'
        }
      });
      summary.skipped += skippedResult.count;
    }

    const order = reminder.order;
    const isStillCancelled = order?.status === 'ANNULEE'
      && isSameInstant(order.marketingCancelledAt, reminder.cancellationAt);

    if (!isStillCancelled) {
      await db.marketingReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'CANCELLED',
          errorMessage: 'Commande réactivée ou cycle d’annulation remplacé'
        }
      });
      summary.skipped += 1;
      continue;
    }

    if (!order.product?.marketingEnabled) {
      summary.blocked += 1;
      continue;
    }

    const marketingUrl = order.product?.marketingFunnelUrl?.trim();
    if (!isValidMarketingUrl(marketingUrl)) {
      summary.blocked += 1;
      continue;
    }

    const smsType = REMINDER_TYPES[reminder.dayOffset];
    const templateField = REMINDER_TEMPLATE_FIELDS[reminder.dayOffset];
    if (!smsType || !templateField) {
      await db.marketingReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SKIPPED',
          errorMessage: `Échéance marketing inconnue: J+${reminder.dayOffset}`
        }
      });
      summary.skipped += 1;
      continue;
    }

    const productTemplate = order.product?.[templateField]?.trim();
    if (!productTemplate) {
      summary.blocked += 1;
      continue;
    }

    const existingSms = await db.smsLog.findFirst({
      where: {
        orderId: order.id,
        type: smsType,
        status: 'SENT',
        sentAt: { gte: reminder.cancellationAt }
      },
      select: { id: true, sentAt: true }
    });

    if (existingSms) {
      await db.marketingReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: existingSms.sentAt,
          smsLogId: existingSms.id,
          errorMessage: null
        }
      });
      summary.recovered += 1;
      continue;
    }

    if (reminder.attempts >= MARKETING_MAX_ATTEMPTS) {
      summary.failed += 1;
      continue;
    }

    const claimed = await db.marketingReminder.updateMany({
      where: {
        id: reminder.id,
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: MARKETING_MAX_ATTEMPTS }
      },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
        lastAttemptAt: now,
        errorMessage: null
      }
    });

    if (claimed.count !== 1) continue;

    try {
      const message = await generateMessage(smsType, {
        prenom: firstName(order.clientNom),
        produit: order.product?.nom || order.produitNom,
        lien: marketingUrl
      }, productTemplate);

      const result = await sendSms(order.clientTelephone, message, {
        orderId: order.id,
        type: smsType,
        userId: order.callerId || null
      });

      if (!result.success) {
        throw new Error(result.error || 'Échec de l’envoi SMS marketing');
      }

      await db.marketingReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: now,
          smsLogId: result.smsLogId || null,
          errorMessage: null
        }
      });

      summary.sent += 1;
      logger.log(`✅ Relance marketing J+${reminder.dayOffset} envoyée pour ${order.orderReference}`);
    } catch (error) {
      await db.marketingReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
      summary.failed += 1;
      logger.error(`❌ Relance marketing J+${reminder.dayOffset} échouée pour ${order.orderReference}:`, error.message);
    }
  }

  return summary;
}

export default {
  MARKETING_REMINDER_DAYS,
  buildMarketingReminderSchedule,
  scheduleMarketingReminders,
  cancelPendingMarketingReminders,
  runMarketingRelaunches
};
