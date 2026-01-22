# 📋 Génération Automatique des Absences

> **Si un employé ne pointe pas, il est automatiquement marqué ABSENT**

---

## 🎯 Principe

**AVANT** : Si un employé ne pointait pas, il n'apparaissait pas dans la liste.

**MAINTENANT** : Si un employé ne pointe pas pendant toute la journée, le système le marque automatiquement **ABSENT**.

---

## 🚀 Méthodes de Génération

### **1. Automatique (Recommandé) - Cron**

Le script s'exécute **tous les soirs à 23h** et génère automatiquement les absences.

#### **Configuration Cron (Linux/Mac)** :

```bash
# Éditer crontab
crontab -e

# Ajouter cette ligne (exécution à 23h chaque jour)
0 23 * * * cd /path/to/project && node scripts/generate-daily-absences.js >> /var/log/attendance-absences.log 2>&1
```

#### **Configuration Railway** :

Créer `railway.cron.json` :

```json
{
  "crons": [
    {
      "schedule": "0 23 * * *",
      "command": "node scripts/generate-daily-absences.js",
      "name": "Génération des absences quotidiennes"
    }
  ]
}
```

#### **Configuration Windows (Task Scheduler)** :

```powershell
schtasks /create /tn "Generate Daily Absences" /tr "node C:\path\to\project\scripts\generate-daily-absences.js" /sc daily /st 23:00
```

---

### **2. Manuelle - Depuis l'Interface**

1. Ouvrir `https://www.afgestion.net/admin/attendance`
2. Cliquer sur le bouton **"Générer absences"** (bouton orange)
3. Le système génère automatiquement les absences pour la date affichée

**Résultat** :
```
✅ 3 absence(s) générée(s)
```

---

### **3. Manuelle - Script Terminal**

```bash
# En local ou sur le serveur
node scripts/generate-daily-absences.js
```

**Résultat attendu** :

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

📊 Récapitulatif :
   Total employés       : 15
   Présents/Pointés     : 12
   Absents créés        : 3
   Date                 : 22 janvier 2026

═══════════════════════════════════════════════════════════
✨ Génération des absences terminée !
═══════════════════════════════════════════════════════════
```

---

### **4. Via l'API**

```bash
# Générer les absences pour aujourd'hui
curl -X POST https://votre-backend.com/api/attendance/generate-absences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Générer les absences pour une date spécifique
curl -X POST https://votre-backend.com/api/attendance/generate-absences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-20"}'
```

**Réponse** :

```json
{
  "success": true,
  "message": "3 absence(s) générée(s) pour le 22/01/2026",
  "created": 3,
  "absences": [...],
  "totalEmployees": 15,
  "presents": 12
}
```

---

## 🔧 Fonctionnement Technique

### **Qui est concerné ?**

Seuls les employés avec les rôles suivants sont concernés :
- ✅ **APPELANT**
- ✅ **GESTIONNAIRE**
- ✅ **GESTIONNAIRE_STOCK**

Les rôles **ADMIN** et **LIVREUR** ne sont **pas** concernés.

### **Comment ça marche ?**

1. Le système récupère tous les employés concernés
2. Il vérifie qui a **déjà pointé** aujourd'hui
3. Pour chaque employé **qui n'a pas pointé**, il crée un enregistrement :
   ```json
   {
     "validee": false,
     "validation": "ABSENT",
     "latitudeArrivee": 0,
     "longitudeArrivee": 0,
     "distanceArrivee": 0,
     "note": "Absence générée automatiquement (pas de pointage)"
   }
   ```

### **Éviter les Doublons**

Le système utilise la contrainte unique `@@unique([userId, date])` dans la base de données.

Si un employé est déjà enregistré (présent ou absent), **aucun doublon** n'est créé.

---

## 📊 Affichage dans l'Interface

### **Page Présences & Absences**

Les absences générées automatiquement apparaissent avec :
- ❌ Badge **ABSENT** (rouge)
- Distance : **0m** (pas de géolocalisation)
- Note : **"Absence générée automatiquement (pas de pointage)"**

### **Statistiques**

Les absences générées automatiquement sont comptabilisées dans :
- 📊 Carte **"Absents"** (rouge)
- 📋 Tableau des présences

---

## 📅 Calendrier Recommandé

| **Quand ?** | **Méthode** | **Avantage** |
|-------------|-------------|--------------|
| **Tous les soirs à 23h** | Cron automatique | ✅ Aucune intervention manuelle |
| **Tous les matins** | Bouton interface | ✅ Contrôle visuel immédiat |
| **À la demande** | Script terminal | ✅ Pour tests ou rattrapages |

---

## 🔐 Sécurité et Permissions

### **Qui peut générer les absences ?**

- ✅ **ADMIN** (via interface ou API)
- ✅ **GESTIONNAIRE** (via interface ou API)
- ❌ **APPELANT** (non autorisé)
- ❌ **LIVREUR** (non autorisé)
- ❌ **GESTIONNAIRE_STOCK** (non autorisé)

---

## 🛠️ Résolution de Problèmes

### **Erreur : "All employees already marked"**

**Cause** : Tous les employés ont déjà pointé.

**Solution** : C'est normal, rien à faire.

---

### **Erreur : "Duplicate entry"**

**Cause** : L'absence a déjà été générée pour cet employé aujourd'hui.

**Solution** : Le système ignore automatiquement les doublons.

---

### **Un employé absent n'apparaît pas**

**Cause possible** :
1. Son rôle n'est pas dans la liste (`APPELANT`, `GESTIONNAIRE`, `GESTIONNAIRE_STOCK`)
2. Il a déjà un enregistrement (même absent)

**Solution** :
```sql
-- Vérifier dans PostgreSQL
SELECT * FROM attendances WHERE userId = XXX AND date = '2026-01-22';
```

---

## 📈 Statistiques et Suivi

### **Voir les Absences Générées**

```sql
-- PostgreSQL
SELECT 
  u.prenom, 
  u.nom, 
  u.role,
  a.date,
  a.validation,
  a.note
FROM attendances a
JOIN users u ON a.userId = u.id
WHERE a.validation = 'ABSENT'
  AND a.note LIKE '%générée automatiquement%'
ORDER BY a.date DESC
LIMIT 50;
```

### **Statistiques Mensuelles**

```sql
-- Nombre d'absences générées par mois
SELECT 
  DATE_TRUNC('month', date) as mois,
  COUNT(*) as total_absences
FROM attendances
WHERE validation = 'ABSENT'
  AND note LIKE '%générée automatiquement%'
GROUP BY mois
ORDER BY mois DESC;
```

---

## ✅ Checklist de Déploiement

- [ ] Script créé : `scripts/generate-daily-absences.js`
- [ ] Route API ajoutée : `POST /api/attendance/generate-absences`
- [ ] Bouton ajouté dans l'interface admin
- [ ] Cron configuré (si automatique)
- [ ] Test manuel réussi
- [ ] Vérification des permissions (ADMIN, GESTIONNAIRE)
- [ ] Documentation lue et comprise

---

## 🎓 Bonnes Pratiques

1. **Exécuter en fin de journée** (23h) pour laisser le temps aux employés de pointer
2. **Vérifier les logs** régulièrement
3. **Sauvegarder** avant toute modification manuelle
4. **Tester d'abord** sur un environnement de développement

---

## 📧 Notifications (Optionnel)

### **Envoyer un Email aux Absents**

```javascript
// Ajouter dans le script generate-daily-absences.js

import nodemailer from 'nodemailer';

async function notifyAbsentEmployees(absentEmployees) {
  const transporter = nodemailer.createTransporter({...});
  
  for (const emp of absentEmployees) {
    await transporter.sendMail({
      to: emp.email,
      subject: '⚠️ Absence non justifiée',
      text: `Bonjour ${emp.prenom},\n\nVous n'avez pas pointé aujourd'hui.\n\nSi vous étiez absent, merci de contacter votre responsable.`
    });
  }
}
```

---

## 📞 Support

**Questions fréquentes** :

**Q: Les absences sont-elles définitives ?**  
R: Oui, une fois créées, elles restent dans la base. Utilisez le script de nettoyage (60j) pour les supprimer.

**Q: Puis-je modifier une absence générée automatiquement ?**  
R: Actuellement non, mais vous pouvez la supprimer manuellement en base de données.

**Q: Le script affecte-t-il les performances ?**  
R: Non, il s'exécute en quelques secondes et ne bloque rien.

**Q: Puis-je générer les absences pour une date passée ?**  
R: Oui, via l'API en passant le paramètre `date`.

---

**© 2026 - Système de Génération Automatique des Absences**

