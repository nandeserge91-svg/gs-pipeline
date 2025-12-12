# ✅ CHECKLIST FINALE DE DÉPLOIEMENT

## ÉTAPES COMPLÉTÉES

- [x] ✅ **ÉTAPE 1 - GITHUB**
  - Code poussé sur : https://github.com/nandeserge91-svg/gs-pipeline
  - Branch : main

---

## ÉTAPES EN COURS

### 📋 ÉTAPE 2 - RAILWAY (Backend + Database)

- [x] Compte créé / connecté
- [x] Projet créé depuis GitHub
- [x] PostgreSQL ajouté
- [x] Variables d'environnement configurées
- [x] Domain généré : `gs-pipeline-production.up.railway.app`
- [ ] **Build terminé sans erreur** ⏳ (2-3 minutes)
- [ ] **Migrations appliquées** ⏳ (après build)
  - Voir : `MIGRATIONS_RAILWAY.md`
  - Commandes :
    ```powershell
    $env:DATABASE_URL="postgresql://..."  # Copié depuis Railway
    npx prisma migrate deploy
    npm run prisma:seed
    ```

---

### 📋 ÉTAPE 3 - VERCEL (Frontend)

- [ ] Compte créé / connecté avec GitHub
- [ ] Projet créé depuis gs-pipeline
- [ ] Root Directory : `frontend` ✓
- [ ] Variable `VITE_API_URL=https://gs-pipeline-production.up.railway.app` ✓
- [ ] Déploiement lancé
- [ ] URL Vercel notée : _________________________________

---

## APRÈS VERCEL

### 📋 ÉTAPE 4 - MISE À JOUR CORS

Une fois l'URL Vercel obtenue :

1. Retour sur **Railway**
2. Service backend → **Variables**
3. Modifier `CORS_ORIGINS` :
   ```
   CORS_ORIGINS=https://votre-app.vercel.app,https://votre-app-git-main.vercel.app
   ```
4. Le service redéploie automatiquement (1-2 min)

---

## TEST FINAL

### Test Backend Railway

```powershell
$body = @{ email = "admin@gs-pipeline.com"; password = "admin123" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://gs-pipeline-production.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**Résultat attendu** : Status 200 + Token JWT

---

### Test Frontend Vercel

1. Ouvrir `https://votre-app.vercel.app`
2. Connexion :
   - Email : `admin@gs-pipeline.com`
   - Password : `admin123`
3. **Résultat attendu** : Accès au dashboard

---

## COMPTES DE TEST

Après le seed, vous avez 5 comptes :

| Rôle | Email | Password |
|------|-------|----------|
| Admin | admin@gs-pipeline.com | admin123 |
| Manager | manager@gs-pipeline.com | admin123 |
| Caller | caller@gs-pipeline.com | admin123 |
| Deliverer | deliverer@gs-pipeline.com | admin123 |
| Stock | stock@gs-pipeline.com | admin123 |

---

## URLs DE PRODUCTION

- 🎨 **Frontend** : https://_______________.vercel.app
- 🔧 **Backend** : https://gs-pipeline-production.up.railway.app
- 🗄️ **Database** : Railway PostgreSQL (privée)
- 💾 **Code** : https://github.com/nandeserge91-svg/gs-pipeline

---

## FICHIERS D'AIDE

- 📄 `MIGRATIONS_RAILWAY.md` - Comment appliquer les migrations
- 📄 `ETAPE_3_VERCEL.md` - Configuration Vercel détaillée
- 📄 `VARIABLES_RAILWAY.txt` - Variables d'environnement Railway
- 📄 `DEPLOIEMENT_RAPIDE.md` - Guide complet de déploiement

---

## STATUT ACTUEL

- ✅ GitHub : OK
- ⏳ Railway : Build en cours (2-3 min)
- 🔄 Vercel : En configuration

**Prochaine action** : Attendre que Railway finisse, puis appliquer les migrations !

