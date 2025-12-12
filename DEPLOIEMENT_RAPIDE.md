# 🚀 Déploiement Rapide - 3 Étapes

## Étape 1️⃣ : GitHub (2 minutes)

```powershell
# Exécuter le script automatique
.\deploy-github.ps1
```

**OU manuellement** :

```powershell
git add .
git commit -m "Deploy: GS Pipeline"
git remote add origin https://github.com/VOTRE_USERNAME/gs-pipeline.git
git branch -M main
git push -u origin main
```

---

## Étape 2️⃣ : Railway - Backend + Base de Données (5 minutes)

### A. Créer le projet
1. Allez sur https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionnez votre repository

### B. Ajouter PostgreSQL
1. Dans le projet, cliquez **"New"**
2. **Database** → **PostgreSQL**

### C. Variables d'Environnement
Cliquez sur le service backend → **Variables** :

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=VotreSecretJWTTresSecurise123456789
CORS_ORIGINS=https://votre-app.vercel.app
```

### D. Déployer les migrations
```powershell
# Copier DATABASE_URL depuis Railway
$env:DATABASE_URL="postgresql://postgres:pass@host:port/railway"
npx prisma migrate deploy
npm run prisma:seed
```

### E. Générer le domaine
**Settings** → **Networking** → **Generate Domain**

📝 **Notez l'URL** : `https://gs-pipeline-production.up.railway.app`

---

## Étape 3️⃣ : Vercel - Frontend (3 minutes)

### A. Créer le projet
1. Allez sur https://vercel.com
2. **Add New** → **Project**
3. Importez votre repository GitHub

### B. Configuration
- **Framework Preset** : Vite
- **Root Directory** : `frontend`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

### C. Variable d'environnement
**Settings** → **Environment Variables** :

```env
VITE_API_URL=https://votre-backend.railway.app
```

⚠️ Remplacez par votre URL Railway (étape 2E)

### D. Déployer
Cliquez **Deploy** et attendez 2-3 minutes

📝 **Notez l'URL** : `https://gs-pipeline.vercel.app`

---

## Étape 4️⃣ : Configuration Finale (1 minute)

### Mettre à jour CORS sur Railway

Retournez sur Railway → Backend → **Variables** :

```env
CORS_ORIGINS=https://votre-app.vercel.app,https://votre-app-git-main.vercel.app
```

**Redéployez** le service backend.

---

## ✅ Test Final

1. Ouvrez votre URL Vercel
2. Connectez-vous :
   - Email : `admin@gs-pipeline.com`
   - Password : `admin123`

---

## 🎉 Félicitations !

Votre application est en production !

**URLs** :
- 🎨 Frontend : https://votre-app.vercel.app
- 🔧 Backend : https://votre-backend.railway.app

---

## 🔄 Déploiements Futurs

Après le premier déploiement, c'est automatique :

```powershell
git add .
git commit -m "Nouvelles fonctionnalités"
git push
```

✅ Railway et Vercel déploient automatiquement !

---

## 📖 Documentation Complète

Voir **`GUIDE_DEPLOIEMENT.md`** pour :
- Configuration détaillée
- Dépannage
- Domaines personnalisés
- Sécurité en production
- Monitoring

---

**Temps total : ~10-15 minutes** ⏱️

