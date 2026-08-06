import prisma from '../config/prisma.js';
import {
  generateSmsFromTemplate,
  sendSms8Message
} from './sms.service.js';
import {
  sendWhatsAppMessage,
  WASENDER_PROVIDER_NAME
} from './wasender.service.js';

export const EXPRESS_REMINDER_DAYS = Object.freeze([1, 2, 3, 5, 7]);
export const EXPRESS_REMINDER_CHANNELS = Object.freeze(['SMS', 'WHATSAPP']);
export const EXPRESS_REMINDER_MAX_ATTEMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildExpressReminderSchedule(orderId, arrivedAt) {
  const arrival = new Date(arrivedAt);

  if (!Number.isInteger(orderId) || orderId <= 0 || Number.isNaN(arrival.getTime())) {
    throw new Error('Données invalides pour planifier les relances EXPRESS');
  }

  return EXPRESS_REMINDER_DAYS.flatMap(dayOffset =>
    EXPRESS_REMINDER_CHANNELS.map(channel => ({
      orderId,
      arrivedAt: arrival,
      dayOffset,
      channel,
      dueAt: new Date(arrival.getTime() + dayOffset * DAY_MS)
    }))
  );
}

export async function scheduleExpressReminders(db, orderId, arrivedAt) {
  return db.expressReminder.createMany({
    data: buildExpressReminderSchedule(orderId, arrivedAt),
    skipDuplicates: true
  });
}

export async function cancelPendingExpressReminders(db, orderId, reason = 'Retrait EXPRESS confirmé') {
  return db.expressReminder.updateMany({
    where: {
      orderId,
      status: { in: ['PENDING', 'PROCESSING', 'FAILED'] }
    },
    data: {
      status: 'CANCELLED',
      errorMessage: reason
    }
  });
}

export async function ensureExpressReminderSchedules(db) {
  const orders = await db.order.findMany({
    where: {
      status: 'EXPRESS_ARRIVE',
      arriveAt: { not: null }
    },
    select: { id: true, arriveAt: true }
  });

  let created = 0;
  for (const order of orders) {
    const result = await scheduleExpressReminders(db, order.id, order.arriveAt);
    created += result.count;
  }
  return created;
}

export function formatExpressReminderDelay(dayOffset) {
  const delays = {
    1: '24 heures',
    2: '48 heures',
    3: '72 heures',
    5: '5 jours',
    7: '7 jours'
  };
  return delays[dayOffset] || `${dayOffset} jours`;
}

function firstName(clientName) {
  return String(clientName || 'Client').trim().split(/\s+/)[0] || 'Client';
}

function isSameInstant(left, right) {
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
}

function groupDueReminders(reminders) {
  const grouped = new Map();

  for (const reminder of reminders) {
    const key = `${reminder.orderId}:${reminder.channel}`;
    const group = grouped.get(key) || [];
    group.push(reminder);
    grouped.set(key, group);
  }

  return [...grouped.values()].map(group =>
    group.sort((left, right) => new Date(right.dueAt) - new Date(left.dueAt))
  );
}

function providerFilter(channel) {
  return channel === 'WHATSAPP'
    ? WASENDER_PROVIDER_NAME
    : { startsWith: 'SMS8' };
}

function successfulStatuses(channel) {
  return channel === 'WHATSAPP'
    ? ['SENT', 'DELIVERED', 'READ']
    : ['SENT'];
}

export async function runExpressReminders(options = {}) {
  const db = options.db || prisma;
  const env = options.env || process.env;
  const now = options.now ? new Date(options.now) : new Date();
  const logger = options.logger || console;
  const generateMessage = options.generateMessage || generateSmsFromTemplate;
  const sendSms = options.sendSms || sendSms8Message;
  const sendWhatsapp = options.sendWhatsapp || sendWhatsAppMessage;

  const summary = {
    disabled: false,
    sent: 0,
    smsSent: 0,
    whatsappSent: 0,
    failed: 0,
    skipped: 0,
    recovered: 0,
    scheduled: 0
  };

  if (env.SMS_ENABLED !== 'true' || env.SMS_EXPRESS_REMINDER === 'false') {
    summary.disabled = true;
    return summary;
  }

  summary.scheduled = await ensureExpressReminderSchedules(db);

  const processingTimeout = new Date(now.getTime() - 30 * 60 * 1000);
  await db.expressReminder.updateMany({
    where: {
      status: 'PROCESSING',
      lastAttemptAt: { lt: processingTimeout }
    },
    data: {
      status: 'FAILED',
      errorMessage: 'Relance rouverte après interruption du traitement'
    }
  });

  const dueReminders = await db.expressReminder.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: EXPRESS_REMINDER_MAX_ATTEMPTS },
      dueAt: { lte: now },
      order: {
        is: {
          status: 'EXPRESS_ARRIVE',
          arriveAt: { not: null }
        }
      }
    },
    include: { order: true },
    orderBy: [
      { orderId: 'asc' },
      { channel: 'asc' },
      { dueAt: 'desc' }
    ],
    take: 500
  });

  for (const reminders of groupDueReminders(dueReminders)) {
    const [reminder, ...outdated] = reminders;

    if (outdated.length > 0) {
      const skipped = await db.expressReminder.updateMany({
        where: { id: { in: outdated.map(item => item.id) } },
        data: {
          status: 'SKIPPED',
          errorMessage: 'Échéance EXPRESS plus récente déjà atteinte'
        }
      });
      summary.skipped += skipped.count;
    }

    const cycleEndsAt = new Date(new Date(reminder.arrivedAt).getTime() + 8 * DAY_MS);
    if (now >= cycleEndsAt) {
      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SKIPPED',
          errorMessage: 'Cycle EXPRESS terminé après le septième jour'
        }
      });
      summary.skipped += 1;
      continue;
    }

    const order = reminder.order;
    const stillWaiting = order?.status === 'EXPRESS_ARRIVE'
      && isSameInstant(order.arriveAt, reminder.arrivedAt);

    if (!stillWaiting) {
      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'CANCELLED',
          errorMessage: 'Colis retiré ou nouveau cycle d’arrivée'
        }
      });
      summary.skipped += 1;
      continue;
    }

    if (reminder.channel === 'WHATSAPP' && env.WHATSAPP_ENABLED !== 'true') {
      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SKIPPED',
          errorMessage: 'Canal WhatsApp désactivé'
        }
      });
      summary.skipped += 1;
      continue;
    }

    const existingLog = await db.smsLog.findFirst({
      where: {
        orderId: order.id,
        type: 'EXPRESS_REMINDER',
        provider: providerFilter(reminder.channel),
        status: { in: successfulStatuses(reminder.channel) },
        sentAt: { gte: reminder.dueAt }
      },
      select: { id: true, sentAt: true }
    });

    if (existingLog) {
      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: existingLog.sentAt,
          smsLogId: existingLog.id,
          errorMessage: null
        }
      });
      summary.recovered += 1;
      continue;
    }

    const claimed = await db.expressReminder.updateMany({
      where: {
        id: reminder.id,
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: EXPRESS_REMINDER_MAX_ATTEMPTS }
      },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
        lastAttemptAt: now,
        errorMessage: null
      }
    });

    if (claimed.count !== 1) continue;

    const freshOrder = await db.order.findUnique({
      where: { id: order.id },
      select: { status: true, arriveAt: true }
    });

    if (freshOrder?.status !== 'EXPRESS_ARRIVE'
      || !isSameInstant(freshOrder.arriveAt, reminder.arrivedAt)) {
      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'CANCELLED',
          errorMessage: 'Retrait confirmé avant l’envoi'
        }
      });
      summary.skipped += 1;
      continue;
    }

    try {
      const message = await generateMessage('EXPRESS_REMINDER', {
        prenom: firstName(order.clientNom),
        agence: order.agenceRetrait || 'notre agence',
        code: order.codeExpedition || '',
        jours: reminder.dayOffset,
        delai: formatExpressReminderDelay(reminder.dayOffset)
      });

      const metadata = {
        orderId: order.id,
        type: 'EXPRESS_REMINDER',
        userId: order.callerId || null
      };

      const result = reminder.channel === 'WHATSAPP'
        ? await sendWhatsapp(order.clientTelephone, message, metadata)
        : await sendSms(order.clientTelephone, message, metadata);

      if (!result.success || result.skipped) {
        throw new Error(result.error || `Canal ${reminder.channel} indisponible`);
      }

      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: now,
          smsLogId: result.smsLogId || result.messageLogId || null,
          errorMessage: null
        }
      });

      summary.sent += 1;
      if (reminder.channel === 'SMS') summary.smsSent += 1;
      if (reminder.channel === 'WHATSAPP') summary.whatsappSent += 1;
      logger.log(
        `Relance EXPRESS ${formatExpressReminderDelay(reminder.dayOffset)} `
        + `${reminder.channel} envoyée pour ${order.orderReference}`
      );
    } catch (error) {
      await db.expressReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
      summary.failed += 1;
      logger.error(
        `Relance EXPRESS ${reminder.channel} échouée pour ${order.orderReference}:`,
        error.message
      );
    }
  }

  return summary;
}

export default {
  EXPRESS_REMINDER_DAYS,
  EXPRESS_REMINDER_CHANNELS,
  buildExpressReminderSchedule,
  scheduleExpressReminders,
  cancelPendingExpressReminders,
  ensureExpressReminderSchedules,
  formatExpressReminderDelay,
  runExpressReminders
};
