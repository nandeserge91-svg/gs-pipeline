# ⚡ Quick Start - Système de Géolocalisation

> **Implémentez un système de pointage GPS en 15 minutes**

---

## 🚀 Installation Express

### 1. Backend (5 min)

```bash
# 1. Copier le schéma dans prisma/schema.prisma
# Voir GUIDE_SYSTEME_GEOLOCALISATION.md section "Schéma Prisma"

# 2. Migration
npx prisma migrate dev --name add_attendance

# 3. Créer routes/attendance.routes.js
# Copier le code du guide

# 4. Ajouter dans server.js
import attendanceRoutes from './routes/attendance.routes.js';
app.use('/api/attendance', attendanceRoutes);
```

### 2. Frontend (5 min)

```bash
# 1. Créer components/attendance/AttendanceButton.tsx
# Copier le code du guide

# 2. Ajouter dans votre dashboard
import AttendanceButton from '@/components/attendance/AttendanceButton';

<AttendanceButton />
```

### 3. Configuration (5 min)

```bash
# 1. Créer scripts/setup-store-location.js
# Copier le code du guide

# 2. Modifier les coordonnées GPS
const latitude = VOTRE_LATITUDE;
const longitude = VOTRE_LONGITUDE;

# 3. Exécuter
node scripts/setup-store-location.js
```

---

## 📍 Obtenir vos coordonnées GPS

### Méthode 1 : Google Maps
1. Ouvrir [Google Maps](https://www.google.com/maps)
2. Clic-droit sur votre emplacement
3. Cliquer sur les coordonnées
4. Copier (ex: `5.353021, -3.870182`)

### Méthode 2 : GPS du téléphone
1. Activer le GPS
2. Utiliser une app de coordonnées
3. Noter `Latitude` et `Longitude`

---

## ✅ Test Rapide

```bash
# 1. Lancer le backend
npm run dev

# 2. Lancer le frontend
npm run dev

# 3. Se connecter à l'app
# 4. Cliquer sur "Marquer ma présence"
# 5. Autoriser la géolocalisation
# 6. ✅ Vérifier le résultat
```

---

## 🎯 Comportement

| Distance | Résultat |
|----------|----------|
| ≤ 50m | ✅ PRÉSENT |
| > 50m | ❌ ABSENT (peut réessayer) |

---

## 🔧 Paramètres par Défaut

```javascript
{
  rayonTolerance: 50,        // 50 mètres
  heureOuverture: '08:00',
  heureFermeture: '18:00',
  toleranceRetard: 15        // 15 minutes
}
```

---

## 📚 Documentation Complète

Pour plus de détails, voir : **GUIDE_SYSTEME_GEOLOCALISATION.md**

---

## ❓ Problèmes Fréquents

### "Configuration non trouvée"
```bash
node scripts/setup-store-location.js
```

### "Géolocalisation refusée"
Autoriser la localisation dans les paramètres du navigateur

### Toujours refusé
Augmenter le rayon : `rayonTolerance: 100`

---

**🎉 C'est tout ! Votre système est prêt.**

