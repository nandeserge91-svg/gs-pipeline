# 📦 Installation et Configuration - GS Pipeline

## ✅ Ce qui a été fait

Votre application a été **complètement nettoyée et reconfigurée** pour fonctionner en local :

1. ✅ Suppression de toutes les références à Railway (ancienne base de données cloud)
2. ✅ Suppression de toutes les références à Vercel (ancien déploiement)
3. ✅ Configuration de Docker avec PostgreSQL
4. ✅ Création d'une nouvelle base de données locale
5. ✅ Application de toutes les migrations (12 migrations)
6. ✅ Insertion des données de test (5 utilisateurs, 3 produits, 2 commandes)
7. ✅ Configuration des fichiers .env pour backend et frontend

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)

```powershell
# Démarrer l'application complète
.\start-app.ps1
```

Ce script va :
- Vérifier Docker
- Démarrer PostgreSQL
- Lancer le backend (port 5000)
- Lancer le frontend (port 5173)
- Ouvrir automatiquement votre navigateur

### Option 2 : Démarrage Manuel

#### Terminal 1 - Backend
```powershell
npm run dev
```

#### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

#### Terminal 3 - Vérification
```powershell
# Vérifier que tout fonctionne
curl http://localhost:5000
```

## 🌐 Accéder à l'Application

Une fois démarré, ouvrez votre navigateur :

**Frontend** : http://localhost:5173

**Comptes de test** (mot de passe : `admin123` pour tous) :
- 👨‍💼 Admin : `admin@gs-pipeline.com`
- 👨‍💼 Gestionnaire : `gestionnaire@gs-pipeline.com`
- 📦 Gestionnaire Stock : `stock@gs-pipeline.com`
- 📞 Appelant : `appelant@gs-pipeline.com`
- 🚚 Livreur : `livreur@gs-pipeline.com`

## 🛑 Arrêter l'Application

### Option 1 : Script Automatique
```powershell
.\stop-app.ps1
```

### Option 2 : Manuel
- Appuyez sur `Ctrl+C` dans chaque terminal (backend et frontend)
- Pour arrêter PostgreSQL : `docker-compose down`

## 📊 État des Services

### Vérifier que tout fonctionne

```powershell
# Docker PostgreSQL
docker ps

# Backend
curl http://localhost:5000

# Frontend
start http://localhost:5173
```

### Résultat attendu

```
CONTAINER ID   IMAGE         PORTS                    NAMES
f857b4c5fd5f   postgres:14   0.0.0.0:5433->5432/tcp   gs-pipeline-db
```

## 🗄️ Base de Données

### Informations de connexion
- **Host** : localhost
- **Port** : 5433
- **Database** : gs_pipeline
- **User** : postgres
- **Password** : postgres

### Accéder à la base de données

```powershell
# Via Docker
docker exec -it gs-pipeline-db psql -U postgres -d gs_pipeline

# Via Prisma Studio (interface graphique)
npm run prisma:studio
```

### Commandes SQL utiles

```sql
-- Lister les tables
\dt

-- Voir les utilisateurs
SELECT id, email, nom, prenom, role FROM users;

-- Voir les produits
SELECT id, code, nom, "stockActuel" FROM products;

-- Voir les commandes
SELECT id, "clientNom", "produitNom", status FROM orders;
```

## 📁 Structure du Projet

```
GS cursor/
├── 📄 .env                          # Config backend (NE PAS COMMITER)
├── 📄 docker-compose.yml            # Configuration PostgreSQL
├── 📄 package.json                  # Dépendances backend
├── 📄 server.js                     # Serveur Express
├── 📄 start-app.ps1                 # Script de démarrage
├── 📄 stop-app.ps1                  # Script d'arrêt
├── 📄 NOUVEAU_DEMARRAGE.md          # Guide détaillé
├── 📄 README_INSTALLATION.md        # Ce fichier
│
├── 📁 routes/                       # Routes API
│   ├── auth.routes.js
│   ├── order.routes.js
│   ├── delivery.routes.js
│   ├── product.routes.js
│   ├── stock.routes.js
│   └── ...
│
├── 📁 prisma/                       # Base de données
│   ├── schema.prisma                # Schéma de la BDD
│   ├── seed.js                      # Données de test
│   └── migrations/                  # Migrations SQL
│
└── 📁 frontend/                     # Application React
    ├── 📄 .env                      # Config frontend (NE PAS COMMITER)
    ├── 📄 package.json
    ├── 📄 vite.config.ts
    └── 📁 src/
        ├── pages/                   # Pages de l'application
        ├── components/              # Composants React
        ├── lib/                     # API client
        └── store/                   # State management
```

## 🔧 Commandes Utiles

### Docker
```powershell
# Démarrer PostgreSQL
docker-compose up -d

# Arrêter PostgreSQL
docker-compose down

# Voir les logs
docker logs gs-pipeline-db -f

# Redémarrer
docker-compose restart

# Supprimer complètement (⚠️ PERTE DE DONNÉES)
docker-compose down -v
```

### Backend
```powershell
# Développement avec rechargement automatique
npm run dev

# Production
npm start

# Générer le client Prisma
npm run prisma:generate

# Voir la base de données (interface graphique)
npm run prisma:studio

# Réinitialiser la base de données
npm run prisma:reset
```

### Frontend
```powershell
cd frontend

# Développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

## 🐛 Résolution de Problèmes

### Le backend ne démarre pas

**Erreur** : `Error: P1000: Authentication failed`

**Solution** :
```powershell
# Vérifier que PostgreSQL est démarré
docker ps

# Redémarrer PostgreSQL
docker-compose restart

# Attendre 10 secondes et réessayer
Start-Sleep -Seconds 10
npm run dev
```

### Le frontend ne se connecte pas au backend

**Vérifier** :
1. Le backend est bien démarré : `curl http://localhost:5000`
2. Le fichier `frontend/.env` contient : `VITE_API_URL=http://localhost:5000`
3. Redémarrer le frontend : `cd frontend; npm run dev`

### Port déjà utilisé

**Erreur** : `Port 5000 is already in use`

**Solution** :
```powershell
# Trouver le processus qui utilise le port
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Arrêter le processus
Stop-Process -Id <ID_DU_PROCESSUS> -Force
```

### Docker ne démarre pas

**Solution** :
1. Vérifier que Docker Desktop est installé et démarré
2. Redémarrer Docker Desktop
3. Vérifier les ressources disponibles (RAM, CPU)

### Base de données corrompue

**Solution** :
```powershell
# Réinitialiser complètement la base de données
docker-compose down -v
docker-compose up -d
Start-Sleep -Seconds 10

# Réappliquer les migrations manuellement
Get-Content prisma\migrations\20251204213821_init\migration.sql | docker exec -i gs-pipeline-db psql -U postgres -d gs_pipeline
# ... (répéter pour chaque migration)

# Ou utiliser le script de seed
npm run prisma:seed
```

## 📝 Fichiers de Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/gs_pipeline
JWT_SECRET=gs_pipeline_jwt_secret_key_2024_change_in_production_123456789
MAKE_API_KEY=your_make_api_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (frontend/.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🔐 Sécurité

⚠️ **IMPORTANT** :
- Les mots de passe par défaut (`admin123`) sont pour le développement uniquement
- Changez-les avant de déployer en production
- Ne commitez JAMAIS les fichiers `.env` dans Git
- Utilisez des mots de passe forts en production

## 🎯 Prochaines Étapes

1. **Tester l'application** : Connectez-vous et explorez toutes les fonctionnalités
2. **Personnaliser les données** : Ajoutez vos propres produits et utilisateurs
3. **Développer** : Ajoutez de nouvelles fonctionnalités selon vos besoins
4. **Déployer** : Quand vous serez prêt, configurez un déploiement en production

## 📚 Documentation Supplémentaire

- `NOUVEAU_DEMARRAGE.md` - Guide détaillé avec toutes les fonctionnalités
- `README.md` - Documentation originale du projet
- `GUIDE_*.md` - Guides spécifiques pour chaque fonctionnalité

## 💡 Conseils

- Utilisez `npm run prisma:studio` pour visualiser et modifier la base de données facilement
- Consultez les logs du backend pour déboguer les erreurs
- Utilisez les DevTools du navigateur pour déboguer le frontend
- Gardez Docker Desktop ouvert pendant le développement

## 🆘 Besoin d'Aide ?

Si vous rencontrez un problème :
1. Vérifiez les logs : `docker logs gs-pipeline-db`
2. Vérifiez que tous les services sont démarrés : `docker ps`
3. Consultez la section "Résolution de Problèmes" ci-dessus
4. Redémarrez tout : `.\stop-app.ps1` puis `.\start-app.ps1`

---

**Bon développement ! 🚀**


