# ⚡ ACTIVER LES SMS AUTOMATIQUES - RAILWAY

## 🎯 PROBLÈME

**`SMS_ENABLED = false`** → Les SMS automatiques ne s'envoient pas lors de la création de commandes.

**Symptôme** : Tests manuels ✅ mais envoi automatique ❌

---

## ✅ SOLUTION (2 minutes)

### Étape 1 : Railway Dashboard

1. Ouvrez https://railway.app
2. Connectez-vous
3. Sélectionnez votre projet **`gs-pipeline`**
4. Cliquez sur le service **Backend** (Node.js)

### Étape 2 : Variables

1. Dans le menu de gauche, cliquez sur **"Variables"**
2. Cherchez la variable **`SMS_ENABLED`**

### Étape 3 : Modification

**Si la variable existe** :
1. Cliquez sur **`SMS_ENABLED`**
2. Changez la valeur en **`true`**
3. Cliquez sur **"Save"** ou validez

**Si la variable n'existe pas** :
1. Cliquez sur **"+ New Variable"**
2. **Name** : `SMS_ENABLED`
3. **Value** : `true`
4. Cliquez sur **"Add"**

### Étape 4 : Redémarrage automatique

Railway redémarre **automatiquement** le service (30-60 secondes).

**Vous verrez** :
- 🔄 Badge "Restarting" sur le service
- ⏰ Attendez 1 minute
- ✅ Badge "Active"

---

## 🧪 TEST APRÈS ACTIVATION

### 1. Créez une commande test (dans 1 minute)

```
Menu Admin → Commandes → Créer commande

Nom       : Test Auto SMS
Téléphone : +225[votre numéro]
Ville     : Abidjan
Produit   : BEE VENOM
Quantité  : 1
Montant   : 10000
```

### 2. Vérifiez votre téléphone

**SMS attendu (30 secondes après création)** :
```
Bonjour Test, votre commande ORD-XXXXX est enregistree. 
Nous vous appellerons bientot. - AFGestion
```

**Expéditeur** : `+2250595871746`

### 3. Vérifiez les logs Railway (optionnel)

```
Railway Dashboard → Deployments → View Logs
```

**Message attendu** :
```
✅ SMS envoyé pour commande ORD-XXXXX
```

---

## 📊 AUTRES VARIABLES IMPORTANTES

Pendant que vous y êtes, vérifiez ces variables :

| Variable | Valeur recommandée |
|----------|-------------------|
| `SMS_ENABLED` | `true` ✅ |
| `SMS_DEVICE_ID` | `5298` |
| `SMS_SIM_SLOT` | `0` |
| `SMS_SENDER_NUMBER` | `+2250595871746` |
| `SMS8_API_KEY` | `6a854258b60b92bd3a87ee563ac8a375ed28a78f` |
| `SMS8_API_URL` | `https://app.sms8.io/services/send.php` |

**Si manquantes** → Ajoutez-les maintenant !

---

## ⚙️ VARIABLES OPTIONNELLES

Ces variables permettent de désactiver des types spécifiques :

| Variable | Effet si = `false` |
|----------|--------------------|
| `SMS_ORDER_CREATED` | Désactive SMS "Commande reçue" |
| `SMS_ORDER_VALIDATED` | Désactive SMS "Commande validée" |
| `SMS_ORDER_DELIVERED` | Désactive SMS "Commande livrée" |
| `SMS_EXPRESS_ARRIVED` | Désactive SMS "EXPRESS arrivé" |
| `SMS_RDV_SCHEDULED` | Désactive SMS "RDV programmé" |

**Par défaut** : Si absentes, toutes sont **activées** (sauf si `SMS_ENABLED = false`)

---

## 🎯 RÉCAPITULATIF

### Avant
- ❌ `SMS_ENABLED = false`
- ❌ Envoi automatique bloqué
- ✅ Tests manuels seulement

### Après (SMS_ENABLED = true)
- ✅ Envoi automatique actif
- ✅ SMS lors de création commande
- ✅ Tests manuels toujours OK
- ✅ Tous les types de SMS fonctionnels

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

### 1. Vérifiez le redémarrage

```
Railway Dashboard → Service Backend
Badge doit être "Active" (vert)
```

### 2. Relancez le diagnostic

```bash
node diagnostic_envoi_automatique.js
```

**Résultat attendu** :
```
✅ SMS_ENABLED: true
✅ Configuration SMS correcte !
```

### 3. Vérifiez les logs

```
Railway → Deployments → View Logs
```

Créez une commande et cherchez :
- ✅ "SMS envoyé pour commande..." = Fonctionne
- ❌ "Erreur envoi SMS..." = Voir l'erreur
- ❌ Rien = Variable pas prise en compte (attendez 1 min)

---

## ⏰ TEMPS TOTAL

- **Modification variable** : 30 secondes
- **Redémarrage Railway** : 1 minute
- **Test création commande** : 30 secondes
- **TOTAL** : 2 minutes

---

**🎉 Après ça, tous vos SMS automatiques fonctionneront ! 🎉**
