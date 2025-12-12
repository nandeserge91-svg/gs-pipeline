# 🚀 Guide de Démarrage - GS Pipeline (Configuration Locale)

## ✅ Configuration Terminée

Votre application a été configurée avec succès pour fonctionner en local avec Docker !

## 📋 Résumé des Modifications

### 1. **Nettoyage des Anciennes Références**
- ❌ Suppression des références Railway (ancienne base de données)
- ❌ Suppression des références Vercel (ancien déploiement)
- ✅ Configuration pour développement local uniquement

### 2. **Base de Données PostgreSQL**
- 🐳 Docker Compose configuré et en cours d'exécution
- 📦 Conteneur : `gs-pipeline-db`
- 🔌 Port : `5433` (localhost)
- 📊 Base de données : `gs_pipeline`
- 👤 Utilisateur : `postgres`
- 🔑 Mot de passe : `postgres`

### 3. **Migrations Appliquées**
Toutes les 12 migrations ont été appliquées avec succès :
- ✅ Tables utilisateurs, commandes, produits
- ✅ Gestion des livraisons et tournées
- ✅ Système de stock et mouvements
- ✅ Expéditions et express
- ✅ Notifications et RDV

### 4. **Données de Test Créées**
**Comptes utilisateurs** (tous avec le mot de passe : `admin123`) :
- 👨‍💼 **Admin** : `admin@gs-pipeline.com`
- 👨‍💼 **Gestionnaire** : `gestionnaire@gs-pipeline.com`
- 📦 **Gestionnaire Stock** : `stock@gs-pipeline.com`
- 📞 **Appelant** : `appelant@gs-pipeline.com`
- 🚚 **Livreur** : `livreur@gs-pipeline.com`

**Produits de test** :
- ⌚ Montre Connectée Pro (MON-001) - Stock : 50 unités - 599 DH
- 🎧 Écouteurs Sans Fil (ECO-001) - Stock : 100 unités - 199 DH
- 🔋 Batterie Externe 20000mAh (POW-001) - Stock : 75 unités - 149 DH

**Commandes de test** :
- 2 commandes créées pour tester le système

## 🌐 URLs de l'Application

- **Backend API** : http://localhost:5000
- **Frontend** : http://localhost:5173
- **Prisma Studio** (optionnel) : `npm run prisma:studio`

## 🚀 Comment Démarrer l'Application

### Démarrage Complet

```powershell
# 1. Démarrer Docker (si pas déjà fait)
docker-compose up -d

# 2. Démarrer le Backend (dans un terminal)
npm run dev

# 3. Démarrer le Frontend (dans un autre terminal)
cd frontend
npm run dev
```

### Vérifier que tout fonctionne

```powershell
# Vérifier Docker
docker ps

# Vérifier le Backend
curl http://localhost:5000

# Ouvrir le Frontend dans le navigateur
start http://localhost:5173
```

## 🔧 Commandes Utiles

### Docker
```powershell
# Démarrer PostgreSQL
docker-compose up -d

# Arrêter PostgreSQL
docker-compose down

# Voir les logs
docker logs gs-pipeline-db

# Accéder à la base de données
docker exec -it gs-pipeline-db psql -U postgres -d gs_pipeline
```

### Backend
```powershell
# Démarrer en mode développement
npm run dev

# Voir le schéma de la base de données
npm run prisma:studio

# Créer une nouvelle migration
npm run prisma:migrate

# Réinitialiser la base de données
npm run prisma:reset
```

### Frontend
```powershell
cd frontend

# Démarrer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure des Fichiers de Configuration

```
GS cursor/
├── .env                    # Configuration backend (DATABASE_URL, JWT_SECRET)
├── docker-compose.yml      # Configuration Docker PostgreSQL
├── package.json            # Dépendances backend
├── server.js              # Serveur Express
├── prisma/
│   ├── schema.prisma      # Schéma de base de données
│   └── migrations/        # Migrations SQL
└── frontend/
    ├── .env               # Configuration frontend (VITE_API_URL)
    └── package.json       # Dépendances frontend
```

## 🔐 Connexion à l'Application

1. Ouvrez votre navigateur : http://localhost:5173
2. Connectez-vous avec un des comptes de test :
   - Email : `admin@gs-pipeline.com`
   - Mot de passe : `admin123`

## 🎯 Fonctionnalités Principales

### Pour l'Admin
- Gestion complète des utilisateurs
- Vue d'ensemble des statistiques
- Gestion des produits et du stock
- Accès à toutes les commandes
- Comptabilité et rapports

### Pour le Gestionnaire
- Validation des commandes
- Assignation des livreurs
- Gestion des tournées
- Suivi des expéditions EXPRESS

### Pour le Gestionnaire Stock
- Gestion du stock des produits
- Suivi des tournées (remise/retour de colis)
- Mouvements de stock

### Pour l'Appelant
- Appel des clients
- Validation des commandes
- Gestion des RDV
- Statistiques personnelles

### Pour le Livreur
- Vue de ses tournées
- Mise à jour du statut des livraisons
- Gestion des retours

## 🐛 Dépannage

### Le backend ne démarre pas
```powershell
# Vérifier que PostgreSQL est en cours d'exécution
docker ps

# Redémarrer Docker
docker-compose restart

# Vérifier les logs
docker logs gs-pipeline-db
```

### Erreur de connexion à la base de données
```powershell
# Attendre que PostgreSQL soit prêt
docker exec gs-pipeline-db pg_isready -U postgres

# Vérifier le fichier .env
Get-Content .env
```

### Le frontend ne se connecte pas au backend
- Vérifiez que le backend est bien démarré sur le port 5000
- Vérifiez le fichier `frontend/.env` : `VITE_API_URL=http://localhost:5000`

## 📝 Variables d'Environnement

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

## 🎉 Prochaines Étapes

1. **Tester l'application** : Connectez-vous et explorez les différentes fonctionnalités
2. **Personnaliser** : Modifiez les données de test selon vos besoins
3. **Développer** : Ajoutez de nouvelles fonctionnalités
4. **Déployer** : Quand vous serez prêt, configurez un déploiement en production

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs du backend et du frontend
2. Consultez les logs Docker : `docker logs gs-pipeline-db`
3. Vérifiez que tous les services sont en cours d'exécution

---

**Bon développement ! 🚀**


