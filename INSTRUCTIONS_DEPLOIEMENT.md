# 🚀 INSTRUCTIONS DE DÉPLOIEMENT - Système de Géolocalisation

## 📋 Checklist Complète

### ✅ Étape 1 : Migrations de la Base de Données

**Sur Railway** :

1. **Ouvrir Railway Dashboard**
   - Aller sur https://railway.app
   - Sélectionner votre projet `gs-pipeline-production`

2. **Ouvrir le Terminal Railway**
   - Cliquer sur votre service backend
   - Onglet "Deploy" → "View Logs"
   - OU utiliser Railway CLI

3. **Appliquer les migrations**
   ```bash
   npx prisma migrate deploy
   ```

   **Résultat attendu** :
   ```
   ✅ Migration `20260122_add_attendance_system` applied
   ✅ Database schema is up to date
   ```

---

### ✅ Étape 2 : Configuration du Magasin (GPS)

**Exécuter le script de configuration** :

```bash
# Sur Railway (via le terminal ou en local avec la bonne DATABASE_URL)
node scripts/setup-abidjan-quick.js
```

**Résultat attendu** :
```
🚀 Configuration du magasin à Abidjan...

✅ Configuration réussie !

═══════════════════════════════════════════════════════════
📍 Nom        : Magasin Principal Abidjan
📍 Adresse    : Abidjan, Côte d'Ivoire
📍 Latitude   : 5.353021° (5°21'10.9"N)
📍 Longitude  : -3.870182° (3°52'12.7"W)
📏 Rayon      : 50m
🕐 Ouverture  : 08:00
🕐 Fermeture  : 18:00
⏰ Tolérance  : 15 minutes
═══════════════════════════════════════════════════════════

🎉 Le système de géolocalisation est maintenant configuré !
```

---

### ✅ Étape 3 : Vérifier les Variables d'Environnement

#### **Sur Vercel (Frontend)**

1. Aller sur https://vercel.com
2. Sélectionner votre projet
3. Settings → Environment Variables
4. Vérifier :
   ```
   VITE_API_URL = https://gs-pipeline-production.up.railway.app
   ```

#### **Sur Railway (Backend)**

1. Aller sur https://railway.app
2. Sélectionner votre projet
3. Variables → Variables
4. Vérifier :
   ```
   DATABASE_URL     = postgresql://...
   JWT_SECRET       = [votre secret]
   CORS_ORIGINS     = https://www.afgestion.net,https://afgestion.net
   NODE_ENV         = production
   ```

---

### ✅ Étape 4 : Redéployer les Services

#### **Backend (Railway)**
```
1. Push vers GitHub (déjà fait ✅)
2. Railway redéploie automatiquement
3. Attendre 2-3 minutes
4. Vérifier les logs : ✅ "Server running on port..."
```

#### **Frontend (Vercel)**
```
1. Push vers GitHub (déjà fait ✅)
2. Vercel redéploie automatiquement
3. Attendre 2-3 minutes
4. Vérifier : https://www.afgestion.net
```

---

### ✅ Étape 5 : Tests de Validation

#### **Test 1 : API Backend**

**Vérifier que l'API répond** :
```bash
# Tester la config du magasin
curl https://gs-pipeline-production.up.railway.app/api/attendance/store-config

# Résultat attendu :
{
  "config": {
    "id": 1,
    "nom": "Magasin Principal Abidjan",
    "latitude": 5.353021,
    "longitude": -3.870182,
    ...
  }
}
```

#### **Test 2 : Frontend**

1. **Se connecter** sur https://www.afgestion.net
2. **Aller sur le Dashboard**
3. **Vérifier le bouton de pointage** :
   - ✅ Composant "Pointage" visible
   - ✅ Badge "ABSENT" affiché
   - ✅ Bouton "Marquer ma présence"

#### **Test 3 : Pointage**

1. **Cliquer sur "Marquer ma présence"**
2. **Autoriser la géolocalisation**
3. **Résultats possibles** :
   - ✅ Si dans la zone (< 50m) → "Présence enregistrée"
   - ❌ Si hors zone (> 50m) → "Pointage refusé - Rapprochez-vous"

#### **Test 4 : Page Présences**

1. **Aller sur "Présences & Absences"** (menu Admin/Gestionnaire)
2. **Vérifier** :
   - ✅ Page s'affiche (pas blanche)
   - ✅ Statistiques visibles
   - ✅ Tableau avec les pointages d'aujourd'hui
   - ✅ Filtres fonctionnels

---

## 🔧 Résolution de Problèmes

### Problème 1 : "Configuration du magasin non trouvée"

**Solution** :
```bash
# Exécuter le script de configuration
node scripts/setup-abidjan-quick.js
```

### Problème 2 : Page "Présences & Absences" blanche

**Solutions** :
1. **Vider le cache du navigateur** : Ctrl+Shift+R
2. **Vérifier la console** : F12 → Console → Copier les erreurs
3. **Vérifier VITE_API_URL** sur Vercel
4. **Redémarrer le backend** sur Railway

### Problème 3 : "Géolocalisation refusée"

**Solutions** :
1. **Autoriser dans le navigateur** :
   - Chrome : Paramètres → Confidentialité → Localisation
   - Autoriser https://www.afgestion.net
2. **Activer le GPS** sur mobile
3. **Utiliser HTTPS** (obligatoire pour la géolocalisation)

### Problème 4 : "CORS Error"

**Solutions** :
1. **Vérifier CORS_ORIGINS** sur Railway
2. **Doit contenir** :
   ```
   https://www.afgestion.net,https://afgestion.net
   ```
3. **Redémarrer le backend** après modification

### Problème 5 : Migrations non appliquées

**Solutions** :
```bash
# Sur Railway (via le terminal)
npx prisma migrate deploy

# OU en local avec la DATABASE_URL de Railway
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 📊 Vérification Finale

Avant de mettre en production, vérifier :

- [ ] ✅ Migrations appliquées (tables `attendances` et `store_config` créées)
- [ ] ✅ Configuration du magasin créée (script exécuté)
- [ ] ✅ Variables d'environnement correctes (Vercel + Railway)
- [ ] ✅ Backend déployé et actif (logs Railway OK)
- [ ] ✅ Frontend déployé et accessible (https://www.afgestion.net)
- [ ] ✅ API répond (test curl)
- [ ] ✅ Bouton de pointage visible sur les dashboards
- [ ] ✅ Test de pointage réussi (dans la zone)
- [ ] ✅ Test de refus réussi (hors zone)
- [ ] ✅ Page "Présences & Absences" fonctionne
- [ ] ✅ Filtres et statistiques opérationnels
- [ ] ✅ Export CSV fonctionne

---

## 🎉 Système Prêt !

Une fois toutes les étapes validées :

✅ **Le système de géolocalisation est opérationnel**
✅ **Les employés peuvent pointer leur présence**
✅ **Les admins/gestionnaires peuvent voir l'historique**
✅ **Tout fonctionne comme prévu**

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Railway (backend)
2. Vérifier la console du navigateur (frontend)
3. Consulter les guides dans PACK_GEOLOCALISATION/
4. Vérifier les variables d'environnement

---

**Date de création** : 22 janvier 2026  
**Version** : 1.0  
**Status** : ✅ Prêt pour production

