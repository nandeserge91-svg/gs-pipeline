# 🚨 FIX URGENT : Variable d'environnement Vercel

## ❌ PROBLÈME

**Erreur de connexion** sur https://afgestion.net

**Cause** : Le frontend ne sait pas où est le backend !

---

## ✅ SOLUTION (3 MINUTES)

### **ÉTAPE 1 : Aller sur Vercel**

1. **Ouvrir** : https://vercel.com
2. **Se connecter** avec votre compte
3. **Cliquer** sur votre projet : **gs-pipeline** (ou gs-pipeline-alpha)

---

### **ÉTAPE 2 : Configurer la Variable**

1. **Cliquer** sur **"Settings"** (en haut)
2. **Menu gauche** → **"Environment Variables"**
3. **Cliquer** sur **"Add New"**

#### **Ajouter cette variable :**

```
Name (Clé):
VITE_API_URL

Value (Valeur):
https://gs-pipeline-production.up.railway.app

Environments (Cocher les 3) :
☑ Production
☑ Preview
☑ Development
```

4. **Cliquer** sur **"Save"**

---

### **ÉTAPE 3 : Redéployer**

1. **Aller dans l'onglet "Deployments"** (en haut)
2. **Trouver le dernier déploiement** (le premier dans la liste)
3. **Cliquer sur les 3 points** `...` à droite
4. **Cliquer** sur **"Redeploy"**
5. **Confirmer** : "Redeploy"

---

### **⏱️ Attendre 2 minutes**

Vercel va reconstruire le site avec la bonne URL.

---

### **ÉTAPE 4 : Tester**

1. **Ouvrir** : https://afgestion.net
2. **Vider le cache** : `Ctrl + Shift + Delete` (Chrome/Edge)
3. **Recharger** : `Ctrl + F5`
4. **Se connecter** :
   - Email : `admin@gs-pipeline.com`
   - Mot de passe : `admin123`

---

## ✅ SI ÇA NE MARCHE TOUJOURS PAS

### **Vérifier que Railway est en ligne**

**Ouvrir** : https://gs-pipeline-production.up.railway.app

**Devrait afficher** :
```json
{
  "message": "API GS Pipeline - Back-office e-commerce",
  "version": "1.0.0",
  "status": "running"
}
```

**Si erreur** :
- Railway est peut-être en cours de déploiement
- Attendre 2-3 minutes
- Vérifier les logs Railway

---

## 📸 CAPTURE D'ÉCRAN VERCEL

### **Voici à quoi ça doit ressembler :**

```
┌─────────────────────────────────────────────────┐
│ Environment Variables                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Name:         VITE_API_URL                      │
│ Value:        https://gs-pipeline-production... │
│                                                 │
│ Environments:                                   │
│   ☑ Production                                  │
│   ☑ Preview                                     │
│   ☑ Development                                 │
│                                                 │
│             [Cancel]  [Save]                    │
└─────────────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST

- [ ] Se connecter à Vercel
- [ ] Aller dans Settings → Environment Variables
- [ ] Ajouter `VITE_API_URL` = `https://gs-pipeline-production.up.railway.app`
- [ ] Cocher les 3 environnements
- [ ] Sauvegarder
- [ ] Redéployer (Deployments → ... → Redeploy)
- [ ] Attendre 2 minutes
- [ ] Vider cache navigateur
- [ ] Tester connexion

---

## 📞 SI BESOIN D'AIDE

**Message d'erreur** : "Erreur de connexion"  
**Signifie** : Frontend ne trouve pas le backend

**Solution** : Ajouter la variable d'environnement comme indiqué ci-dessus

---

*Le site fonctionnera à nouveau dans 2-3 minutes après le redéploiement !*

