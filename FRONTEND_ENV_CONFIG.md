# ⚙️ Configuration Variables d'Environnement Frontend

## 📋 **Variables Requises**

### **VITE_API_URL**

**Obligatoire** pour que le frontend communique avec le backend.

---

## 🌐 **Valeurs selon l'Environnement**

### **Production (Vercel)**

```env
VITE_API_URL=https://gs-pipeline-production.up.railway.app
```

**Configuration sur Vercel** :
1. Aller sur https://vercel.com
2. Projet → Settings → Environment Variables
3. Ajouter :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://gs-pipeline-production.up.railway.app`
   - **Environments** : ☑ Production, ☑ Preview, ☑ Development

---

### **Développement Local**

**Créer le fichier** : `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
```

**Alternative** (si backend sur Railway même en local) :

```env
VITE_API_URL=https://gs-pipeline-production.up.railway.app
```

---

## 🔍 **Comment Vérifier**

### **Dans le Code** (`frontend/src/lib/api.ts`)

```typescript
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### **Dans la Console Navigateur** (F12)

```javascript
// Voir l'URL utilisée
console.log(import.meta.env.VITE_API_URL)
```

---

## ⚠️ **IMPORTANT**

### **Le fichier `.env` ne doit JAMAIS être commité**

**Raison** : Variables sensibles (clés API, URLs, etc.)

**Déjà dans `.gitignore`** :
```gitignore
.env
.env.local
.env.production
```

---

## 🚨 **Erreurs Courantes**

### **Erreur : "Erreur de connexion"**

**Cause** : Variable `VITE_API_URL` manquante ou incorrecte

**Solution** :
1. Vérifier la variable sur Vercel
2. Redéployer après ajout
3. Vider le cache navigateur

---

### **Erreur : "Network Error" ou "CORS"**

**Cause** : URL backend incorrecte

**Solution** :
1. Vérifier que l'URL se termine **SANS** `/api`
   - ✅ `https://gs-pipeline-production.up.railway.app`
   - ❌ `https://gs-pipeline-production.up.railway.app/api`
2. Le code ajoute `/api` automatiquement :
   ```typescript
   const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
   ```

---

## 🔄 **Après Modification**

### **Vercel (Production)**

1. Modifier la variable
2. **Redéployer** : Deployments → ... → Redeploy
3. Attendre 2-3 minutes

### **Local (Développement)**

1. Modifier `frontend/.env`
2. **Redémarrer Vite** : `Ctrl + C` puis `npm run dev`

---

## 📚 **Autres Variables (Optionnelles)**

### **Pour activer React Query DevTools**

```env
VITE_ENABLE_DEVTOOLS=true
```

### **Pour le mode debug**

```env
VITE_DEBUG=true
```

---

## ✅ **Checklist Configuration**

- [ ] Créer `frontend/.env` en local
- [ ] Ajouter `VITE_API_URL=http://localhost:5000`
- [ ] Vérifier que `.env` est dans `.gitignore`
- [ ] Configurer `VITE_API_URL` sur Vercel
- [ ] Redéployer Vercel
- [ ] Tester connexion

---

*Dernière mise à jour : 22 janvier 2026*

