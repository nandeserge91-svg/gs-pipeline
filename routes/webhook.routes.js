import express from 'express';

import { body, validationResult } from 'express-validator';
import { cleanPhoneNumber } from '../utils/phone.util.js';
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
  body('customer_name').notEmpty().withMessage('customer_name requis'),
  body('customer_phone').notEmpty().withMessage('customer_phone requis'),
  body('customer_city').notEmpty().withMessage('customer_city requis'),
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

    // 1. Chercher le produit via product_key (qui correspond au champ "code")
    const product = await prisma.product.findUnique({
      where: { code: product_key }
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
    const totalAmount = calculatePriceByQuantity(product, orderQuantity);
    
    console.log('💰 Calcul prix:', {
      quantité: orderQuantity,
      prix1: product.prix1,
      prix2: product.prix2,
      prix3: product.prix3,
      prixUnitaire: product.prixUnitaire,
      montantTotal: totalAmount
    });

    // 3. Nettoyer le numéro de téléphone (ajouter +, enlever espaces)
    const cleanedPhone = cleanPhoneNumber(customer_phone);
    console.log(`📞 Numéro nettoyé: ${customer_phone} → ${cleanedPhone}`);

    // 4. Créer la commande dans la base de données
    const order = await prisma.order.create({
      data: {
        // Informations client
        clientNom: customer_name,
        clientTelephone: cleanedPhone,
        clientVille: customer_city,
        clientCommune: customer_commune || null,
        clientAdresse: customer_address || null,
        
        // Informations produit
        produitNom: product.nom,
        produitPage: page_url || source || null,
        productId: product.id,
        quantite: orderQuantity,
        montant: totalAmount,
        
        // Informations marketing
        sourceCampagne: campaign_source || campaign_name || make_scenario_name || 'Make',
        sourcePage: source || page_url || make_scenario_name || null,
        
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
        await sendSMS(order.clientTelephone, message, {
          orderId: order.id,
          type: 'ORDER_CREATED'
        });
        console.log(`✅ SMS ORDER_CREATED envoyé pour commande ${order.orderReference} (Make webhook)`);
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
  body('nom').notEmpty().withMessage('nom requis'),
  body('telephone').notEmpty().withMessage('telephone requis'),
  body('ville').notEmpty().withMessage('ville requis'),
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

    // Chercher un produit correspondant à l'offre
    // On cherche d'abord par code, sinon par nom (recherche partielle)
    let product = null;
    
    if (offre || tag) {
      const searchTerm = offre || tag;
      
      console.log('🔍 Recherche produit avec terme:', searchTerm);
      
      // Essayer de trouver par code exact
      product = await prisma.product.findFirst({
        where: { code: searchTerm }
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
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        });
        
        if (product) {
          console.log('✅ Produit trouvé par nom:', product.code, '|', product.nom, '| ID:', product.id);
        } else {
          console.log('❌ PRODUIT NON TROUVÉ pour:', searchTerm);
          console.log('💡 Vérifiez que le produit existe avec code "BEE" ou nom contenant "Bee Venom"');
        }
      }
    } else {
      console.log('⚠️ Aucun tag ou offre fourni');
    }
    
    // Quantité (par défaut 1 si non spécifiée)
    const orderQuantity = parseInt(quantite) || 1;
    
    // Si aucun produit trouvé, utiliser un produit par défaut ou créer sans produit
    const productData = product ? {
      produitNom: product.nom,
      productId: product.id,
      montant: calculatePriceByQuantity(product, orderQuantity),
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
        montantTotal: productData.montant
      });
    }

    // Nettoyer le numéro de téléphone (ajouter +, enlever espaces)
    const cleanedPhone = cleanPhoneNumber(telephone);
    console.log(`📞 Numéro nettoyé Google Sheet: ${telephone} → ${cleanedPhone}`);

    // Créer la commande avec statut NOUVELLE (apparaîtra dans "À appeler")
    const order = await prisma.order.create({
      data: {
        // Informations client
        clientNom: nom,
        clientTelephone: cleanedPhone,
        clientVille: ville,
        clientCommune: null,
        clientAdresse: null,
        
        // Informations produit
        ...productData,
        
        // Source
        sourceCampagne: 'Google Sheet - Bee Venom',
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
        await sendSMS(order.clientTelephone, message, {
          orderId: order.id,
          type: 'ORDER_CREATED'
        });
        console.log(`✅ SMS ORDER_CREATED envoyé pour commande ${order.orderReference} (Google Sheet webhook)`);
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



