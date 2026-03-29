import axios from 'axios';
import prisma from '../config/prisma.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || '360MESSENGER').toUpperCase();

// Meta (legacy/optionnel)
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';

// 360Messenger
const WHATSAPP_360_SEND_URL = process.env.WHATSAPP_360_SEND_URL || '';
const WHATSAPP_360_API_KEY = process.env.WHATSAPP_360_API_KEY || '';
const WHATSAPP_360_API_KEY_HEADER = process.env.WHATSAPP_360_API_KEY_HEADER || 'Authorization';
const WHATSAPP_360_API_KEY_PREFIX = process.env.WHATSAPP_360_API_KEY_PREFIX || 'Bearer ';
const WHATSAPP_360_API_KEY_QUERY_PARAM = process.env.WHATSAPP_360_API_KEY_QUERY_PARAM || '';
const WHATSAPP_360_TO_FIELD = process.env.WHATSAPP_360_TO_FIELD || 'phonenumber';
const WHATSAPP_360_MESSAGE_FIELD = process.env.WHATSAPP_360_MESSAGE_FIELD || 'text';
const WHATSAPP_360_TYPE_FIELD = process.env.WHATSAPP_360_TYPE_FIELD || '';
const WHATSAPP_360_TEXT_TYPE_VALUE = process.env.WHATSAPP_360_TEXT_TYPE_VALUE || 'text';
const WHATSAPP_360_EXTRA_PAYLOAD = process.env.WHATSAPP_360_EXTRA_PAYLOAD || '';
const WHATSAPP_360_REQUEST_FORMAT = (process.env.WHATSAPP_360_REQUEST_FORMAT || 'form-data').toLowerCase();

const WHATSAPP_AI_ENABLED = process.env.WHATSAPP_AI_ENABLED === 'true';

const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.3);

function isOrderConfirmation(text) {
  const t = (text || '').toLowerCase();
  return [
    'je confirme',
    'confirmer',
    'valider',
    'valide',
    'je valide',
    'commander',
    'je commande',
    'acheter'
  ].some((k) => t.includes(k));
}

function detectIntent(text) {
  const t = (text || '').toLowerCase();

  if (
    ['commander', 'commande', 'acheter', 'prix', 'livraison', 'disponible'].some((k) =>
      t.includes(k)
    )
  ) {
    return 'ORDER';
  }

  if (
    ['garantie', 'retour', 'remboursement', 'panne', 'defectueux', 'sav'].some((k) =>
      t.includes(k)
    )
  ) {
    return 'AFTER_SALES';
  }

  if (
    ['bonjour', 'bonsoir', 'aide', 'service client', 'probleme', 'information'].some((k) =>
      t.includes(k)
    )
  ) {
    return 'CUSTOMER_SERVICE';
  }

  if (['produit', 'utilisation', 'comment utiliser', 'composition', 'benefice'].some((k) => t.includes(k))) {
    return 'PRODUCT_INFO';
  }

  return 'UNKNOWN';
}

function parseQuantityFromText(text) {
  const match = String(text || '').match(/(\d{1,2})\s*(piece|pieces|u|unite|unites)?/i);
  if (!match) return null;
  const qty = Number(match[1]);
  if (Number.isNaN(qty) || qty <= 0) return null;
  return qty;
}

function calculatePriceByQuantity(product, quantity) {
  const qty = parseInt(quantity, 10) || 1;
  if (product.prix1 || product.prix2 || product.prix3) {
    if (qty === 1 && product.prix1) return product.prix1;
    if (qty === 2 && product.prix2) return product.prix2;
    if (qty >= 3 && product.prix3) return product.prix3;
  }
  return product.prixUnitaire * qty;
}

async function findProductFromText(text) {
  if (!text) return null;

  const cleaned = text.trim();
  const byCode = await prisma.product.findFirst({
    where: {
      actif: true,
      code: { equals: cleaned, mode: 'insensitive' }
    }
  });
  if (byCode) return byCode;

  return prisma.product.findFirst({
    where: {
      actif: true,
      nom: { contains: cleaned, mode: 'insensitive' }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

async function listTopProducts(limit = 8) {
  return prisma.product.findMany({
    where: { actif: true },
    select: { code: true, nom: true, prixUnitaire: true, stockActuel: true },
    orderBy: [{ stockActuel: 'desc' }, { nom: 'asc' }],
    take: limit
  });
}

export async function sendWhatsAppText(to, text) {
  if (WHATSAPP_PROVIDER === 'META') {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manquant');
    }

    const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return;
  }

  if (!WHATSAPP_360_SEND_URL) {
    throw new Error('WHATSAPP_360_SEND_URL manquant');
  }

  const headers = {};

  if (WHATSAPP_360_API_KEY) {
    let normalizedPrefix = WHATSAPP_360_API_KEY_PREFIX || '';
    // Be tolerant with env values like "Bearer" without a trailing space.
    if (
      normalizedPrefix &&
      !normalizedPrefix.endsWith(' ') &&
      ['bearer', 'token'].includes(normalizedPrefix.trim().toLowerCase())
    ) {
      normalizedPrefix = `${normalizedPrefix.trim()} `;
    }
    headers[WHATSAPP_360_API_KEY_HEADER] = `${normalizedPrefix}${WHATSAPP_360_API_KEY}`;
  }

  const params = {};
  if (WHATSAPP_360_API_KEY && WHATSAPP_360_API_KEY_QUERY_PARAM) {
    params[WHATSAPP_360_API_KEY_QUERY_PARAM] = WHATSAPP_360_API_KEY;
  }

  let extraPayload = {};
  if (WHATSAPP_360_EXTRA_PAYLOAD) {
    try {
      extraPayload = JSON.parse(WHATSAPP_360_EXTRA_PAYLOAD);
    } catch (error) {
      console.warn('WHATSAPP_360_EXTRA_PAYLOAD invalide (JSON), ignore');
    }
  }

  const requestPayload = {
    [WHATSAPP_360_TO_FIELD]: to,
    [WHATSAPP_360_MESSAGE_FIELD]: text,
    ...extraPayload
  };

  if (WHATSAPP_360_TYPE_FIELD) {
    requestPayload[WHATSAPP_360_TYPE_FIELD] = WHATSAPP_360_TEXT_TYPE_VALUE;
  }

  // Certaines APIs (ex: 360Messenger v2/sendMessage) attendent multipart/form-data.
  if (WHATSAPP_360_REQUEST_FORMAT === 'form-data') {
    const form = new FormData();
    for (const [key, value] of Object.entries(requestPayload)) {
      form.append(key, value == null ? '' : String(value));
    }

    await axios.post(WHATSAPP_360_SEND_URL, form, {
      headers,
      params,
      timeout: 15000
    });
    return;
  }

  headers['Content-Type'] = 'application/json';

  await axios.post(
    WHATSAPP_360_SEND_URL,
    requestPayload,
    {
      headers,
      params,
      timeout: 15000
    }
  );
}

async function generateAIReply({ userMessage, product, state }) {
  if (!WHATSAPP_AI_ENABLED || !AI_API_KEY) return null;

  const productContext = product
    ? `Produit cible:
- nom: ${product.nom}
- code: ${product.code}
- prixUnitaire: ${product.prixUnitaire}
- stockActuel: ${product.stockActuel}
- description: ${product.description || 'N/A'}`
    : 'Produit cible: non determine';

  const systemPrompt = `Tu es l'assistant WhatsApp de GS Pipeline.
Objectif:
- Repondre en francais simple, poli, court.
- Aider sur informations produit, SAV, et pre-commande.
- Si une info est inconnue, dis-le clairement sans inventer.
- Rester oriente conversion commerciale sans etre aggressif.
- Ne pas demander de paiement dans WhatsApp.
- Si le client veut commander, demander: produit, quantite, ville, nom complet.`;

  const userPrompt = `Message client: ${userMessage}

Etat conversation: ${JSON.stringify(state || {})}
${productContext}

Reponds en maximum 5 lignes.`;

  const response = await axios.post(
    `${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`,
    {
      model: AI_MODEL,
      temperature: AI_TEMPERATURE,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || null;
}

async function saveMessage(conversationId, sender, message, metadata = null) {
  return prisma.whatsAppMessage.create({
    data: {
      conversationId,
      sender,
      message,
      metadata
    }
  });
}

async function createValidatedOrderFromConversation(conversation, state) {
  if (!state?.productId || !state?.city) return null;

  const product = await prisma.product.findUnique({
    where: { id: state.productId }
  });
  if (!product) return null;

  const quantity = Number(state.quantity || 1);
  const total = calculatePriceByQuantity(product, quantity);

  const cleanedPhone = cleanPhoneNumber(conversation.phoneNumber);
  const clientNom = state.customerName || conversation.clientName || 'Client WhatsApp';

  const order = await prisma.order.create({
    data: {
      clientNom,
      clientTelephone: cleanedPhone,
      clientVille: state.city,
      clientCommune: state.commune || null,
      clientAdresse: state.address || null,
      produitNom: product.nom,
      productId: product.id,
      quantite: quantity,
      montant: total,
      status: 'VALIDEE',
      validatedAt: new Date(),
      sourceCampagne: 'WhatsApp AI Bot',
      sourcePage: 'WhatsApp',
      noteAppelant: 'Commande validee automatiquement via WhatsApp bot.'
    }
  });

  const changedBy = Number(process.env.WHATSAPP_SYSTEM_USER_ID || 0);
  if (changedBy > 0) {
    try {
      await prisma.statusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: null,
          newStatus: 'VALIDEE',
          changedBy,
          comment: 'Commande creee et validee automatiquement via WhatsApp bot.'
        }
      });
    } catch (error) {
      console.warn('WhatsApp bot: impossible de creer StatusHistory:', error.message);
    }
  }

  return order;
}

function extractWhatsAppMessages(payload) {
  // 1) Format Meta officiel
  const messages = [];
  const entries = payload?.entry || [];

  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const value = change?.value || {};
      const contacts = value.contacts || [];
      const messagesInChange = value.messages || [];

      for (const msg of messagesInChange) {
        const contact = contacts.find((c) => c.wa_id === msg.from);
        messages.push({
          from: msg.from,
          name: contact?.profile?.name || null,
          type: msg.type,
          text: msg?.text?.body || '',
          messageId: msg.id
        });
      }
    }
  }

  if (messages.length > 0) {
    return messages;
  }

  // 2) Format generique (360Messenger / autres providers webhook)
  const genericCandidates = [];
  if (Array.isArray(payload?.messages)) genericCandidates.push(...payload.messages);
  if (Array.isArray(payload?.data?.messages)) genericCandidates.push(...payload.data.messages);
  if (payload?.message && typeof payload.message === 'object') genericCandidates.push(payload.message);
  if (payload?.data?.message && typeof payload.data.message === 'object') genericCandidates.push(payload.data.message);

  for (const raw of genericCandidates) {
    const from = raw?.from || raw?.phone || raw?.number || raw?.sender || raw?.wa_id || payload?.from || payload?.phone;
    const text =
      raw?.text?.body ||
      raw?.text ||
      raw?.message ||
      raw?.body ||
      raw?.content ||
      '';
    const type = raw?.type || (text ? 'text' : 'unknown');
    const name = raw?.name || raw?.sender_name || raw?.profile?.name || payload?.name || payload?.sender_name || null;
    const messageId = raw?.id || raw?.message_id || raw?.msgId || null;

    if (from && text) {
      messages.push({
        from: String(from),
        name: name ? String(name) : null,
        type: String(type),
        text: String(text),
        messageId: messageId ? String(messageId) : null
      });
    }
  }

  // 3) Format ultra simple
  if (messages.length === 0 && (payload?.from || payload?.phone) && (payload?.text || payload?.message)) {
    messages.push({
      from: String(payload.from || payload.phone),
      name: payload.name ? String(payload.name) : null,
      type: 'text',
      text: String(payload.text || payload.message),
      messageId: payload.id ? String(payload.id) : null
    });
  }

  return messages;
}

async function buildRuleBasedReply({ text, product, state }) {
  if (state.awaitingField === 'city') {
    return 'Merci. Peux-tu me donner ta commune/quartier (optionnel) puis ton adresse exacte ?';
  }

  if (state.awaitingField === 'address') {
    return 'Parfait. Ecris "je confirme" pour valider la commande, ou "modifier" pour corriger une info.';
  }

  if (product) {
    return `Le produit ${product.nom} est disponible. Prix de base: ${product.prixUnitaire} FCFA. Si tu veux commander, envoie: "Je commande ${product.code} quantite 1 ville Abidjan".`;
  }

  const products = await listTopProducts(6);
  const lines = products.map((p) => `- ${p.code}: ${p.nom} (${p.prixUnitaire} FCFA)`);
  return `Je peux t'aider tout de suite.\nVoici quelques produits:\n${lines.join('\n')}\nDis-moi le code ou le nom du produit qui t'interesse.`;
}

export async function processIncomingWhatsAppPayload(payload) {
  const incoming = extractWhatsAppMessages(payload);

  for (const item of incoming) {
    if (item.type !== 'text') {
      await sendWhatsAppText(
        item.from,
        'Je traite uniquement les messages texte pour le moment. Ecris ton message et je te reponds.'
      );
      continue;
    }

    const detectedIntent = detectIntent(item.text);

    const conversation = await prisma.whatsAppConversation.upsert({
      where: { phoneNumber: item.from },
      create: {
        phoneNumber: item.from,
        clientName: item.name || null,
        currentIntent: detectedIntent,
        state: {}
      },
      update: {
        clientName: item.name || undefined,
        currentIntent: detectedIntent,
        lastMessageAt: new Date()
      }
    });

    await saveMessage(conversation.id, 'CLIENT', item.text, { messageId: item.messageId });

    const state = conversation.state || {};
    const lowerText = item.text.toLowerCase();

    if (['humain', 'agent', 'conseiller'].some((k) => lowerText.includes(k))) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { handedToHuman: true }
      });
      const reply = 'Un conseiller humain va prendre le relais tres vite. Merci pour ta patience.';
      await sendWhatsAppText(item.from, reply);
      await saveMessage(conversation.id, 'BOT', reply, { handover: true });
      continue;
    }

    if (conversation.handedToHuman) {
      const reply = 'Conversation en mode humain actif. Ecris "retour bot" pour reactiver le bot.';
      if (lowerText.includes('retour bot')) {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { handedToHuman: false }
        });
        const reactivate = 'Bot reactive. Je peux te guider pour infos produit, SAV et commande.';
        await sendWhatsAppText(item.from, reactivate);
        await saveMessage(conversation.id, 'BOT', reactivate, { reactivated: true });
      } else {
        await sendWhatsAppText(item.from, reply);
        await saveMessage(conversation.id, 'BOT', reply, {});
      }
      continue;
    }

    let product = null;

    if (state.productId) {
      product = await prisma.product.findUnique({ where: { id: state.productId } });
    }

    if (!product) {
      product = await findProductFromText(item.text);
      if (product) {
        state.productId = product.id;
        state.productName = product.nom;
      }
    }

    const quantity = parseQuantityFromText(item.text);
    if (quantity) state.quantity = quantity;

    const cityMatch = item.text.match(/ville\s+([a-zA-ZÀ-ÿ' -]{2,40})/i);
    if (cityMatch?.[1]) state.city = cityMatch[1].trim();

    if (!state.customerName && item.name) {
      state.customerName = item.name;
    }

    if (state.awaitingField === 'city' && !state.city && item.text.length <= 40) {
      state.city = item.text.trim();
      state.awaitingField = 'address';
    } else if (state.awaitingField === 'address' && !state.address) {
      state.address = item.text.trim();
      state.awaitingField = 'confirm';
    }

    const shouldConfirmOrder = isOrderConfirmation(item.text) && state.productId && state.city;
    if (shouldConfirmOrder) {
      const order = await createValidatedOrderFromConversation(conversation, state);
      if (order) {
        const reply = `Commande validee avec succes.\nReference: ${order.orderReference}\nProduit: ${order.produitNom}\nQuantite: ${order.quantite}\nMontant: ${Math.round(order.montant)} FCFA\nMerci pour ta confiance.`;
        await sendWhatsAppText(item.from, reply);
        await saveMessage(conversation.id, 'BOT', reply, { orderId: order.id, autoValidated: true });

        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            state: {},
            currentIntent: 'ORDER',
            lastMessageAt: new Date()
          }
        });
        continue;
      }
    }

    if (detectedIntent === 'ORDER' || state.productId) {
      if (!state.productId) {
        state.awaitingField = 'product';
      } else if (!state.city) {
        state.awaitingField = 'city';
      } else if (!state.address) {
        state.awaitingField = 'address';
      } else {
        state.awaitingField = 'confirm';
      }
    }

    let reply = null;
    try {
      reply = await generateAIReply({
        userMessage: item.text,
        product,
        state
      });
    } catch (error) {
      console.warn('WhatsApp AI indisponible, fallback regle:', error.message);
    }

    if (!reply) {
      reply = await buildRuleBasedReply({
        text: item.text,
        product,
        state
      });
    }

    if (state.awaitingField === 'confirm' && state.productId && state.city) {
      const q = state.quantity || 1;
      reply += `\n\nRecap: ${state.productName} x${q}, ville ${state.city}. Reponds "je confirme" pour valider.`;
    }

    await sendWhatsAppText(item.from, reply);
    await saveMessage(conversation.id, 'BOT', reply, {
      intent: detectedIntent,
      productId: state.productId || null
    });

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        state,
        currentIntent: detectedIntent,
        lastMessageAt: new Date()
      }
    });
  }
}

export default {
  processIncomingWhatsAppPayload,
  sendWhatsAppText
};
