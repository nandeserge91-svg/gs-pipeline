# 🗺️ Guide Complet - Système de Géolocalisation et Pointage

> **Guide complet pour implémenter un système de pointage par géolocalisation dans n'importe quel projet avec Cursor**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation Backend](#installation-backend)
4. [Installation Frontend](#installation-frontend)
5. [Configuration](#configuration)
6. [Utilisation](#utilisation)
7. [Personnalisation](#personnalisation)
8. [Tests](#tests)
9. [Résolution de problèmes](#résolution-de-problèmes)

---

## 🎯 Vue d'ensemble

### Fonctionnalités

✅ **Pointage arrivée/départ** avec géolocalisation GPS  
✅ **Validation automatique** de la distance (rayon de tolérance)  
✅ **Détection de retard** avec tolérance configurable  
✅ **Refus automatique** si hors zone  
✅ **Possibilité de réessayer** après refus  
✅ **Historique complet** des pointages  
✅ **Statistiques** par utilisateur et par date  
✅ **Export CSV** des données  
✅ **Design moderne** et responsive  

### Architecture

```
Backend (Node.js + Prisma)
├── Base de données PostgreSQL
│   ├── Table `attendances` (pointages)
│   └── Table `store_config` (configuration)
├── API Routes
│   ├── POST /api/attendance/mark-arrival
│   ├── POST /api/attendance/mark-departure
│   ├── GET /api/attendance/my-attendance-today
│   ├── GET /api/attendance/history
│   └── GET /api/attendance/store-config
└── Calcul de distance (Formule Haversine)

Frontend (React + TypeScript)
├── Composant AttendanceButton
├── Page Historique des présences
└── Intégration dans les dashboards
```

---

## ⚙️ Prérequis

### Technologies

- **Backend** : Node.js 18+, Express, Prisma, PostgreSQL
- **Frontend** : React 18+, TypeScript, TanStack Query (React Query), Tailwind CSS
- **Outils** : Git, npm/yarn

### Packages NPM

**Backend** :
```json
{
  "express": "^4.18.2",
  "@prisma/client": "^5.7.0",
  "express-validator": "^7.0.1"
}
```

**Frontend** :
```json
{
  "react": "^18.2.0",
  "@tanstack/react-query": "^5.17.0",
  "lucide-react": "^0.294.0",
  "react-hot-toast": "^2.4.1",
  "axios": "^1.6.2"
}
```

---

## 🔧 Installation Backend

### Étape 1 : Ajouter le schéma Prisma

Ajoutez ces modèles à votre fichier `prisma/schema.prisma` :

```prisma
// Système de pointage
model Attendance {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])

  date            DateTime  @default(now()) @db.Date
  heureArrivee    DateTime  @default(now())
  heureDepart     DateTime?

  // Géolocalisation arrivée
  latitudeArrivee   Float
  longitudeArrivee  Float
  distanceArrivee   Float    // Distance en mètres

  // Géolocalisation départ
  latitudeDepart    Float?
  longitudeDepart   Float?
  distanceDepart    Float?

  // Validation
  validee         Boolean   @default(false)
  validation      String?   // "VALIDE", "HORS_ZONE", "RETARD"

  // Métadonnées
  note            String?
  ipAddress       String?
  deviceInfo      String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([userId, date])  // Un seul pointage par jour
  @@index([userId])
  @@index([date])
  @@index([validee])
  @@map("attendances")
}

// Configuration du magasin/bureau
model StoreConfig {
  id              Int       @id @default(autoincrement())
  nom             String    @default("Magasin Principal")
  adresse         String?

  // Coordonnées GPS
  latitude        Float     // Ex: 5.353021
  longitude       Float     // Ex: -3.870182
  
  // Rayon de tolérance (en mètres)
  rayonTolerance  Int       @default(50)

  // Horaires de travail
  heureOuverture  String    @default("08:00")
  heureFermeture  String    @default("18:00")

  // Tolérance de retard (en minutes)
  toleranceRetard Int       @default(15)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("store_config")
}
```

**N'oubliez pas d'ajouter la relation dans le modèle `User`** :

```prisma
model User {
  // ... vos champs existants ...
  attendances     Attendance[]
}
```

### Étape 2 : Créer la migration

```bash
npx prisma migrate dev --name add_attendance_system
```

### Étape 3 : Créer le fichier de routes

Créez `routes/attendance.routes.js` :

```javascript
import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { body, validationResult } from 'express-validator';
import prisma from '../config/prisma.js';

const router = express.Router();

// Formule de Haversine pour calculer la distance entre deux coordonnées GPS
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

// 📍 Marquer l'arrivée
router.post('/mark-arrival',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT'), // Adaptez les rôles
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
      
      // ❌ REJETER si hors zone
      if (!validee) {
        console.log(`❌ Pointage REFUSÉ - ${req.user.prenom} ${req.user.nom} - Distance: ${Math.round(distance)}m (max ${storeConfig.rayonTolerance}m)`);
        
        return res.status(400).json({
          success: false,
          error: 'HORS_ZONE',
          message: `❌ Vous êtes ABSENT - Vous êtes à ${Math.round(distance)}m du magasin. Vous devez être à moins de ${storeConfig.rayonTolerance}m pour pointer.`,
          distance: Math.round(distance),
          rayonTolerance: storeConfig.rayonTolerance,
          validee: false,
          status: 'ABSENT'
        });
      }
      
      // Déterminer la validation (uniquement si dans la zone)
      let validation = 'VALIDE';
      const now = new Date();
      const heureOuverture = new Date();
      const [heureO, minuteO] = storeConfig.heureOuverture.split(':');
      heureOuverture.setHours(parseInt(heureO), parseInt(minuteO), 0, 0);
      
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

      console.log(`✅ Pointage VALIDE - ${req.user.prenom} ${req.user.nom} - Distance: ${Math.round(distance)}m - ${validation}`);

      res.json({
        success: true,
        message: validation === 'RETARD'
          ? `⚠️ Présence enregistrée avec retard à ${new Date().toLocaleTimeString('fr-FR')}`
          : `✅ Présence enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`,
        attendance,
        distance: Math.round(distance),
        rayonTolerance: storeConfig.rayonTolerance,
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
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT'), // Adaptez les rôles
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
  authorize('ADMIN', 'GESTIONNAIRE'), // Adaptez les rôles
  async (req, res) => {
    try {
      const { userId, date, startDate, endDate, validee, page = 1, limit = 30 } = req.query;
      
      const where = {};
      
      if (userId) {
        where.userId = parseInt(userId);
      }
      
      // Filtre par date unique
      if (date) {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.date = {
          gte: selectedDate,
          lt: nextDay
        };
      }
      // Filtre par plage de dates
      else if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
      // PAR DÉFAUT : Afficher uniquement AUJOURD'HUI
      else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        where.date = {
          gte: today,
          lt: tomorrow
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

// 🔧 Récupérer la configuration du magasin
router.get('/store-config', authenticate, async (req, res) => {
  try {
    const storeConfig = await prisma.storeConfig.findFirst();
    
    if (!storeConfig) {
      return res.status(404).json({ 
        error: 'Configuration non trouvée' 
      });
    }

    res.json({ config: storeConfig });

  } catch (error) {
    console.error('Erreur récupération config:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// 🔧 Mettre à jour la configuration (Admin uniquement)
router.put('/store-config',
  authenticate,
  authorize('ADMIN'),
  [
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('rayonTolerance').optional().isInt({ min: 10, max: 500 }),
    body('heureOuverture').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('heureFermeture').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('toleranceRetard').optional().isInt({ min: 0, max: 60 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const storeConfig = await prisma.storeConfig.upsert({
        where: { id: 1 },
        update: req.body,
        create: {
          ...req.body,
          nom: req.body.nom || 'Magasin Principal'
        }
      });

      res.json({
        success: true,
        message: 'Configuration mise à jour',
        config: storeConfig
      });

    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
);

export default router;
```

### Étape 4 : Intégrer les routes dans `server.js`

```javascript
import attendanceRoutes from './routes/attendance.routes.js';

// ... vos autres imports et middlewares ...

app.use('/api/attendance', attendanceRoutes);
```

---

## 🎨 Installation Frontend

### Étape 1 : Créer le composant AttendanceButton

Créez `frontend/src/components/attendance/AttendanceButton.tsx` :

```typescript
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Check, X, Clock, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AttendanceButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Récupérer la présence du jour
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['my-attendance-today'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/my-attendance-today');
      return data;
    },
    refetchInterval: 60000 // Rafraîchir chaque minute
  });

  const attendance = attendanceData?.attendance;

  // Mutation pour marquer l'arrivée
  const markArrivalMutation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      const { data } = await api.post('/attendance/mark-arrival', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      
      if (data.validation === 'RETARD') {
        toast.success(data.message, { duration: 5000, icon: '⚠️' });
      } else {
        toast.success(data.message, { duration: 5000, icon: '✅' });
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      
      if (errorData?.error === 'HORS_ZONE') {
        const message = `❌ POINTAGE REFUSÉ\n\nVous êtes à ${errorData.distance}m du magasin (max ${errorData.rayonTolerance}m).\n\n🚶‍♂️ Rapprochez-vous du magasin et réessayez !`;
        
        toast.error(message, { 
          duration: 10000, 
          icon: '🚫',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            fontWeight: 'bold',
            whiteSpace: 'pre-line'
          }
        });
      } else {
        toast.error(errorData?.message || 'Erreur lors du pointage', { duration: 5000 });
      }
    }
  });

  // Mutation pour marquer le départ
  const markDepartureMutation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      const { data } = await api.post('/attendance/mark-departure', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      toast.success(data.message, { icon: '👋' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du départ');
    }
  });

  const handleMarkArrival = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      setIsLoading(false);
      toast.error('Géolocalisation non supportée');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        markArrivalMutation.mutate(position);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Position indisponible. Vérifiez votre GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = '❌ Délai d\'attente dépassé. Réessayez.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleMarkDeparture = () => {
    setIsLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        markDepartureMutation.mutate(position);
        setIsLoading(false);
      },
      (error) => {
        toast.error('Erreur de géolocalisation');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Affichage du statut
  const getStatusBadge = () => {
    if (!attendance) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold">
          <X size={14} />
          ABSENT
        </span>
      );
    }

    if (!attendance.validee) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold">
          <X size={14} />
          ABSENT (Hors zone)
        </span>
      );
    }

    if (attendance.validation === 'RETARD') {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
          <Clock size={12} />
          Retard
        </span>
      );
    }

    if (attendance.heureDepart) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
          <LogOut size={12} />
          Parti
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1 animate-pulse">
        <Check size={12} />
        Présent
      </span>
    );
  };

  if (isLoadingAttendance) {
    return (
      <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-primary-600" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-primary-200 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="text-primary-600 animate-pulse" size={20} />
          <span className="hidden sm:inline">Pointage</span>
          <span className="sm:hidden">📍</span>
        </h3>
        {getStatusBadge()}
      </div>

      {attendance && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <Clock size={16} className="text-green-600" />
            <span className="font-medium">Arrivée :</span>
            <span className="font-bold text-green-700">
              {new Date(attendance.heureArrivee).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          {attendance.heureDepart && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <LogOut size={16} className="text-blue-600" />
              <span className="font-medium">Départ :</span>
              <span className="font-bold text-blue-700">
                {new Date(attendance.heureDepart).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}

          {attendance.distanceArrivee !== undefined && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              <MapPin size={12} />
              <span>Distance : {Math.round(attendance.distanceArrivee)}m du magasin</span>
              {attendance.validee && <span className="text-green-600">✓</span>}
            </div>
          )}
        </div>
      )}

      {locationError && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg animate-pulse">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-700">{locationError}</p>
          </div>
        </div>
      )}

      {/* Message d'information pour les absents */}
      {!attendance && (
        <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-bold mb-1">📍 Vous devez être au magasin</p>
              <p className="mb-2">Pour pointer, vous devez être à <span className="font-bold">moins de 50m</span> du magasin.</p>
              <p className="text-xs bg-white px-2 py-1 rounded border border-blue-300">
                💡 <span className="font-bold">Astuce :</span> Si votre pointage est refusé (hors zone), <span className="font-bold text-green-600">rapprochez-vous et réessayez</span> !
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!attendance && (
          <button
            onClick={handleMarkArrival}
            disabled={isLoading || markArrivalMutation.isPending}
            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading || markArrivalMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Géolocalisation...</span>
                <span className="sm:hidden">📍...</span>
              </>
            ) : (
              <>
                <MapPin size={18} />
                <span className="hidden sm:inline">Marquer ma présence</span>
                <span className="sm:hidden">Je suis là !</span>
              </>
            )}
          </button>
        )}

        {attendance && !attendance.heureDepart && attendance.validee && (
          <button
            onClick={handleMarkDeparture}
            disabled={isLoading || markDepartureMutation.isPending}
            className="btn bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading || markDepartureMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Géolocalisation...</span>
                <span className="sm:hidden">📍...</span>
              </>
            ) : (
              <>
                <LogOut size={18} />
                <span className="hidden sm:inline">Marquer mon départ</span>
                <span className="sm:hidden">Je pars</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
```

### Étape 2 : Intégrer le composant dans les dashboards

Dans vos pages de dashboard (ex: `pages/admin/Overview.tsx`) :

```typescript
import AttendanceButton from '@/components/attendance/AttendanceButton';

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Vos autres sections */}
      
      {/* Nouveau: Bouton de pointage */}
      <AttendanceButton />
      
      {/* Vos autres sections */}
    </div>
  );
}
```

---

## ⚙️ Configuration

### Script de configuration rapide

Créez `scripts/setup-store-location.js` :

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupStoreLocation() {
  console.log('🚀 Configuration du magasin...');

  // ⚠️ REMPLACEZ PAR VOS COORDONNÉES GPS
  const latitude = 5.353021;   // Votre latitude
  const longitude = -3.870182;  // Votre longitude

  try {
    const storeConfig = await prisma.storeConfig.upsert({
      where: { id: 1 },
      update: {
        nom: 'Magasin Principal',
        adresse: 'Votre adresse',
        latitude: latitude,
        longitude: longitude,
        rayonTolerance: 50,          // 50 mètres
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,         // 15 minutes
      },
      create: {
        nom: 'Magasin Principal',
        adresse: 'Votre adresse',
        latitude: latitude,
        longitude: longitude,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
      },
    });

    console.log('✅ Configuration réussie:');
    console.log(`   📍 Latitude: ${storeConfig.latitude}`);
    console.log(`   📍 Longitude: ${storeConfig.longitude}`);
    console.log(`   📏 Rayon: ${storeConfig.rayonTolerance}m`);
    console.log(`   🕐 Ouverture: ${storeConfig.heureOuverture}`);
    console.log(`   🕐 Fermeture: ${storeConfig.heureFermeture}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupStoreLocation();
```

**Exécutez le script** :

```bash
node scripts/setup-store-location.js
```

### Comment obtenir vos coordonnées GPS ?

1. **Google Maps** :
   - Allez sur [Google Maps](https://www.google.com/maps)
   - Cliquez-droit sur votre emplacement
   - Cliquez sur les coordonnées qui apparaissent
   - Copiez (format: `5.353021, -3.870182`)

2. **GPS de votre téléphone** :
   - Utilisez une application GPS
   - Activez "Afficher les coordonnées"

---

## 🚀 Utilisation

### 1. Pointer son arrivée

```
1. Ouvrir l'application
2. Aller sur le dashboard
3. Cliquer sur "Marquer ma présence"
4. Autoriser l'accès à la localisation
5. ✅ Présence enregistrée (si dans la zone)
   OU
   ❌ Pointage refusé (si hors zone) → Réessayer
```

### 2. Pointer son départ

```
1. Cliquer sur "Marquer mon départ"
2. ✅ Départ enregistré
```

### 3. Voir l'historique (Admin/Gestionnaire)

Créez une page pour afficher l'historique complet (voir le fichier complet dans le projet `frontend/src/pages/admin/Attendance.tsx`).

---

## 🎨 Personnalisation

### Modifier le rayon de tolérance

Dans la base de données, ou via l'API :

```javascript
// Backend
await prisma.storeConfig.update({
  where: { id: 1 },
  data: { rayonTolerance: 100 } // 100 mètres
});
```

### Modifier les horaires

```javascript
await prisma.storeConfig.update({
  where: { id: 1 },
  data: {
    heureOuverture: '07:30',
    heureFermeture: '19:00',
    toleranceRetard: 20 // 20 minutes
  }
});
```

### Adapter les rôles

Dans `routes/attendance.routes.js`, modifiez les rôles autorisés :

```javascript
authorize('ADMIN', 'MANAGER', 'EMPLOYEE') // Vos rôles
```

### Personnaliser le design

Modifiez les classes Tailwind dans `AttendanceButton.tsx` :

```typescript
className="bg-gradient-to-r from-purple-600 to-pink-600" // Vos couleurs
```

---

## 🧪 Tests

### Test manuel

1. **Hors zone** :
   - Désactiver le GPS OU être loin du magasin
   - Cliquer sur "Marquer ma présence"
   - ✅ Devrait afficher "POINTAGE REFUSÉ"

2. **Dans la zone** :
   - Activer le GPS
   - Être à moins de 50m du magasin
   - Cliquer sur "Marquer ma présence"
   - ✅ Devrait afficher "Présence enregistrée"

3. **Réessayer après refus** :
   - Après un refus, se rapprocher
   - Cliquer à nouveau sur "Marquer ma présence"
   - ✅ Devrait accepter le pointage

### Simuler la géolocalisation (Chrome DevTools)

1. Ouvrir Chrome DevTools (F12)
2. Cliquer sur les 3 points `⋮`
3. `More tools` → `Sensors`
4. Sélectionner `Custom location`
5. Entrer vos coordonnées GPS
6. Tester le pointage

---

## 🔧 Résolution de problèmes

### Erreur: "Géolocalisation non autorisée"

**Solution** :
1. Vérifier les paramètres du navigateur
2. Aller dans `Paramètres` → `Confidentialité` → `Localisation`
3. Autoriser votre site web

### Erreur: "Configuration du magasin non trouvée"

**Solution** :
```bash
# Exécuter le script de configuration
node scripts/setup-store-location.js
```

### Pointage toujours refusé

**Solution** :
1. Vérifier les coordonnées GPS du magasin
2. Augmenter le rayon de tolérance (50m → 100m)
3. Vérifier la précision du GPS (activer "Haute précision")

### Erreur CORS

**Solution** :
Ajouter votre domaine frontend dans le backend :

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://votre-domaine.com'],
  credentials: true
}));
```

---

## 📝 Checklist de déploiement

- [ ] Base de données migrée (`npx prisma migrate deploy`)
- [ ] Configuration du magasin créée (script setup)
- [ ] Coordonnées GPS vérifiées
- [ ] Variables d'environnement configurées
- [ ] CORS configuré pour votre domaine
- [ ] Permissions de géolocalisation testées
- [ ] Rayon de tolérance adapté
- [ ] Horaires configurés
- [ ] Tests réalisés (dans/hors zone)

---

## 🎉 Félicitations !

Votre système de géolocalisation est maintenant opérationnel ! 

**Support** : Pour toute question, consultez la documentation Prisma, React Query, ou ouvrez une issue sur GitHub.

**Améliorations futures** :
- Notifications push pour rappeler de pointer
- Graphiques de présence
- Export PDF des rapports
- Intégration avec un système de paie

---

**© 2026 - Guide créé pour Cursor AI**

