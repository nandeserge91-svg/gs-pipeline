import express from 'express';
import { processIncomingWhatsAppPayload, sendWhatsAppText } from '../services/whatsapp.service.js';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || '360MESSENGER').toUpperCase();
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';
const WHATSAPP_WEBHOOK_ENFORCE_SECRET = process.env.WHATSAPP_WEBHOOK_ENFORCE_SECRET === 'true';

// Verification webhook (Meta only). Pour 360Messenger, retourne simplement OK.
router.get('/webhook', (req, res) => {
  if (WHATSAPP_PROVIDER !== 'META') {
    return res.status(200).json({
      status: 'ok',
      provider: WHATSAPP_PROVIDER,
      message: 'Webhook WhatsApp actif'
    });
  }

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Verification token invalide' });
});

// Reception des messages WhatsApp
router.post('/webhook', async (req, res) => {
  if (WHATSAPP_WEBHOOK_ENFORCE_SECRET && WHATSAPP_WEBHOOK_SECRET) {
    const incomingSecret = req.headers['x-webhook-secret'];
    if (incomingSecret !== WHATSAPP_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Webhook secret invalide' });
    }
  }

  // Accuser reception tout de suite pour eviter timeout Meta
  res.status(200).json({ received: true });

  try {
    await processIncomingWhatsAppPayload(req.body);
  } catch (error) {
    console.error('Erreur webhook WhatsApp:', error);
  }
});

// Routes back-office (admin/gestion)
router.use(authenticate);
router.use(authorize('ADMIN', 'GESTIONNAIRE'));

// GET /api/whatsapp/stats - Statistiques rapides WhatsApp
router.get('/stats', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalConversations, activeConversations, handoverCount, messagesBySender] = await Promise.all([
      prisma.whatsAppConversation.count(),
      prisma.whatsAppConversation.count({
        where: {
          lastMessageAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.whatsAppConversation.count({
        where: { handedToHuman: true }
      }),
      prisma.whatsAppMessage.groupBy({
        by: ['sender'],
        _count: true,
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      })
    ]);

    const bySender = messagesBySender.reduce((acc, item) => {
      acc[item.sender] = item._count;
      return acc;
    }, {});

    return res.json({
      totalConversations,
      activeConversations7d: activeConversations,
      handoverCount,
      messages7d: {
        client: bySender.CLIENT || 0,
        bot: bySender.BOT || 0,
        agent: bySender.AGENT || 0
      }
    });
  } catch (error) {
    console.error('Erreur stats WhatsApp:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des statistiques WhatsApp.' });
  }
});

// GET /api/whatsapp/conversations - Liste des conversations
router.get('/conversations', async (req, res) => {
  try {
    const {
      search,
      intent,
      handedToHuman,
      page = 1,
      limit = 30
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 200);
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};
    const andConditions = [];

    if (search) {
      andConditions.push({
        OR: [
          { phoneNumber: { contains: String(search) } },
          { clientName: { contains: String(search), mode: 'insensitive' } }
        ]
      });
    }

    if (intent && intent !== 'ALL') {
      andConditions.push({ currentIntent: String(intent) });
    }

    if (typeof handedToHuman === 'string' && ['true', 'false'].includes(handedToHuman)) {
      andConditions.push({ handedToHuman: handedToHuman === 'true' });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [conversations, total] = await Promise.all([
      prisma.whatsAppConversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: parsedLimit
      }),
      prisma.whatsAppConversation.count({ where })
    ]);

    return res.json({
      conversations,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Erreur liste conversations WhatsApp:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des conversations WhatsApp.' });
  }
});

// GET /api/whatsapp/conversations/:id/messages - Messages d'une conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 150, 1), 500);

    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID de conversation invalide.' });
    }

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take
    });

    return res.json({ conversation, messages });
  } catch (error) {
    console.error('Erreur messages WhatsApp:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement des messages.' });
  }
});

// PUT /api/whatsapp/conversations/:id/handover - Basculer humain/bot
router.put('/conversations/:id/handover', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { handedToHuman } = req.body;

    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID de conversation invalide.' });
    }

    if (typeof handedToHuman !== 'boolean') {
      return res.status(400).json({ error: 'Le champ handedToHuman doit etre un booleen.' });
    }

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { handedToHuman }
    });

    return res.json({
      conversation: updated,
      message: handedToHuman ? 'Conversation transferee a un agent humain.' : 'Conversation rendue au bot.'
    });
  } catch (error) {
    console.error('Erreur handover WhatsApp:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise a jour du handover.' });
  }
});

// POST /api/whatsapp/conversations/:id/reply - Reponse manuelle agent
router.post('/conversations/:id/reply', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID de conversation invalide.' });
    }

    const text = String(message || '').trim();
    if (!text) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    await sendWhatsAppText(conversation.phoneNumber, text);

    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        sender: 'AGENT',
        message: text,
        metadata: {
          userId: req.user.id,
          userName: `${req.user.prenom} ${req.user.nom}`.trim()
        }
      }
    });

    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return res.json({ success: true, message: 'Message envoye au client.' });
  } catch (error) {
    console.error('Erreur reponse manuelle WhatsApp:', error);
    return res.status(500).json({ error: 'Erreur lors de l envoi de la reponse.' });
  }
});

export default router;
