# 📦 Package de Duplication de Projet

## 🎯 Objectif

Ce dossier contient des **scripts automatiques** pour dupliquer facilement votre projet sur un autre ordinateur avec de nouveaux comptes GitHub, Railway et Vercel.

**Temps total : 30 minutes** au lieu de 2+ heures manuellement !

## 📁 Contenu

```
PACKAGE_DUPLICATION/
├── README.md                     ← Vous êtes ici
├── 1-EXPORT-PROJET.sh            ← Script d'export (Mac/Linux)
├── 1-EXPORT-PROJET.bat           ← Script d'export (Windows)
└── (Les autres fichiers seront créés automatiquement)
```

## 🚀 Utilisation Rapide

### Sur l'ORDINATEUR SOURCE (actuel)

#### **Windows**
```bash
cd "C:\chemin\vers\votre\projet"
PACKAGE_DUPLICATION\1-EXPORT-PROJET.bat
```

#### **Mac/Linux**
```bash
cd /chemin/vers/votre/projet
bash PACKAGE_DUPLICATION/1-EXPORT-PROJET.sh
```

Le script va :
- ✅ Nettoyer le projet (supprimer node_modules, dist, etc.)
- ✅ Sauvegarder vos variables d'environnement
- ✅ Créer un package PACKAGE_DUPLICATION_EXPORT/
- ✅ Générer les scripts d'import automatiques

### Transférer le projet

Copiez **TOUT le projet** (avec le dossier PACKAGE_DUPLICATION_EXPORT) sur le nouvel ordinateur via :
- 💾 Clé USB
- ☁️ Google Drive / Dropbox / OneDrive
- 📧 WeTransfer (gratuit jusqu'à 2 GB)
- 📨 Email (si < 25 MB)

### Sur le NOUVEL ORDINATEUR

#### 1. Installer les prérequis (5 min)

**Obligatoire** :
- **Node.js 18+** : https://nodejs.org/en/download
- **Git** : https://git-scm.com/downloads

Vérifier :
```bash
node --version   # Doit afficher v18+ ou v20+
npm --version
git --version
```

#### 2. Créer les comptes (10 min)

1. **GitHub** : https://github.com/signup
   - Créer un nouveau compte
   - Noter le username

2. **Railway** : https://railway.app
   - Se connecter
   - Créer un nouveau projet
   - Cliquer "Provision PostgreSQL"
   - Copier la `DATABASE_URL` (onglet Connect)

3. **Vercel** : https://vercel.com/signup
   - Se connecter avec GitHub ou email

#### 3. Configurer (2 min)

Ouvrir le fichier `PACKAGE_DUPLICATION_EXPORT/CONFIG.sh` (ou `CONFIG.bat` sur Windows)

Remplir :
```bash
NEW_PROJECT_NAME="mon-nouveau-projet"
NEW_GITHUB_USERNAME="votre-nouveau-username"
NEW_GITHUB_EMAIL="votre-email@example.com"
NEW_DATABASE_URL="postgresql://..."  # Depuis Railway
NEW_JWT_SECRET="..."  # Voir ci-dessous pour générer
```

**Générer un JWT_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 4. Exécuter l'import (5 min)

**Windows** :
```bash
cd PACKAGE_DUPLICATION_EXPORT
2-IMPORT-PROJET.bat
```

**Mac/Linux** :
```bash
cd PACKAGE_DUPLICATION_EXPORT
bash 2-IMPORT-PROJET.sh
```

Le script va automatiquement :
- ✅ Configurer Git
- ✅ Créer les fichiers .env
- ✅ Installer toutes les dépendances
- ✅ Appliquer les migrations Prisma
- ✅ Créer un utilisateur admin (si applicable)
- ✅ Initialiser le dépôt Git

#### 5. Pousser sur GitHub (2 min)

**Option A : GitHub CLI (recommandé)**
```bash
gh auth login
gh repo create mon-nouveau-projet --private --source=. --push
```

**Option B : Manuellement**
1. Créer un nouveau dépôt sur https://github.com/new
2. Ne pas cocher "Add README" ou ".gitignore"
3. Exécuter :
```bash
git remote add origin https://github.com/VOTRE_USERNAME/mon-nouveau-projet.git
git push -u origin main
```

#### 6. Déployer sur Railway (5 min)

1. Railway > "+ New"
2. "GitHub Repo"
3. Connecter votre GitHub
4. Sélectionner le dépôt
5. Dans Settings :
   - Root Directory : `backend` (si applicable)
   - Start Command : `npm start`
6. Dans Variables, ajouter :
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=votre_secret
   NODE_ENV=production
   ```
7. Settings > Generate Domain
8. **Copier l'URL** (ex: https://backend.up.railway.app)

#### 7. Déployer sur Vercel (5 min)

1. Vercel > "Add New Project"
2. "Import Git Repository"
3. Sélectionner votre dépôt
4. Dans Settings :
   - Root Directory : `frontend` (si applicable)
   - Build Command : `npm run build`
   - Output Directory : `dist`
5. Environment Variables :
   - `VITE_API_URL` = `https://votre-backend.railway.app` ⚠️ URL Railway
6. Deploy
7. **Copier l'URL** (ex: https://projet.vercel.app)

#### 8. Configurer CORS (2 min)

Dans `backend/server.js` :
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://votre-projet.vercel.app',  // ← Votre URL Vercel
  ],
  credentials: true
}));
```

Pousser :
```bash
git add .
git commit -m "Configure CORS"
git push
```

#### 9. Tester ! ✅

**Local** :
```bash
# Terminal 1
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Ouvrir http://localhost:5173

**Production** :
Ouvrir votre URL Vercel 🎉

## ✅ Checklist Complète

- [ ] Node.js + Git installés sur le nouvel ordinateur
- [ ] Comptes GitHub, Railway, Vercel créés
- [ ] Script 1-EXPORT-PROJET exécuté
- [ ] Projet transféré sur le nouvel ordinateur
- [ ] CONFIG.sh/.bat rempli avec toutes les infos
- [ ] Script 2-IMPORT-PROJET exécuté
- [ ] Code poussé sur GitHub
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] CORS configuré
- [ ] Tests locaux OK
- [ ] Tests production OK

## 🆘 Problèmes Courants

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
GitHub n'accepte plus les mots de passe. Utiliser un **Personal Access Token** :
1. GitHub > Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Cocher "repo"
4. Utiliser comme mot de passe

### Railway build échoue
- Vérifier le Root Directory dans Settings
- Vérifier le Start Command
- Vérifier les variables d'environnement

### Vercel build échoue
- Vérifier le Root Directory
- Vérifier que VITE_API_URL est définie
- Consulter les logs de build

## 💡 Astuces

### Générer un JWT Secret fort
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Vérifier les logs
- **Railway** : Dashboard > Service > Logs
- **Vercel** : Dashboard > Deployment > Logs

### Créer plusieurs projets
Le script peut être réutilisé autant de fois que nécessaire !
Il suffit de changer le nom du projet dans CONFIG.

### Sécurité
⚠️ **Ne jamais commiter les fichiers .env sur GitHub**
Le .gitignore est configuré automatiquement pour les ignorer.

## 🎯 Cas d'Usage

### Pour un client
1. Créer des comptes au nom du client
2. Personnaliser le nom, logo, couleurs
3. Configurer les coordonnées GPS (si géolocalisation)

### Pour tester
1. Utiliser vos propres comptes
2. Nommer "projet-test" ou "projet-staging"
3. Tester les nouvelles fonctionnalités

### Pour collaborer
1. Créer une organisation GitHub
2. Inviter les collaborateurs
3. Chacun a sa DB locale
4. Partager la DB Railway pour la prod

## 📊 Limitations Gratuites

### GitHub
✅ Dépôts illimités (publics et privés)
✅ Actions : 2000 min/mois

### Railway
✅ 500h/mois
✅ 1 GB RAM
✅ 1 GB DB
⚠️ Suffisant pour 1-2 petits projets

### Vercel
✅ Déploiements illimités
✅ 100 GB/mois
✅ Domaines personnalisés
⚠️ Suffisant pour plusieurs projets

## 🚀 Automatisation Avancée

### GitHub CLI (optionnel mais recommandé)

**Installer** :
- Windows : `winget install GitHub.cli`
- Mac : `brew install gh`
- Linux : https://cli.github.com

**Utiliser** :
```bash
gh auth login
gh repo create mon-projet --private --source=. --push
```

## 📝 Notes

- Les scripts nettoient automatiquement node_modules (économise de l'espace)
- Les variables sensibles (.env) ne sont jamais copiées en clair
- Git est réinitialisé pour un nouveau démarrage propre
- Un utilisateur admin est créé automatiquement (email: admin@example.com, password: admin123)
- ⚠️ Changez le mot de passe admin en production !

## 🎉 Résultat

Après avoir suivi ce guide, vous aurez :
- ✅ Un projet identique sur le nouvel ordinateur
- ✅ Un nouveau dépôt GitHub
- ✅ Une nouvelle base de données Railway
- ✅ Un backend déployé sur Railway
- ✅ Un frontend déployé sur Vercel
- ✅ Tout configuré et fonctionnel

**Temps total : 30-45 minutes au lieu de 2+ heures !** 🚀

## 📞 Support

En cas de problème :
1. Vérifier la checklist ci-dessus
2. Consulter la section "Problèmes Courants"
3. Vérifier les logs (Railway/Vercel)
4. Relire le fichier README-QUICK.md généré dans PACKAGE_DUPLICATION_EXPORT/

## 🔄 Mises à jour

Ce script est compatible avec :
- Node.js 18+
- Prisma 5+
- React 18+
- Vite 5+
- Express 4+

---

Créé avec ❤️ pour faciliter la duplication de projets avec Cursor AI

Dernière mise à jour : 1er février 2026









