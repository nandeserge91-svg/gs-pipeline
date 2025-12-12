# 📦 GS Pipeline - Application de Gestion

> Système complet de gestion de commandes e-commerce avec pipeline de traitement

## 🚀 Démarrage Rapide

### En Local (Développement)

```powershell
# 1. Démarrer PostgreSQL
docker-compose up -d

# 2. Installer les dépendances
npm install
cd frontend && npm install && cd ..

# 3. Créer la base de données
npx prisma db push
npm run prisma:seed

# 4. Démarrer
npm run dev              # Backend (port 5000)
cd frontend && npm run dev   # Frontend (port 3000)
```

### En Production

📖 **Voir** : `DEPLOIEMENT_RAPIDE.md` (10 minutes)

```
1. GitHub   → Pousser le code
2. Railway  → Backend + PostgreSQL
3. Vercel   → Frontend
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **`DEPLOIEMENT_RAPIDE.md`** ⭐ | Guide en 3 étapes (10 min) |
| **`GUIDE_DEPLOIEMENT.md`** | Guide complet détaillé |
| **`NOUVEAU_PROJET_LOCAL.md`** | Configuration locale |
| **`NOUVEAU_DEMARRAGE.md`** | Fonctionnalités |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│         Vite + TypeScript               │
│         Ports: 3000/5173                │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│         Backend (Node.js)               │
│       Express + Prisma ORM              │
│           Port: 5000                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      PostgreSQL Database                │
│           Port: 5432                    │
└─────────────────────────────────────────┘
```

---

## 🔐 Comptes par Défaut

Mot de passe : `admin123` (⚠️ À changer en production !)

| Rôle | Email |
|------|-------|
| 👨‍💼 Admin | `admin@gs-pipeline.com` |
| 👨‍💼 Gestionnaire | `gestionnaire@gs-pipeline.com` |
| 📦 Gestionnaire Stock | `stock@gs-pipeline.com` |
| 📞 Appelant | `appelant@gs-pipeline.com` |
| 🚚 Livreur | `livreur@gs-pipeline.com` |

---

## 🎯 Fonctionnalités Principales

### Gestion des Commandes
- ✅ Réception automatique depuis le site web
- ✅ Appel clients et validation
- ✅ Assignation aux livreurs
- ✅ Suivi en temps réel
- ✅ Gestion des retours

### Gestion du Stock
- ✅ Inventaire produits
- ✅ Mouvements de stock
- ✅ Alertes de stock faible
- ✅ Suivi des tournées

### Types de Livraison
- 🚚 **Locale** : Livraison standard
- 📦 **Expédition** : Paiement 100% avant envoi
- ⚡ **Express** : Paiement 10% + retrait en agence

### Rapports & Statistiques
- 📊 Dashboard avec KPIs
- 📈 Statistiques par utilisateur
- 💰 Comptabilité et revenus
- 📅 Exports Excel

---

## 🛠️ Technologies

### Backend
- Node.js 18+
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand

---

## 📦 Scripts Disponibles

### Backend
```powershell
npm run dev              # Développement
npm start                # Production
npm run prisma:studio    # Interface BDD
npm run prisma:seed      # Données de test
```

### Frontend
```powershell
cd frontend
npm run dev              # Développement
npm run build            # Build production
npm run preview          # Preview build
```

---

## 🔄 Workflow de Développement

1. **Développement Local**
   ```powershell
   npm run dev
   cd frontend && npm run dev
   ```

2. **Commit & Push**
   ```powershell
   git add .
   git commit -m "Feature: Nouvelle fonctionnalité"
   git push
   ```

3. **Déploiement Automatique**
   - ✅ Railway déploie le backend
   - ✅ Vercel déploie le frontend

---

## 🌐 URLs

### Développement Local
- Frontend : http://localhost:3000
- Backend : http://localhost:5000
- Prisma Studio : http://localhost:5555

### Production (Après déploiement)
- Frontend : https://votre-app.vercel.app
- Backend : https://votre-app.railway.app

---

## 🔧 Configuration

### Variables d'Environnement

**Backend (.env)** :
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGINS=https://...
```

**Frontend (frontend/.env)** :
```env
VITE_API_URL=https://...
```

---

## 🐛 Dépannage

### Problème de connexion BDD
```powershell
docker-compose restart
npx prisma generate
```

### Erreur CORS
Vérifier `CORS_ORIGINS` dans `.env` backend

### Frontend ne charge pas
Vérifier `VITE_API_URL` dans `frontend/.env`

---

## 📞 Support

- 📖 Documentation complète dans `/docs`
- 🐛 Issues : GitHub Issues
- 📧 Email : support@votre-domaine.com

---

## 📄 Licence

ISC License - Usage privé

---

## 👥 Contributeurs

- Développeur Principal : [Votre Nom]
- Projet : GS Pipeline
- Version : 1.0.0

---

**Créé avec ❤️ pour la gestion d'entreprise**

