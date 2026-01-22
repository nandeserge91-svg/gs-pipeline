# 📍 SYSTÈME DE POINTAGE GÉOLOCALISÉ

## 📋 Vue d'ensemble

Ce système permet de vérifier la présence physique des travailleurs (APPELANT, GESTIONNAIRE, GESTIONNAIRE_STOCK) à leur lieu de travail via géolocalisation GPS.

---

## 🎯 Fonctionnalités

### ✅ Pour les Travailleurs
- **Pointage d'arrivée** avec géolocalisation automatique
- **Pointage de départ** en fin de journée
- Validation automatique si dans le rayon de tolérance
- Affichage de l'heure d'arrivée et de départ
- Badge de statut (Présent, Absent, Hors zone, Retard)

### ✅ Pour les Administrateurs
- Configuration des coordonnées GPS du magasin
- Définition du rayon de tolérance (en mètres)
- Gestion des horaires de travail
- Tolérance de retard paramétrable
- Historique complet des pointages
- Statistiques de présence

---

## 🗄️ Structure Base de Données

### Table `attendances`
- Enregistrement de chaque pointage (arrivée/départ)
- Coordonnées GPS de l'utilisateur
- Distance calculée par rapport au magasin
- Validation automatique
- Informations sur l'appareil et l'IP

### Table `store_config`
- Coordonnées GPS du magasin
- Rayon de tolérance
- Horaires de travail
- Paramètres de validation

---

## 🚀 Déploiement

### 1. Migration de la Base de Données

```bash
cd "C:\Users\MSI\Desktop\GS cursor"
npx prisma migrate dev --name add_attendance_system
# Ou en production:
npx prisma migrate deploy
```

### 2. Configuration du Magasin

Exécutez le script de configuration pour définir les coordonnées GPS :

```bash
node scripts/configure-store-location.js
```

Le script vous demandera :
- Nom du magasin
- Adresse
- **Latitude** (ex: 5.3599517)
- **Longitude** (ex: -4.0082563)
- Rayon de tolérance (50m par défaut)
- Horaires de travail
- Tolérance de retard

💡 **Astuce** : Pour trouver vos coordonnées GPS:
1. Ouvrir Google Maps
2. Faire un clic droit sur votre magasin
3. Cliquer sur les coordonnées pour les copier

### 3. Variables d'Environnement

Aucune variable supplémentaire requise. Le système utilise la DATABASE_URL existante.

---

## 💻 Utilisation

### Pour les Travailleurs

1. **Se connecter** à l'application
2. Accéder au **Dashboard**
3. Voir le widget **"Pointage"**
4. Cliquer sur **"Marquer ma présence"**
5. Autoriser la géolocalisation dans le navigateur
6. Le système valide automatiquement la position

#### États possibles :
- ✅ **Présent** : Pointage validé dans le rayon
- ❌ **Hors zone** : Trop loin du magasin
- ⏰ **Retard** : Arrivée après l'heure d'ouverture + tolérance
- 👋 **Parti** : Départ enregistré

### Pour les Administrateurs

#### Consulter l'historique

```
GET /api/attendance/history?userId=123&startDate=2026-01-01&endDate=2026-01-31
```

#### Obtenir les statistiques

```
GET /api/attendance/stats?month=1&year=2026
```

#### Mettre à jour la configuration

```
PUT /api/attendance/store-config
Authorization: Bearer <token>

{
  "latitude": 5.3599517,
  "longitude": -4.0082563,
  "rayonTolerance": 50,
  "heureOuverture": "08:00",
  "heureFermeture": "18:00",
  "toleranceRetard": 15
}
```

---

## 📡 API Endpoints

### Pointage

| Route | Méthode | Rôles | Description |
|-------|---------|-------|-------------|
| `/api/attendance/mark-arrival` | POST | APPELANT, GESTIONNAIRE, GESTIONNAIRE_STOCK | Marquer l'arrivée |
| `/api/attendance/mark-departure` | POST | APPELANT, GESTIONNAIRE, GESTIONNAIRE_STOCK | Marquer le départ |
| `/api/attendance/my-attendance-today` | GET | Tous | Ma présence du jour |
| `/api/attendance/history` | GET | ADMIN, GESTIONNAIRE | Historique complet |
| `/api/attendance/stats` | GET | ADMIN, GESTIONNAIRE | Statistiques |
| `/api/attendance/store-config` | GET | Tous | Configuration magasin |
| `/api/attendance/store-config` | PUT | ADMIN | Mettre à jour config |

---

## 🔧 Configuration Technique

### Calcul de Distance

Le système utilise la **formule de Haversine** pour calculer la distance entre deux points GPS avec une précision au mètre près.

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  // ... calcul Haversine
  return distance; // en mètres
}
```

### Validation

1. **Position GPS** : Récupérée via l'API Geolocation du navigateur
2. **Distance** : Calculée par rapport aux coordonnées du magasin
3. **Validation** : Si distance <= rayon de tolérance
4. **Retard** : Comparaison avec l'heure d'ouverture + tolérance

### Sécurité

- ✅ Authentification JWT obligatoire
- ✅ Permissions par rôle
- ✅ Un seul pointage par jour par utilisateur
- ✅ Enregistrement de l'IP et du device
- ✅ Coordonnées GPS non modifiables côté client

---

## 📊 Exemple de Données

### Pointage Valide

```json
{
  "id": 1,
  "userId": 5,
  "date": "2026-01-22",
  "heureArrivee": "2026-01-22T08:05:00Z",
  "heureDepart": "2026-01-22T18:00:00Z",
  "latitudeArrivee": 5.3599517,
  "longitudeArrivee": -4.0082563,
  "distanceArrivee": 12.5,
  "validee": true,
  "validation": "VALIDE"
}
```

### Pointage Hors Zone

```json
{
  "id": 2,
  "userId": 6,
  "date": "2026-01-22",
  "heureArrivee": "2026-01-22T08:10:00Z",
  "latitudeArrivee": 5.3650000,
  "longitudeArrivee": -4.0100000,
  "distanceArrivee": 523.7,
  "validee": false,
  "validation": "HORS_ZONE"
}
```

---

## 🛠️ Dépannage

### L'utilisateur ne peut pas pointer

**Problème** : "Permission de géolocalisation refusée"

**Solution** :
1. Vérifier les paramètres du navigateur
2. Autoriser la géolocalisation pour afgestion.net
3. Sur Chrome : Paramètres > Confidentialité > Position

---

### La distance est incorrecte

**Problème** : Le système indique que l'utilisateur est loin alors qu'il est sur place

**Solution** :
1. Vérifier les coordonnées du magasin dans la config
2. Exécuter `node scripts/configure-store-location.js`
3. Vérifier sur Google Maps que les coordonnées sont correctes

---

### Le rayon de tolérance est trop strict

**Problème** : Les utilisateurs valides sont rejetés

**Solution** :
1. Augmenter le rayon de tolérance (ex: 100m au lieu de 50m)
2. Via l'API ou le script de configuration
3. Prendre en compte la précision GPS (5-10m en ville)

---

## 📈 Statistiques Disponibles

- **Taux de présence** : % de jours travaillés
- **Retards** : Nombre d'arrivées après l'heure + tolérance
- **Pointages hors zone** : Tentatives invalides
- **Jours travaillés** : Nombre total de présences validées
- **Heures moyennes** : Heure moyenne d'arrivée/départ

---

## 🎯 Bonnes Pratiques

1. **Rayon de tolérance** : Commencer avec 50m et ajuster
2. **Tolérance retard** : 15 minutes est une bonne base
3. **GPS précis** : Demander aux utilisateurs d'activer le GPS haute précision
4. **WiFi activé** : Améliore la précision de la géolocalisation en ville
5. **Vérification** : Tester avec plusieurs appareils avant déploiement complet

---

## 🔒 Confidentialité

- Les coordonnées GPS ne sont utilisées **que** pour la validation
- Aucun tracking en temps réel
- Données accessibles uniquement aux ADMIN et GESTIONNAIRE
- Conformité RGPD : Finalité limitée à la gestion de présence

---

## 📞 Support

Pour toute question ou problème :
- Contacter l'administrateur système
- Vérifier les logs backend : `console.log` dans `attendance.routes.js`
- Consulter l'historique dans la table `attendances`

---

**Version** : 1.0.0  
**Dernière mise à jour** : 22 Janvier 2026

