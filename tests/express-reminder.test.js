import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExpressReminderDueAt,
  buildExpressReminderSchedule,
  cancelPendingExpressReminders,
  formatExpressReminderDelay,
  runExpressReminders
} from '../services/express-reminder.service.js';

const arrivedAt = new Date('2026-08-01T10:00:00.000Z');
const enabledEnv = {
  SMS_ENABLED: 'true',
  SMS_EXPRESS_REMINDER: 'true'
};

const silentLogger = { log() {}, error() {} };

function reminderFixture(overrides = {}) {
  return {
    id: 10,
    orderId: 42,
    arrivedAt,
    dayOffset: 1,
    channel: 'SMS',
    dueAt: new Date('2026-08-02T08:30:00.000Z'),
    status: 'PENDING',
    attempts: 0,
    order: {
      id: 42,
      orderReference: 'EXP-42',
      clientNom: 'Awa Koné',
      clientTelephone: '+2250102030405',
      callerId: 8,
      status: 'EXPRESS_ARRIVE',
      arriveAt: arrivedAt,
      agenceRetrait: 'Agence Yopougon',
      codeExpedition: 'RET-42'
    },
    ...overrides
  };
}

function createDb(reminders, options = {}) {
  const updates = [];
  return {
    updates,
    order: {
      async findMany() {
        return [];
      },
      async findUnique() {
        return options.freshOrder || {
          status: 'EXPRESS_ARRIVE',
          arriveAt: arrivedAt
        };
      }
    },
    expressReminder: {
      async createMany() {
        return { count: 0 };
      },
      async findMany() {
        return reminders;
      },
      async updateMany(args) {
        updates.push({ kind: 'many', args });
        if (args.where?.id?.in) return { count: args.where.id.in.length };
        if (args.data?.status === 'PROCESSING') return { count: 1 };
        return { count: 0 };
      },
      async update(args) {
        updates.push({ kind: 'one', args });
        return args;
      }
    },
    smsLog: {
      async findFirst() {
        return options.existingLog || null;
      }
    }
  };
}

test('planifie uniquement les SMS à 8h30 à J+1, J+2, J+3, J+5 et J+7', () => {
  const schedule = buildExpressReminderSchedule(42, arrivedAt);

  assert.equal(schedule.length, 5);
  assert.deepEqual(
    [...new Set(schedule.map(item => item.dayOffset))],
    [1, 2, 3, 5, 7]
  );
  assert.deepEqual(schedule.map(item => item.channel), ['SMS', 'SMS', 'SMS', 'SMS', 'SMS']);
  assert.equal(schedule[0].dueAt.toISOString(), '2026-08-02T08:30:00.000Z');
  assert.equal(schedule.at(-1).dueAt.toISOString(), '2026-08-08T08:30:00.000Z');
});

test('conserve 8h30 même si le colis arrive après 8h30', () => {
  const lateArrival = new Date('2026-08-01T20:45:00.000Z');
  assert.equal(
    buildExpressReminderDueAt(lateArrival, 1).toISOString(),
    '2026-08-02T08:30:00.000Z'
  );
});

test('formate clairement les cinq délais client', () => {
  assert.deepEqual(
    [1, 2, 3, 5, 7].map(formatExpressReminderDelay),
    ['24 heures', '48 heures', '72 heures', '5 jours', '7 jours']
  );
});

test('envoie uniquement le SMS après 24 heures', async () => {
  const smsReminder = reminderFixture();
  const db = createDb([smsReminder]);
  const sent = [];
  const generated = [];

  const result = await runExpressReminders({
    db,
    env: enabledEnv,
    now: new Date('2026-08-02T10:05:00.000Z'),
    logger: silentLogger,
    generateMessage: async (type, variables) => {
      generated.push({ type, variables });
      return `Rappel ${variables.delai}`;
    },
    sendSms: async (phone, message, metadata) => {
      sent.push({ channel: 'SMS', phone, message, metadata });
      return { success: true, smsLogId: 100 };
    }
  });

  assert.equal(result.smsSent, 1);
  assert.equal(result.whatsappSent, 0);
  assert.deepEqual(sent.map(item => item.channel), ['SMS']);
  assert.equal(generated[0].variables.delai, '24 heures');
  assert.equal(sent[0].metadata.type, 'EXPRESS_REMINDER');
});

test('annule l’envoi si le retrait est confirmé juste avant le message', async () => {
  const db = createDb([reminderFixture()], {
    freshOrder: { status: 'EXPRESS_LIVRE', arriveAt: arrivedAt }
  });
  let sendCount = 0;

  const result = await runExpressReminders({
    db,
    env: enabledEnv,
    now: new Date('2026-08-02T10:05:00.000Z'),
    logger: silentLogger,
    sendSms: async () => {
      sendCount += 1;
      return { success: true };
    }
  });

  assert.equal(sendCount, 0);
  assert.equal(result.skipped, 1);
  assert.equal(db.updates.at(-1).args.data.status, 'CANCELLED');
});

test('à J+5, ignore les anciennes échéances et n’envoie que J+5', async () => {
  const reminders = [1, 2, 3, 5].map((dayOffset, index) => reminderFixture({
    id: 20 + index,
    dayOffset,
    dueAt: buildExpressReminderDueAt(arrivedAt, dayOffset)
  }));
  const db = createDb(reminders);
  const messages = [];

  const result = await runExpressReminders({
    db,
    env: enabledEnv,
    now: new Date('2026-08-06T10:05:00.000Z'),
    logger: silentLogger,
    generateMessage: async (_type, variables) => {
      messages.push(variables.delai);
      return variables.delai;
    },
    sendSms: async () => ({ success: true, smsLogId: 200 })
  });

  assert.deepEqual(messages, ['5 jours']);
  assert.equal(result.skipped, 3);
  assert.equal(result.smsSent, 1);
});

test('ne planifie aucune relance après le septième jour', () => {
  const schedule = buildExpressReminderSchedule(42, arrivedAt);
  assert.equal(Math.max(...schedule.map(item => item.dayOffset)), 7);
});

test('n’envoie plus rien une fois le septième jour terminé', async () => {
  const reminder = reminderFixture({
    dayOffset: 7,
    dueAt: new Date('2026-08-08T08:30:00.000Z')
  });
  const db = createDb([reminder]);
  let sendCount = 0;

  const result = await runExpressReminders({
    db,
    env: enabledEnv,
    now: new Date('2026-08-09T10:00:00.000Z'),
    logger: silentLogger,
    sendSms: async () => {
      sendCount += 1;
      return { success: true };
    }
  });

  assert.equal(sendCount, 0);
  assert.equal(result.skipped, 1);
  assert.equal(db.updates.at(-1).args.data.status, 'SKIPPED');
});

test('neutralise une ancienne échéance WhatsApp sans tenter de l’envoyer', async () => {
  const whatsappReminder = reminderFixture({ id: 11, channel: 'WHATSAPP' });
  const db = createDb([whatsappReminder]);
  let sendCount = 0;

  const result = await runExpressReminders({
    db,
    env: enabledEnv,
    now: new Date('2026-08-02T10:05:00.000Z'),
    logger: silentLogger,
    generateMessage: async () => 'Rappel',
    sendSms: async () => {
      sendCount += 1;
      return { success: true, smsLogId: 300 };
    }
  });

  assert.equal(sendCount, 0);
  assert.equal(result.smsSent, 0);
  assert.equal(result.whatsappSent, 0);
  assert.equal(result.failed, 0);
  assert.equal(result.skipped, 1);
  const finalStatuses = db.updates
    .filter(update => update.kind === 'one')
    .map(update => update.args.data.status);
  assert.deepEqual(finalStatuses, ['SKIPPED']);
});

test('la confirmation de retrait annule toutes les échéances restantes', async () => {
  let mutation;
  const db = {
    expressReminder: {
      async updateMany(args) {
        mutation = args;
        return { count: 8 };
      }
    }
  };

  const result = await cancelPendingExpressReminders(db, 42);
  assert.equal(result.count, 8);
  assert.equal(mutation.where.orderId, 42);
  assert.deepEqual(mutation.where.status.in, ['PENDING', 'PROCESSING', 'FAILED']);
  assert.equal(mutation.data.status, 'CANCELLED');
});
