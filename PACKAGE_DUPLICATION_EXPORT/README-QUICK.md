# 📦 Package de Duplication - Guide Rapide

## 🎯 Ce package contient

- ✅ Configuration de votre projet source
- ✅ Variables d'environnement sauvegardées
- ✅ Scripts d'import automatiques
- ✅ Instructions complètes

**IMPORTANT** : Vous devez copier **TOUT VOTRE PROJET** (pas seulement ce dossier) sur le nouvel ordinateur.

---

## 📤 SUR L'ORDINATEUR ACTUEL

### ✅ Ce qui a été fait automatiquement :
- Sauvegarde des variables d'environnement
- Création des scripts de configuration
- Préparation du package

### 📦 Ce que vous devez transférer :
**Copiez TOUT le projet "GS cursor"** sur le nouvel ordinateur via :
- Clé USB
- Google Drive / Dropbox
- WeTransfer (https://wetransfer.com)
- Email (si < 25 MB après compression)

**💡 ASTUCE** : Compressez en ZIP avant de transférer
- Clic-droit sur le dossier "GS cursor" > Envoyer vers > Dossier compressé

---

## 🆕 SUR LE NOUVEL ORDINATEUR

### 1. Installer les outils (5 minutes)

**Node.js 18+** : https://nodejs.org
```bash
node --version  # Vérifier
npm --version
```

**Git** : https://git-scm.com
```bash
git --version  # Vérifier
```

### 2. Créer les comptes (10 minutes)

#### GitHub
1. https://github.com/signup
2. Créer un compte
3. Noter le username

#### Railway
1. https://railway.app
2. Se connecter
3. "+ New Project"
4. "Provision PostgreSQL"
5. **COPIER LA DATABASE_URL** (onglet Connect)
   - Format : `postgresql://postgres:xxx@xxx.railway.app:5432/railway`

#### Vercel
1. https://vercel.com/signup
2. Se connecter

### 3. Configurer le projet (5 minutes)

1. **Extraire** le projet sur le nouvel ordinateur

2. **Ouvrir** `PACKAGE_DUPLICATION_EXPORT\CONFIG.bat`

3. **Remplir** toutes les variables :
   ```bat
   set "NEW_PROJECT_NAME=mon-nouveau-projet"
   set "NEW_GITHUB_USERNAME=votre-username"
   set "NEW_GITHUB_EMAIL=votre@email.com"
   set "NEW_DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway"
   set "NEW_JWT_SECRET=..."
   ```

4. **Générer un JWT_SECRET** :
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copier le résultat dans NEW_JWT_SECRET

### 4. Exécuter l'import (5 minutes)

```bash
cd "C:\chemin\vers\GS cursor\PACKAGE_DUPLICATION_EXPORT"
2-IMPORT-PROJET.bat
```

Le script va automatiquement :
- ✅ Créer les fichiers .env
- ✅ Installer les dépendances
- ✅ Configurer Prisma
- ✅ Initialiser Git

---

## 🌐 DÉPLOIEMENT (15 minutes)

### GitHub (2 min)

**Option 1 - GitHub CLI** (recommandé)
```bash
gh auth login
gh repo create mon-projet --private --source=. --push
```

**Option 2 - Manuel**
1. Créer un dépôt sur https://github.com/new
2. Ne pas ajouter README ou .gitignore
3. Exécuter :
```bash
git remote add origin https://github.com/USERNAME/PROJET.git
git push -u origin main
```

### Railway (5 min)

1. Railway > "+ New" > "GitHub Repo"
2. Connecter votre GitHub
3. Sélectionner le dépôt
4. **Settings** :
   - Root Directory : `backend`
   - Start Command : `npm start`
5. **Variables** :
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=votre_secret
   NODE_ENV=production
   ```
6. **Generate Domain**
7. **Copier l'URL** (ex: https://backend.up.railway.app)

### Vercel (5 min)

1. Vercel > "Add New Project"
2. "Import Git Repository"
3. Sélectionner votre dépôt
4. **Settings** :
   - Root Directory : `frontend`
   - Build Command : `npm run build`
   - Output Directory : `dist`
5. **Environment Variables** :
   - `VITE_API_URL` = `https://votre-backend.railway.app`
6. "Deploy"
7. **Copier l'URL** (ex: https://projet.vercel.app)

### CORS (2 min)

Dans `backend/server.js` :
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://votre-projet.vercel.app',  // URL Vercel
  ],
  credentials: true
}));
```

Pousser les changements :
```bash
git add .
git commit -m "Configure CORS"
git push
```

---

## ✅ TESTS

### Local
```bash
npm run dev                    # Backend
cd frontend && npm run dev     # Frontend
```
Ouvrir http://localhost:5173

### Production
Ouvrir votre URL Vercel 🎉

---

## 🆘 PROBLÈMES COURANTS

### "npm install" échoue
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### "Prisma Client not generated"
```bash
npx prisma generate
npx prisma migrate deploy
```

### Erreur CORS
Vérifier que l'URL Vercel est bien dans `cors({ origin: [...] })`

### GitHub demande un mot de passe
Utiliser un **Personal Access Token** :
1. GitHub > Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Cocher "repo"
4. Utiliser comme mot de passe lors du push

---

## ✅ CHECKLIST

- [ ] Node.js + Git installés
- [ ] Comptes créés (GitHub, Railway, Vercel)
- [ ] CONFIG.bat rempli
- [ ] Script 2-IMPORT-PROJET.bat exécuté
- [ ] Code poussé sur GitHub
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] CORS configuré
- [ ] Tests locaux OK
- [ ] Tests production OK

---

## 🎉 SUCCÈS !

Votre projet est maintenant dupliqué et fonctionnel avec :
- ✅ Nouveau dépôt GitHub
- ✅ Nouvelle base de données Railway
- ✅ Backend déployé
- ✅ Frontend déployé

**Temps total : ~40 minutes** 🚀

---

Pour plus de détails, consultez le README.md complet dans PACKAGE_DUPLICATION/









