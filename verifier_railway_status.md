# 🔍 VÉRIFIER LE STATUS RAILWAY

## ⚠️ SITUATION ACTUELLE

Les variables montrent toujours "Non configuré", ce qui signifie :

**SOIT** : Railway est en train de redéployer (il faut attendre)  
**SOIT** : Les variables n'ont pas été correctement sauvegardées  
**SOIT** : Le déploiement a échoué  

---

## ✅ VÉRIFICATIONS À FAIRE SUR RAILWAY

### 1. Vérifier que les Variables Existent

**Sur Railway Dashboard** :
1. Projet `afgestion` → Service `gs-pipeline`
2. Onglet **`Variables`**
3. **Vérifiez que vous voyez ces 4 variables** :

```
✓ SMS8_API_URL = https://app.sms8.io/services/send.php
✓ SMS_DEVICE_ID = 5298
✓ SMS_SIM_SLOT = 0
✓ SMS_SENDER_NUMBER = +2250595871746
```

**Si vous ne les voyez PAS** :
- Elles n'ont pas été sauvegardées correctement
- Ajoutez-les à nouveau

---

### 2. Vérifier le Status du Déploiement

**Sur Railway Dashboard** :
1. Onglet **`Deployments`** (en haut)
2. **Regardez le dernier déploiement** (en haut de la liste)

**3 états possibles** :

#### ✅ État 1 : "Active" (pastille verte)
```
Status: Active
Durée: X minutes ago
```
→ Le déploiement est TERMINÉ mais les variables ne sont pas prises en compte
→ **PROBLÈME** : Il faut forcer un redéploiement

**Solution** :
- Cliquez sur les **3 points** (...) à droite du déploiement
- Cliquez sur **"Redeploy"**
- Attendez 3 minutes

---

#### 🔄 État 2 : "Building" ou "Deploying" (pastille orange/bleue)
```
Status: Building / Deploying
```
→ Railway est en train de déployer
→ **NORMAL** : Attendez 2-3 minutes

**Solution** :
- Attendez que le status passe à "Active"
- Relancez `node verifier_deploiement.js`

---

#### ❌ État 3 : "Failed" (pastille rouge)
```
Status: Failed
```
→ Le déploiement a échoué
→ **PROBLÈME** : Il y a une erreur

**Solution** :
- Cliquez sur le déploiement pour voir les logs
- Cherchez les erreurs en rouge
- Copiez l'erreur et demandez de l'aide

---

### 3. Vérifier les Logs du Déploiement

**Sur Railway Dashboard** :
1. Onglet **`Deployments`**
2. Cliquez sur le **dernier déploiement**
3. Onglet **`View Logs`**

**Cherchez** :
```
✅ API GS Pipeline - Version 1.0.0
```

**Si vous voyez des erreurs en rouge** :
- Copiez l'erreur complète
- Il y a un problème avec le code ou les variables

---

## 🎯 CHECKLIST RAPIDE

### Sur Railway Dashboard :

- [ ] Variables → Les 4 variables existent et ont les bonnes valeurs
- [ ] Deployments → Status = "Active" (pastille verte)
- [ ] Logs → Pas d'erreur rouge, message "API GS Pipeline" visible
- [ ] Service → Pastille verte à côté du nom du service

### Si TOUT est ✅ mais variables toujours "Non configuré" :

**Forcez un redéploiement** :
1. Deployments → Dernier déploiement → **3 points** (...)
2. Cliquez sur **"Redeploy"**
3. Attendez 3 minutes
4. Relancez `node verifier_deploiement.js`

---

## 🔄 SCRIPT D'ATTENTE AUTOMATIQUE

Pour vérifier automatiquement toutes les 30 secondes :

```powershell
# Dans PowerShell
while ($true) {
    Clear-Host
    Write-Host "Vérification..." -ForegroundColor Yellow
    node verifier_deploiement.js
    Write-Host "`nProchaine vérification dans 30 secondes..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
}
```

**Arrêter** : Appuyez sur `Ctrl+C`

---

## 📊 TEMPS D'ATTENTE NORMAUX

- **Ajout d'une variable** : Railway redéploie automatiquement (2-3 min)
- **4 variables ajoutées d'un coup** : 1 seul redéploiement (2-3 min)
- **Redéploiement manuel** : 2-3 minutes
- **Premier démarrage après variables** : 3-5 minutes

---

## 💡 SI APRÈS 5 MINUTES C'EST TOUJOURS "Non configuré"

**Il y a 3 possibilités** :

### 1. Les variables ne sont pas sur Railway
→ Retournez sur Variables et vérifiez qu'elles existent

### 2. Le déploiement a échoué
→ Consultez les Logs pour voir l'erreur

### 3. L'API /sms/config ne retourne pas les variables
→ Forcez un redéploiement complet

---

## 🎯 PROCHAINES ÉTAPES

1. **Vérifiez** les 3 points ci-dessus sur Railway Dashboard
2. **Dites-moi** quel est le status du dernier déploiement :
   - ✅ Active
   - 🔄 Building/Deploying
   - ❌ Failed

3. Si "Active" depuis plus de 5 minutes :
   - **Forcez un redéploiement** (3 points → Redeploy)

4. Si "Failed" :
   - **Copiez les logs d'erreur**

---

**📱 Allez sur Railway Dashboard MAINTENANT et vérifiez le status !**
