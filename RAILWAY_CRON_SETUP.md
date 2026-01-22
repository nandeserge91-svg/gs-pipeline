# 🚂 Configuration Cron sur Railway

> **Automatiser la génération quotidienne des absences sur Railway**

---

## 📋 Tâches Automatiques à Configurer

### **1. Génération des Absences (23h chaque jour)**
### **2. Nettoyage des Données (2h chaque jour)**

---

## 🚀 Méthode 1 : Railway Cron Jobs (Recommandé)

### **Étape 1 : Créer le Fichier de Configuration**

Dans le répertoire racine du projet, créer `railway.cron.json` :

```json
{
  "crons": [
    {
      "schedule": "0 23 * * *",
      "command": "node scripts/generate-daily-absences.js",
      "name": "Génération quotidienne des absences"
    },
    {
      "schedule": "0 2 * * *",
      "command": "node scripts/cleanup-old-attendance.js",
      "name": "Nettoyage des données anciennes (60j)"
    }
  ]
}
```

### **Étape 2 : Pousser sur GitHub**

```bash
git add railway.cron.json
git commit -m "Add Railway cron jobs"
git push origin main
```

### **Étape 3 : Activer sur Railway**

1. Aller sur **Railway Dashboard**
2. Sélectionner votre projet **GS Pipeline**
3. Cliquer sur **Settings** → **Cron Jobs**
4. Activer **"Enable Cron Jobs"**
5. Railway détectera automatiquement `railway.cron.json`

---

## 🚀 Méthode 2 : Exécution Manuelle (Test)

### **Option A : Depuis Railway CLI**

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Exécuter le script manuellement
railway run node scripts/generate-daily-absences.js
```

### **Option B : Depuis Railway Dashboard**

1. Aller sur **Railway Dashboard**
2. Sélectionner votre projet
3. Cliquer sur **Deploy** → **Run Custom Command**
4. Saisir :
   ```
   node scripts/generate-daily-absences.js
   ```
5. Cliquer sur **Run**

---

## 🚀 Méthode 3 : Service Séparé (Avancé)

Si Railway Cron Jobs n'est pas disponible, créer un **service séparé** :

### **Créer `cron-service.js`**

```javascript
import cron from 'node-cron';
import { exec } from 'child_process';

console.log('🚂 Service Cron Railway démarré');

// Génération des absences (23h chaque jour)
cron.schedule('0 23 * * *', () => {
  console.log('📋 Génération des absences...');
  exec('node scripts/generate-daily-absences.js', (error, stdout, stderr) => {
    if (error) console.error('Erreur:', error);
    console.log(stdout);
  });
});

// Nettoyage (2h chaque jour)
cron.schedule('0 2 * * *', () => {
  console.log('🗑️ Nettoyage des données...');
  exec('node scripts/cleanup-old-attendance.js', (error, stdout, stderr) => {
    if (error) console.error('Erreur:', error);
    console.log(stdout);
  });
});

// Garder le processus actif
setInterval(() => {
  console.log(`✅ Service Cron actif - ${new Date().toLocaleString('fr-FR')}`);
}, 3600000); // Log toutes les heures
```

### **Installer node-cron**

```bash
npm install node-cron
```

### **Ajouter au package.json**

```json
{
  "scripts": {
    "start": "node server.js",
    "cron": "node cron-service.js"
  }
}
```

### **Créer un Nouveau Service sur Railway**

1. Railway Dashboard → **New Service**
2. **Deploy from GitHub**
3. Sélectionner le même repo
4. Dans **Settings** → **Start Command** :
   ```
   npm run cron
   ```
5. Déployer

---

## 📊 Vérification et Monitoring

### **Vérifier les Logs**

```bash
# Railway CLI
railway logs --service backend

# Ou sur Railway Dashboard
Projet → Service → Logs
```

### **Logs Attendus (Génération Absences)** :

```
═══════════════════════════════════════════════════════════
📋 GÉNÉRATION AUTOMATIQUE DES ABSENCES
═══════════════════════════════════════════════════════════

📅 Date : 22 janvier 2026

👥 15 employé(s) à vérifier :

   ✅ Présents/Pointés : 12
   ❌ Absents (non pointés) : 3

📝 Création des enregistrements d'absence...

   ❌ Marie Dupont (APPELANT) → ABSENT
   ❌ Jean Martin (GESTIONNAIRE_STOCK) → ABSENT
   ❌ Paul Durand (GESTIONNAIRE) → ABSENT

✅ 3 absence(s) créée(s) avec succès !
```

### **Logs Attendus (Nettoyage)** :

```
═══════════════════════════════════════════════════════════
🗑️  NETTOYAGE AUTOMATIQUE DES PRÉSENCES
═══════════════════════════════════════════════════════════

📅 Date limite : 23 novembre 2025
📊 Suppression des données avant cette date...

✅ 45 enregistrement(s) supprimé(s) avec succès !
```

---

## 🕐 Format des Horaires Cron

| **Format** | **Signification** | **Exemple** |
|------------|-------------------|-------------|
| `* * * * *` | Minute Heure Jour Mois Jour-Semaine | |
| `0 23 * * *` | À 23h00 chaque jour | Génération absences |
| `0 2 * * *` | À 2h00 chaque jour | Nettoyage données |
| `0 0 * * 0` | À minuit chaque dimanche | Rapport hebdomadaire |
| `0 8 1 * *` | À 8h le 1er de chaque mois | Rapport mensuel |

---

## ⚙️ Variables d'Environnement

Assurez-vous que ces variables sont configurées sur Railway :

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGINS=https://afgestion.net,https://www.afgestion.net
```

---

## 🔧 Résolution de Problèmes

### **Erreur : "Cron jobs not enabled"**

**Solution** :
1. Railway Dashboard → Settings
2. Activer **"Enable Cron Jobs"**

---

### **Erreur : "Can't find module 'node-cron'"**

**Solution** :
```bash
npm install node-cron
git add package.json package-lock.json
git commit -m "Add node-cron"
git push
```

---

### **Erreur : "DATABASE_URL not defined"**

**Solution** :
- Vérifier que `DATABASE_URL` est bien configurée dans Railway
- Redéployer le service

---

### **Les scripts ne s'exécutent pas**

**Vérifications** :
1. Vérifier les logs Railway
2. Vérifier que le fichier `railway.cron.json` est bien présent
3. Vérifier la syntaxe cron
4. Tester manuellement : `railway run node scripts/generate-daily-absences.js`

---

## 🧪 Test Local

Avant de déployer, testez localement :

```bash
# Générer les absences
node scripts/generate-daily-absences.js

# Nettoyer les données
node scripts/cleanup-old-attendance.js
```

---

## 📅 Calendrier Recommandé

| **Tâche** | **Heure** | **Fréquence** | **Commande** |
|-----------|-----------|---------------|--------------|
| Génération absences | 23h00 | Quotidien | `node scripts/generate-daily-absences.js` |
| Nettoyage données | 02h00 | Quotidien | `node scripts/cleanup-old-attendance.js` |
| Rapport hebdomadaire | Dimanche 20h | Hebdomadaire | (À créer) |
| Sauvegarde | 03h00 | Quotidien | `pg_dump ...` |

---

## ✅ Checklist de Déploiement

- [ ] `railway.cron.json` créé
- [ ] Scripts testés en local
- [ ] Variables d'environnement configurées
- [ ] Fichier poussé sur GitHub
- [ ] Cron Jobs activés sur Railway
- [ ] Logs vérifiés après 24h
- [ ] Notifications configurées (optionnel)

---

## 📞 Support Railway

- **Documentation** : https://docs.railway.app/reference/cron-jobs
- **Discord** : https://discord.gg/railway
- **Status** : https://status.railway.app/

---

**© 2026 - Configuration Cron Railway**

