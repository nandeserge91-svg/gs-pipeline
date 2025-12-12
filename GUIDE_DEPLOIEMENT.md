# 🚀 Guide de Déploiement - GS Pipeline

## Architecture de Déploiement

```
GitHub (Code Source)
    ↓
    ├─→ Railway (Backend + PostgreSQL)
    └─→ Vercel (Frontend React)
```

---

## 📋 Prérequis

- ✅ Compte GitHub
- ✅ Compte Railway (https://railway.app)
- ✅ Compte Vercel (https://vercel.com)
- ✅ Git installé localement

---

## ÉTAPE 1 : Préparation du Code 📦

### 1.1 Créer les fichiers .env.example

**Backend (.env.example)** :
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_jwt_secret_here_change_in_production
MAKE_API_KEY=your_make_api_key_here
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

**Frontend (frontend/.env.example)** :
```env
VITE_API_URL=https://your-backend-url.railway.app
```

### 1.2 Vérifier le package.json

Assurez-vous que `package.json` contient :

```json
{
  "scripts": {
    "start": "node server.js",
    "build": "npx prisma generate",
    "postinstall": "npx prisma generate"
  },
  "engines": {
    "node": ">=18.x"
  }
}
```

---

## ÉTAPE 2 : Déploiement sur GitHub 🐙

### 2.1 Créer un nouveau repository

1. Allez sur https://github.com/new
2. Nom du repository : `gs-pipeline` (ou autre)
3. **Ne pas** initialiser avec README (on a déjà du code)
4. Visibilité : **Private** (recommandé pour un projet d'entreprise)

### 2.2 Pousser le code

```powershell
# Configurer Git (si pas déjà fait)
git config user.name "Votre Nom"
git config user.email "votre@email.com"

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Application GS Pipeline"

# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/gs-pipeline.git

# Pousser le code
git branch -M main
git push -u origin main
```

---

## ÉTAPE 3 : Déploiement Backend sur Railway 🚂

### 3.1 Créer un nouveau projet

1. Connectez-vous sur https://railway.app
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez votre repository `gs-pipeline`

### 3.2 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"New"**
2. Sélectionnez **"Database" → "PostgreSQL"**
3. Railway créera automatiquement la base de données
4. Notez l'URL de connexion (elle sera automatiquement disponible via `DATABASE_URL`)

### 3.3 Configurer les Variables d'Environnement

Dans Railway, allez dans **Settings → Variables** :

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Automatique
JWT_SECRET=votreSecretJWTTresSecurise123456789
CORS_ORIGINS=https://votre-frontend.vercel.app
MAKE_API_KEY=votre_api_key_make_si_necessaire
```

**Important** : 
- Générez un JWT_SECRET sécurisé : https://www.grc.com/passwords.htm
- Mettez l'URL de votre frontend Vercel dans CORS_ORIGINS (on l'aura à l'étape suivante)

### 3.4 Configurer le Build

Railway devrait détecter automatiquement Node.js, mais vérifiez :

- **Build Command** : `npm install && npx prisma generate`
- **Start Command** : `npm start`
- **Root Directory** : `/` (racine)

### 3.5 Déployer la Base de Données

Dans le terminal Railway ou localement avec l'URL Railway :

```powershell
# Copier l'URL DATABASE_URL depuis Railway
# Puis exécuter :
$env:DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:xxxx/railway"

# Appliquer les migrations
npx prisma migrate deploy

# OU créer le schéma directement
npx prisma db push

# Seed la base de données
npm run prisma:seed
```

### 3.6 Récupérer l'URL du Backend

1. Dans Railway, allez dans **Settings → Domains**
2. Cliquez sur **"Generate Domain"**
3. Notez l'URL (ex: `https://gs-pipeline-production.up.railway.app`)

---

## ÉTAPE 4 : Déploiement Frontend sur Vercel ▲

### 4.1 Créer un nouveau projet

1. Connectez-vous sur https://vercel.com
2. Cliquez sur **"Add New" → "Project"**
3. Importez votre repository GitHub `gs-pipeline`

### 4.2 Configurer le projet

Dans les paramètres de déploiement Vercel :

- **Framework Preset** : Vite
- **Root Directory** : `frontend`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

### 4.3 Variables d'Environnement

Dans **Settings → Environment Variables** :

```env
VITE_API_URL=https://votre-backend.railway.app
```

⚠️ Utilisez l'URL Railway de l'étape 3.6

### 4.4 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez la fin du build (2-3 minutes)
3. Récupérez l'URL Vercel (ex: `https://gs-pipeline.vercel.app`)

---

## ÉTAPE 5 : Configuration Finale ⚙️

### 5.1 Mettre à jour CORS sur Railway

Retournez sur Railway et mettez à jour la variable `CORS_ORIGINS` :

```env
CORS_ORIGINS=https://votre-app.vercel.app,https://votre-app-git-main.vercel.app
```

Incluez les deux URLs (production et preview).

### 5.2 Redéployer le Backend

Sur Railway, cliquez sur **"Redeploy"** pour appliquer les changements.

### 5.3 Configurer le Domaine Personnalisé (Optionnel)

**Sur Vercel** :
1. Settings → Domains
2. Ajoutez `obgestion.com` et `www.obgestion.com`
3. Configurez les DNS selon les instructions Vercel

**Sur Railway** :
1. Settings → Domains
2. Ajoutez `api.obgestion.com`
3. Configurez les DNS

---

## ÉTAPE 6 : Vérification et Tests ✅

### 6.1 Tester le Backend

```powershell
# Test de l'API
$body = @{ email = "admin@gs-pipeline.com"; password = "admin123" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://votre-backend.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### 6.2 Tester le Frontend

1. Ouvrez https://votre-app.vercel.app
2. Essayez de vous connecter avec :
   - Email : `admin@gs-pipeline.com`
   - Password : `admin123`

### 6.3 Vérifier la Base de Données

```powershell
# Accéder à la base Railway
railway login
railway link
railway run psql

# Vérifier les utilisateurs
SELECT email, role FROM users;
```

---

## 🔄 Workflow de Déploiement Continu

Après la configuration initiale :

1. **Développement Local** :
   ```powershell
   git add .
   git commit -m "Description des changements"
   git push
   ```

2. **Déploiement Automatique** :
   - ✅ Railway déploie automatiquement le backend
   - ✅ Vercel déploie automatiquement le frontend

---

## 📝 Checklist de Déploiement

### Avant de déployer
- [ ] Code testé en local
- [ ] Fichiers de test supprimés
- [ ] .gitignore configuré
- [ ] .env.example créés

### GitHub
- [ ] Repository créé
- [ ] Code poussé
- [ ] Repository en privé

### Railway (Backend)
- [ ] Projet créé
- [ ] PostgreSQL ajouté
- [ ] Variables d'environnement configurées
- [ ] Migrations appliquées
- [ ] Seed exécuté
- [ ] URL backend récupérée

### Vercel (Frontend)
- [ ] Projet créé
- [ ] Root directory = `frontend`
- [ ] Variable VITE_API_URL configurée
- [ ] Déployé avec succès
- [ ] URL frontend récupérée

### Configuration Finale
- [ ] CORS_ORIGINS mis à jour sur Railway
- [ ] Backend redéployé
- [ ] Tests de connexion réussis

---

## 🐛 Dépannage

### Erreur "Cannot connect to database"

```powershell
# Vérifier la variable DATABASE_URL sur Railway
# Réappliquer les migrations
npx prisma migrate deploy
```

### Erreur CORS sur le frontend

Vérifiez que `CORS_ORIGINS` sur Railway contient l'URL exacte de Vercel.

### Erreur "Prisma Client not generated"

```powershell
# Sur Railway, dans les logs de build
# Vérifiez que "npx prisma generate" s'exécute
# Ajoutez-le dans package.json → postinstall
```

### Frontend ne se connecte pas au backend

Vérifiez `VITE_API_URL` dans les variables Vercel (sans `/` à la fin).

---

## 🔐 Sécurité en Production

### À Faire Immédiatement

1. **Changer les mots de passe** :
   ```sql
   -- Se connecter à Railway psql
   UPDATE users SET password = '$2a$10$NEW_HASH' WHERE email = 'admin@gs-pipeline.com';
   ```

2. **Générer un nouveau JWT_SECRET** :
   - Utilisez un générateur de mot de passe fort
   - Mettez à jour sur Railway

3. **Activer HTTPS uniquement** :
   - Railway et Vercel utilisent HTTPS par défaut ✅

4. **Configurer les backups** :
   - Railway fait des backups automatiques
   - Configurez des backups supplémentaires si nécessaire

---

## 📊 Monitoring

### Railway
- Dashboard → Metrics : CPU, RAM, Réseau
- Logs en temps réel

### Vercel
- Analytics → Usage
- Logs de déploiement

---

## 💰 Coûts Estimés

| Service | Plan Gratuit | Plan Payant |
|---------|--------------|-------------|
| **GitHub** | Illimité (privé) | - |
| **Railway** | $5/mois de crédit | $20/mois |
| **Vercel** | 100 GB/mois | $20/mois |

**Total** : Gratuit pour commencer, ~$25-40/mois pour production.

---

## 🎉 Félicitations !

Votre application est maintenant déployée en production !

**URLs de Production** :
- Frontend : https://votre-app.vercel.app
- Backend : https://votre-backend.railway.app
- Base de données : Railway PostgreSQL

---

## 📞 Support

Pour toute question :
1. Vérifiez les logs sur Railway et Vercel
2. Consultez la documentation :
   - Railway : https://docs.railway.app
   - Vercel : https://vercel.com/docs
   - Prisma : https://www.prisma.io/docs

**Bon déploiement ! 🚀**

