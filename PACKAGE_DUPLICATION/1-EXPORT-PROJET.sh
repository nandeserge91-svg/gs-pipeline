#!/bin/bash

###############################################################################
#                                                                             #
#           📦 SCRIPT 1 : EXPORT DU PROJET (ORDINATEUR SOURCE)                #
#                                                                             #
#  À exécuter sur l'ordinateur actuel pour préparer le projet                #
#                                                                             #
###############################################################################

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         📦 EXPORT DU PROJET POUR DUPLICATION                 ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PROJECT_NAME=$(basename "$PWD")
EXPORT_DIR="PACKAGE_DUPLICATION_EXPORT"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📁 Projet détecté : $PROJECT_NAME"
echo ""

# Étape 1 : Créer le dossier d'export
echo "1️⃣  Création du dossier d'export..."
mkdir -p "$EXPORT_DIR"

# Étape 2 : Sauvegarder les variables d'environnement
echo "2️⃣  Sauvegarde des variables d'environnement..."

# Backend .env
if [ -f ".env" ]; then
    cp .env "$EXPORT_DIR/backend.env.EXAMPLE"
    echo "   ✅ .env copié"
fi

if [ -f "backend/.env" ]; then
    cp backend/.env "$EXPORT_DIR/backend.env.EXAMPLE"
    echo "   ✅ backend/.env copié"
fi

# Frontend .env
if [ -f "frontend/.env" ]; then
    cp frontend/.env "$EXPORT_DIR/frontend.env.EXAMPLE"
    echo "   ✅ frontend/.env copié"
fi

# Étape 3 : Extraire les informations importantes
echo "3️⃣  Extraction des informations du projet..."

cat > "$EXPORT_DIR/PROJECT_INFO.txt" << EOF
╔══════════════════════════════════════════════════════════════╗
║          INFORMATIONS DU PROJET                              ║
╚══════════════════════════════════════════════════════════════╝

📦 Nom du projet : $PROJECT_NAME
📅 Date d'export : $(date +"%d/%m/%Y à %H:%M:%S")
💻 Système : $OSTYPE

══════════════════════════════════════════════════════════════

📋 STRUCTURE DU PROJET :

$(tree -L 2 -I 'node_modules|dist|build' 2>/dev/null || find . -maxdepth 2 -type d ! -path '*/node_modules*' ! -path '*/dist*' ! -path '*/.git*' 2>/dev/null)

══════════════════════════════════════════════════════════════

📦 DÉPENDANCES BACKEND :

$(if [ -f "package.json" ]; then cat package.json | grep -A 20 '"dependencies"'; elif [ -f "backend/package.json" ]; then cat backend/package.json | grep -A 20 '"dependencies"'; fi)

══════════════════════════════════════════════════════════════

📦 DÉPENDANCES FRONTEND :

$(if [ -f "frontend/package.json" ]; then cat frontend/package.json | grep -A 20 '"dependencies"'; fi)

══════════════════════════════════════════════════════════════

⚙️  VERSIONS INSTALLÉES :

Node.js : $(node --version 2>/dev/null || echo "Non installé")
npm : $(npm --version 2>/dev/null || echo "Non installé")
Git : $(git --version 2>/dev/null || echo "Non installé")

══════════════════════════════════════════════════════════════

🗄️  SCHÉMA PRISMA :

$(if [ -f "prisma/schema.prisma" ]; then cat prisma/schema.prisma; elif [ -f "backend/prisma/schema.prisma" ]; then cat backend/prisma/schema.prisma; else echo "Non trouvé"; fi)

══════════════════════════════════════════════════════════════
EOF

echo "   ✅ Informations extraites"

# Étape 4 : Créer une copie du projet pour export
echo "4️⃣  Création d'une copie propre du projet..."

COPY_DIR="$EXPORT_DIR/${PROJECT_NAME}_CLEAN"

echo "   📁 Copie du projet..."
# Créer une copie complète en excluant les dossiers inutiles
rsync -a --exclude='node_modules' \
         --exclude='dist' \
         --exclude='build' \
         --exclude='.git' \
         --exclude='.next' \
         --exclude='.turbo' \
         --exclude='.cache' \
         --exclude='*.log' \
         --exclude="$EXPORT_DIR" \
         . "$COPY_DIR" 2>/dev/null || \
cp -r . "$COPY_DIR" 2>/dev/null

# Nettoyer la copie (pas l'original !)
cd "$COPY_DIR"
rm -rf node_modules backend/node_modules frontend/node_modules 2>/dev/null
rm -rf dist backend/dist frontend/dist frontend/build 2>/dev/null
rm -rf .next .turbo .cache 2>/dev/null
rm -rf *.log backend/*.log frontend/*.log 2>/dev/null
cd ../..

COPY_SIZE=$(du -sh "$COPY_DIR" 2>/dev/null | cut -f1 || echo "?")

echo "   ✅ Copie créée : $COPY_SIZE"
echo "   ℹ️  Votre projet original reste intact !"

# Étape 5 : Créer le fichier de configuration
echo "5️⃣  Création du fichier de configuration..."

cat > "$EXPORT_DIR/CONFIG.sh" << 'EOF'
#!/bin/bash

###############################################################################
#                                                                             #
#                    ⚙️  CONFIGURATION DU NOUVEAU PROJET                      #
#                                                                             #
#  🔧 REMPLISSEZ CE FICHIER AVANT D'EXÉCUTER LE SCRIPT D'IMPORT              #
#                                                                             #
###############################################################################

# ===== INFORMATIONS DU NOUVEAU PROJET =====
export NEW_PROJECT_NAME="mon-nouveau-projet"  # Nom du nouveau projet

# ===== GITHUB (Nouveau compte) =====
export NEW_GITHUB_USERNAME="nouveau-username"  # Votre nouveau username GitHub
export NEW_GITHUB_EMAIL="nouveau@email.com"    # Votre nouvel email GitHub

# ===== RAILWAY =====
# Note : Les infos Railway seront configurées manuellement via l'interface web

# ===== VERCEL =====
# Note : Les infos Vercel seront configurées manuellement via l'interface web

# ===== BASE DE DONNÉES =====
export NEW_DATABASE_URL=""  # À remplir après création Railway
# Format : postgresql://postgres:PASSWORD@HOST.railway.app:5432/railway

# ===== JWT & SÉCURITÉ =====
# Générer un nouveau secret avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
export NEW_JWT_SECRET=""  # Votre nouveau JWT secret

# ===== GÉOLOCALISATION (Si applicable) =====
export STORE_LATITUDE=""   # Ex: 5.353021
export STORE_LONGITUDE=""  # Ex: -3.870182
export STORE_NAME="Magasin Principal"
export STORE_ADDRESS="Votre adresse"

# ===== AUTRES VARIABLES =====
export NEW_PORT="3000"
export NEW_NODE_ENV="development"

###############################################################################
#                                                                             #
#  ✅ Après avoir rempli ce fichier, exécutez : bash 2-IMPORT-PROJET.sh      #
#                                                                             #
###############################################################################
EOF

chmod +x "$EXPORT_DIR/CONFIG.sh"
echo "   ✅ Fichier CONFIG.sh créé"

# Étape 6 : Créer les instructions
echo "6️⃣  Création des instructions..."

cat > "$EXPORT_DIR/README.md" << EOF
# 📦 Package de Duplication de Projet

## 🎯 Objectif

Ce package contient tout ce dont vous avez besoin pour dupliquer votre projet sur un autre ordinateur avec de nouveaux comptes GitHub, Railway et Vercel.

## 📁 Contenu du package

\`\`\`
PACKAGE_DUPLICATION_EXPORT/
├── README.md                    ← Vous êtes ici
├── CONFIG.sh                    ← À REMPLIR avant l'import
├── backend.env.EXAMPLE          ← Variables d'environnement backend
├── frontend.env.EXAMPLE         ← Variables d'environnement frontend
├── PROJECT_INFO.txt             ← Informations du projet source
└── 2-IMPORT-PROJET.sh           ← Script d'import (à exécuter sur le nouvel ordinateur)
\`\`\`

## 🚀 Étapes de duplication

### Sur l'ORDINATEUR SOURCE (actuel) ✅

1. ✅ Vous avez déjà exécuté \`1-EXPORT-PROJET.sh\`
2. ✅ Le dossier \`PACKAGE_DUPLICATION_EXPORT\` a été créé
3. 📦 **Transférez TOUT votre projet** sur le nouvel ordinateur :
   - Via clé USB
   - Via Cloud (Google Drive, Dropbox)
   - Via WeTransfer
   - Via Email (si petit)

### Sur le NOUVEL ORDINATEUR 🆕

#### Étape 1 : Prérequis (5 minutes)

Installer :
- **Node.js 18+** : https://nodejs.org
- **Git** : https://git-scm.com

Vérifier les installations :
\`\`\`bash
node --version  # Doit afficher v18.x ou plus
npm --version
git --version
\`\`\`

#### Étape 2 : Créer les comptes (10 minutes)

1. **GitHub** : https://github.com/signup
   - Créer un nouveau compte
   - Vérifier l'email
   - Noter le username

2. **Railway** : https://railway.app
   - Se connecter avec le nouvel email ou GitHub
   - Créer un nouveau projet
   - Provisionner PostgreSQL
   - Copier la \`DATABASE_URL\`

3. **Vercel** : https://vercel.com/signup
   - Se connecter avec le nouvel email ou GitHub
   - (Configuration détaillée après)

#### Étape 3 : Configurer le projet (2 minutes)

1. Ouvrir le fichier \`CONFIG.sh\`
2. Remplir TOUTES les variables :
   - \`NEW_PROJECT_NAME\`
   - \`NEW_GITHUB_USERNAME\`
   - \`NEW_GITHUB_EMAIL\`
   - \`NEW_DATABASE_URL\` (depuis Railway)
   - \`NEW_JWT_SECRET\` (générer un nouveau)
   - Coordonnées GPS (si applicable)

**Générer un JWT_SECRET** :
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

#### Étape 4 : Exécuter l'import (5 minutes)

\`\`\`bash
cd PACKAGE_DUPLICATION_EXPORT
bash 2-IMPORT-PROJET.sh
\`\`\`

Le script va :
- Créer les fichiers .env
- Installer les dépendances
- Configurer Git
- Appliquer les migrations Prisma
- Créer un utilisateur admin (si applicable)

#### Étape 5 : Pousser sur GitHub (2 minutes)

\`\`\`bash
# Créer le dépôt sur GitHub.com manuellement ou avec GitHub CLI
gh repo create mon-nouveau-projet --private

# Ou manuellement sur github.com puis :
git remote add origin https://github.com/VOTRE_USERNAME/mon-nouveau-projet.git
git branch -M main
git push -u origin main
\`\`\`

#### Étape 6 : Déployer sur Railway (5 minutes)

1. Railway > New > GitHub Repo
2. Connecter votre nouveau GitHub
3. Sélectionner le dépôt
4. Settings :
   - Root Directory : \`backend\` (si applicable)
   - Start Command : \`npm start\`
5. Variables :
   - DATABASE_URL : \`\${{Postgres.DATABASE_URL}}\`
   - JWT_SECRET : Votre secret
   - NODE_ENV : \`production\`
6. Generate Domain
7. Copier l'URL backend

#### Étape 7 : Déployer sur Vercel (5 minutes)

1. Vercel > Add New Project
2. Import Git Repository
3. Sélectionner votre dépôt
4. Settings :
   - Root Directory : \`frontend\` (si applicable)
   - Build Command : \`npm run build\`
   - Output Directory : \`dist\`
5. Environment Variables :
   - \`VITE_API_URL\` : URL Railway du backend
6. Deploy
7. Copier l'URL frontend

#### Étape 8 : Configurer CORS (2 minutes)

Dans \`backend/server.js\`, mettre à jour :
\`\`\`javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://votre-projet.vercel.app',  // ← URL Vercel
  ],
  credentials: true
}));
\`\`\`

Pousser sur GitHub :
\`\`\`bash
git add .
git commit -m "Configure CORS for production"
git push
\`\`\`

#### Étape 9 : Tester (5 minutes)

**En local** :
\`\`\`bash
# Terminal 1 : Backend
npm run dev

# Terminal 2 : Frontend
cd frontend
npm run dev
\`\`\`

Ouvrir http://localhost:5173

**En production** :
- Ouvrir l'URL Vercel
- Vérifier la connexion
- Vérifier l'API (F12 > Network)

## ✅ Checklist finale

- [ ] Node.js, npm, git installés
- [ ] Comptes GitHub, Railway, Vercel créés
- [ ] CONFIG.sh rempli
- [ ] 2-IMPORT-PROJET.sh exécuté
- [ ] Dépendances installées
- [ ] Migrations Prisma appliquées
- [ ] Code poussé sur GitHub
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] CORS configuré
- [ ] Tests locaux OK
- [ ] Tests production OK

## 🆘 Aide

### Erreur "npm install" échoue
\`\`\`bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
\`\`\`

### Erreur "Prisma Client not generated"
\`\`\`bash
npx prisma generate
npx prisma migrate deploy
\`\`\`

### Erreur CORS
Vérifier que l'URL Vercel est bien dans la config CORS du backend.

### GitHub demande un mot de passe
Utiliser un Personal Access Token :
1. GitHub > Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Cocher "repo"
4. Utiliser comme mot de passe

## 🎉 Succès !

Votre projet est maintenant dupliqué et fonctionnel ! 🚀

📊 URLs à noter :
- Frontend : https://votre-projet.vercel.app
- Backend : https://backend.railway.app
- GitHub : https://github.com/username/projet

EOF

echo "   ✅ README.md créé"

# Étape 7 : Créer le script d'import
echo "7️⃣  Création du script d'import..."

cat > "$EXPORT_DIR/2-IMPORT-PROJET.sh" << 'IMPORT_SCRIPT'
#!/bin/bash

###############################################################################
#                                                                             #
#           📥 SCRIPT 2 : IMPORT DU PROJET (NOUVEL ORDINATEUR)                #
#                                                                             #
#  À exécuter sur le nouvel ordinateur après avoir rempli CONFIG.sh          #
#                                                                             #
###############################################################################

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         📥 IMPORT ET CONFIGURATION DU PROJET                 ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Charger la configuration
if [ ! -f "CONFIG.sh" ]; then
    echo "❌ Erreur : Fichier CONFIG.sh non trouvé !"
    echo "   Assurez-vous d'être dans le dossier PACKAGE_DUPLICATION_EXPORT"
    exit 1
fi

source CONFIG.sh

# Vérifications
echo "🔍 Vérification de la configuration..."

if [ -z "$NEW_PROJECT_NAME" ]; then
    echo "❌ Erreur : NEW_PROJECT_NAME n'est pas défini dans CONFIG.sh"
    exit 1
fi

if [ -z "$NEW_GITHUB_USERNAME" ]; then
    echo "❌ Erreur : NEW_GITHUB_USERNAME n'est pas défini dans CONFIG.sh"
    exit 1
fi

if [ -z "$NEW_DATABASE_URL" ]; then
    echo "⚠️  Avertissement : NEW_DATABASE_URL n'est pas défini"
    echo "   Vous devrez le configurer manuellement plus tard"
fi

echo "✅ Configuration validée"
echo ""
echo "📋 Résumé :"
echo "   Projet : $NEW_PROJECT_NAME"
echo "   GitHub : $NEW_GITHUB_USERNAME"
echo ""

# Remonter au projet principal
cd ../..

# Étape 1 : Configuration Git
echo "1️⃣  Configuration de Git..."
git config user.name "$NEW_GITHUB_USERNAME"
git config user.email "$NEW_GITHUB_EMAIL"
echo "   ✅ Git configuré"

# Étape 2 : Créer les fichiers .env
echo "2️⃣  Création des fichiers .env..."

# Backend .env
if [ -f "PACKAGE_DUPLICATION_EXPORT/backend.env.EXAMPLE" ]; then
    cat > backend/.env << ENV_BACKEND
# Database
DATABASE_URL="${NEW_DATABASE_URL}"

# JWT
JWT_SECRET="${NEW_JWT_SECRET}"

# Server
PORT=${NEW_PORT}
NODE_ENV=${NEW_NODE_ENV}

# Géolocalisation (si applicable)
STORE_LATITUDE=${STORE_LATITUDE}
STORE_LONGITUDE=${STORE_LONGITUDE}
ENV_BACKEND
    echo "   ✅ backend/.env créé"
elif [ -f "PACKAGE_DUPLICATION_EXPORT/backend.env.EXAMPLE" ]; then
    cat > .env << ENV_ROOT
# Database
DATABASE_URL="${NEW_DATABASE_URL}"

# JWT
JWT_SECRET="${NEW_JWT_SECRET}"

# Server
PORT=${NEW_PORT}
NODE_ENV=${NEW_NODE_ENV}
ENV_ROOT
    echo "   ✅ .env créé"
fi

# Frontend .env
if [ -f "PACKAGE_DUPLICATION_EXPORT/frontend.env.EXAMPLE" ]; then
    cat > frontend/.env << ENV_FRONTEND
# API URL
VITE_API_URL=http://localhost:${NEW_PORT}
ENV_FRONTEND
    echo "   ✅ frontend/.env créé"
fi

# Étape 3 : Installer les dépendances
echo "3️⃣  Installation des dépendances..."

# Backend
if [ -f "package.json" ]; then
    echo "   📦 Installation backend..."
    npm install
elif [ -f "backend/package.json" ]; then
    echo "   📦 Installation backend..."
    cd backend && npm install && cd ..
fi

# Frontend
if [ -f "frontend/package.json" ]; then
    echo "   📦 Installation frontend..."
    cd frontend && npm install && cd ..
fi

echo "   ✅ Dépendances installées"

# Étape 4 : Prisma
echo "4️⃣  Configuration de Prisma..."

if [ -f "prisma/schema.prisma" ] || [ -f "backend/prisma/schema.prisma" ]; then
    if [ -f "backend/prisma/schema.prisma" ]; then
        cd backend
    fi
    
    echo "   🔨 Génération du client Prisma..."
    npx prisma generate
    
    if [ ! -z "$NEW_DATABASE_URL" ]; then
        echo "   🔨 Application des migrations..."
        npx prisma migrate deploy || npx prisma migrate dev --name init
        echo "   ✅ Migrations appliquées"
    else
        echo "   ⚠️  DATABASE_URL non définie, migrations ignorées"
    fi
    
    if [ -f "backend/prisma/schema.prisma" ]; then
        cd ..
    fi
else
    echo "   ⚠️  Prisma non détecté, étape ignorée"
fi

# Étape 5 : Créer un utilisateur admin (optionnel)
echo "5️⃣  Création d'un utilisateur admin..."

if [ ! -z "$NEW_DATABASE_URL" ]; then
    cat > scripts/create-admin-temp.js << 'ADMIN_SCRIPT'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        nom: 'Admin',
        prenom: 'Super',
        password: hashedPassword,
        role: 'ADMIN',
        telephone: '0000000000',
      },
    });
    
    console.log('✅ Utilisateur admin créé');
    console.log('   Email: admin@example.com');
    console.log('   Mot de passe: admin123');
    console.log('   ⚠️  Changez ce mot de passe en production !');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Admin existe déjà');
    } else {
      console.log('⚠️  Impossible de créer l\'admin:', error.message);
    }
  }
}

createAdmin()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
ADMIN_SCRIPT

    node scripts/create-admin-temp.js 2>/dev/null || echo "   ⚠️  Création admin ignorée (normal si pas de système d'auth)"
    rm -f scripts/create-admin-temp.js
else
    echo "   ⚠️  DATABASE_URL non définie, création admin ignorée"
fi

# Étape 6 : Configuration de la géolocalisation
if [ ! -z "$STORE_LATITUDE" ] && [ ! -z "$STORE_LONGITUDE" ]; then
    echo "6️⃣  Configuration de la géolocalisation..."
    
    cat > scripts/setup-store-temp.js << STORE_SCRIPT
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupStore() {
  try {
    const config = await prisma.storeConfig.upsert({
      where: { id: 1 },
      update: {
        nom: '${STORE_NAME}',
        adresse: '${STORE_ADDRESS}',
        latitude: parseFloat('${STORE_LATITUDE}'),
        longitude: parseFloat('${STORE_LONGITUDE}'),
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
      },
      create: {
        nom: '${STORE_NAME}',
        adresse: '${STORE_ADDRESS}',
        latitude: parseFloat('${STORE_LATITUDE}'),
        longitude: parseFloat('${STORE_LONGITUDE}'),
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
      },
    });
    
    console.log('✅ Configuration géolocalisation créée');
  } catch (error) {
    console.log('⚠️  Erreur:', error.message);
  }
}

setupStore()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
STORE_SCRIPT

    node scripts/setup-store-temp.js 2>/dev/null || echo "   ⚠️  Configuration géolocalisation ignorée"
    rm -f scripts/setup-store-temp.js
fi

# Étape 7 : Initialiser Git
echo "7️⃣  Initialisation de Git..."
if [ -d ".git" ]; then
    echo "   ⚠️  Dépôt Git existant détecté, nettoyage..."
    rm -rf .git
fi

git init
git add .
git commit -m "Initial commit - Project duplicated from $PROJECT_NAME"
echo "   ✅ Git initialisé"

# Résumé final
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║            ✅ IMPORT TERMINÉ AVEC SUCCÈS !                   ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1️⃣  Créer le dépôt sur GitHub :"
echo "   → Aller sur https://github.com/new"
echo "   → Nom : $NEW_PROJECT_NAME"
echo "   → Privé recommandé"
echo "   → Ne PAS ajouter README/gitignore"
echo ""
echo "   Puis exécuter :"
echo "   git remote add origin https://github.com/$NEW_GITHUB_USERNAME/$NEW_PROJECT_NAME.git"
echo "   git push -u origin main"
echo ""
echo "2️⃣  Déployer le backend sur Railway :"
echo "   → https://railway.app"
echo "   → New Project > GitHub Repo"
echo "   → Configurer les variables d'environnement"
echo "   → Generate Domain"
echo ""
echo "3️⃣  Déployer le frontend sur Vercel :"
echo "   → https://vercel.com"
echo "   → Add New Project > Import Git Repository"
echo "   → Configurer VITE_API_URL avec l'URL Railway"
echo ""
echo "4️⃣  Tester en local :"
echo "   npm run dev"
echo "   cd frontend && npm run dev"
echo ""
echo "📖 Consultez PACKAGE_DUPLICATION_EXPORT/README.md pour plus de détails"
echo ""
echo "🎉 Bon développement !"
echo ""
IMPORT_SCRIPT

chmod +x "$EXPORT_DIR/2-IMPORT-PROJET.sh"
echo "   ✅ Script d'import créé"

# Résumé final
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║            ✅ EXPORT TERMINÉ AVEC SUCCÈS !                   ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📦 Package créé dans : $EXPORT_DIR/"
echo ""
echo "📋 Contenu :"
ls -lh "$EXPORT_DIR" | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
echo ""
echo "✅ Votre projet ORIGINAL reste INTACT (rien n'a été supprimé !)"
echo "📁 Une copie propre a été créée dans : $EXPORT_DIR/${PROJECT_NAME}_CLEAN/"
echo ""
echo "📤 Prochaines étapes :"
echo ""
echo "1️⃣  Transférer le dossier $EXPORT_DIR sur le nouvel ordinateur"
echo "   Méthodes : USB, Cloud (Drive/Dropbox), WeTransfer, Email"
echo ""
echo "2️⃣  Sur le NOUVEL ordinateur :"
echo "   a) Extraire le dossier $EXPORT_DIR"
echo "   b) Installer Node.js, npm, git"
echo "   c) Créer les comptes GitHub, Railway, Vercel"
echo "   d) Ouvrir $EXPORT_DIR/CONFIG.sh"
echo "   e) Remplir TOUTES les variables"
echo "   f) Ouvrir le dossier ${PROJECT_NAME}_CLEAN/"
echo "   g) Exécuter : bash ../2-IMPORT-PROJET.sh"
echo ""
echo "💡 ASTUCE : Créer une archive ZIP pour faciliter le transfert :"
echo "   zip -r ${PROJECT_NAME}_export.zip $EXPORT_DIR"
echo ""
echo "📖 Consultez $EXPORT_DIR/README.md pour le guide complet"
echo ""
echo "🚀 Bonne duplication !"
echo ""

