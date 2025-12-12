# ▲ ÉTAPE 3 : Déploiement sur Vercel (Frontend)

## ✅ Prérequis

- ✅ Code sur GitHub
- ✅ Backend sur Railway : `https://gs-pipeline-production.up.railway.app`
- ⏳ Migrations appliquées (voir MIGRATIONS_RAILWAY.md)

---

## ▲ Configuration Vercel (3 minutes)

### A. Créer un compte / Se connecter

1. Allez sur : **https://vercel.com**
2. Cliquez sur **"Sign Up"** ou **"Login"**
3. Connectez-vous avec **GitHub**
4. Autorisez Vercel à accéder à vos repositories

---

### B. Créer le Projet

1. Cliquez sur **"Add New..."** → **"Project"**
2. Dans la liste, trouvez **"gs-pipeline"**
3. Cliquez sur **"Import"** à côté du nom

---

### C. Configuration du Build

Dans l'écran "Configure Project" :

#### 1. Framework Preset
```
Vite (détecté automatiquement)
```

#### 2. Root Directory
```
frontend
```
Cliquez sur **"Edit"** et sélectionnez **"frontend"**

#### 3. Build Settings (normalement auto-détectés)
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

---

### D. Variables d'Environnement

**IMPORTANT** : Avant de cliquer "Deploy", ajoutez la variable d'environnement :

1. Descendez jusqu'à **"Environment Variables"**
2. Cliquez sur **"Add New"**
3. Ajoutez :

```
Name  : VITE_API_URL
Value : https://gs-pipeline-production.up.railway.app
```

⚠️ **PAS DE SLASH** à la fin de l'URL !

4. Environment : **Production**, **Preview**, **Development** (tous cochés)

---

### E. Déployer

1. Cliquez sur le bouton bleu **"Deploy"** en bas
2. Attendez le build (2-3 minutes)
3. ✅ Vercel déploie automatiquement !

---

### F. Récupérer l'URL Vercel

Une fois le déploiement terminé :

1. Vous verrez un écran de succès avec des confettis 🎉
2. Cliquez sur **"Visit"** pour voir votre site
3. Ou notez l'URL dans le dashboard (ex: `https://gs-pipeline.vercel.app`)

📝 **NOTEZ CETTE URL** - Vous en aurez besoin pour mettre à jour Railway !

---

## ✅ Checklist Vercel

- [ ] Compte Vercel créé / connecté avec GitHub
- [ ] Projet créé depuis gs-pipeline
- [ ] Root Directory = `frontend`
- [ ] Variable VITE_API_URL ajoutée
- [ ] Déploiement réussi (sans erreur)
- [ ] URL Vercel notée : _________________________________

---

## 🎯 Test du Frontend

1. Ouvrez votre URL Vercel : `https://votre-app.vercel.app`
2. Vous devriez voir la page de connexion GS Pipeline
3. **NE VOUS CONNECTEZ PAS ENCORE** - Il reste une étape !

---

## ⚠️ IMPORTANT : Mettre à jour CORS sur Railway

Maintenant que vous avez l'URL Vercel, retournez sur Railway :

1. Cliquez sur votre service **"gs-pipeline"** (backend)
2. Allez dans **"Variables"**
3. Modifiez **"CORS_ORIGINS"** :

```
CORS_ORIGINS=https://votre-app.vercel.app,https://votre-app-git-main.vercel.app
```

Remplacez `votre-app` par votre vraie URL Vercel !

4. Le service va redéployer automatiquement (1-2 minutes)

---

## ✅ Test Final

Une fois CORS mis à jour :

1. Ouvrez `https://votre-app.vercel.app`
2. Connectez-vous :
   - Email : `admin@gs-pipeline.com`
   - Password : `admin123`
3. Vous devriez accéder au dashboard ! 🎉

---

## 🐛 Dépannage

### Erreur CORS lors de la connexion

**Solution** : Vérifiez que CORS_ORIGINS sur Railway contient exactement votre URL Vercel (sans slash à la fin).

### Page blanche sur Vercel

**Solution** : Vérifiez les logs de build sur Vercel. Si erreur, vérifiez que :
- Root Directory = `frontend`
- VITE_API_URL est bien configurée

### Erreur 500 sur l'API

**Solution** : Les migrations ne sont pas appliquées. Retournez à MIGRATIONS_RAILWAY.md

---

## 🎉 Félicitations !

Si tout fonctionne, votre application est maintenant **EN LIGNE** et accessible 24/7 !

**URLs de Production** :
- 🎨 Frontend : https://votre-app.vercel.app
- 🔧 Backend : https://gs-pipeline-production.up.railway.app
- 🗄️ Database : Railway PostgreSQL

---

**Prochaine étape : Test complet de l'application !** ✅

