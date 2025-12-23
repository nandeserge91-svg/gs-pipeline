/**
 * Routes API pour la gestion des templates SMS personnalisables
 */

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

/**
 * GET /api/sms-templates
 * Récupérer tous les templates SMS
 */
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const templates = await prisma.smsTemplate.findMany({
      orderBy: [
        { category: 'asc' },
        { label: 'asc' }
      ]
    });

    // Grouper par catégorie
    const templatesByCategory = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push({
        ...template,
        variables: JSON.parse(template.variables) // Parser le JSON
      });
      return acc;
    }, {});

    res.json({
      success: true,
      templates: templates.map(t => ({
        ...t,
        variables: JSON.parse(t.variables)
      })),
      templatesByCategory,
      count: templates.length
    });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des templates',
      details: error.message
    });
  }
});

/**
 * GET /api/sms-templates/:key
 * Récupérer un template spécifique
 */
router.get('/:key', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;
    
    const template = await prisma.smsTemplate.findUnique({
      where: { key: key.toUpperCase() }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template non trouvé'
      });
    }

    res.json({
      success: true,
      template: {
        ...template,
        variables: JSON.parse(template.variables)
      }
    });
  } catch (error) {
    console.error('Erreur récupération template:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du template',
      details: error.message
    });
  }
});

/**
 * PUT /api/sms-templates/:key
 * Modifier un template SMS
 */
router.put('/:key', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;
    const { template, isActive } = req.body;

    if (!template) {
      return res.status(400).json({
        error: 'Le template est requis'
      });
    }

    // Calculer le nombre de caractères
    const characterCount = template.length;

    // Mettre à jour le template
    const updatedTemplate = await prisma.smsTemplate.update({
      where: { key: key.toUpperCase() },
      data: {
        template,
        characterCount,
        isActive: isActive !== undefined ? isActive : undefined,
        lastModifiedBy: req.user.id,
        lastModifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Template modifié avec succès',
      template: {
        ...updatedTemplate,
        variables: JSON.parse(updatedTemplate.variables)
      }
    });
  } catch (error) {
    console.error('Erreur modification template:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Template non trouvé'
      });
    }
    
    res.status(500).json({
      error: 'Erreur lors de la modification du template',
      details: error.message
    });
  }
});

/**
 * POST /api/sms-templates/:key/reset
 * Réinitialiser un template à sa valeur par défaut
 */
router.post('/:key/reset', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;

    // Récupérer le template
    const template = await prisma.smsTemplate.findUnique({
      where: { key: key.toUpperCase() }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template non trouvé'
      });
    }

    // Réinitialiser au template par défaut
    const updatedTemplate = await prisma.smsTemplate.update({
      where: { key: key.toUpperCase() },
      data: {
        template: template.defaultTemplate,
        characterCount: template.defaultTemplate.length,
        lastModifiedBy: req.user.id,
        lastModifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Template réinitialisé avec succès',
      template: {
        ...updatedTemplate,
        variables: JSON.parse(updatedTemplate.variables)
      }
    });
  } catch (error) {
    console.error('Erreur réinitialisation template:', error);
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation du template',
      details: error.message
    });
  }
});

/**
 * POST /api/sms-templates/:key/preview
 * Prévisualiser un template avec des variables d'exemple
 */
router.post('/:key/preview', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;
    const { template, variables } = req.body;

    if (!template || !variables) {
      return res.status(400).json({
        error: 'Template et variables sont requis'
      });
    }

    // Remplacer les variables
    let preview = template;
    for (const [varKey, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${varKey}\\}`, 'g');
      preview = preview.replace(regex, value || `{${varKey}}`);
    }

    res.json({
      success: true,
      preview,
      characterCount: preview.length,
      hasUnreplacedVariables: preview.includes('{') && preview.includes('}')
    });
  } catch (error) {
    console.error('Erreur prévisualisation template:', error);
    res.status(500).json({
      error: 'Erreur lors de la prévisualisation du template',
      details: error.message
    });
  }
});

/**
 * GET /api/sms-templates/stats/usage
 * Statistiques d'utilisation des templates
 */
router.get('/stats/usage', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const templates = await prisma.smsTemplate.findMany();
    
    // Pour chaque template, compter les SMS envoyés
    const templateStats = await Promise.all(
      templates.map(async (template) => {
        const smsTypeKey = template.key.replace(/_/g, '_');
        
        // Compter les SMS logs de ce type
        const count = await prisma.smsLog.count({
          where: {
            sentAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
            }
          }
        });

        return {
          key: template.key,
          label: template.label,
          category: template.category,
          smsCount: count,
          characterCount: template.characterCount,
          isActive: template.isActive
        };
      })
    );

    res.json({
      success: true,
      stats: templateStats,
      period: '30 derniers jours'
    });
  } catch (error) {
    console.error('Erreur statistiques templates:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
});

export default router;
