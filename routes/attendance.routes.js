import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';

const router = express.Router();

// 📐 Fonction pour calculer la distance entre 2 points GPS (formule Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

// 📍 Marquer la présence (Arrivée)
router.post('/mark-arrival', 
  authenticate, 
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT'),
  [
    body('latitude').isFloat().withMessage('Latitude requise'),
    body('longitude').isFloat().withMessage('Longitude requise'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude } = req.body;
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Vérifier si déjà pointé aujourd'hui
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      if (existingAttendance) {
        return res.status(400).json({ 
          error: 'Vous avez déjà marqué votre présence aujourd\'hui',
          attendance: existingAttendance
        });
      }

      // Récupérer la config du magasin
      const storeConfig = await prisma.storeConfig.findFirst();
      
      if (!storeConfig) {
        return res.status(500).json({ 
          error: 'Configuration du magasin non trouvée. Veuillez contacter l\'administrateur.' 
        });
      }

      // Calculer la distance
      const distance = calculateDistance(
        latitude, 
        longitude, 
        storeConfig.latitude, 
        storeConfig.longitude
      );

      // Vérifier si dans la zone
      const validee = distance <= storeConfig.rayonTolerance;
      
      // Déterminer la validation
      let validation = 'VALIDE';
      const now = new Date();
      const heureOuverture = new Date();
      const [heureO, minuteO] = storeConfig.heureOuverture.split(':');
      heureOuverture.setHours(parseInt(heureO), parseInt(minuteO), 0, 0);
      
      if (!validee) {
        validation = 'HORS_ZONE';
      } else if (now > heureOuverture) {
        const retardMinutes = Math.floor((now - heureOuverture) / (1000 * 60));
        if (retardMinutes > storeConfig.toleranceRetard) {
          validation = 'RETARD';
        }
      }

      // Enregistrer la présence
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          heureArrivee: new Date(),
          latitudeArrivee: latitude,
          longitudeArrivee: longitude,
          distanceArrivee: distance,
          validee,
          validation,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          deviceInfo: req.headers['user-agent'] || 'unknown'
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          }
        }
      });

      console.log(`✅ Pointage ${validee ? 'VALIDE' : 'HORS ZONE'} - ${req.user.prenom} ${req.user.nom} - Distance: ${Math.round(distance)}m`);

      res.json({
        success: true,
        message: validee 
          ? `✅ Présence enregistrée à ${new Date().toLocaleTimeString('fr-FR')}` 
          : `❌ Vous êtes à ${Math.round(distance)}m du magasin (max ${storeConfig.rayonTolerance}m)`,
        attendance,
        distance: Math.round(distance),
        rayonTolerance: storeConfig.rayonTolerance,
        validee,
        validation
      });

    } catch (error) {
      console.error('Erreur pointage arrivée:', error);
      res.status(500).json({ error: 'Erreur lors du pointage' });
    }
  }
);

// 📍 Marquer le départ
router.post('/mark-departure',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT'),
  [
    body('latitude').isFloat().withMessage('Latitude requise'),
    body('longitude').isFloat().withMessage('Longitude requise'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude } = req.body;
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Trouver le pointage d'aujourd'hui
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      if (!attendance) {
        return res.status(400).json({ 
          error: 'Aucun pointage d\'arrivée trouvé pour aujourd\'hui' 
        });
      }

      if (attendance.heureDepart) {
        return res.status(400).json({ 
          error: 'Vous avez déjà marqué votre départ aujourd\'hui' 
        });
      }

      // Récupérer la config
      const storeConfig = await prisma.storeConfig.findFirst();
      
      // Calculer la distance
      const distance = calculateDistance(
        latitude, 
        longitude, 
        storeConfig.latitude, 
        storeConfig.longitude
      );

      // Mettre à jour
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          heureDepart: new Date(),
          latitudeDepart: latitude,
          longitudeDepart: longitude,
          distanceDepart: distance
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          }
        }
      });

      console.log(`👋 Départ enregistré - ${req.user.prenom} ${req.user.nom} - ${new Date().toLocaleTimeString('fr-FR')}`);

      res.json({
        success: true,
        message: `✅ Départ enregistré à ${new Date().toLocaleTimeString('fr-FR')}`,
        attendance: updatedAttendance
      });

    } catch (error) {
      console.error('Erreur pointage départ:', error);
      res.status(500).json({ error: 'Erreur lors du départ' });
    }
  }
);

// 📊 Obtenir ma présence du jour
router.get('/my-attendance-today', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      }
    });

    res.json({ attendance });

  } catch (error) {
    console.error('Erreur récupération présence:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// 📊 Historique des présences (Admin/Gestionnaire)
router.get('/history', 
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE'),
  async (req, res) => {
    try {
      const { userId, startDate, endDate, validee, page = 1, limit = 30 } = req.query;
      
      const where = {};
      
      if (userId) {
        where.userId = parseInt(userId);
      }
      
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      if (validee !== undefined) {
        where.validee = validee === 'true';
      }

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { heureArrivee: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      const total = await prisma.attendance.count({ where });

      res.json({
        attendances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur historique:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
  }
);

// 📊 Statistiques de présence
router.get('/stats',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE'),
  async (req, res) => {
    try {
      const { userId, month, year } = req.query;
      
      const now = new Date();
      const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
      const targetYear = year ? parseInt(year) : now.getFullYear();
      
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
      
      const where = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };
      
      if (userId) {
        where.userId = parseInt(userId);
      }

      // Total de présences
      const totalPresences = await prisma.attendance.count({ where });
      
      // Présences validées
      const presencesValides = await prisma.attendance.count({
        where: {
          ...where,
          validee: true
        }
      });
      
      // Retards
      const retards = await prisma.attendance.count({
        where: {
          ...where,
          validation: 'RETARD'
        }
      });
      
      // Hors zone
      const horsZone = await prisma.attendance.count({
        where: {
          ...where,
          validation: 'HORS_ZONE'
        }
      });

      // Jours travaillés
      const joursTravailles = await prisma.attendance.groupBy({
        by: ['date'],
        where,
        _count: true
      });

      res.json({
        stats: {
          totalPresences,
          presencesValides,
          retards,
          horsZone,
          joursTravailles: joursTravailles.length,
          tauxPresence: totalPresences > 0 ? ((presencesValides / totalPresences) * 100).toFixed(1) : 0
        },
        period: {
          month: targetMonth,
          year: targetYear
        }
      });

    } catch (error) {
      console.error('Erreur stats:', error);
      res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
    }
  }
);

// ⚙️ Obtenir la configuration du magasin (pour afficher sur la carte)
router.get('/store-config',
  authenticate,
  async (req, res) => {
    try {
      const config = await prisma.storeConfig.findFirst();
      
      if (!config) {
        return res.status(404).json({ 
          error: 'Configuration du magasin non trouvée' 
        });
      }

      res.json({ config });

    } catch (error) {
      console.error('Erreur config:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
    }
  }
);

// ⚙️ Mettre à jour la configuration du magasin (Admin seulement)
router.put('/store-config',
  authenticate,
  authorize('ADMIN'),
  [
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('rayonTolerance').optional().isInt({ min: 10, max: 1000 }),
    body('heureOuverture').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('heureFermeture').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('toleranceRetard').optional().isInt({ min: 0, max: 60 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updateData = {};
      const allowedFields = ['nom', 'adresse', 'latitude', 'longitude', 'rayonTolerance', 
                             'heureOuverture', 'heureFermeture', 'toleranceRetard'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Trouver le config existant
      const existingConfig = await prisma.storeConfig.findFirst();
      
      let config;
      if (existingConfig) {
        // Mettre à jour
        config = await prisma.storeConfig.update({
          where: { id: existingConfig.id },
          data: updateData
        });
      } else {
        // Créer
        config = await prisma.storeConfig.create({
          data: {
            ...updateData,
            latitude: updateData.latitude || 5.3599517,
            longitude: updateData.longitude || -4.0082563
          }
        });
      }

      console.log(`⚙️ Configuration magasin mise à jour par ${req.user.prenom} ${req.user.nom}`);

      res.json({
        success: true,
        message: 'Configuration mise à jour avec succès',
        config
      });

    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
);

export default router;

