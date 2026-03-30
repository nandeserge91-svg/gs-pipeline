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
const WHATSAPP_360_REPLY_URL = process.env.WHATSAPP_360_REPLY_URL || '';
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
const WHATSAPP_360_USE_REPLY_ENDPOINT = process.env.WHATSAPP_360_USE_REPLY_ENDPOINT === 'true';

const WHATSAPP_AI_ENABLED = process.env.WHATSAPP_AI_ENABLED === 'true';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.3);
const WHATSAPP_AI_TIMEOUT_MS = Math.max(2000, Number(process.env.WHATSAPP_AI_TIMEOUT_MS || 9000));
const WHATSAPP_MAX_MISSING_INFO_ATTEMPTS = Number(process.env.WHATSAPP_MAX_MISSING_INFO_ATTEMPTS || 2);
const KNOWLEDGE_CACHE_TTL_MS = Math.max(1000, Number(process.env.WHATSAPP_KNOWLEDGE_CACHE_TTL_MS || 60000));
const knowledgeCache = new Map();

const GLOBAL_FAQ = [
  { keywords: ["magasin", "boutique", "local", "situe", "situes", "localise", "localisation", "adresse", "ou etes vous", "quelle ville", "sur place", "venir", "se trouve"],
    answer: "Nous sommes une boutique en ligne. Nous livrons uniquement sur commande et le paiement se fait a la livraison." },
  { keywords: ["dimanche", "livrez dimanche", "travaillez dimanche", "disponible dimanche"],
    answer: "Non, nous ne livrons pas le dimanche. Les livraisons se font du lundi au samedi." },
  { keywords: ["jours de livraison", "quand livrer", "quel jour", "jours ouvrables"],
    answer: "Nous livrons du lundi au samedi. Les livraisons ne se font pas le dimanche." },
  { keywords: ["paiement", "comment payer", "mode de paiement", "payer comment"],
    answer: "Le paiement se fait a la livraison. Tu paies quand tu recois ton produit." },
  { keywords: ["retour", "rembourser", "remboursement", "pas satisfait", "echanger"],
    answer: "Si le produit ne te convient pas, contacte-nous dans les 48h apres reception." },
  { keywords: ["original", "authentique", "vrai", "contrefacon", "faux", "certifie"],
    answer: "Tous nos produits sont 100% originaux et authentiques." }
];

function isOrderConfirmation(text) {
  const t = (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return [
    'je confirme',
    'confirmer',
    'valider',
    'valide',
    'je valide',
    'commander',
    'je commande',
    'acheter',
    'oui je veux',
    'oui je confirme',
    'oui',
    'ok',
    'okay',
    'd accord',
    'daccord',
    "d'accord",
    'je veux',
    'je prends',
    'je suis interesse',
    'allez-y',
    'allez y',
    'allons-y',
    'go',
    'c est bon',
    'vous pouvez livrer',
    'vous pouvez livrez',
    'pouvez livrer',
    'envoyez',
    'envoyer',
    'livrez',
    'livrer',
    'on y va',
    'parfait',
    'ca marche',
    'super',
    'genial',
    'bien sur',
    'avec plaisir',
    'je le prends',
    'je la prends',
    'je les prends'
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

function normalizeComparable(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_\-./]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKeyword(value) {
  return normalizeComparable(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function parseKnowledgeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return {
          keywords: [item],
          answer: item
        };
      }
      if (!item || typeof item !== 'object') return null;
      const answer = String(item.answer || item.response || item.reponse || '').trim();
      if (!answer) return null;
      const keywords = Array.isArray(item.keywords)
        ? item.keywords.map((k) => String(k || '').trim()).filter(Boolean)
        : [];
      return { keywords, answer };
    })
    .filter(Boolean);
}

async function getProductKnowledge(productId) {
  if (!productId) return null;
  const now = Date.now();
  const cached = knowledgeCache.get(productId);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = await prisma.whatsAppProductKnowledge.findUnique({
    where: { productId }
  });
  knowledgeCache.set(productId, {
    value,
    expiresAt: now + KNOWLEDGE_CACHE_TTL_MS
  });
  return value;
}

function findKnowledgeAnswer(text, items) {
  const normalizedText = normalizeKeyword(text);
  if (!normalizedText || items.length === 0) return null;

  for (const item of items) {
    const normalizedKeywords = (item.keywords || []).map(normalizeKeyword).filter(Boolean);
    if (normalizedKeywords.length > 0) {
      const keywordMatch = normalizedKeywords.some(
        (keyword) => normalizedText.includes(keyword) || keyword.includes(normalizedText)
      );
      if (keywordMatch) return item.answer;
    }
  }

  return null;
}

function isLikelyMissingInfoQuestion(text) {
  const normalizedText = normalizeKeyword(text);
  if (!normalizedText) return false;
  const infoSignals = [
    '?',
    'ingredient',
    'composition',
    'effet secondaire',
    'danger',
    'risque',
    'certifie',
    'authentique',
    'garantie',
    'comment utiliser',
    'utilisation',
    'combien de temps',
    'resultat'
  ];
  return infoSignals.some((signal) => normalizedText.includes(signal));
}

function extractLikelyProductQueries(text) {
  const source = String(text || '').trim();
  if (!source) return [];

  const queries = new Set();
  queries.add(source);

  const orderPhraseMatch = source.match(
    /(?:commande|commander|acheter|prendre|veux|veut)\s+([a-z0-9À-ÿ_\- ]{2,})(?:\s+(?:quantite|qte|ville|commune|adresse)\b|$)/i
  );
  if (orderPhraseMatch?.[1]) {
    queries.add(orderPhraseMatch[1].trim());
  }

  const underscoreCodeMatches = source.match(/[a-z0-9]+(?:_[a-z0-9]+)+/gi) || [];
  underscoreCodeMatches.forEach((match) => queries.add(match));

  const normalized = normalizeComparable(source);
  if (normalized) {
    queries.add(normalized);
  }

  return Array.from(queries).filter((q) => q && q.length >= 2);
}

function levenshteinDistance(a, b) {
  const s = a || '';
  const t = b || '';
  const rows = s.length + 1;
  const cols = t.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function scoreAlias(query, alias) {
  if (!query || !alias) return 0;
  if (query === alias) return 1;

  if (alias.includes(query) || query.includes(alias)) {
    const ratio = Math.min(query.length, alias.length) / Math.max(query.length, alias.length);
    return 0.86 + ratio * 0.14;
  }

  const distance = levenshteinDistance(query, alias);
  const maxLen = Math.max(query.length, alias.length);
  if (maxLen === 0) return 0;
  const similarity = 1 - distance / maxLen;

  if (distance <= 2 && similarity >= 0.6) {
    return 0.72 + similarity * 0.2;
  }

  const queryTokens = query.split(' ').filter(Boolean);
  const aliasTokens = alias.split(' ').filter(Boolean);
  const overlap = queryTokens.filter((token) => aliasTokens.includes(token)).length;
  if (overlap > 0) {
    return 0.55 + overlap / Math.max(queryTokens.length, aliasTokens.length) * 0.25;
  }

  return similarity * 0.45;
}

async function findProductFromText(text) {
  if (!text) return null;

  const queries = extractLikelyProductQueries(text);
  if (queries.length === 0) return null;

  for (const query of queries) {
    const byCode = await prisma.product.findFirst({
      where: {
        actif: true,
        code: { equals: query.trim(), mode: 'insensitive' }
      }
    });
    if (byCode) return byCode;
  }

  for (const query of queries) {
    const byNameContains = await prisma.product.findFirst({
      where: {
        actif: true,
        nom: { contains: query.trim(), mode: 'insensitive' }
      },
      orderBy: { updatedAt: 'desc' }
    });
    if (byNameContains) return byNameContains;
  }

  const activeProducts = await prisma.product.findMany({
    where: { actif: true },
    select: {
      id: true,
      code: true,
      nom: true,
      description: true,
      prixUnitaire: true,
      prix1: true,
      prix2: true,
      prix3: true,
      stockActuel: true,
      updatedAt: true
    }
  });

  const normalizedQueries = queries.map(normalizeComparable).filter(Boolean);
  let bestProduct = null;
  let bestScore = 0;

  for (const product of activeProducts) {
    const aliases = [
      product.code,
      product.nom,
      String(product.code || '').replace(/_/g, ' '),
      String(product.nom || '').replace(/_/g, ' ')
    ]
      .map(normalizeComparable)
      .filter(Boolean);

    let productScore = 0;
    for (const query of normalizedQueries) {
      for (const alias of aliases) {
        productScore = Math.max(productScore, scoreAlias(query, alias));
      }
    }

    if (productScore > bestScore) {
      bestScore = productScore;
      bestProduct = product;
    }
  }

  // Seuil empirique pour eviter les faux positifs trop faibles.
  if (bestScore >= 0.74) {
    return bestProduct;
  }

  return null;
}

async function listTopProducts(limit = 8) {
  return prisma.product.findMany({
    where: { actif: true },
    select: { code: true, nom: true, prixUnitaire: true, stockActuel: true },
    orderBy: [{ stockActuel: 'desc' }, { nom: 'asc' }],
    take: limit
  });
}

async function findProductsByDescription(text) {
  if (!text || text.length < 3) return [];

  const normalizedText = normalizeComparable(text);
  const tokens = normalizedText.split(' ').filter(t => t.length >= 3);
  if (tokens.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { actif: true },
    select: {
      id: true,
      code: true,
      nom: true,
      description: true,
      prixUnitaire: true,
      whatsappKnowledge: true
    }
  });

  const scored = [];

  for (const p of products) {
    const searchable = normalizeComparable([
      p.description || '',
      p.whatsappKnowledge?.keyBenefits || '',
      p.whatsappKnowledge?.usageTips || ''
    ].join(' '));

    if (!searchable) continue;

    let matchCount = 0;
    for (const token of tokens) {
      if (searchable.includes(token)) matchCount++;
    }

    const score = matchCount / tokens.length;
    if (score >= 0.4 && matchCount >= 1) {
      scored.push({ product: p, score, matchCount });
    }
  }

  scored.sort((a, b) => b.score - a.score || b.matchCount - a.matchCount);
  return scored.slice(0, 5);
}

function build360AuthHeadersAndParams() {
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

  return { headers, params };
}

function normalizeToChatId(value) {
  const source = String(value || '').trim();
  if (!source) return '';
  if (source.includes('@')) return source;
  // Certains providers renvoient un chatId opaque (non numerique): on le conserve tel quel.
  if (/[a-z]/i.test(source)) return source;
  const digits = source.replace(/[^\d]/g, '');
  if (!digits) return '';
  return `${digits}@c.us`;
}

export async function sendWhatsAppText(to, text, options = {}) {
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

  const { headers, params } = build360AuthHeadersAndParams();

  const incomingMessageId = String(options?.incomingMessageId || '').trim();
  const incomingChatId = normalizeToChatId(options?.incomingChatId || to);
  const shouldUseReplyEndpoint = Boolean(
    WHATSAPP_360_USE_REPLY_ENDPOINT &&
    WHATSAPP_360_REPLY_URL &&
    incomingMessageId
  );

  if (shouldUseReplyEndpoint) {
    headers['Content-Type'] = 'application/json';
    try {
      await axios.post(
        WHATSAPP_360_REPLY_URL,
        {
          chatId: incomingChatId,
          messageId: incomingMessageId,
          destinationChatId: incomingChatId,
          content: text
        },
        {
          headers,
          params,
          timeout: 15000
        }
      );
      return;
    } catch (error) {
      // Fallback sur sendMessage classique si le endpoint reply rejette le payload.
      console.warn('360 reply endpoint echec, fallback sendMessage:', error.message);
    }
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

async function generateAIReply({ userMessage, product, state, knowledge }) {
  if (!WHATSAPP_AI_ENABLED || !AI_API_KEY) return null;

  let productContext;
  if (product) {
    productContext = `Produit cible:
- nom: ${product.nom}
- code: ${product.code}
- prixUnitaire: ${product.prixUnitaire}
- stockActuel: ${product.stockActuel}
- description: ${product.description || 'N/A'}`;
  } else {
    const catalogue = await prisma.product.findMany({
      where: { actif: true },
      select: { nom: true, prixUnitaire: true, description: true, whatsappKnowledge: { select: { keyBenefits: true } } },
      take: 15
    });
    const catalogueLines = catalogue.map(p =>
      `- ${p.nom} (${Math.round(p.prixUnitaire)} FCFA): ${p.whatsappKnowledge?.keyBenefits?.substring(0, 80) || p.description?.substring(0, 80) || ''}`
    ).join('\n');
    productContext = `Pas de produit selectionne. Catalogue disponible:\n${catalogueLines}`;
  }

  const knowledgeContext = knowledge
    ? `Connaissance produit:
- keyBenefits: ${knowledge.keyBenefits || 'N/A'}
- usageTips: ${knowledge.usageTips || 'N/A'}
- objectionHandling: ${JSON.stringify(knowledge.objectionHandling || [])}
- faq: ${JSON.stringify(knowledge.faq || [])}
- closingScript: ${knowledge.closingScript || 'N/A'}
- missingInfoEscalation: ${knowledge.missingInfoEscalation || 'N/A'}`
    : 'Connaissance produit: non renseignee';

  const stateDescription = [];
  if (state.productId) stateDescription.push(`Produit choisi: ${state.productName || 'oui'}`);
  if (state.city) stateDescription.push(`Ville: ${state.city}`);
  if (state.customerName) stateDescription.push(`Nom: ${state.customerName}`);
  if (state.awaitingField) stateDescription.push(`En attente de: ${state.awaitingField}`);
  const stateText = stateDescription.length > 0 ? stateDescription.join(', ') : 'debut conversation';

  const systemPrompt = `Tu es un agent commercial et service client WhatsApp professionnel, poli, clair et rassurant.

REGLES ABSOLUES:
#1: Reponds TOUJOURS a la question exacte du client AVANT de parler de commande.
#2: Ne repete JAMAIS une info deja partagee dans la conversation.
#3: Maximum 3 lignes par message. Une seule question a la fois.
#4: Francais simple, ton humain, poli et vendeur.
#5: Ne jamais inventer d'information. Ne jamais demander de paiement dans le chat.
#6: TOUJOURS terminer ton message par une question de relance pour faire avancer la conversation (ex: "Ca t'interesse ?", "Tu veux commander ?", "Quelle est ta ville ?").

POLITIQUE BOUTIQUE (a respecter strictement):
- Nous sommes une BOUTIQUE EN LIGNE. Pas de magasin physique.
- Livraison uniquement sur commande. Paiement a la livraison.
- Livraison gratuite a Abidjan, sous 24-48h.
- Livraison hors Abidjan possible (frais selon ville).
- Jours de livraison: lundi au samedi. PAS de livraison le dimanche.
- Produits 100% originaux et authentiques.

Si le client demande l'adresse/magasin/localisation: repondre que c'est une boutique en ligne avec livraison sur commande et paiement a la livraison.
Si le client demande pour le dimanche: repondre non, livraison du lundi au samedi.

ETAPES DE VENTE (dans l'ordre naturel):
1. Saluer et identifier le besoin
2. Presenter brievement: produit, prix, livraison
3. Demander ville/commune de livraison
4. Demander nom complet
5. Resumer et demander "je confirme"

Si le client pose une question (utilisation, benefices, localisation, jours...), reponds clairement PUIS relance doucement vers la commande.

Si le client decrit un besoin sans nommer de produit (ex: "creme contre les douleurs", "produit pour cicatrices"), propose le ou les produits correspondants avec nom et prix. Si un seul correspond, presente-le directement. Si plusieurs, liste-les pour que le client choisisse.`;

  const userPrompt = `${productContext}
${knowledgeContext}

Etat actuel: ${stateText}

${userMessage}

Reponds en 2-3 lignes maximum. Sois naturel et vendeur.`;

  if (AI_PROVIDER === 'gemini') {
    return callGeminiNativeAPI(systemPrompt, userPrompt);
  }
  return callOpenAICompatibleAPI(systemPrompt, userPrompt);
}

async function callGeminiNativeAPI(systemPrompt, userPrompt) {
  const model = AI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_API_KEY}`;

  const response = await axios.post(
    url,
    {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: AI_TEMPERATURE,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 }
      }
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: WHATSAPP_AI_TIMEOUT_MS
    }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function callOpenAICompatibleAPI(systemPrompt, userPrompt) {
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
      timeout: WHATSAPP_AI_TIMEOUT_MS
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || null;
}

function isQuestionLike(text) {
  const value = String(text || '').toLowerCase();
  return (
    value.includes('?')
    || /(comment|pourquoi|combien|quand|quelle|quel|est.ce|c.est quoi|ou\b|où|aide|utilisation|sert a|a quoi|ingredient|composition|effet|benefice|avantage|danger|risque)/i.test(value)
  );
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
      status: 'A_APPELER',
      sourceCampagne: 'WhatsApp AI Bot',
      sourcePage: 'WhatsApp',
      noteAppelant: 'Commande recue via WhatsApp bot. A appeler pour confirmation.'
    }
  });

  const changedBy = Number(process.env.WHATSAPP_SYSTEM_USER_ID || 0);
  if (changedBy > 0) {
    try {
      await prisma.statusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: null,
          newStatus: 'A_APPELER',
          changedBy,
          comment: 'Commande recue via WhatsApp bot. En attente d appel de confirmation.'
        }
      });
    } catch (error) {
      console.warn('WhatsApp bot: impossible de creer StatusHistory:', error.message);
    }
  }

  return order;
}

function extractMediaUrl(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const candidates = [
    obj.audio?.url,
    obj.audio?.link,
    typeof obj.audio === 'string' ? obj.audio : null,
    obj.voice?.url,
    obj.voice?.link,
    typeof obj.voice === 'string' ? obj.voice : null,
    obj.ptt?.url,
    obj.ptt?.link,
    obj.media?.url,
    obj.media?.link,
    obj.media_url,
    obj.file_url,
    obj.file?.url,
    obj.url,
    obj.link,
    obj.download_url,
    obj.downloadUrl
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && (c.startsWith('http://') || c.startsWith('https://'))) return c;
  }
  return null;
}

async function transcribeAudio(audioUrl) {
  if (!AI_API_KEY) return null;

  const audioResponse = await axios.get(audioUrl, {
    responseType: 'arraybuffer',
    timeout: 20000,
    headers: build360AuthHeadersAndParams().headers
  });
  const audioBuffer = Buffer.from(audioResponse.data);

  if (AI_PROVIDER === 'gemini') {
    const base64Audio = audioBuffer.toString('base64');
    const model = AI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_API_KEY}`;

    const result = await axios.post(
      url,
      {
        contents: [{
          parts: [
            { text: 'Transcris ce message vocal en francais. Donne UNIQUEMENT le texte transcrit, sans commentaire.' },
            { inlineData: { mimeType: 'audio/ogg', data: base64Audio } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    return result.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  }

  const FormData = (await import('form-data')).default || (await import('form-data'));
  const form = new FormData();
  form.append('file', audioBuffer, { filename: 'voice.ogg', contentType: 'audio/ogg' });
  form.append('model', 'whisper-1');
  form.append('language', 'fr');

  const result = await axios.post(
    `${AI_BASE_URL.replace(/\/$/, '')}/audio/transcriptions`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${AI_API_KEY}`
      },
      timeout: 20000
    }
  );

  return result.data?.text?.trim() || null;
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
          messageId: msg.id,
          chatId: msg?.from ? `${String(msg.from).replace(/[^\d]/g, '')}@c.us` : null,
          mediaUrl: extractMediaUrl(msg)
        });
      }
    }
  }

  if (messages.length > 0) {
    return messages;
  }

  // 2) Format generique (360Messenger / autres providers webhook)
  const genericCandidates = [];
  if (payload && typeof payload === 'object') genericCandidates.push(payload);
  if (Array.isArray(payload?.messages)) genericCandidates.push(...payload.messages);
  if (Array.isArray(payload?.data?.messages)) genericCandidates.push(...payload.data.messages);
  if (payload?.message && typeof payload.message === 'object') genericCandidates.push(payload.message);
  if (payload?.data?.message && typeof payload.data.message === 'object') genericCandidates.push(payload.data.message);
  if (payload?.data && typeof payload.data === 'object') genericCandidates.push(payload.data);
  if (payload?.event && typeof payload.event === 'object') genericCandidates.push(payload.event);
  if (payload?.event?.data && typeof payload.event.data === 'object') genericCandidates.push(payload.event.data);

  for (const raw of genericCandidates) {
    const fromRaw =
      raw?.from ||
      raw?.From ||
      raw?.phone ||
      raw?.number ||
      raw?.sender ||
      raw?.Sender ||
      raw?.wa_id ||
      raw?.from_number ||
      raw?.sender_number ||
      raw?.chatId ||
      raw?.WhatsappId ||
      raw?.sender?.id ||
      payload?.from ||
      payload?.From ||
      payload?.phone;
    const from = String(fromRaw || '')
      .replace(/[^\d]/g, '')
      .trim();
    const text =
      raw?.text?.body ||
      raw?.text ||
      raw?.chat ||
      raw?.Chat ||
      raw?.body?.text ||
      raw?.message ||
      raw?.body ||
      raw?.caption ||
      raw?.content ||
      raw?.conversation ||
      payload?.Chat ||
      '';
    const rawType = String(raw?.type || raw?.Type || (text ? 'text' : 'unknown'))
      .trim()
      .toLowerCase();
    const type = ['chat', 'conversation', 'text'].includes(rawType) ? 'text' : rawType;
    const name = raw?.name || raw?.sender_name || raw?.profile?.name || payload?.name || payload?.sender_name || null;
    const messageId = raw?.id || raw?.ID || raw?.message_id || raw?.msgId || raw?.Hash || null;
    const chatId = raw?.chatId || raw?.chat_id || raw?.jid || raw?.WhatsappId || payload?.chatId || payload?.WhatsappId || null;

    if (from && (text || ['audio', 'ptt', 'voice'].includes(type))) {
      messages.push({
        from,
        name: name ? String(name) : null,
        type: String(type),
        text: String(text || ''),
        messageId: messageId ? String(messageId) : null,
        chatId: chatId ? String(chatId) : normalizeToChatId(from),
        mediaUrl: extractMediaUrl(raw) || extractMediaUrl(payload)
      });
    }
  }

  // 3) Format ultra simple
  if (
    messages.length === 0 &&
    (payload?.from || payload?.From || payload?.phone) &&
    (payload?.text || payload?.message || payload?.chat || payload?.Chat)
  ) {
    messages.push({
      from: String(payload.from || payload.From || payload.phone).replace(/[^\d]/g, ''),
      name: payload.name ? String(payload.name) : null,
      type: ['chat', 'conversation', 'text'].includes(
        String(payload.type || payload.Type || 'text').trim().toLowerCase()
      )
        ? 'text'
        : String(payload.type || payload.Type || 'text').trim().toLowerCase(),
      text: String(payload.text || payload.message || payload.chat || payload.Chat),
      messageId: payload.id ? String(payload.id) : payload.ID ? String(payload.ID) : null,
      chatId: payload.chatId
        ? String(payload.chatId)
        : payload.WhatsappId
          ? String(payload.WhatsappId)
          : normalizeToChatId(payload.from || payload.From || payload.phone)
    });
  }

  if (messages.length === 0) {
    try {
      const keys = Object.keys(payload || {});
      console.warn('WhatsApp webhook: payload non reconnu, keys=', keys);
    } catch (error) {
      console.warn('WhatsApp webhook: payload non reconnu');
    }
  }

  return messages;
}

function getFollowUpQuestion(state, product) {
  if (state.awaitingField === 'confirm' && state.city && state.customerName) {
    return 'Reponds "je confirme" pour valider ta commande.';
  }
  if (state.awaitingField === 'name' && state.city) {
    return 'Quel est ton nom complet pour finaliser la commande ?';
  }
  if (state.awaitingField === 'city' && state.productId) {
    return 'Dans quelle ville ou commune souhaites-tu la livraison ?';
  }
  if (product && state.productIntroduced) {
    return 'Souhaites-tu commander ou tu as une autre question ?';
  }
  if (product) {
    return 'Ca t\'interesse ? Je peux t\'en dire plus ou enregistrer ta commande.';
  }
  return 'Quel produit t\'interesse ?';
}

async function buildRuleBasedReply({ text, product, state, knowledge }) {
  const clientAsking = isQuestionLike(text);
  const objectionItems = parseKnowledgeItems(knowledge?.objectionHandling);
  const faqItems = parseKnowledgeItems(knowledge?.faq);
  const objectionAnswer = findKnowledgeAnswer(text, objectionItems);
  const faqAnswer = findKnowledgeAnswer(text, faqItems);

  const followUpQuestion = getFollowUpQuestion(state, product);

  const globalAnswer = findKnowledgeAnswer(text, GLOBAL_FAQ);
  if (globalAnswer) {
    return { reply: `${globalAnswer}\n\n${followUpQuestion}`, escaladeManqueInfo: false };
  }

  if (objectionAnswer) {
    const closeLine = knowledge?.closingScript
      || "Ca t'interesse ? Dis simplement: je confirme.";
    return { reply: `${objectionAnswer}\n${closeLine}`, escaladeManqueInfo: false };
  }

  if (faqAnswer) {
    return { reply: `${faqAnswer}\n\n${followUpQuestion}`, escaladeManqueInfo: false };
  }

  if (!clientAsking && state.productIntroduced) {
    if (state.awaitingField === 'city') {
      return { reply: 'Dans quelle ville ou commune souhaites-tu la livraison ?', escaladeManqueInfo: false };
    }
    if (state.awaitingField === 'name') {
      return { reply: 'Quel est ton nom complet pour finaliser la commande ?', escaladeManqueInfo: false };
    }
    if (state.awaitingField === 'confirm' && state.customerName && state.city) {
      const q = state.quantity || 1;
      return {
        reply: `Merci ${state.customerName} !\n\nRecap: ${state.productName} x${q}, livraison a ${state.city}.\nReponds "je confirme" pour valider ta commande.`,
        escaladeManqueInfo: false
      };
    }
  }

  if (product && !state.productIntroduced) {
    const lines = [`${product.nom} - ${Math.round(product.prixUnitaire)} FCFA`];
    if (knowledge?.keyBenefits) lines.push(knowledge.keyBenefits);
    lines.push('Livraison gratuite a Abidjan.');
    lines.push('Dans quelle ville souhaites-tu la livraison ?');
    return {
      reply: lines.join('\n'),
      escaladeManqueInfo: false,
      markProductIntroduced: true
    };
  }

  if (product && clientAsking) {
    return { reply: null, escaladeManqueInfo: isLikelyMissingInfoQuestion(text) && !knowledge?.keyBenefits };
  }

  if (!product) {
    return { reply: "Bonjour ! Je suis ton conseiller. Quel produit t'interesse ?", escaladeManqueInfo: false };
  }

  return { reply: null, escaladeManqueInfo: false };
}

export async function processIncomingWhatsAppPayload(payload) {
  const incoming = extractWhatsAppMessages(payload);

  for (const item of incoming) {
    if (item.type !== 'text') {
      if (['audio', 'ptt', 'voice'].includes(item.type)) {
        if (item.mediaUrl && AI_API_KEY) {
          try {
            console.log(`[BOT ${item.from}] Transcription audio en cours...`);
            const transcription = await transcribeAudio(item.mediaUrl);
            if (transcription) {
              console.log(`[BOT ${item.from}] Transcrit: ${transcription.substring(0, 80)}`);
              item.text = transcription;
              item.type = 'text';
            }
          } catch (error) {
            console.error(`[BOT ${item.from}] Transcription echec:`, error.message);
          }
        }

        if (item.type !== 'text') {
          await sendWhatsAppText(
            item.from,
            "J'ai bien recu ton message vocal mais je n'ai pas pu le transcrire. Peux-tu m'envoyer ton message en texte s'il te plait ?",
            { incomingMessageId: item.messageId, incomingChatId: item.chatId || item.from }
          );
          continue;
        }
      } else {
        await sendWhatsAppText(
          item.from,
          'Je traite uniquement les messages texte et vocaux pour le moment. Ecris ou envoie un vocal et je te reponds.',
          { incomingMessageId: item.messageId, incomingChatId: item.chatId || item.from }
        );
        continue;
      }
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

    await saveMessage(conversation.id, 'CLIENT', item.text, {
      messageId: item.messageId,
      chatId: item.chatId || null
    });

    const state = conversation.state || {};
    const lowerText = item.text.toLowerCase();

    if (['humain', 'agent', 'conseiller'].some((k) => lowerText.includes(k))) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { handedToHuman: true }
      });
      const reply = 'Un conseiller humain va prendre le relais tres vite. Merci pour ta patience.';
      await sendWhatsAppText(item.from, reply, {
        incomingMessageId: item.messageId,
        incomingChatId: item.chatId || item.from
      });
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
        await sendWhatsAppText(item.from, reactivate, {
          incomingMessageId: item.messageId,
          incomingChatId: item.chatId || item.from
        });
        await saveMessage(conversation.id, 'BOT', reactivate, { reactivated: true });
      } else {
        await sendWhatsAppText(item.from, reply, {
          incomingMessageId: item.messageId,
          incomingChatId: item.chatId || item.from
        });
        await saveMessage(conversation.id, 'BOT', reply, {});
      }
      continue;
    }

    let product = null;
    let knowledge = null;
    let suggestedProducts = null;

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

    if (!product && !state.productId) {
      const descMatches = await findProductsByDescription(item.text);
      if (descMatches.length === 1) {
        product = descMatches[0].product;
        state.productId = product.id;
        state.productName = product.nom;
      } else if (descMatches.length > 1) {
        suggestedProducts = descMatches;
      }
    }

    if (!product && state.lastProductId) {
      product = await prisma.product.findUnique({ where: { id: state.lastProductId } });
    }

    if (product?.id) {
      knowledge = await getProductKnowledge(product.id);
    }

    const objectionAnswerPreview = findKnowledgeAnswer(
      item.text,
      parseKnowledgeItems(knowledge?.objectionHandling)
    );
    const faqAnswerPreview = findKnowledgeAnswer(
      item.text,
      parseKnowledgeItems(knowledge?.faq)
    );
    const hasDescriptionInfo = Boolean(String(product?.description || '').trim());
    const infoQuestionWithoutKnowledge =
      Boolean(product) &&
      isLikelyMissingInfoQuestion(item.text) &&
      !objectionAnswerPreview &&
      !faqAnswerPreview &&
      !knowledge?.keyBenefits &&
      !knowledge?.usageTips &&
      !hasDescriptionInfo;

    const recentMessages = await prisma.whatsAppMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
    const conversationContextText = recentMessages
      .reverse()
      .map((m) => `${m.sender}: ${m.message}`)
      .join('\n');

    const quantity = parseQuantityFromText(item.text);
    if (quantity) state.quantity = quantity;

    const cityMatch = item.text.match(/ville\s+([a-zA-ZÀ-ÿ' -]{2,40})/i);
    if (cityMatch?.[1]) state.city = cityMatch[1].trim();

    if (!state.customerName && item.name) {
      state.customerName = item.name;
    }

    if (state.awaitingField === 'city' && !state.city && item.text.length <= 40) {
      const cityCandidate = item.text.trim();
      const notACity = /^(bonjour|bonsoir|salut|hello|hey|oui|non|merci|ok|d.accord|comment|pourquoi|combien|quel|quelle|aide|je veux|c.est|est.ce|utilisation|produit|prix|livraison|information|scargel)/i;
      if (!notACity.test(cityCandidate) && !isQuestionLike(cityCandidate) && cityCandidate.length >= 2) {
        state.city = cityCandidate;
        if (!state.customerName) {
          state.awaitingField = 'name';
        } else {
          state.awaitingField = 'confirm';
        }
      }
    } else if (state.awaitingField === 'name' && !state.customerName && item.text.length <= 80) {
      const nameCandidate = item.text.trim();
      const notAName = /^(bonjour|bonsoir|salut|hello|oui|non|merci|ok|comment|pourquoi|combien|quel|quelle|aide|je veux|c.est|est.ce|utilisation|produit|prix|livraison|il |elle |ca |vous )/i;
      if (!notAName.test(nameCandidate) && !isQuestionLike(nameCandidate) && nameCandidate.length >= 2) {
        state.customerName = nameCandidate;
        state.awaitingField = 'confirm';
      }
    }

    const shouldConfirmOrder = isOrderConfirmation(item.text) && state.productId && state.city && state.customerName;
    if (shouldConfirmOrder) {
      const order = await createValidatedOrderFromConversation(conversation, state);
      if (order) {
        const reply = `Commande enregistree avec succes!\nReference: ${order.orderReference}\nProduit: ${order.produitNom}\nQuantite: ${order.quantite}\nMontant: ${Math.round(order.montant)} FCFA\nUn conseiller va te rappeler pour confirmer. Merci pour ta confiance!`;
        await sendWhatsAppText(item.from, reply, {
          incomingMessageId: item.messageId,
          incomingChatId: item.chatId || item.from
        });
        await saveMessage(conversation.id, 'BOT', reply, { orderId: order.id, autoValidated: true });

        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            state: { lastProductId: state.productId, lastProductName: state.productName },
            currentIntent: 'ORDER',
            lastMessageAt: new Date()
          }
        });
        continue;
      }
    }

    if (suggestedProducts && suggestedProducts.length > 1 && !state.productId) {
      const lines = ['J\'ai trouve plusieurs produits qui pourraient correspondre:'];
      suggestedProducts.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.product.nom} - ${Math.round(s.product.prixUnitaire)} FCFA`);
      });
      lines.push('\nLequel t\'interesse ? Donne-moi le nom ou le numero.');
      const reply = lines.join('\n');
      await sendWhatsAppText(item.from, reply, {
        incomingMessageId: item.messageId,
        incomingChatId: item.chatId || item.from
      });
      await saveMessage(conversation.id, 'BOT', reply, { suggestedProducts: suggestedProducts.map(s => s.product.nom) });
      state.suggestedProductIds = suggestedProducts.map(s => s.product.id);
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { state, lastMessageAt: new Date() }
      });
      continue;
    }

    if (state.suggestedProductIds && !state.productId) {
      const choiceNum = parseInt(item.text.trim(), 10);
      if (choiceNum >= 1 && choiceNum <= state.suggestedProductIds.length) {
        const chosenId = state.suggestedProductIds[choiceNum - 1];
        product = await prisma.product.findUnique({ where: { id: chosenId } });
        if (product) {
          state.productId = product.id;
          state.productName = product.nom;
          delete state.suggestedProductIds;
        }
      } else {
        const chosenByName = await findProductFromText(item.text);
        if (chosenByName && state.suggestedProductIds.includes(chosenByName.id)) {
          product = chosenByName;
          state.productId = product.id;
          state.productName = product.nom;
          delete state.suggestedProductIds;
        }
      }
      if (product?.id) {
        knowledge = await getProductKnowledge(product.id);
      }
    }

    if (detectedIntent === 'ORDER' || state.productId) {
      if (!state.productId) {
        state.awaitingField = 'product';
      } else if (!state.city) {
        state.awaitingField = 'city';
      } else if (!state.customerName) {
        state.awaitingField = 'name';
      } else {
        state.awaitingField = 'confirm';
      }
    }

    const fallback = await buildRuleBasedReply({
      text: item.text,
      product,
      state,
      knowledge
    });

    let reply = fallback.reply;
    let fallbackEscalationFlag = fallback.escaladeManqueInfo;

    if (fallback.markProductIntroduced) {
      state.productIntroduced = true;
    }

    const hasDirectKnowledgeAnswer = Boolean(objectionAnswerPreview || faqAnswerPreview);
    const clientIsAsking = isQuestionLike(item.text);
    const isProvidingOrderData = !clientIsAsking
      && state.productIntroduced
      && state.awaitingField
      && ['city', 'name', 'confirm'].includes(state.awaitingField);
    const shouldSkipAI = (hasDirectKnowledgeAnswer || isProvidingOrderData) && reply != null;

    console.log(`[BOT ${item.from}] skipAI=${shouldSkipAI} asking=${clientIsAsking} field=${state.awaitingField} introduced=${!!state.productIntroduced} hasFallback=${!!reply} AI_ENABLED=${WHATSAPP_AI_ENABLED} AI_PROVIDER=${AI_PROVIDER} HAS_KEY=${!!AI_API_KEY}`);

    if (!shouldSkipAI) {
      try {
        console.log(`[BOT ${item.from}] Appel IA ${AI_PROVIDER}/${AI_MODEL}...`);
        const aiReply = await generateAIReply({
          userMessage: conversationContextText
            ? `Historique:\n${conversationContextText}\n\nDernier message client: ${item.text}`
            : item.text,
          product,
          state,
          knowledge
        });
        console.log(`[BOT ${item.from}] IA reponse: ${aiReply ? aiReply.substring(0, 80) + '...' : 'NULL'}`);
        if (aiReply) reply = aiReply;
      } catch (error) {
        console.error(`[BOT ${item.from}] IA ERREUR: ${error.response?.data?.error?.message || error.message}`);
      }
    }

    if (!reply) {
      reply = product
        ? `${product.nom} - ${Math.round(product.prixUnitaire)} FCFA. ${getFollowUpQuestion(state, product)}`
        : "Bonjour ! Quel produit t'interesse ?";
    }

    if (reply && product && !reply.includes('?') && state.productIntroduced) {
      reply += `\n\n${getFollowUpQuestion(state, product)}`;
    }

    if (state.awaitingField === 'confirm' && state.productId && state.city && !reply.includes('je confirme')) {
      const q = state.quantity || 1;
      reply += `\n\nRecap: ${state.productName} x${q}, livraison a ${state.city}, nom ${state.customerName || 'a confirmer'}. Reponds "je confirme" pour valider.`;
    }

    if (fallbackEscalationFlag || infoQuestionWithoutKnowledge) {
      state.missingInfoAttempts = Number(state.missingInfoAttempts || 0) + 1;
    } else {
      state.missingInfoAttempts = 0;
    }

    const shouldEscalateForMissingInfo =
      state.missingInfoAttempts >= Math.max(1, WHATSAPP_MAX_MISSING_INFO_ATTEMPTS);
    if (shouldEscalateForMissingInfo) {
      const escalationMessage =
        knowledge?.missingInfoEscalation ||
        "Je prefere te transferer a un conseiller humain pour te donner une information precise et fiable.";
      reply += `\n\n${escalationMessage}`;
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { handedToHuman: true }
      });
      state.missingInfoAttempts = 0;
    }

    await sendWhatsAppText(item.from, reply, {
      incomingMessageId: item.messageId,
      incomingChatId: item.chatId || item.from
    });
    await saveMessage(conversation.id, 'BOT', reply, {
      intent: detectedIntent,
      productId: state.productId || null,
      knowledgeId: knowledge?.id || null
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
