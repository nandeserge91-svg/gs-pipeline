# ⚙️ CONFIGURATION RAILWAY - ANDROID DÉDIÉ

## 🎯 ÉTAPES À SUIVRE MAINTENANT

Le code a été déployé sur GitHub. **Vous devez maintenant configurer les nouvelles variables sur Railway**.

---

## 📝 VARIABLES À AJOUTER/MODIFIER

### Sur Railway Dashboard :

1. **Allez sur** : https://railway.app/
2. **Projet** : `afgestion`
3. **Service** : `gs-pipeline`
4. **Onglet** : `Variables`

---

## ✏️ MODIFIER CES VARIABLES :

### 1. **SMS8_API_URL** (MODIFIER)

```
Variable Name: SMS8_API_URL
Valeur ACTUELLE: https://app.sms8.io/services/sendFront.php
Nouvelle Valeur: https://app.sms8.io/services/send.php
```

**Action** : Cliquez sur `SMS8_API_URL` → Modifiez → `https://app.sms8.io/services/send.php`

---

## ➕ AJOUTER CES NOUVELLES VARIABLES :

### 2. **SMS_DEVICE_ID** (NOUVELLE)

```
Variable Name: SMS_DEVICE_ID
Value: 5298
```

**Action** : Cliquez sur `New Variable` → Name: `SMS_DEVICE_ID` → Value: `5298`

---

### 3. **SMS_SIM_SLOT** (NOUVELLE)

```
Variable Name: SMS_SIM_SLOT
Value: 0
```

**Action** : Cliquez sur `New Variable` → Name: `SMS_SIM_SLOT` → Value: `0`

**Note** : 0 = SIM 1, 1 = SIM 2

---

### 4. **SMS_SENDER_NUMBER** (NOUVELLE)

```
Variable Name: SMS_SENDER_NUMBER
Value: +2250595871746
```

**Action** : Cliquez sur `New Variable` → Name: `SMS_SENDER_NUMBER` → Value: `+2250595871746`

---

## 📋 RÉCAPITULATIF DES VARIABLES

Après configuration, vous devriez avoir **TOUTES** ces variables :

```env
# API SMS8.io
SMS8_API_KEY=6a854258b60b92bd3a87ee563ac8a375ed28a78f
SMS8_API_URL=https://app.sms8.io/services/send.php  ← MODIFIÉ

# Android dédié (NOUVELLES)
SMS_DEVICE_ID=5298                    ← NOUVEAU
SMS_SIM_SLOT=0                        ← NOUVEAU
SMS_SENDER_NUMBER=+2250595871746      ← NOUVEAU

# Sender Name (existant)
SMS_SENDER_NAME=GS-Pipeline

# Activation SMS (existants)
SMS_ENABLED=true
SMS_ORDER_CREATED=true
SMS_ORDER_VALIDATED=true
SMS_DELIVERY_ASSIGNED=true
SMS_ORDER_DELIVERED=true
SMS_EXPEDITION_CONFIRMED=true
SMS_EXPRESS_ARRIVED=true
SMS_EXPRESS_REMINDER=true
SMS_RDV_SCHEDULED=true
SMS_RDV_REMINDER=true
SMS_DELIVERER_ALERT=true
```

---

## 💾 SAUVEGARDER ET REDÉPLOYER

1. **Après avoir ajouté toutes les variables**, Railway va **automatiquement redéployer**
2. **Attendez 2-3 minutes** que le déploiement se termine
3. **Vérifiez** que le service affiche **"Active"** (pastille verte)

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. **Vérifier les Logs Railway**

1. **Deployments** → Dernier déploiement → **View Logs**
2. **Cherchez** : Aucune erreur de démarrage
3. **Devrait afficher** : `✅ API GS Pipeline - Version 1.0.0`

### 2. **Vérifier l'Android sur SMS8.io**

1. **Allez sur** : https://app.sms8.io/
2. **Devices** → Vérifiez que **KLE-A0** est **Online** (pastille verte)
3. **Si Offline** : 
   - Vérifiez que l'Android est allumé
   - Vérifiez la connexion Internet
   - Ouvrez l'app SMS8.io sur l'Android

---

## 🧪 TESTER L'ENVOI SMS

### Test 1 : Créer une Commande

1. **Allez sur** : https://afgestion.net
2. **Créez une commande** avec **VOTRE numéro** : `+225...`
3. **Vérifiez votre téléphone** → SMS reçu
4. **L'expéditeur doit être** : `+2250595871746` (pas "GS-Pipeline")

### Test 2 : Consulter les Logs Railway

```bash
# Dans les logs, vous devez voir :
📱 SMS envoyé via Android 5298 (SIM 1) : +2250712345678
✅ SMS envoyé pour commande CMD-XXX
```

### Test 3 : Dashboard SMS8.io

1. **https://app.sms8.io/messages**
2. **Vous devez voir** : Messages envoyés via `KLE-A0`
3. **Status** : Sent / Delivered

---

## ⚠️ TROUBLESHOOTING

### Problème : "Device not found"

**Cause** : Variable `SMS_DEVICE_ID` incorrecte ou device offline

**Solution** :
1. Vérifiez que `SMS_DEVICE_ID=5298` sur Railway
2. Vérifiez que `KLE-A0` est Online sur SMS8.io
3. Redémarrez l'app SMS8.io sur l'Android

### Problème : SMS ne partent pas

**Cause** : Android offline ou pas de crédit SIM

**Solution** :
1. Vérifiez que l'Android est allumé et connecté
2. Vérifiez que la SIM a du crédit
3. Consultez les logs Railway pour les erreurs

### Problème : "Missing device parameter"

**Cause** : Variables Railway pas configurées

**Solution** :
1. Vérifiez que `SMS_DEVICE_ID`, `SMS_SIM_SLOT` sont bien sur Railway
2. Redéployez si nécessaire
3. Attendez que le déploiement se termine

---

## 🎯 CHECKLIST COMPLÈTE

- [ ] Variable `SMS8_API_URL` modifiée vers `send.php`
- [ ] Variable `SMS_DEVICE_ID` = `5298` ajoutée
- [ ] Variable `SMS_SIM_SLOT` = `0` ajoutée
- [ ] Variable `SMS_SENDER_NUMBER` = `+2250595871746` ajoutée
- [ ] Railway a redéployé (pastille verte)
- [ ] Android `KLE-A0` est Online sur SMS8.io
- [ ] Test SMS envoyé et reçu
- [ ] Expéditeur affiché : `+2250595871746` ✅

---

## 📱 MAINTENIR L'ANDROID OPÉRATIONNEL

### Important :

Votre Android **doit rester** :
- ✅ **Allumé** 24/7
- ✅ **Connecté à Internet** (WiFi recommandé)
- ✅ **App SMS8.io active** (en arrière-plan OK)
- ✅ **Batterie chargée** (brancher sur secteur recommandé)
- ✅ **Ne pas mettre en mode avion**
- ✅ **Ne pas désactiver les données mobiles** (si WiFi instable)

### Recommandations :

1. **Brancher le téléphone** sur secteur en permanence
2. **Désactiver le mode économie d'énergie**
3. **Configurer WiFi stable** (ou forfait data illimité)
4. **Exclure SMS8.io** de l'optimisation batterie
5. **Vérifier quotidiennement** le status Online

---

## 🎊 APRÈS CONFIGURATION

Une fois tout configuré :

1. ✅ Les SMS partiront de `+2250595871746`
2. ✅ Les clients pourront répondre
3. ✅ Coût réduit (forfait SIM)
4. ✅ Meilleure délivrabilité

**Consultez `MIGRATION_ANDROID_SMS.md` pour plus de détails !**

---

## 📞 EN CAS DE PROBLÈME

Si après configuration, les SMS ne partent toujours pas :

1. **Vérifiez** les 4 nouvelles variables sur Railway
2. **Vérifiez** que l'Android est Online
3. **Consultez** les logs Railway
4. **Testez** manuellement sur SMS8.io Dashboard

**Le système devrait être opérationnel dans 5 minutes après configuration ! ⏰**

