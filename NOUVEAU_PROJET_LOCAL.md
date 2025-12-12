# 🎉 Nouveau Projet Local - GS Pipeline

## ✅ Configuration Terminée avec Succès !

Votre application a été **complètement réinitialisée** et configurée en local, sans aucune référence à Railway.

---

## 📊 État Actuel

### Services Actifs
- ✅ **PostgreSQL** : Port 5432 (Docker)
- ✅ **Backend API** : Port 5000 (http://localhost:5000)
- ✅ **Frontend** : Port 3000 (http://localhost:3000)

### Base de Données
- **Nom** : `gs_pipeline`
- **Utilisateur** : `postgres`
- **Mot de passe** : `postgres`
- **Port** : 5432
- **Host** : localhost

### Données Créées
- 👥 **5 utilisateurs** (Admin, Gestionnaire, Stock, Appelant, Livreur)
- 📦 **3 produits** avec stock initial
- 📋 **2 commandes** de test

---

## 🔐 Comptes de Connexion

**Tous les comptes utilisent le mot de passe : `admin123`**

| Rôle | Email | Accès |
|------|-------|-------|
| 👨‍💼 **Admin** | `admin@gs-pipeline.com` | Toutes les fonctionnalités |
| 👨‍💼 **Gestionnaire** | `gestionnaire@gs-pipeline.com` | Validation, assignation, tournées |
| 📦 **Gestionnaire Stock** | `stock@gs-pipeline.com` | Gestion stock et produits |
| 📞 **Appelant** | `appelant@gs-pipeline.com` | Appels clients, validation |
| 🚚 **Livreur** | `livreur@gs-pipeline.com` | Ses tournées et livraisons |

---

## 🌐 Accès à l'Application

**URL Frontend** : http://localhost:3000

1. Ouvrez votre navigateur
2. Allez sur http://localhost:3000
3. Connectez-vous avec un des comptes ci-dessus

---

## 🚀 Commandes Utiles

### Démarrer l'Application

```powershell
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Arrêter l'Application

```powershell
# Arrêter les serveurs Node.js
.\stop-app.ps1

# OU manuellement
Get-Process -Name node | Stop-Process -Force
```

### Gérer Docker

```powershell
# Voir les conteneurs actifs
docker ps

# Arrêter PostgreSQL
docker-compose down

# Démarrer PostgreSQL
docker-compose up -d

# Voir les logs
docker logs gs-pipeline-db -f
```

### Base de Données

```powershell
# Accéder à la base de données
docker exec -it gs-pipeline-db psql -U postgres -d gs_pipeline

# Interface graphique
npm run prisma:studio

# Réinitialiser la base de données
npm run prisma:reset
```

---

## 📦 Produits de Test

| Code | Nom | Prix | Stock |
|------|-----|------|-------|
| MON-001 | Montre Connectée Pro | 599 DH | 50 |
| ECO-001 | Écouteurs Sans Fil | 199 DH | 100 |
| POW-001 | Batterie Externe 20000mAh | 149 DH | 75 |

---

## 🎯 Fonctionnalités Principales

### Pour l'Admin
- ✅ Gestion complète des utilisateurs
- ✅ Vue d'ensemble des statistiques
- ✅ Gestion des produits et du stock
- ✅ Accès à toutes les commandes
- ✅ Comptabilité et rapports

### Pour le Gestionnaire
- ✅ Validation des commandes
- ✅ Assignation des livreurs
- ✅ Création des tournées
- ✅ Gestion des expéditions EXPRESS

### Pour le Gestionnaire Stock
- ✅ Gestion du stock des produits
- ✅ Suivi des tournées (remise/retour)
- ✅ Mouvements de stock
- ✅ Alertes de stock

### Pour l'Appelant
- ✅ Appel des clients
- ✅ Validation des commandes
- ✅ Gestion des RDV
- ✅ Statistiques personnelles

### Pour le Livreur
- ✅ Vue de ses tournées
- ✅ Mise à jour des livraisons
- ✅ Gestion des retours
- ✅ Statistiques

---

## 📁 Structure du Projet

```
GS cursor/
├── .env                    # Configuration backend ✅
├── docker-compose.yml      # Configuration PostgreSQL
├── package.json            # Dépendances backend
├── server.js              # Serveur Express
├── config/
│   └── prisma.js          # Configuration Prisma centralisée ✅
├── routes/                # Routes API
├── middlewares/           # Middlewares Express
├── prisma/
│   ├── schema.prisma      # Schéma de BDD
│   ├── seed.js           # Données de test
│   └── migrations/        # Migrations SQL
└── frontend/
    ├── .env               # Configuration frontend
    ├── package.json
    └── src/              # Code React
```

---

## 🔧 Modifications Effectuées

### Nettoyage Complet
- ❌ Supprimé toutes les références Railway
- ❌ Supprimé toutes les références Vercel
- ❌ Supprimé `vercel.json`
- ❌ Nettoyé `package.json`

### Nouvelle Configuration
- ✅ Base de données locale PostgreSQL (Docker)
- ✅ Port 5432 (standard PostgreSQL)
- ✅ Configuration centralisée Prisma (`config/prisma.js`)
- ✅ Fichiers `.env` créés
- ✅ CORS configuré pour local uniquement

### Fichiers Créés/Modifiés
- ✅ `.env` - Configuration backend
- ✅ `frontend/.env` - Configuration frontend
- ✅ `config/prisma.js` - Config Prisma centralisée
- ✅ `server.js` - dotenv chargé en premier
- ✅ Toutes les routes - Utilisent `config/prisma.js`
- ✅ `docker-compose.yml` - Port 5432

---

## 🐛 Dépannage

### Le backend ne démarre pas

```powershell
# Vérifier que PostgreSQL est actif
docker ps

# Redémarrer PostgreSQL
docker-compose restart

# Vérifier les logs
docker logs gs-pipeline-db
```

### Le frontend ne se connecte pas

```powershell
# Vérifier le fichier .env
Get-Content frontend\.env

# Doit contenir :
# VITE_API_URL=http://localhost:5000
```

### Erreur de connexion à la base de données

```powershell
# Vérifier la connexion
docker exec gs-pipeline-db psql -U postgres -c "SELECT version();"

# Régénérer le client Prisma
Remove-Item -Recurse -Force node_modules\.prisma
npm install
```

### Port déjà utilisé

```powershell
# Trouver le processus
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Arrêter le processus
Stop-Process -Id <ID> -Force
```

---

## 🔄 Réinitialiser Complètement

Si vous voulez tout recommencer :

```powershell
# 1. Arrêter tout
Get-Process -Name node | Stop-Process -Force
docker-compose down -v

# 2. Nettoyer
Remove-Item -Recurse -Force node_modules\.prisma

# 3. Redémarrer
docker-compose up -d
npm install
npm run prisma:seed
npm run dev
```

---

## 📚 Documentation

- `README.md` - Documentation principale
- `NOUVEAU_DEMARRAGE.md` - Guide détaillé des fonctionnalités
- `CORRECTION_CONNEXION.md` - Guide de dépannage
- `SYNTHESE_CONFIGURATION.txt` - Détails techniques

---

## ✅ Checklist de Vérification

- [✅] Docker installé et démarré
- [✅] PostgreSQL en cours (port 5432)
- [✅] Base de données créée (gs_pipeline)
- [✅] Schéma appliqué
- [✅] Données de test insérées
- [✅] Fichiers .env créés
- [✅] Backend démarré (port 5000)
- [✅] Frontend accessible (port 3000)
- [✅] Connexion API testée ✅
- [✅] Application opérationnelle ✅

---

## 🎉 Félicitations !

Votre application GS Pipeline est maintenant **100% locale** et prête à être utilisée !

**Accédez à l'application** : http://localhost:3000

**Bon développement ! 🚀**

