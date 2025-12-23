# 📱 GUIDE : CHANGEMENT DE PUCE SIM

## 🎯 SI VOUS CHANGEZ LA PUCE SIM

### ⚠️ IMPORTANT
Changer la puce SIM dans votre Android **NÉCESSITE** une mise à jour de la configuration.

---

## 📋 ÉTAPES À SUIVRE

### Étape 1 : Sur l'Android (avec nouvelle SIM)

1. **Insérez la nouvelle SIM** dans l'Android KLE-A0
2. **Ouvrez l'app SMS8.io**
3. **Vérifiez que l'app détecte** la nouvelle SIM
4. **Notez le nouveau numéro** : +225XXXXXXXXXX
5. **Vérifiez le Slot** : 
   - Slot 1 (première puce) = 0
   - Slot 2 (deuxième puce) = 1

### Étape 2 : Sur SMS8.io Dashboard

1. **Allez sur** : https://app.sms8.io/devices
2. **Vérifiez** que KLE-A0 est **Online** (pastille verte)
3. **Cliquez** sur le device
4. **Vérifiez** que la nouvelle SIM est bien détectée

### Étape 3 : Sur Railway

1. **Allez sur** : https://railway.app/
2. **Projet** : gs-pipeline → **Variables**
3. **Modifiez ces 2 variables** :

#### Variable à modifier 1 : Numéro expéditeur
```
Variable Name: SMS_SENDER_NUMBER
Ancienne Valeur: +2250595871746
Nouvelle Valeur: +225XXXXXXXXXX  ← VOTRE NOUVEAU NUMÉRO
```

#### Variable à modifier 2 : Slot SIM (si nécessaire)
```
Variable Name: SMS_SIM_SLOT
Valeur actuelle: 0
Nouvelle Valeur: 0 ou 1  ← Selon le slot utilisé
```

**Note** : 
- Slot 1 (première puce) = `0`
- Slot 2 (deuxième puce dual SIM) = `1`

### Étape 4 : Redémarrage

Railway va redémarrer automatiquement (1 minute).

### Étape 5 : Test

1. **Créez une commande test**
2. **Vérifiez votre téléphone**
3. **L'expéditeur doit être** : Le NOUVEAU numéro

---

## 🔧 SI VOUS AVEZ UN TÉLÉPHONE DUAL SIM

### Configuration Slot 1 (première puce)
```env
SMS_SIM_SLOT=0
SMS_SENDER_NUMBER=+225XXXXXXXXXX  ← Numéro de la SIM 1
```

### Configuration Slot 2 (deuxième puce)
```env
SMS_SIM_SLOT=1
SMS_SENDER_NUMBER=+225YYYYYYYYYY  ← Numéro de la SIM 2
```

**Avantage Dual SIM** :
- ✅ Basculer entre 2 numéros
- ✅ Backup si une SIM a un problème
- ✅ Tester avec différents opérateurs

---

## 🚨 PROBLÈMES COURANTS

### Problème 1 : SMS ne partent plus après changement

**Cause** : Variable `SMS_SENDER_NUMBER` pas mise à jour

**Solution** :
1. Vérifiez le nouveau numéro sur l'Android
2. Mettez à jour `SMS_SENDER_NUMBER` sur Railway
3. Attendez le redémarrage (1 min)
4. Testez

---

### Problème 2 : "SIM not found"

**Cause** : Variable `SMS_SIM_SLOT` incorrecte

**Solution** :
1. Vérifiez dans quelle fente vous avez mis la SIM
2. Slot 1 → `SMS_SIM_SLOT=0`
3. Slot 2 → `SMS_SIM_SLOT=1`
4. Mettez à jour sur Railway

---

### Problème 3 : Device Offline

**Cause** : SMS8.io ne reconnait pas la nouvelle SIM

**Solution** :
1. Ouvrez l'app SMS8.io sur l'Android
2. Déconnectez et reconnectez le compte
3. Vérifiez que la SIM est bien détectée
4. Testez l'envoi depuis le dashboard SMS8.io

---

## 💰 CONSIDÉRATIONS FORFAIT

### Nouveau forfait SIM

Si vous changez de puce, vérifiez :
- ✅ **Forfait SMS illimité** (recommandé)
- ✅ **Crédit suffisant** si prépayé
- ✅ **SMS activés** (certains forfaits data-only n'ont pas de SMS)
- ✅ **Pas de restriction** sur les SMS sortants

---

## 📊 IMPACT SUR LES CLIENTS

### Ce qui change :
- 📞 **Nouveau numéro d'expéditeur** visible
- 📱 Les clients verront le nouveau numéro

### Ce qui ne change pas :
- ✅ **Messages identiques**
- ✅ **Templates** (inchangés)
- ✅ **Historique** (conservé)
- ✅ **Statistiques** (continues)

---

## ⚠️ RECOMMANDATIONS

### Avant de changer :
1. ✅ **Notez l'ancien numéro** (backup)
2. ✅ **Prévenez votre équipe**
3. ✅ **Testez la nouvelle SIM** hors production d'abord
4. ✅ **Changez en dehors des heures de pointe**

### Après le changement :
1. ✅ **Testez immédiatement** avec votre numéro
2. ✅ **Vérifiez les logs Railway**
3. ✅ **Créez une commande test complète**
4. ✅ **Vérifiez l'historique SMS** dans l'interface

---

## 🔄 ALTERNATIVE : GARDER LE MÊME NUMÉRO

Si vous voulez éviter les problèmes :
- 📞 **Transférez votre numéro** vers la nouvelle puce (portabilité)
- 🔒 **Gardez la même SIM** et changez juste le forfait
- 🔄 **Rechargez la SIM existante** plutôt que d'en changer

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Nouvelle SIM insérée dans l'Android
- [ ] SMS8.io app détecte la nouvelle SIM
- [ ] Device Online sur SMS8.io dashboard
- [ ] `SMS_SENDER_NUMBER` mis à jour sur Railway
- [ ] `SMS_SIM_SLOT` vérifié/mis à jour si besoin
- [ ] Railway a redémarré (1 minute)
- [ ] Test SMS envoyé et reçu
- [ ] Nouveau numéro affiché correctement

---

## 📞 EN CAS DE PROBLÈME

Si après changement, les SMS ne partent plus :

1. **Vérifiez les logs Railway** :
   ```
   Railway → Deployments → View Logs
   Cherchez : "Erreur SMS" ou "Device"
   ```

2. **Vérifiez SMS8.io** :
   - Device Online ?
   - SIM détectée ?
   - Testez envoi manuel depuis le dashboard

3. **Vérifiez les variables** :
   ```bash
   node verifier_config_android.js
   ```

---

**⏰ Temps total pour le changement : ~5 minutes**

**🎉 Avec ces étapes, le changement de SIM se fera sans interruption ! 🎉**




