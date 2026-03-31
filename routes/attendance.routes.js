import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { body, validationResult } from 'express-validator';
import prisma from '../config/prisma.js';
import {
  startOfAppDay,
  endOfAppDay,
  startOfNextAppDay,
  startOfTodayAppDay,
  formatYmdInAppTz
} from '../utils/appDayBounds.js';

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
      const today = startOfTodayAppDay();

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

      // ✅ Récupérer TOUTES les configurations de magasin
      const storeConfigs = await prisma.storeConfig.findMany();
      
      if (!storeConfigs || storeConfigs.length === 0) {
        return res.status(500).json({ 
          error: 'Aucune configuration de magasin trouvée. Veuillez contacter l\'administrateur.' 
        });
      }

      // ✅ Vérifier la distance pour CHAQUE localisation autorisée
      let validee = false;
      let closestStore = null;
      let minDistance = Infinity;
      let validStoreNom = null;

      for (const store of storeConfigs) {
        const dist = calculateDistance(
          latitude, 
          longitude, 
          store.latitude, 
          store.longitude
        );
        
        // Garder le magasin le plus proche
        if (dist < minDistance) {
          minDistance = dist;
          closestStore = store;
        }

        // Si dans le rayon d'AU MOINS UNE localisation → VALIDE
        if (dist <= store.rayonTolerance) {
          validee = true;
          validStoreNom = store.nom;
          console.log(`✅ Zone valide détectée : ${store.nom} (${Math.round(dist)}m)`);
          break;
        }
      }

      const distance = minDistance;
      const storeConfig = closestStore; // Utiliser le magasin le plus proche pour la config
      
      // ❌ REJETER si hors zone de TOUS les magasins
      if (!validee) {
        console.log(`❌ Pointage REFUSÉ - ${req.user.prenom} ${req.user.nom} - Distance: ${Math.round(distance)}m du magasin le plus proche (${closestStore.nom})`);
        
        return res.status(400).json({
          success: false,
          error: 'HORS_ZONE',
          message: `❌ Vous êtes ABSENT - Vous êtes à ${Math.round(distance)}m du magasin le plus proche (${closestStore.nom}). Vous devez être à moins de ${closestStore.rayonTolerance}m d'un des magasins autorisés pour pointer.`,
          distance: Math.round(distance),
          rayonTolerance: closestStore.rayonTolerance,
          closestStore: closestStore.nom,
          validee: false,
          status: 'ABSENT'
        });
      }
      
      // Déterminer la validation (uniquement si dans la zone)
      let validation = 'VALIDE';
      const now = new Date();
      const [heureO, minuteO] = storeConfig.heureOuverture.split(':').map((x) => parseInt(x, 10));
      const heureOuverture = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
        heureO,
        minuteO,
        0,
        0
      ));
      
      if (now > heureOuverture) {
        const retardMinutes = Math.floor((now - heureOuverture) / (1000 * 60));
        if (retardMinutes > storeConfig.toleranceRetard) {
          validation = 'RETARD';
        }
      }

      // Enregistrer la présence (uniquement si dans la zone)
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

      console.log(`✅ Pointage VALIDE - ${req.user.prenom} ${req.user.nom} - Magasin: ${validStoreNom} - Distance: ${Math.round(distance)}m - ${validation}`);

      res.json({
        success: true,
        message: validation === 'RETARD'
          ? `⚠️ Présence enregistrée avec retard à ${new Date().toLocaleTimeString('fr-FR')} (${validStoreNom})`
          : `✅ Présence enregistrée à ${new Date().toLocaleTimeString('fr-FR')} (${validStoreNom})`,
        attendance,
        distance: Math.round(distance),
        rayonTolerance: storeConfig.rayonTolerance,
        storeName: validStoreNom,
        validee: true,
        validation,
        status: 'PRESENT'
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
      const today = startOfTodayAppDay();

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
    const today = startOfTodayAppDay();

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
      const { userId, date, startDate, endDate, validee, page = 1, limit = 30 } = req.query;
      
      const where = {};
      
      if (userId) {
        where.userId = parseInt(userId);
      }
      
      if (date) {
        const dayStart = startOfAppDay(date);
        const dayEndExcl = startOfNextAppDay(date);
        if (dayStart && dayEndExcl) {
          where.date = { gte: dayStart, lt: dayEndExcl };
        }
      } else if (startDate && endDate) {
        const rangeStart = startOfAppDay(startDate);
        const rangeEnd = endOfAppDay(endDate);
        if (rangeStart && rangeEnd) {
          where.date = { gte: rangeStart, lte: rangeEnd };
        }
      } else {
        const ymd = formatYmdInAppTz(new Date());
        const dayStart = startOfTodayAppDay();
        const dayEndExcl = startOfNextAppDay(ymd);
        if (dayStart && dayEndExcl) {
          where.date = { gte: dayStart, lt: dayEndExcl };
        }
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

      const ymdNow = formatYmdInAppTz(new Date());
      const [cyStr, cmStr] = ymdNow.split('-');
      const cy = parseInt(cyStr, 10);
      const cm = parseInt(cmStr, 10);
      const targetMonth = month ? parseInt(month, 10) : cm;
      const targetYear = year ? parseInt(year, 10) : cy;

      const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
      
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

// 🗑️ Supprimer les anciennes données (> 60 jours) - Admin uniquement
router.delete('/cleanup',
  authenticate,
  authorize('ADMIN'),
  async (req, res) => {
    try {
      const todayAbidjan = startOfTodayAppDay();
      const sixtyDaysAgo = new Date(todayAbidjan.getTime() - 60 * 86400000);

      console.log(`🗑️ Nettoyage des données avant le ${sixtyDaysAgo.toLocaleDateString('fr-FR')}...`);

      const result = await prisma.attendance.deleteMany({
        where: {
          date: {
            lt: sixtyDaysAgo
          }
        }
      });

      console.log(`✅ ${result.count} enregistrements supprimés`);

      res.json({
        success: true,
        message: `${result.count} enregistrement(s) ancien(s) supprimé(s)`,
        deletedCount: result.count,
        deletedBefore: sixtyDaysAgo.toISOString()
      });

    } catch (error) {
      console.error('Erreur nettoyage:', error);
      res.status(500).json({ error: 'Erreur lors du nettoyage' });
    }
  }
);

// 📋 Générer les absences pour les employés qui n'ont pas pointé - Admin uniquement
router.post('/generate-absences',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE'),
  async (req, res) => {
    try {
      const { date } = req.body;

      const targetDate = date
        ? (startOfAppDay(String(date).trim()) || startOfTodayAppDay())
        : startOfTodayAppDay();
      const ymdResolved = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`;
      const targetDateEnd = endOfAppDay(ymdResolved);

      console.log(`📋 Génération des absences pour le ${targetDate.toLocaleDateString('fr-FR')}...`);

      // Rôles concernés
      const ROLES_WITH_ATTENDANCE = ['APPELANT', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'];

      // 1. Récupérer tous les employés concernés
      const employees = await prisma.user.findMany({
        where: {
          role: { in: ROLES_WITH_ATTENDANCE }
        },
        select: { id: true, nom: true, prenom: true, role: true }
      });

      // 2. Vérifier qui a déjà pointé
      const existingAttendances = await prisma.attendance.findMany({
        where: {
          date: {
            gte: targetDate,
            lte: targetDateEnd
          }
        },
        select: { userId: true }
      });

      const employeesWithAttendance = new Set(existingAttendances.map(a => a.userId));

      // 3. Identifier les absents
      const absentEmployees = employees.filter(emp => !employeesWithAttendance.has(emp.id));

      if (absentEmployees.length === 0) {
        return res.json({
          success: true,
          message: 'Tous les employés ont pointé',
          created: 0,
          absences: []
        });
      }

      // 4. Créer les absences
      const absencesCreated = [];

      for (const employee of absentEmployees) {
        try {
          const absence = await prisma.attendance.create({
            data: {
              userId: employee.id,
              date: targetDate,
              heureArrivee: targetDate,
              latitudeArrivee: 0,
              longitudeArrivee: 0,
              distanceArrivee: 0,
              validee: false,
              validation: 'ABSENT',
              note: `Absence générée automatiquement (pas de pointage) par ${req.user.prenom} ${req.user.nom}`,
              ipAddress: req.ip || 'system',
              deviceInfo: req.headers['user-agent'] || 'auto-generated'
            },
            include: {
              user: {
                select: { id: true, nom: true, prenom: true, role: true }
              }
            }
          });

          absencesCreated.push(absence);
          console.log(`   ❌ ${employee.prenom} ${employee.nom} → ABSENT`);
        } catch (error) {
          // Ignorer si déjà existant (unique constraint)
          if (error.code !== 'P2002') {
            console.error(`Erreur pour ${employee.prenom} ${employee.nom}:`, error.message);
          }
        }
      }

      console.log(`✅ ${absencesCreated.length} absence(s) générée(s)`);

      res.json({
        success: true,
        message: `${absencesCreated.length} absence(s) générée(s) pour le ${targetDate.toLocaleDateString('fr-FR')}`,
        created: absencesCreated.length,
        absences: absencesCreated,
        totalEmployees: employees.length,
        presents: employeesWithAttendance.size
      });

    } catch (error) {
      console.error('Erreur génération absences:', error);
      res.status(500).json({ error: 'Erreur lors de la génération des absences' });
    }
  }
);

// 🔧 ENDPOINT TEMPORAIRE : Configuration automatique des localisations
// À utiliser UNE FOIS puis supprimer
router.post('/setup-locations',
  authenticate,
  authorize('ADMIN'),
  async (req, res) => {
    try {
      console.log('🔧 Début de la configuration des localisations...');

      // 1. Supprimer les anciennes localisations
      const deleted = await prisma.storeConfig.deleteMany({});
      console.log(`   🗑️  ${deleted.count} ancienne(s) localisation(s) supprimée(s)`);

      // 2. Créer les 2 localisations d'Abidjan
      const location1 = await prisma.storeConfig.create({
        data: {
          nom: 'Magasin Principal Abidjan',
          adresse: 'Abidjan, Côte d\'Ivoire',
          latitude: 5.353021,
          longitude: -3.870182,
          rayonTolerance: 75,
          heureOuverture: '08:00',
          heureFermeture: '18:00',
          toleranceRetard: 15
        }
      });

      const location2 = await prisma.storeConfig.create({
        data: {
          nom: 'Magasin Secondaire Abidjan',
          adresse: 'Abidjan, Côte d\'Ivoire (Site 2)',
          latitude: 5.354687,
          longitude: -3.872683,
          rayonTolerance: 75,
          heureOuverture: '08:00',
          heureFermeture: '18:00',
          toleranceRetard: 15
        }
      });

      console.log('✅ Localisations configurées avec succès !');

      res.json({
        success: true,
        message: '✅ Localisations configurées avec succès !',
        locations: [
          {
            id: location1.id,
            nom: location1.nom,
            latitude: location1.latitude,
            longitude: location1.longitude,
            rayonTolerance: location1.rayonTolerance
          },
          {
            id: location2.id,
            nom: location2.nom,
            latitude: location2.latitude,
            longitude: location2.longitude,
            rayonTolerance: location2.rayonTolerance
          }
        ]
      });

    } catch (error) {
      console.error('❌ Erreur configuration localisations:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la configuration des localisations',
        details: error.message
      });
    }
  }
);

export default router;

