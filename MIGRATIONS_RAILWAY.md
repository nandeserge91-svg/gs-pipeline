# 🗄️ Appliquer les Migrations sur Railway

## 📋 Instructions

Une fois que votre backend Railway est déployé, vous devez appliquer les migrations pour créer les tables dans la base de données.

---

## ÉTAPE 1 : Récupérer l'URL de la Base de Données

1. Sur Railway, cliquez sur **"Postgres"** (l'icône de base de données)
2. Allez dans l'onglet **"Variables"**
3. Cherchez **"DATABASE_URL"** ou **"DATABASE_PRIVATE_URL"**
4. Cliquez sur l'icône 👁️ pour afficher l'URL complète
5. **Copiez l'URL** (elle ressemble à : `postgresql://postgres:password@containers-us...`)

---

## ÉTAPE 2 : Appliquer les Migrations

Dans PowerShell, exécutez ces commandes :

```powershell
# 1. Définir l'URL de la base de données Railway
$env:DATABASE_URL="COLLEZ_ICI_L_URL_COPIEE"

# 2. Appliquer les migrations
npx prisma migrate deploy

# 3. Créer les données de test (utilisateurs, produits)
npm run prisma:seed
```

---

## ÉTAPE 3 : Vérifier

Dans PowerShell :

```powershell
# Test de connexion API
$body = @{ email = "admin@gs-pipeline.com"; password = "admin123" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://gs-pipeline-production.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

Si vous recevez un token JWT → ✅ Tout fonctionne !

---

## 🔧 Alternative : Via Railway CLI

Si vous préférez, vous pouvez aussi le faire directement depuis Railway :

1. Sur Railway, cliquez sur votre service backend
2. Allez dans l'onglet **"Logs"**
3. Vérifiez qu'il n'y a pas d'erreur Prisma

---

## ✅ Résultat Attendu

Après le seed, vous aurez :
- 👥 5 utilisateurs (Admin, Gestionnaire, Stock, Appelant, Livreur)
- 📦 3 produits avec stock
- 📋 2 commandes de test

Tous les comptes avec le mot de passe : `admin123`

---

## 🐛 Dépannage

### Erreur "Can't reach database server"

Le PostgreSQL Railway n'est pas encore prêt. Attendez 2-3 minutes et réessayez.

### Erreur "Authentication failed"

Vérifiez que vous avez copié la bonne URL DATABASE_URL (avec le mot de passe).

### Les migrations sont déjà appliquées

Si vous voyez "No pending migrations", c'est parfait ! Passez directement au seed :
```powershell
npm run prisma:seed
```

---

**Une fois les migrations appliquées, passez à l'ÉTAPE 3 : VERCEL** 🚀

