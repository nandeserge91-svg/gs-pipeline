# 🔍 VÉRIFICATION - Variables Railway SMS

## ⚠️ PROBLÈME : Aucun SMS envoyé

Si vous ne recevez pas de SMS, c'est **probablement** car les variables d'environnement ne sont **PAS configurées sur Railway**.

---

## ✅ ÉTAPE 1 : Configurer les Variables SMS sur Railway

### 📍 Allez sur Railway Dashboard

1. **Ouvrez** : https://railway.app/
2. **Connectez-vous** avec votre compte GitHub
3. **Sélectionnez** le projet : **`afgestion`** ou **`gs-pipeline`**
4. **Cliquez** sur le service : **`gs-pipeline-production`**
5. **Cliquez** sur l'onglet : **`Variables`**

---

### 📝 Ajoutez TOUTES ces variables

**Cliquez sur "New Variable" pour chaque ligne :**

```env
SMS8_API_KEY=6a854258b60b92bd3a87ee563ac8a375ed28a78f
SMS8_API_URL=https://app.sms8.io/services/sendFront.php
SMS_SENDER_NAME=GS-Pipeline
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

### 🎯 Format dans Railway

Pour chaque variable :
- **Variable Name** : `SMS8_API_KEY`
- **Value** : `6a854258b60b92bd3a87ee563ac8a375ed28a78f`

Répétez pour TOUTES les 14 variables ci-dessus.

---

### 💾 Sauvegarder et Redéployer

1. **Après avoir ajouté toutes les variables**, Railway va **automatiquement redéployer**
2. **Attendez 2-3 minutes** que le déploiement se termine
3. **Vérifiez** que le service est "Active" (pastille verte)

---

## ✅ ÉTAPE 2 : Vérifier que les Variables sont Présentes

### Ouvrez le fichier : `diagnostic_sms.html`

1. **Double-cliquez** sur `diagnostic_sms.html` dans votre navigateur
2. **Obtenez votre token** (F12 sur afgestion.net → `localStorage.getItem('token')`)
3. **Collez le token** dans l'interface
4. **Cliquez** sur "Lancer le Diagnostic Complet"

### ✅ Ce que vous devez voir :

```
✅ 1. Connexion API Railway - OK
✅ 2. Configuration SMS - SMS activé
✅ 3. Crédits SMS8.io - X crédits disponibles
✅ 4. Variables d'environnement - Toutes configurées
```

### ❌ Si vous voyez des erreurs :

Les solutions seront affichées directement dans l'interface de diagnostic.

---

## ✅ ÉTAPE 3 : Tester à Nouveau

### Créez une nouvelle commande :

1. **Allez sur** : https://afgestion.net
2. **Créez une commande** avec :
   - Nom : `Test SMS 2`
   - **Téléphone : `+2250712345678`** ⬅️ VOTRE numéro (format IMPORTANT !)
   - Produit : n'importe lequel
   - Mode : LOCAL

### 📱 Format du Numéro CRITICAL :

```
❌ FAUX : 0712345678
❌ FAUX : 712345678
❌ FAUX : +225712345678 (manque le 0 après l'indicatif)
✅ BON : +2250712345678
```

**Structure :**
- `+225` = Indicatif Côte d'Ivoire
- `0` = Obligatoire après l'indicatif
- `712345678` = Les 9 chiffres du numéro

---

## 🔍 ÉTAPE 4 : Consulter les Logs Railway

### Si vous ne recevez toujours pas de SMS :

1. **Railway Dashboard** → **Deployments** (onglet)
2. **Cliquez** sur le dernier déploiement (en haut)
3. **View Logs** (bouton en haut à droite)
4. **Cherchez** les lignes contenant :
   - `[SMS]`
   - `sendSMS`
   - `sms.service`
   - `error`

### 📋 Logs à rechercher :

**✅ Si ça marche, vous verrez :**
```
[SMS] Envoi SMS à +2250712345678
[SMS] SMS envoyé avec succès - ID: sms_xxx
```

**❌ Si ça ne marche pas, vous verrez :**
```
[SMS] SMS désactivé
[SMS] Erreur : ...
Error in sms.service: ...
```

**Copiez les erreurs** et envoyez-les moi pour diagnostic.

---

## 🎯 CHECKLIST DE VÉRIFICATION

- [ ] Les 14 variables SMS sont configurées sur Railway
- [ ] Railway a redéployé (pastille verte "Active")
- [ ] `diagnostic_sms.html` affiche tout en vert
- [ ] Le numéro de téléphone est au format `+2250712345678`
- [ ] Une commande test a été créée
- [ ] Les logs Railway ne montrent pas d'erreur

---

## 💡 CAUSES FRÉQUENTES

### 1. Variables non configurées sur Railway
**Solution** : Suivez ÉTAPE 1 ci-dessus

### 2. Format du numéro incorrect
**Solution** : Utilisez `+2250712345678` (avec le 0 après +225)

### 3. SMS_ENABLED=false
**Solution** : Mettez `SMS_ENABLED=true` sur Railway

### 4. Crédits SMS8.io épuisés
**Solution** : Rechargez sur https://app.sms8.io/

### 5. API SMS8.io ne répond pas
**Solution** : Consultez les logs Railway pour voir l'erreur exacte

---

## 🚀 ACTION IMMÉDIATE

### 1️⃣ **Configurez les variables Railway** (ÉTAPE 1)
### 2️⃣ **Attendez 2 minutes** (redéploiement)
### 3️⃣ **Lancez** `diagnostic_sms.html` (ÉTAPE 2)
### 4️⃣ **Testez** avec une nouvelle commande (ÉTAPE 3)

---

## 📞 BESOIN D'AIDE ?

Si après avoir tout vérifié, ça ne marche toujours pas :

1. **Lancez** `diagnostic_sms.html`
2. **Faites une capture d'écran** des résultats
3. **Consultez** les logs Railway
4. **Envoyez-moi** les erreurs trouvées

Je pourrai alors identifier le problème exact ! 🔍
