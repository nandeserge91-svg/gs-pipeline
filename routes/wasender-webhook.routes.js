import crypto from 'crypto';
import express from 'express';
import prisma from '../config/prisma.js';
import { WASENDER_PROVIDER_NAME } from '../services/wasender.service.js';

const router = express.Router();

const STATUS_BY_CODE = {
  0: 'FAILED',
  1: 'PENDING',
  2: 'SENT',
  3: 'DELIVERED',
  4: 'READ',
  5: 'READ'
};

const STATUS_RANK = {
  FAILED: 0,
  PENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4
};

export function isValidWasenderSignature(receivedSignature, expectedSecret) {
  if (!receivedSignature || !expectedSecret) return false;

  const received = Buffer.from(String(receivedSignature));
  const expected = Buffer.from(String(expectedSecret));
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function parseWasenderStatusUpdate(payload = {}) {
  if (payload.event !== 'messages.update') return null;

  const providerId = payload.data?.key?.id;
  const statusCode = Number(payload.data?.update?.status);
  const status = STATUS_BY_CODE[statusCode];
  if (!providerId || !status) return null;

  return {
    providerId: String(providerId),
    status,
    statusCode,
    providerStatus: `messages.update:${statusCode}`
  };
}

export async function applyWasenderStatusUpdate(db, update, now = new Date()) {
  const messageLog = await db.smsLog.findFirst({
    where: {
      provider: WASENDER_PROVIDER_NAME,
      providerId: update.providerId
    },
    orderBy: { sentAt: 'desc' },
    select: { id: true, status: true }
  });

  if (!messageLog) return { matched: false, updated: false };

  const isFailure = update.status === 'FAILED';
  const isProgression = (STATUS_RANK[update.status] || 0) >= (STATUS_RANK[messageLog.status] || 0);
  if (!isFailure && !isProgression) {
    return { matched: true, updated: false, id: messageLog.id };
  }

  const data = {
    status: update.status,
    providerStatus: update.providerStatus
  };

  if (update.status === 'FAILED') data.errorMessage = 'Échec de remise signalé par WaSenderAPI';
  if (update.status === 'DELIVERED') data.deliveredAt = now;
  if (update.status === 'READ') {
    data.deliveredAt = now;
    data.readAt = now;
  }

  await db.smsLog.update({ where: { id: messageLog.id }, data });
  return { matched: true, updated: true, id: messageLog.id, status: update.status };
}

router.post('/status', async (req, res) => {
  const secret = process.env.WASENDER_WEBHOOK_SECRET?.trim();
  const signature = req.get('X-Webhook-Signature');

  if (!secret) {
    console.error('Webhook WaSenderAPI refusé : WASENDER_WEBHOOK_SECRET manquant');
    return res.status(503).json({ success: false, error: 'Webhook non configuré' });
  }

  if (!isValidWasenderSignature(signature, secret)) {
    return res.status(401).json({ success: false, error: 'Signature invalide' });
  }

  try {
    const update = parseWasenderStatusUpdate(req.body);
    if (!update) return res.status(200).json({ success: true, ignored: true });

    const result = await applyWasenderStatusUpdate(prisma, update);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error(`Erreur webhook WaSenderAPI : ${error.message}`);
    return res.status(500).json({ success: false, error: 'Erreur de traitement' });
  }
});

export default router;
