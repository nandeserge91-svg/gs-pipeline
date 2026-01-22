# 🚀 INSTRUCTIONS DE DÉPLOIEMENT - SYSTÈME DE POINTAGE

## ✅ ÉTAT ACTUEL

- ✅ **Code poussé sur GitHub** (commit: 464be9e)
- ✅ **Railway** : Déploiement automatique en cours
- ✅ **Vercel** : Déploiement automatique en cours
- 🔄 **Migration** : Sera appliquée automatiquement par Railway
- ⏳ **Configuration GPS** : À faire après le déploiement

---

## 📍 COORDONNÉES CONFIGURÉES

```
Lieu      : Abidjan, Côte d'Ivoire
Latitude  : 5.353021
Longitude : -3.870182
Rayon     : 50 mètres
Horaires  : 08:00 - 18:00
```

---

## 🎯 ÉTAPES APRÈS DÉPLOIEMENT (dans 2-3 minutes)

### **Option 1 : Configuration via Railway Console** (Recommandé)

1. **Aller sur Railway** : https://railway.app
2. **Ouvrir votre projet** : gs-pipeline
3. **Cliquer sur le service** backend
4. **Onglet "Deploy"** → Attendre que le build soit terminé
5. **Une fois déployé**, aller dans l'onglet **"Settings"**
6. **Scroller jusqu'à "Custom Start Command"**
7. **Exécuter cette commande** dans le terminal Railway :

```bash
node scripts/quick-setup-abidjan.js
```

**OU** si vous avez accès au shell Railway :

```bash
# Se connecter au shell
railway run bash

# Exécuter le script
node scripts/quick-setup-abidjan.js
```

---

### **Option 2 : Via API REST** (Alternative)

Si vous ne pouvez pas accéder au shell Railway, utilisez l'API :

**1. Se connecter en tant qu'ADMIN** sur https://afgestion.net

**2. Récupérer votre token JWT** (F12 → Application → Local Storage → token)

**3. Utiliser Postman/Insomnia** ou curl :

```bash
curl -X PUT https://gs-pipeline-production.up.railway.app/api/attendance/store-config \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "GS Pipeline - Abidjan",
    "adresse": "Abidjan, Côte d'\''Ivoire",
    "latitude": 5.353021,
    "longitude": -3.870182,
    "rayonTolerance": 50,
    "heureOuverture": "08:00",
    "heureFermeture": "18:00",
    "toleranceRetard": 15
  }'
```

---

### **Option 3 : SQL Direct** (Si vous avez accès à la BDD)

**Via Railway Database Console** :

1. Aller sur Railway
2. Cliquer sur votre base de données PostgreSQL
3. Onglet **"Data"** ou **"Query"**
4. Exécuter ce SQL :

```sql
-- Supprimer l'ancienne config
DELETE FROM "store_config";

-- Insérer la nouvelle
INSERT INTO "store_config" (
    "nom",
    "adresse",
    "latitude",
    "longitude",
    "rayonTolerance",
    "heureOuverture",
    "heureFermeture",
    "toleranceRetard",
    "joursOuvres",
    "updatedAt"
) VALUES (
    'GS Pipeline - Abidjan',
    'Abidjan, Côte d''Ivoire',
    5.353021,
    -3.870182,
    50,
    '08:00',
    '18:00',
    15,
    '["lundi","mardi","mercredi","jeudi","vendredi","samedi"]',
    CURRENT_TIMESTAMP
);

-- Vérifier
SELECT * FROM "store_config";
```

---

## ✅ VÉRIFICATION

### **1. Vérifier que le backend est déployé**

```bash
curl https://gs-pipeline-production.up.railway.app/
```

Devrait retourner :
```json
{
  "message": "API GS Pipeline - Back-office e-commerce",
  "version": "1.0.0",
  "status": "running"
}
```

### **2. Vérifier que la migration est appliquée**

Se connecter sur Railway et vérifier les logs :
- Chercher : `✓ Generated Prisma Client`
- Chercher : `Applied migrations`

### **3. Tester l'API de pointage**

```bash
curl https://gs-pipeline-production.up.railway.app/api/attendance/store-config
```

Devrait retourner la configuration du magasin.

---

## 🎯 APRÈS CONFIGURATION

### **Tester le système**

1. **Se connecter** : https://afgestion.net
2. **Rôle** : APPELANT, GESTIONNAIRE ou GESTIONNAIRE_STOCK
3. **Dashboard** : Voir le widget "Pointage" 📍
4. **Cliquer** : "Marquer ma présence"
5. **Autoriser** la géolocalisation
6. **Vérifier** le résultat

---

## 🆘 EN CAS DE PROBLÈME

### **Logs Railway**

```
Railway → Votre projet → Service backend → Deploy → View Logs
```

Chercher les erreurs liées à :
- `Prisma`
- `attendance`
- `StoreConfig`

### **Réappliquer la migration**

Si la migration n'est pas appliquée automatiquement :

```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# OU forcer un redéploiement
# Railway → Settings → Redeploy
```

---

## 📊 TIMELINE

```
T+0min  : Push GitHub ✅ (fait)
T+2min  : Railway build en cours 🔄
T+3min  : Migration automatique 🔄
T+4min  : Backend déployé ✅
T+5min  : Exécuter script configuration 📍
T+6min  : Système opérationnel ! 🎉
```

---

## 🎉 CHECKLIST FINALE

- [ ] Railway déployé (vérifier les logs)
- [ ] Migration appliquée (chercher "Applied migrations" dans les logs)
- [ ] Script configuration exécuté (Option 1, 2 ou 3)
- [ ] Config vérifiée via API
- [ ] Frontend Vercel déployé
- [ ] Test de pointage réussi

---

**Le système sera 100% opérationnel dans 5-6 minutes ! ⏱️**

**Prochain checkpoint** : Vérifier Railway dans 2-3 minutes

