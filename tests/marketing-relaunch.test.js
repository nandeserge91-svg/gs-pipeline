import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMarketingReminderSchedule,
  runMarketingRelaunches
} from '../services/marketing-relaunch.service.js';

const enabledEnv = {
  SMS_ENABLED: 'true',
  SMS_MARKETING_RELAUNCH: 'true'
};

const silentLogger = {
  log() {},
  error() {}
};

function reminderFixture(overrides = {}) {
  const cancellationAt = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: 10,
    orderId: 42,
    cancellationAt,
    dayOffset: 3,
    dueAt: new Date('2026-08-04T10:00:00.000Z'),
    status: 'PENDING',
    attempts: 0,
    order: {
      id: 42,
      orderReference: 'CMD-42',
      clientNom: 'Awa Koné',
      clientTelephone: '+2250102030405',
      produitNom: 'ScarGel',
      callerId: 8,
      status: 'ANNULEE',
      marketingCancelledAt: cancellationAt,
      product: {
        nom: 'ScarGel',
        marketingEnabled: true,
        marketingFunnelUrl: 'https://example.com/scargel',
        marketingTemplateJ3: 'J3 {prenom} - {produit} - {lien}',
        marketingTemplateJ5: 'J5 {prenom} - {produit} - {lien}',
        marketingTemplateJ7: 'J7 {prenom} - {produit} - {lien}'
      }
    },
    ...overrides
  };
}

function createDb(reminders, existingSms = null) {
  const updates = [];
  let updateManyCall = 0;

  return {
    updates,
    marketingReminder: {
      async findMany() {
        return reminders;
      },
      async updateMany(args) {
        updates.push({ kind: 'many', args });
        updateManyCall += 1;
        if (updateManyCall === 1) return { count: 0 };
        if (args.where?.id?.in) return { count: args.where.id.in.length };
        return { count: 1 };
      },
      async update(args) {
        updates.push({ kind: 'one', args });
        return args;
      }
    },
    smsLog: {
      async findFirst() {
        return existingSms;
      }
    }
  };
}

test('planifie exactement les relances J+3, J+5 et J+7', () => {
  const cancellationAt = new Date('2026-08-01T10:00:00.000Z');
  const schedule = buildMarketingReminderSchedule(42, cancellationAt);

  assert.deepEqual(schedule.map((item) => item.dayOffset), [3, 5, 7]);
  assert.deepEqual(
    schedule.map((item) => item.dueAt.toISOString()),
    [
      '2026-08-04T10:00:00.000Z',
      '2026-08-06T10:00:00.000Z',
      '2026-08-08T10:00:00.000Z'
    ]
  );
});

test('envoie une relance produit avec le lien du tunnel', async () => {
  const db = createDb([reminderFixture()]);
  let generated;
  let sent;

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-04T11:00:00.000Z'),
    logger: silentLogger,
    generateMessage: async (type, variables, customTemplate) => {
      generated = { type, variables, customTemplate };
      return `Offre ${variables.produit}: ${variables.lien}`;
    },
    sendSms: async (phone, message, metadata) => {
      sent = { phone, message, metadata };
      return { success: true, smsLogId: 99 };
    }
  });

  assert.equal(result.sent, 1);
  assert.deepEqual(generated, {
    type: 'MARKETING_RELANCE_J3',
    variables: {
      prenom: 'Awa',
      produit: 'ScarGel',
      lien: 'https://example.com/scargel'
    },
    customTemplate: 'J3 {prenom} - {produit} - {lien}'
  });
  assert.deepEqual(sent.metadata, {
    orderId: 42,
    type: 'MARKETING_RELANCE_J3',
    userId: 8
  });
});

test('utilise le texte J+5 propre au produit sans consulter un modèle global', async () => {
  const reminder = reminderFixture({
    dayOffset: 5,
    dueAt: new Date('2026-08-06T10:00:00.000Z')
  });
  reminder.order.product.marketingTemplateJ5 = 'Texte B uniquement pour {produit} : {lien}';
  const db = createDb([reminder]);
  let selectedTemplate;

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-06T11:00:00.000Z'),
    logger: silentLogger,
    generateMessage: async (_type, _variables, customTemplate) => {
      selectedTemplate = customTemplate;
      return customTemplate;
    },
    sendSms: async () => ({ success: true, smsLogId: 101 })
  });

  assert.equal(result.sent, 1);
  assert.equal(selectedTemplate, 'Texte B uniquement pour {produit} : {lien}');
});

test('conserve des textes différents pour deux produits', async () => {
  const productA = reminderFixture();
  productA.order.product.marketingTemplateJ3 = 'Relance produit A';

  const baseProductB = reminderFixture();
  const productB = reminderFixture({
    id: 20,
    orderId: 43,
    order: {
      ...baseProductB.order,
      id: 43,
      orderReference: 'CMD-43',
      product: {
        ...baseProductB.order.product,
        nom: 'Produit B',
        marketingFunnelUrl: 'https://example.com/produit-b',
        marketingTemplateJ3: 'Relance produit B'
      }
    }
  });
  const db = createDb([productA, productB]);
  const selectedTemplates = [];

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-04T11:00:00.000Z'),
    logger: silentLogger,
    generateMessage: async (_type, _variables, customTemplate) => {
      selectedTemplates.push(customTemplate);
      return customTemplate;
    },
    sendSms: async () => ({ success: true, smsLogId: 102 })
  });

  assert.equal(result.sent, 2);
  assert.deepEqual(selectedTemplates, ['Relance produit A', 'Relance produit B']);
});

test('n’envoie rien lorsque le Marketing est désactivé pour ce produit', async () => {
  const reminder = reminderFixture();
  reminder.order.product.marketingEnabled = false;
  const db = createDb([reminder]);
  let sendCount = 0;

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-04T11:00:00.000Z'),
    logger: silentLogger,
    sendSms: async () => {
      sendCount += 1;
      return { success: true };
    }
  });

  assert.equal(result.blocked, 1);
  assert.equal(sendCount, 0);
});

test('n’envoie rien tant que le produit ne possède pas de tunnel', async () => {
  const reminder = reminderFixture();
  reminder.order.product.marketingFunnelUrl = null;
  const db = createDb([reminder]);
  let sendCount = 0;

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-04T11:00:00.000Z'),
    logger: silentLogger,
    sendSms: async () => {
      sendCount += 1;
      return { success: true };
    }
  });

  assert.equal(result.blocked, 1);
  assert.equal(sendCount, 0);
});

test('récupère un envoi déjà journalisé sans envoyer de doublon', async () => {
  const db = createDb(
    [reminderFixture()],
    { id: 77, sentAt: new Date('2026-08-04T10:05:00.000Z') }
  );
  let sendCount = 0;

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-04T11:00:00.000Z'),
    logger: silentLogger,
    sendSms: async () => {
      sendCount += 1;
      return { success: true };
    }
  });

  assert.equal(result.recovered, 1);
  assert.equal(sendCount, 0);
  assert.equal(db.updates.at(-1).args.data.smsLogId, 77);
});

test('ignore une ancienne échéance lorsqu’une relance plus récente est déjà due', async () => {
  const j3 = reminderFixture({ id: 10, dayOffset: 3 });
  const j5 = reminderFixture({
    id: 11,
    dayOffset: 5,
    dueAt: new Date('2026-08-06T10:00:00.000Z')
  });
  const db = createDb([j3, j5]);
  const sentTypes = [];

  const result = await runMarketingRelaunches({
    db,
    env: enabledEnv,
    now: new Date('2026-08-06T11:00:00.000Z'),
    logger: silentLogger,
    generateMessage: async (type) => type,
    sendSms: async (_phone, _message, metadata) => {
      sentTypes.push(metadata.type);
      return { success: true, smsLogId: 100 };
    }
  });

  assert.equal(result.skipped, 1);
  assert.deepEqual(sentTypes, ['MARKETING_RELANCE_J5']);
});
