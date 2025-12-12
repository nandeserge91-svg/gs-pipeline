# 🗄️ AJOUTER POSTGRESQL SUR RAILWAY

## ⚠️ PROBLÈME ACTUEL

Votre backend Railway affiche cette erreur en boucle :
```
Error: Environment variable not found: DATABASE_URL.
```

**Cause** : PostgreSQL n'a pas été ajouté au projet Railway.

---

## ✅ SOLUTION (2 minutes)

### ÉTAPE 1 : Ouvrir Railway

1. Allez sur : **https://railway.app/dashboard**
2. Cliquez sur votre projet **"gs-pipeline"**

---

### ÉTAPE 2 : Ajouter PostgreSQL

#### Option A : Si vous voyez SEULEMENT le service backend

Votre projet ressemble à ça :
```
┌─────────────────┐
│  gs-pipeline    │  ← Seulement le backend
│  (Backend)      │
└─────────────────┘
```

**ACTIONS** :
1. Cliquez sur **"+ New"** (en haut à droite)
2. Sélectionnez **"Database"**
3. Choisissez **"Add PostgreSQL"**
4. Attendez quelques secondes (Railway crée la base)

---

#### Option B : Si PostgreSQL existe déjà

Votre projet ressemble à ça :
```
┌─────────────────┐          ┌─────────────────┐
│  gs-pipeline    │          │    Postgres     │
│  (Backend)      │          │   (Database)    │
└─────────────────┘          └─────────────────┘
       PAS DE LIGNE ENTRE LES DEUX !
```

**Le problème** : Les services ne sont pas connectés.

**ACTIONS** :
1. Cliquez sur **"gs-pipeline"** (le backend)
2. Allez dans l'onglet **"Variables"**
3. Cherchez **"DATABASE_URL"**
4. Si elle n'existe PAS :
   - Cliquez sur **"New Variable"**
   - Name : `DATABASE_URL`
   - Value : `${{Postgres.DATABASE_URL}}`
   - Cliquez **"Add"**

---

### ÉTAPE 3 : Vérifier la connexion

Après avoir ajouté PostgreSQL, votre projet doit ressembler à :

```
┌─────────────────┐          ┌─────────────────┐
│  gs-pipeline    │  ←─────→ │    Postgres     │
│  (Backend)      │          │   (Database)    │
└─────────────────┘          └─────────────────┘
     ↑
     └─ Ligne de connexion
```

**VÉRIFICATION** :
1. Cliquez sur **"gs-pipeline"** (backend)
2. Onglet **"Variables"**
3. Vous devez voir :
   ```
   DATABASE_URL = postgresql://postgres:password@...
   ```

---

### ÉTAPE 4 : Attendre le redéploiement

Railway redéploie automatiquement le backend :
- Durée : **1-2 minutes**
- Surveillez l'onglet **"Deployments"**
- Cherchez **"Deployment completed"**

---

## ✅ RÉSULTAT ATTENDU

Dans les logs, vous devez voir :

```
✅ Server running on port 5000
✅ Connected to database
```

Au lieu de l'erreur `DATABASE_URL not found` répétée.

---

## 🔍 DÉPANNAGE

### Problème 1 : "Comment ajouter DATABASE_URL manuellement ?"

1. Cliquez sur **Postgres** (la base de données)
2. Onglet **"Variables"** → Trouvez `DATABASE_URL`
3. Cliquez sur l'icône 👁️ pour voir l'URL
4. **Copiez** l'URL (commence par `postgresql://...`)
5. Retournez sur **gs-pipeline** (backend)
6. Onglet **"Variables"** → **"New Variable"**
7. Name : `DATABASE_URL`
8. Value : **Collez l'URL copiée**
9. Add

---

### Problème 2 : "Je ne vois pas le bouton + New"

Vous êtes peut-être dans le mauvais écran.
- Retournez au **Dashboard** : https://railway.app/dashboard
- Cliquez sur votre projet
- Le bouton **"+ New"** est en haut à droite

---

### Problème 3 : "PostgreSQL est ajouté mais l'erreur persiste"

Vérifiez que `DATABASE_URL` est bien dans les variables :
1. Backend → Variables → Cherchez `DATABASE_URL`
2. Si absente → Suivez "Problème 1" ci-dessus
3. Après ajout → Railway redéploie automatiquement

---

## 📝 CHECKLIST

- [ ] PostgreSQL ajouté au projet Railway
- [ ] Les 2 services sont visibles (backend + postgres)
- [ ] DATABASE_URL existe dans les variables du backend
- [ ] Le backend a redéployé (logs sans erreur)
- [ ] Je vois "Server running" dans les logs

---

**Une fois PostgreSQL configuré, revenez dans le chat et dites "postgres ok" !** ✅

