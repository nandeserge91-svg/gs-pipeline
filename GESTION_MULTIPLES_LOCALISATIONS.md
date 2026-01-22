# 📍 Gestion de Plusieurs Localisations

> **Permettre aux employés de pointer depuis plusieurs magasins autorisés**

---

## 🎯 Principe

Le système permet maintenant de **valider les présences depuis plusieurs localisations**.

**Fonctionnement** :
- ✅ Si l'employé est dans le rayon d'**AU MOINS UNE** localisation autorisée → **PRÉSENT**
- ❌ Si l'employé est hors zone de **TOUTES** les localisations → **ABSENT**

---

## 📍 Localisations Actuelles

### **Localisation 1 : Magasin Principal**
- **Nom** : Magasin Principal Abidjan
- **Coordonnées** : 5.353021°, -3.870182°
- **Format DMS** : 5°21'10.9"N, 3°52'12.7"W
- **Rayon** : 50m

### **Localisation 2 : Magasin Secondaire**
- **Nom** : Magasin Secondaire Abidjan
- **Coordonnées** : 5.354706°, -3.872607°
- **Format DMS** : 5°21'16.9"N, 3°52'21.4"W
- **Rayon** : 50m

---

## 🚀 Ajouter une Nouvelle Localisation

### **Méthode 1 : Script Automatique (Recommandé)**

```bash
# Ajouter la 2ème localisation
node scripts/add-second-location.js
```

**Résultat attendu** :

```
═══════════════════════════════════════════════════════════
📍 AJOUT DE LA 2ÈME LOCALISATION AUTORISÉE
═══════════════════════════════════════════════════════════

📊 Localisations existantes : 1
   1. Magasin Principal Abidjan
      Lat: 5.353021, Lon: -3.870182
      Rayon: 50m

➕ Ajout de la nouvelle localisation...

✅ Localisation ajoutée avec succès !

📋 Détails de la nouvelle localisation :
═══════════════════════════════════════════════════════════
ID              : 2
Nom             : Magasin Secondaire Abidjan
Adresse         : Abidjan, Côte d'Ivoire (Site 2)
Latitude        : 5.354706° (5°21'16.9"N)
Longitude       : -3.872607° (3°52'21.4"W)
Rayon tolérance : 50m
Heures          : 08:00 - 18:00
Tolérance retard: 15 min
═══════════════════════════════════════════════════════════

📍 Total de localisations autorisées : 2

   1. Magasin Principal Abidjan
      📍 Lat: 5.353021°, Lon: -3.870182°
      📏 Rayon: 50m
      🕐 08:00 - 18:00

   2. Magasin Secondaire Abidjan
      📍 Lat: 5.354706°, Lon: -3.872607°
      📏 Rayon: 50m
      🕐 08:00 - 18:00

═══════════════════════════════════════════════════════════
✨ Configuration terminée avec succès !
═══════════════════════════════════════════════════════════

💡 Les employés peuvent maintenant pointer depuis :
   1. Magasin Principal Abidjan (Rayon 50m)
   2. Magasin Secondaire Abidjan (Rayon 50m)
```

---

### **Méthode 2 : Manuellement (SQL)**

```sql
INSERT INTO "store_config" (
  "nom", 
  "adresse", 
  "latitude", 
  "longitude", 
  "rayonTolerance", 
  "heureOuverture", 
  "heureFermeture", 
  "toleranceRetard", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'Magasin Secondaire Abidjan',
  'Abidjan, Côte d''Ivoire (Site 2)',
  5.354706,
  -3.872607,
  50,
  '08:00',
  '18:00',
  15,
  NOW(),
  NOW()
);
```

---

### **Méthode 3 : Via l'API (Admin uniquement)**

```bash
curl -X POST https://votre-backend.com/api/attendance/store-config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Magasin Secondaire Abidjan",
    "adresse": "Abidjan, Côte d'\''Ivoire (Site 2)",
    "latitude": 5.354706,
    "longitude": -3.872607,
    "rayonTolerance": 50,
    "heureOuverture": "08:00",
    "heureFermeture": "18:00",
    "toleranceRetard": 15
  }'
```

---

## 🔍 Comment ça Marche ?

### **1. Pointage d'un Employé**

Lorsqu'un employé clique sur **"Marquer ma présence"** :

1. Le système récupère sa position GPS
2. Le système calcule la distance avec **TOUTES** les localisations autorisées
3. Si l'employé est dans le rayon d'**AU MOINS UNE** localisation → ✅ **PRÉSENT**
4. Si l'employé est hors zone de **TOUTES** les localisations → ❌ **ABSENT**

### **2. Exemple**

**Scénario 1 : Employé au Magasin Principal**
- Distance Magasin 1 : **25m** ✅ (< 50m)
- Distance Magasin 2 : **210m** ❌ (> 50m)
- **Résultat** : ✅ **PRÉSENT** (valide pour Magasin 1)

**Scénario 2 : Employé au Magasin Secondaire**
- Distance Magasin 1 : **205m** ❌ (> 50m)
- Distance Magasin 2 : **18m** ✅ (< 50m)
- **Résultat** : ✅ **PRÉSENT** (valide pour Magasin 2)

**Scénario 3 : Employé hors zone**
- Distance Magasin 1 : **1540m** ❌ (> 50m)
- Distance Magasin 2 : **1620m** ❌ (> 50m)
- **Résultat** : ❌ **ABSENT** (hors zone de tous les magasins)

---

## 📊 Voir les Localisations Actives

### **PostgreSQL**

```sql
SELECT 
  id,
  nom,
  latitude,
  longitude,
  "rayonTolerance",
  "heureOuverture",
  "heureFermeture"
FROM "store_config"
ORDER BY id;
```

### **Prisma (Node.js)**

```javascript
const locations = await prisma.storeConfig.findMany();
console.log(locations);
```

---

## ✏️ Modifier une Localisation

### **Méthode 1 : SQL**

```sql
UPDATE "store_config"
SET 
  "rayonTolerance" = 100,  -- Augmenter le rayon à 100m
  "heureOuverture" = '07:00',
  "updatedAt" = NOW()
WHERE id = 2;
```

### **Méthode 2 : Via l'API**

```bash
curl -X PUT https://votre-backend.com/api/attendance/store-config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 2,
    "rayonTolerance": 100,
    "heureOuverture": "07:00"
  }'
```

---

## 🗑️ Supprimer une Localisation

```sql
DELETE FROM "store_config" WHERE id = 2;
```

⚠️ **Attention** : Assurez-vous qu'au moins une localisation reste active !

---

## 📱 Interface Utilisateur

### **Message de Pointage Réussi**

```
✅ Présence enregistrée à 08:45 (Magasin Secondaire Abidjan)
```

### **Message de Pointage Refusé**

```
❌ Vous êtes ABSENT - Vous êtes à 1540m du magasin le plus proche 
(Magasin Principal Abidjan). Vous devez être à moins de 50m d'un des 
magasins autorisés pour pointer.
```

---

## 🧪 Tester le Système

### **1. Vérifier les Localisations**

```bash
# Depuis Railway
railway run node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.storeConfig.findMany().then(console.log);
"
```

### **2. Simuler un Pointage**

```bash
# Test API
curl -X POST https://votre-backend.com/api/attendance/mark-arrival \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 5.354706,
    "longitude": -3.872607
  }'
```

**Résultat attendu** :

```json
{
  "success": true,
  "message": "✅ Présence enregistrée à 08:45:23 (Magasin Secondaire Abidjan)",
  "storeName": "Magasin Secondaire Abidjan",
  "distance": 18,
  "validee": true
}
```

---

## 📈 Statistiques par Localisation

### **Voir les Présences par Magasin**

```sql
SELECT 
  sc.nom AS magasin,
  COUNT(a.id) AS total_presences,
  COUNT(CASE WHEN a.validee = true THEN 1 END) AS presences_validees,
  ROUND(AVG(a."distanceArrivee"), 2) AS distance_moyenne
FROM attendances a
LEFT JOIN "store_config" sc ON 
  -- Approximation : localisation la plus proche
  ABS(a."latitudeArrivee" - sc.latitude) < 0.01 AND
  ABS(a."longitudeArrivee" - sc.longitude) < 0.01
WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sc.nom
ORDER BY total_presences DESC;
```

---

## 🔐 Sécurité

### **Permissions**

- ✅ **ADMIN** : Peut ajouter/modifier/supprimer des localisations
- ❌ **GESTIONNAIRE** : Lecture seule
- ❌ **APPELANT** : Aucune permission
- ❌ **LIVREUR** : Aucune permission

### **Validation**

- Vérification que `rayonTolerance` est entre 10m et 1000m
- Vérification que les coordonnées GPS sont valides
- Vérification qu'au moins une localisation existe

---

## 🌍 Trouver les Coordonnées GPS

### **Méthode 1 : Google Maps**

1. Ouvrir Google Maps
2. Clic droit sur l'emplacement → **"Plus d'infos sur cet endroit"**
3. Copier les coordonnées (format : `5.354706, -3.872607`)

### **Méthode 2 : GPS du Téléphone**

1. Installer une app GPS (ex: GPS Status)
2. Se rendre sur place
3. Relever les coordonnées

### **Méthode 3 : OpenStreetMap**

1. Ouvrir https://www.openstreetmap.org/
2. Clic droit sur l'emplacement → **"Afficher l'adresse"**
3. Copier les coordonnées

---

## ✅ Checklist de Déploiement

- [ ] Script créé : `scripts/add-second-location.js`
- [ ] Backend modifié pour supporter plusieurs localisations
- [ ] 2ème localisation ajoutée en base de données
- [ ] Test de pointage depuis Localisation 1 ✅
- [ ] Test de pointage depuis Localisation 2 ✅
- [ ] Test de pointage hors zone ✅
- [ ] Logs vérifiés
- [ ] Documentation mise à jour

---

## 📞 Support

**Questions fréquentes** :

**Q: Combien de localisations puis-je ajouter ?**  
R: Autant que nécessaire. Pas de limite technique.

**Q: Le système est-il plus lent avec plusieurs localisations ?**  
R: Non, le calcul est instantané même avec 10+ localisations.

**Q: Puis-je avoir des rayons différents par localisation ?**  
R: Oui, chaque localisation a son propre `rayonTolerance`.

**Q: Que se passe-t-il si je supprime toutes les localisations ?**  
R: Le système retournera une erreur. Gardez toujours au moins 1 localisation.

---

## 🎓 Bonnes Pratiques

1. **Nommer clairement** les localisations (ex: "Magasin Centre-Ville", "Entrepôt Zone Industrielle")
2. **Tester en local** avant de déployer en production
3. **Documenter** les changements de localisation
4. **Sauvegarder** la config avant toute modification
5. **Informer** les employés des nouvelles localisations autorisées

---

**© 2026 - Système de Gestion Multi-Localisations**

