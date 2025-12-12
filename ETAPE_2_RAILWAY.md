# 🚂 ÉTAPE 2 : Déploiement sur Railway

## ✅ Étape 1 Terminée : Code sur GitHub ✅

Votre code est maintenant sur : https://github.com/nandeserge91-svg/gs-pipeline

---

## 🚂 Configuration Railway (5 minutes)

### A. Créer un compte / Se connecter

1. Allez sur : **https://railway.app**
2. Cliquez sur **"Start a New Project"** ou **"Login"**
3. Connectez-vous avec votre compte GitHub

---

### B. Créer le projet Backend

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez **"gs-pipeline"** dans la liste
4. Railway commence à déployer automatiquement

⏳ **Attendez 2-3 minutes** que le premier déploiement se termine.

---

### C. Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"New"** (en haut à droite)
2. Sélectionnez **"Database"**
3. Choisissez **"Add PostgreSQL"**
4. Railway crée automatiquement la base de données

✅ La variable `DATABASE_URL` est automatiquement liée !

---

### D. Configurer les Variables d'Environnement

1. Cliquez sur votre service **"gs-pipeline"** (backend)
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"New Variable"** et ajoutez :

```env
NODE_ENV=production

PORT=5000

JWT_SECRET=gs_pipeline_2024_jwt_secret_production_change_this_to_secure_random_string_min_32_chars

CORS_ORIGINS=http://localhost:3000,https://gs-pipeline.vercel.app
```

⚠️ **IMPORTANT pour CORS_ORIGINS** :
- Ajoutez `https://gs-pipeline.vercel.app` (ou votre futur URL Vercel)
- Vous pourrez le mettre à jour après avoir déployé sur Vercel

4. Cliquez sur **"Add"** pour chaque variable

---

### E. Appliquer les Migrations

Une fois le service déployé :

1. Dans Railway, allez dans **"Settings"**
2. Copiez l'URL **"DATABASE_URL"** (dans Variables)
3. Dans PowerShell local, exécutez :

```powershell
# Remplacez par l'URL copiée
$env:DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:xxxx/railway"

# Appliquer les migrations
npx prisma migrate deploy

# Créer les données de test
npm run prisma:seed
```

✅ Votre base de données est maintenant créée avec les utilisateurs de test !

---

### F. Générer le Domaine Public

1. Cliquez sur votre service **"gs-pipeline"**
2. Allez dans **"Settings"**
3. Descendez jusqu'à **"Networking"**
4. Cliquez sur **"Generate Domain"**

🎯 Vous obtiendrez une URL comme :
```
https://gs-pipeline-production.up.railway.app
```

📝 **NOTEZ CETTE URL** - Vous en aurez besoin pour Vercel !

---

### G. Vérifier que le Backend fonctionne

Testez votre backend :

```powershell
curl https://votre-backend.railway.app
```

Devrait retourner :
```json
{"message":"API GS Pipeline - Back-office e-commerce","version":"1.0.0","status":"running"}
```

---

## ✅ Checklist Railway

- [ ] Compte Railway créé / connecté avec GitHub
- [ ] Projet créé depuis le repository GitHub
- [ ] PostgreSQL ajouté au projet
- [ ] Variables d'environnement configurées (NODE_ENV, PORT, JWT_SECRET, CORS_ORIGINS)
- [ ] Migrations appliquées (prisma migrate deploy)
- [ ] Seed exécuté (données de test créées)
- [ ] Domaine généré et noté
- [ ] Backend testé et fonctionnel

---

## 📝 Informations à Noter

**Backend URL Railway** : _________________________________

**DATABASE_URL** : _________________________________
(Gardez-le secret !)

---

## 🎯 Prochaine Étape

Une fois Railway configuré et l'URL du backend notée, passez à :

**ÉTAPE 3 : Déploiement sur Vercel (Frontend)**

---

## 🆘 Problèmes Courants

### Le build échoue sur Railway

**Solution** : Vérifiez les logs de build. Si erreur Prisma :
- Ajoutez `"postinstall": "npx prisma generate"` dans package.json
- Vérifiez que DATABASE_URL est bien configurée

### Les migrations ne s'appliquent pas

**Solution** :
```powershell
# Vérifiez la connexion à la BDD Railway
$env:DATABASE_URL="votre_url_railway"
npx prisma db push --accept-data-loss
npm run prisma:seed
```

### Erreur "Cannot reach database"

**Solution** : Attendez 2-3 minutes que PostgreSQL soit complètement démarré sur Railway.

---

**📍 Vous êtes ici : ÉTAPE 2 - RAILWAY** ✅
**⏭️ Prochaine étape : ÉTAPE 3 - VERCEL**

