# 🗑️ Nettoyage Automatique des Présences

> **Supprimer automatiquement les données de présence de plus de 60 jours**

---

## 📋 Vue d'ensemble

Ce système permet de :
- ✅ Supprimer automatiquement les présences de plus de 60 jours
- ✅ Libérer de l'espace dans la base de données
- ✅ Respecter les règles de conservation des données
- ✅ Exécution manuelle ou automatique (Cron)

---

## 🚀 Utilisation

### **Option 1 : Nettoyage Manuel**

```bash
# En local ou sur le serveur
node scripts/cleanup-old-attendance.js
```

**Résultat attendu** :
```
═══════════════════════════════════════════════════════════
🗑️  NETTOYAGE AUTOMATIQUE DES PRÉSENCES
═══════════════════════════════════════════════════════════

📅 Date limite : 23 novembre 2025
📊 Suppression des données avant cette date...

⚠️  15 enregistrement(s) à supprimer

✅ 15 enregistrement(s) supprimé(s) avec succès !

📊 Statistiques :
   Supprimés      : 15
   Restants       : 142
   Date limite    : 23 novembre 2025
   Rétention      : 60 jours

═══════════════════════════════════════════════════════════
✨ Nettoyage terminé avec succès !
═══════════════════════════════════════════════════════════
```

---

### **Option 2 : Via l'API (Admin uniquement)**

```bash
# Appeler l'API de nettoyage
curl -X DELETE https://votre-backend.com/api/attendance/cleanup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse** :
```json
{
  "success": true,
  "message": "15 enregistrement(s) supprimés",
  "deletedCount": 15,
  "deletedBefore": "2025-11-23T00:00:00.000Z"
}
```

---

### **Option 3 : Nettoyage Automatique (Cron)**

#### **Sur un Serveur Linux**

```bash
# Ouvrir crontab
crontab -e

# Ajouter cette ligne (tous les jours à 2h du matin)
0 2 * * * cd /path/to/your/project && node scripts/cleanup-old-attendance.js >> /var/log/attendance-cleanup.log 2>&1
```

#### **Sur Railway (avec Railway Cron)**

1. Créer un fichier `railway.cron.json` :

```json
{
  "crons": [
    {
      "schedule": "0 2 * * *",
      "command": "node scripts/cleanup-old-attendance.js",
      "name": "Nettoyage présences (60j)"
    }
  ]
}
```

2. Déployer sur Railway

#### **Sur Windows (Task Scheduler)**

```powershell
# Créer une tâche planifiée
schtasks /create /tn "Cleanup Attendance" /tr "node C:\path\to\project\scripts\cleanup-old-attendance.js" /sc daily /st 02:00
```

---

## ⚙️ Configuration

### **Modifier la Durée de Rétention**

Dans `scripts/cleanup-old-attendance.js` :

```javascript
// Par défaut : 60 jours
const RETENTION_DAYS = 60;

// Modifier selon vos besoins :
const RETENTION_DAYS = 30;  // 1 mois
const RETENTION_DAYS = 90;  // 3 mois
const RETENTION_DAYS = 365; // 1 an
```

---

## 📊 Statistiques et Logs

### **Logs de Nettoyage**

```bash
# Voir les logs (Linux/Mac)
tail -f /var/log/attendance-cleanup.log

# Voir les logs (Railway)
railway logs --service backend
```

### **Vérifier les Données Restantes**

```sql
-- Se connecter à PostgreSQL
SELECT 
  COUNT(*) as total,
  MIN(date) as oldest,
  MAX(date) as newest
FROM attendances;
```

---

## 🔧 Résolution de Problèmes

### **Erreur : "Can't reach database"**

**Solution** :
```bash
# Vérifier DATABASE_URL
echo $DATABASE_URL

# Tester la connexion
npx prisma db pull
```

### **Erreur : "Permission denied"**

**Solution** :
```bash
# Rendre le script exécutable
chmod +x scripts/cleanup-old-attendance.js
```

### **Rien n'est supprimé**

**Solution** :
```
Toutes les données ont moins de 60 jours.
C'est normal si le système est récent.
```

---

## 📅 Calendrier de Rétention Recommandé

| **Type d'entreprise** | **Durée recommandée** |
|-----------------------|----------------------|
| PME (< 50 employés) | 60 jours |
| Moyenne (50-200) | 90 jours |
| Grande (> 200) | 6 mois |
| Obligatoire (légal) | 1 an minimum |

---

## 🔐 Sécurité

### **Avant de Supprimer**

✅ **Créer une sauvegarde** :
```bash
# Export PostgreSQL
pg_dump -h HOST -U USER -d DATABASE -t attendances > backup_attendances.sql
```

✅ **Exporter en CSV** :
```sql
COPY (
  SELECT * FROM attendances 
  WHERE date < NOW() - INTERVAL '60 days'
) TO '/tmp/attendances_archive.csv' CSV HEADER;
```

---

## 📈 Automatisation Avancée

### **Nettoyage Progressif**

Pour les grandes bases de données :

```javascript
// Supprimer par lots de 1000
async function cleanupInBatches() {
  let totalDeleted = 0;
  let batchSize = 1000;
  
  while (true) {
    const result = await prisma.attendance.deleteMany({
      where: { date: { lt: cutoffDate } },
      take: batchSize
    });
    
    totalDeleted += result.count;
    
    if (result.count < batchSize) break;
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause 1s
  }
  
  return totalDeleted;
}
```

---

## 📧 Notifications

### **Envoyer un Email après Nettoyage**

```javascript
import nodemailer from 'nodemailer';

async function sendCleanupReport(deletedCount) {
  const transporter = nodemailer.createTransport({...});
  
  await transporter.sendMail({
    to: 'admin@example.com',
    subject: `[GS Pipeline] Nettoyage présences : ${deletedCount} supprimés`,
    text: `Le nettoyage automatique a supprimé ${deletedCount} enregistrements.`
  });
}
```

---

## ✅ Checklist de Déploiement

- [ ] Script créé : `scripts/cleanup-old-attendance.js`
- [ ] Route API ajoutée : `DELETE /api/attendance/cleanup`
- [ ] Durée de rétention configurée (60 jours par défaut)
- [ ] Test manuel réussi
- [ ] Cron configuré (si automatique)
- [ ] Logs activés
- [ ] Sauvegarde configurée (optionnel)
- [ ] Notifications configurées (optionnel)

---

## 🎓 Bonnes Pratiques

1. **Exécuter d'abord en mode test** (sans supprimer)
2. **Créer une sauvegarde** avant le premier nettoyage
3. **Vérifier les logs** après chaque exécution
4. **Tester en développement** avant la production
5. **Documenter** les suppressions (logs)

---

## 📞 Support

**Questions fréquentes** :

**Q: Puis-je récupérer des données supprimées ?**  
R: Non, c'est définitif. Créez toujours une sauvegarde avant.

**Q: Le script affecte-t-il les performances ?**  
R: Non, il s'exécute en arrière-plan et ne bloque rien.

**Q: Puis-je changer la durée de rétention ?**  
R: Oui, modifiez `RETENTION_DAYS` dans le script.

---

**© 2026 - Système de Nettoyage Automatique**

