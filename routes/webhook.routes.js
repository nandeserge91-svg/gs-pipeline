import express from 'express';

import { body, validationResult } from 'express-validator';
import { cleanPhoneNumber } from '../utils/phone.util.js';
import {
  applyRetargetingDiscount,
  classifyOrderTrafficSource,
  parseTaggedProductSource,
  RETARGETING_DISCOUNT_AMOUNT,
} from '../utils/campaign-source.util.js';
import { sendSMS, smsTemplates } from '../services/sms.service.js';

const router = express.Router();
import prisma from '../config/prisma.js';

// 💰 Fonction pour calculer le prix total selon la quantité et les prix variantes
function calculatePriceByQuantity(product, quantity) {
  const qty = parseInt(quantity) || 1;
  
  // Si le produit a des prix variantes définis
  if (product.prix1 || product.prix2 || product.prix3) {
    if (qty === 1 && product.prix1) {
      return product.prix1; // Prix pour 1 unité
    } else if (qty === 2 && product.prix2) {
      return product.prix2; // Prix pour 2 unités
    } else if (qty >= 3 && product.prix3) {
      return product.prix3; // Prix pour 3+ unités
    }
  }
  
  // Sinon, utiliser le prix unitaire × quantité
  return product.prixUnitaire * qty;
}

// Middleware pour vérifier l'API Key (sécurité webhook Make)
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'API Key manquante. Veuillez fournir X-API-KEY dans les headers.' 
    });
  }
  
  if (apiKey !== process.env.MAKE_WEBHOOK_API_KEY) {
    console.error('❌ Tentative d\'accès avec API Key invalide:', apiKey);
    return res.status(401).json({ 
      success: false,
      error: 'API Key invalide.' 
    });
  }
  
  next();
};

// POST /api/webhook/make - Réception des commandes depuis Make
router.post('/make', verifyApiKey, [
  body('product_key').notEmpty().withMessage('product_key requis'),
  body('customer_phone').notEmpty().withMessage('customer_phone requis'),
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Données invalides',
        details: errors.array() 
      });
    }

    const {
      product_key,
      customer_name,
      customer_phone,
      customer_city,
      customer_commune,
      customer_address,
      quantity,
      source,
      make_scenario_name,
      campaign_source,
      campaign_name,
      page_url,
      raw_payload
    } = req.body;

    console.log('📥 Commande reçue depuis Make:', {
      product_key,
      customer_name,
      customer_phone,
      customer_city,
      quantity: quantity || 1,
      source
    });

    // 1. Retirer une éventuelle balise publicitaire avant la recherche produit.
    const normalizedProductKey = String(product_key).replace(/^\d+_/, '').trim();
    const sourceAttribution = parseTaggedProductSource(normalizedProductKey);
    const hasTaggedProductSource = sourceAttribution.productKey !== sourceAttribution.originalTag;
    const trafficSource = classifyOrderTrafficSource({
      campaignSource: [
        hasTaggedProductSource ? sourceAttribution.campaignSource : null,
        campaign_source,
        campaign_name,
        make_scenario_name,
      ].filter(Boolean).join(' '),
      sourcePage: [product_key, source, page_url].filter(Boolean).join(' '),
    });
    const resolvedCampaignSource = trafficSource === 'retargeting'
      ? 'Facebook Retargeting'
      : hasTaggedProductSource
        ? sourceAttribution.campaignSource
        : campaign_source || campaign_name || make_scenario_name || 'Make';

    const product = await prisma.product.findFirst({
      where: {
        code: {
          equals: sourceAttribution.productKey,
          mode: 'insensitive'
        }
      }
    });

    if (!product) {
      console.error(`❌ Produit introuvable pour product_key: ${product_key}`);
      return res.status(400).json({ 
        success: false,
        error: `Produit inconnu avec product_key: ${product_key}`,
        hint: 'Vérifiez que le produit existe dans l\'app avec ce code.'
      });
    }

    // 2. Calculer les montants avec prix variantes
    const orderQuantity = parseInt(quantity) || 1;
    const baseTotalAmount = calculatePriceByQuantity(product, orderQuantity);
    const totalAmount = applyRetargetingDiscount(baseTotalAmount, resolvedCampaignSource);
    
    console.log('💰 Calcul prix:', {
      quantité: orderQuantity,
      prix1: product.prix1,
      prix2: product.prix2,
      prix3: product.prix3,
      prixUnitaire: product.prixUnitaire,
      remiseRetargeting: resolvedCampaignSource === 'Facebook Retargeting' ? RETARGETING_DISCOUNT_AMOUNT : 0,
      montantTotal: totalAmount
    });

    // 3. Nettoyer le numéro de téléphone (ajouter +, enlever espaces)
    const cleanedPhone = cleanPhoneNumber(customer_phone);
    console.log(`📞 Numéro nettoyé: ${customer_phone} → ${cleanedPhone}`);

    // 4. Créer la commande dans la base de données
    const order = await prisma.order.create({
      data: {
        // Informations client (seul le contact est obligatoire)
        clientNom: (customer_name && customer_name.trim()) ? customer_name.trim() : 'À renseigner',
        clientTelephone: cleanedPhone,
        clientVille: (customer_city && customer_city.trim()) ? customer_city.trim() : 'À renseigner',
        clientCommune: customer_commune || null,
        clientAdresse: customer_address || null,
        
        // Informations produit
        produitNom: product.nom,
        produitPage: page_url || source || null,
        productId: product.id,
        quantite: orderQuantity,
        montant: totalAmount,
        
        // Informations marketing
        sourceCampagne: resolvedCampaignSource,
        sourcePage: source || page_url || (hasTaggedProductSource ? sourceAttribution.originalTag : make_scenario_name) || null,
        
        // Statut initial
        status: 'NOUVELLE'
      },
      include: {
        product: true
      }
    });

    // 4. Envoi SMS de confirmation (non bloquant)
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    const smsOrderCreatedEnabled = process.env.SMS_ORDER_CREATED !== 'false';
    
    if (smsEnabled && smsOrderCreatedEnabled) {
      try {
        const message = await smsTemplates.orderCreated(order.clientNom, order.orderReference, order.produitNom);
        const smsResult = await sendSMS(order.clientTelephone, message, {
          orderId: order.id,
          type: 'ORDER_CREATED'
        });
        if (smsResult.success) {
          console.log(`✅ SMS ORDER_CREATED envoyé pour commande ${order.orderReference} (Make webhook)`);
        } else {
          console.error(`⚠️ Échec SMS ORDER_CREATED pour commande ${order.orderReference} (Make webhook): ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error('⚠️ Erreur envoi SMS Make webhook (non bloquante):', smsError.message);
      }
    }

    // 5. Log pour traçabilité
    console.log('✅ Commande créée depuis Make:', {
      orderId: order.id,
      orderReference: order.orderReference,
      product: product.nom,
      customer: customer_name,
      amount: totalAmount
    });

    // 5. Optionnel : Enregistrer le payload brut pour debug si fourni
    if (raw_payload) {
      // Vous pouvez stocker raw_payload dans une table de logs si nécessaire
      console.log('📋 Raw payload Make:', raw_payload);
    }

    // 6. Retourner une réponse de succès
    res.json({
      success: true,
      order_id: order.id,
      order_reference: order.orderReference,
      product: {
        id: product.id,
        name: product.nom,
        code: product.code
      },
      amount: totalAmount,
      message: 'Commande créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création commande depuis Make:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la création de la commande',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/webhook/test - Endpoint de test (protégé par API Key)
router.get('/test', verifyApiKey, (req, res) => {
  res.json({
    success: true,
    message: 'Webhook Make fonctionnel !',
    timestamp: new Date().toISOString()
  });
});

// GET /api/webhook/products - Liste des produits disponibles (pour configuration Make)
router.get('/products', verifyApiKey, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        code: true,
        nom: true,
        prixUnitaire: true,
        stockActuel: true
      },
      orderBy: {
        nom: 'asc'
      }
    });

    res.json({
      success: true,
      products: products.map(p => ({
        product_key: p.code,
        name: p.nom,
        price: p.prixUnitaire,
        stock: p.stockActuel
      })),
      count: products.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération produits:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// POST /api/webhook/google-sheet - Réception depuis Google Apps Script (Bee Venom)
router.post('/google-sheet', [
  body('telephone').notEmpty().withMessage('telephone requis'),
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Données invalides',
        details: errors.array() 
      });
    }

    const {
      nom,           // Nom du client
      telephone,     // Téléphone
      ville,         // Ville
      offre,         // Nom de l'offre/produit
      tag,           // Tag optionnel
      quantite,      // Quantité du produit
      notes          // 🆕 Notes (taille, code, etc.)
    } = req.body;

    console.log('📥 Commande reçue depuis Google Sheet:', {
      nom,
      telephone,
      ville,
      offre: offre || tag,
      quantite: quantite || 1
    });

    // 🆕 NETTOYAGE DU TAG : Enlever le préfixe de quantité (1_, 2_, 3_)
    let searchTerm = tag || offre;
    let cleanedSearchTerm = searchTerm;
    let sourceAttribution = parseTaggedProductSource('');
    
    if (searchTerm) {
      // Supprimer le préfixe numérique (1_, 2_, 3_) si présent
      cleanedSearchTerm = searchTerm.replace(/^\d+_/, '');
      
      // Supprimer les espaces en trop au début et à la fin
      cleanedSearchTerm = cleanedSearchTerm.trim();
      
      // Supprimer les underscores multiples
      cleanedSearchTerm = cleanedSearchTerm.replace(/_+/g, '_');

      // Retirer uniquement la balise publicitaire avant la recherche produit.
      // SCARGEL-TIK trouve donc le produit SCARGEL, sans produit ni stock séparé.
      sourceAttribution = parseTaggedProductSource(cleanedSearchTerm);
      cleanedSearchTerm = sourceAttribution.productKey;
      
      console.log('📥 Tag reçu:', searchTerm);
      console.log('🧹 Tag nettoyé:', cleanedSearchTerm);
    }

    // Chercher un produit correspondant à l'offre
    // On cherche d'abord par code, sinon par nom (recherche partielle)
    let product = null;
    
    if (cleanedSearchTerm) {
      console.log('🔍 Recherche produit avec terme:', cleanedSearchTerm);
      
      // 🆕 Essayer de trouver par code (case-insensitive pour plus de flexibilité)
      product = await prisma.product.findFirst({
        where: { 
          code: {
            equals: cleanedSearchTerm,
            mode: 'insensitive'
          }
        }
      });
      
      if (product) {
        console.log('✅ Produit trouvé par code:', product.code, '|', product.nom, '| ID:', product.id);
      }
      
      // Si pas trouvé, chercher par nom (contient)
      if (!product) {
        console.log('⚠️ Pas trouvé par code, recherche par nom...');
        product = await prisma.product.findFirst({
          where: { 
            nom: {
              contains: cleanedSearchTerm,
              mode: 'insensitive'
            }
          }
        });
        
        if (product) {
          console.log('✅ Produit trouvé par nom:', product.code, '|', product.nom, '| ID:', product.id);
        } else {
          console.log('❌ PRODUIT NON TROUVÉ pour:', cleanedSearchTerm);
          console.log('💡 Vérifiez que le produit existe dans la base de données');
          console.log('   Tag original:', searchTerm);
          console.log('   Tag nettoyé:', cleanedSearchTerm);
        }
      }
    } else {
      console.log('⚠️ Aucun tag ou offre fourni');
    }
    
    // Quantité (par défaut 1 si non spécifiée)
    const orderQuantity = parseInt(quantite) || 1;
    
    // Si aucun produit trouvé, utiliser un produit par défaut ou créer sans produit
    const baseAmount = product ? calculatePriceByQuantity(product, orderQuantity) : 0;
    const discountedAmount = applyRetargetingDiscount(baseAmount, sourceAttribution.campaignSource);
    const productData = product ? {
      produitNom: product.nom,
      productId: product.id,
      montant: discountedAmount,
      quantite: orderQuantity
    } : {
      produitNom: offre || tag || 'Produit non spécifié',
      productId: null,
      montant: 0,
      quantite: orderQuantity
    };
    
    if (product) {
      console.log('💰 Calcul prix Google Sheet:', {
        quantité: orderQuantity,
        prix1: product.prix1,
        prix2: product.prix2,
        prix3: product.prix3,
        prixUnitaire: product.prixUnitaire,
        remiseRetargeting: sourceAttribution.campaignSource === 'Facebook Retargeting' ? RETARGETING_DISCOUNT_AMOUNT : 0,
        montantTotal: productData.montant
      });
    }

    // Nettoyer le numéro de téléphone (ajouter +, enlever espaces)
    const cleanedPhone = cleanPhoneNumber(telephone);
    console.log(`📞 Numéro nettoyé Google Sheet: ${telephone} → ${cleanedPhone}`);

    // Créer la commande avec statut NOUVELLE (apparaîtra dans "À appeler")
    const order = await prisma.order.create({
      data: {
        // Informations client (seul le contact est obligatoire)
        clientNom: (nom && nom.trim()) ? nom.trim() : 'À renseigner',
        clientTelephone: cleanedPhone,
        clientVille: (ville && ville.trim()) ? ville.trim() : 'À renseigner',
        clientCommune: null,
        clientAdresse: null,
        
        // Informations produit
        ...productData,
        
        // Source
        sourceCampagne: sourceAttribution.campaignSource || 'Google Sheet - Bee Venom',
        sourcePage: tag || offre || null,
        
        // 🆕 Notes (taille, code, etc.)
        noteGestionnaire: notes || null,
        
        // Statut initial = NOUVELLE (pour "À appeler")
        status: 'NOUVELLE'
      },
      include: {
        product: true
      }
    });

    // Envoi SMS de confirmation (non bloquant)
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    const smsOrderCreatedEnabled = process.env.SMS_ORDER_CREATED !== 'false';
    
    if (smsEnabled && smsOrderCreatedEnabled) {
      try {
        const message = await smsTemplates.orderCreated(order.clientNom, order.orderReference, order.produitNom);
        const smsResult = await sendSMS(order.clientTelephone, message, {
          orderId: order.id,
          type: 'ORDER_CREATED'
        });
        if (smsResult.success) {
          console.log(`✅ SMS ORDER_CREATED envoyé pour commande ${order.orderReference} (Google Sheet webhook)`);
        } else {
          console.error(`⚠️ Échec SMS ORDER_CREATED pour commande ${order.orderReference} (Google Sheet webhook): ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error('⚠️ Erreur envoi SMS Google Sheet webhook (non bloquante):', smsError.message);
      }
    }

    console.log('✅ Commande créée depuis Google Sheet:', {
      orderId: order.id,
      orderReference: order.orderReference,
      customer: nom,
      product: productData.produitNom
    });

    // Réponse pour Google Apps Script
    res.json({
      success: true,
      order_id: order.id,
      order_reference: order.orderReference,
      message: 'Commande ajoutée dans "À appeler"'
    });

  } catch (error) {
    console.error('❌ Erreur création commande depuis Google Sheet:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;



